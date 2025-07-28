"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { GridAlgorithm, MarkerClusterer } from "@googlemaps/markerclusterer"

interface Store {
  id: number
  storeName: string
  localBill: string
  region: string
  roadAddress: string
  latitude: number
  longitude: number
}

interface GoogleMapProps {
  stores: Store[]
  center: { lat: number; lng: number }
  selectedStore: Store | null
  onMarkerClick: (store: Store) => void
  onCenterChanged: (center: { lat: number; lng: number }) => void
  onZoomChanged: (zoom: number) => void
}

export default function GoogleMap({
  stores,
  center,
  selectedStore,
  onMarkerClick,
  onCenterChanged,
  onZoomChanged,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer | null>(null)
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)

  // Google Maps 초기화
  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        version: "weekly",
        libraries: ["places"],
      })

      try {
        await loader.load()

        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: center,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          })

          const infoWindowInstance = new google.maps.InfoWindow()

          setMap(mapInstance)
          setInfoWindow(infoWindowInstance)
        }
      } catch (error) {
        console.error("Google Maps 로드 실패:", error)
      }
    }

    initMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 지도 이벤트 리스너 (최적화)
  useEffect(() => {
    if (!map) return

    const dragEndListener = map.addListener("dragend", () => {
      const newCenter = map.getCenter()
      if (newCenter && (newCenter.lat() !== center.lat || newCenter.lng() !== center.lng)) {
        onCenterChanged({ lat: newCenter.lat(), lng: newCenter.lng() })
      }
    })

    const zoomListener = map.addListener("zoom_changed", () => {
      const newZoom = map.getZoom()
      if (newZoom) {
        onZoomChanged(newZoom)
      }
    })

    return () => {
      google.maps.event.removeListener(dragEndListener)
      google.maps.event.removeListener(zoomListener)
    }
  }, [map, onCenterChanged, onZoomChanged])

  // 마커 생성 및 클러스터링
  useEffect(() => {
    if (!map || !stores.length) return

    // 기존 마커 제거
    markers.forEach((marker) => marker.setMap(null))
    if (markerClusterer) {
      markerClusterer.clearMarkers()
    }

    // 새 마커 생성
    const newMarkers = stores.map((store) => {
      const marker = new google.maps.Marker({
        position: { lat: store.latitude, lng: store.longitude },
        title: store.storeName,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="white" strokeWidth="3"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
      })

      marker.addListener("click", () => {
        onMarkerClick(store)

        if (infoWindow) {
          infoWindow.setContent(`
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${store.storeName}</h3>
              <p style="margin: 4px 0; font-size: 14px; color: #666;">${store.roadAddress}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <span style="background: #E5E7EB; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${store.localBill}</span>
                <span style="font-size: 12px; color: #9CA3AF;">${store.region}</span>
              </div>
            </div>
          `)
          infoWindow.open(map, marker)
        }
      })

      return marker
    })

    // 마커 클러스터러 설정
    const clusterer = new MarkerClusterer({
      map,
      markers: newMarkers,
      algorithm: new GridAlgorithm({ gridSize: 60 }),
      renderer: {
        render: ({ count, position }) => {
          const color = count > 10 ? "#DC2626" : count > 5 ? "#F59E0B" : "#3B82F6"
          return new google.maps.Marker({
            position,
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" strokeWidth="3"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20),
            },
            label: {
              text: count.toString(),
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
            },
            zIndex: 1000,
          })
        },
      },
    })

    setMarkers(newMarkers)
    setMarkerClusterer(clusterer)
  }, [map, stores, onMarkerClick, infoWindow])

  // 지도 중심 이동
  useEffect(() => {
    if (map && center) {
      map.panTo(center)
      if (selectedStore) {
        map.setZoom(16)
      }
    }
  }, [map, center, selectedStore])

  // 선택된 상점 마커 강조
  useEffect(() => {
    if (!selectedStore || !markers.length) return

    markers.forEach((marker) => {
      const isSelected = marker.getTitle() === selectedStore.storeName
      marker.setIcon({
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="${isSelected ? "#DC2626" : "#3B82F6"}" stroke="white" strokeWidth="3"/>
            <circle cx="16" cy="16" r="4" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(isSelected ? 40 : 32, isSelected ? 40 : 32),
        anchor: new google.maps.Point(isSelected ? 20 : 16, isSelected ? 20 : 16),
      })
    })
  }, [selectedStore, markers])

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-8">
            <h3 className="text-lg font-semibold mb-2">Google Maps API 키가 필요합니다</h3>
            <p className="text-gray-600">환경변수에 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 설정해주세요.</p>
          </div>
        </div>
      )}
    </div>
  )
}
