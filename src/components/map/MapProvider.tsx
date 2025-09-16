"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { GridAlgorithm, MarkerClusterer } from "@googlemaps/markerclusterer";
import { SimpleStore, Store } from "@/types";
import GoogleMapDisplay from "./MapDisplay";

interface GoogleMapProviderProps {
  stores: SimpleStore[];
  center: { lat: number; lng: number };
  selectedStore: Store | null;
  onMarkerClick: (store: SimpleStore | null) => void;
  onCenterChanged: (center: { lat: number; lng: number }) => void;
  onZoomChanged: (zoom: number) => void;
  onBoundsChanged: (bounds: google.maps.LatLngBounds) => void;
}

export default function GoogleMapProvider({
  stores,
  center,
  selectedStore,
  onMarkerClick,
  onCenterChanged,
  onBoundsChanged,
  onZoomChanged,
}: GoogleMapProviderProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

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
  }, [])

  // 지도 이벤트 리스너 (최적화)
  useEffect(() => {
    if (!map) return

    const dragEndListener = map.addListener("dragend", () => {
      const newCenter = map.getCenter();
      if (newCenter) {
        onCenterChanged({ lat: newCenter.lat(), lng: newCenter.lng() });
      }
    
      const bounds = map.getBounds();
      if (bounds) {
        onBoundsChanged(bounds);
      }
    });
    
    const zoomListener = map.addListener("zoom_changed", () => {
      const newZoom = map.getZoom();
      if (newZoom !== undefined) {
        onZoomChanged(newZoom);
      }
    
      const bounds = map.getBounds();
      if (bounds) {
        onBoundsChanged(bounds);
      }
    });

    return () => {
      google.maps.event.removeListener(dragEndListener)
      google.maps.event.removeListener(zoomListener)
    }
  }, [map, onCenterChanged, onZoomChanged])


  useEffect(() => {
    if (!map || !map.getProjection()) return

    if (markerClusterer) {
      markerClusterer.clearMarkers()
    }

    if (stores.length === 0) {
      setMarkers([]);
      return;
    }

    // 새 마커 생성
    const newMarkers = stores.map((store) => {
      const marker = new google.maps.Marker({
        position: { lat: store.latitude, lng: store.longitude },
        title: store.uuid, 
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
      })

      return marker
    })

    // 마커 클러스터러 설정
    const clusterer = new MarkerClusterer({
      map,
      markers: newMarkers,
      algorithm: new GridAlgorithm({ gridSize: 60, maxZoom: 16 }),
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

  // 선택된 가게 정보로 인포윈도우 표시
  useEffect(() => {
    if (!map || !infoWindow) return;

    if (!selectedStore) {
      infoWindow.close();
      return;
    }

    const targetMarker = markers.find(marker => marker.getTitle() === selectedStore.uuid);

    if (targetMarker) {
      const detailedStore = selectedStore;
      infoWindow.setContent(`
        <div style="padding: 8px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${detailedStore.storeName}</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #666; font-weight: bold;">${detailedStore.address}</p>
          <p style="margin: 4px 0; font-size: 14px;">📞 ${detailedStore.telNumber || '정보 없음'}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span style="background: #E5E7EB; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${detailedStore.localBill}</span>
            <span style="font-size: 12px; ">${detailedStore.region}</span>
          </div>
        </div>
      `);
      infoWindow.open(map, targetMarker);
    }

  }, [map, infoWindow, selectedStore, markers]);

  useEffect(() => {
    if (map && center) {
      map.panTo(new google.maps.LatLng(center.lat, center.lng));
    }
  }, [map, center, selectedStore]);

  // 선택된 상점 마커 강조
  useEffect(() => {
    if (!selectedStore || !markers.length) return

    markers.forEach((marker) => {
      const isSelected = marker.getTitle() === selectedStore.uuid
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

  //선택된 마커가 지도 bounds 밖으로 벗어나면 선택 해제
  useEffect(() => {
    if (!map || !selectedStore) return;

    const listener = map.addListener("bounds_changed", () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      const storeLatLng = new google.maps.LatLng(selectedStore.latitude, selectedStore.longitude);

      if (!bounds.contains(storeLatLng)) {
        console.log("선택된 마커가 지도 범위를 벗어났습니다. 선택 해제합니다.");
        onMarkerClick(null); // ✅ 선택 해제
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, selectedStore, onMarkerClick]);

  return (
    <GoogleMapDisplay
      mapRef={mapRef}
      apiKeyExists={!!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
    />
  );
}