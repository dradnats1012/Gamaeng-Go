"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { GridAlgorithm, MarkerClusterer } from "@googlemaps/markerclusterer";
import { SimpleStore, Store } from "@/types";
import GoogleMapDisplay from "./MapDisplay";

interface GoogleMapProviderProps {
  stores: SimpleStore[];  // 지도에 표시할 가게들의 배열
  center: { lat: number; lng: number };
  selectedStore: Store | null;  // 현재 선택된 가게
  zoom: number;
  onMarkerClick: (store: SimpleStore | null) => void;
  onCenterChanged: (center: { lat: number; lng: number }) => void;
  onZoomChanged: (zoom: number) => void;
  onBoundsChanged: (bounds: google.maps.LatLngBounds) => void;  // 지도 경계 변경 핸들러
}

export default function GoogleMapProvider({
  stores,
  center,
  selectedStore,
  zoom,
  onMarkerClick,
  onCenterChanged,
  onBoundsChanged,
  onZoomChanged,
}: GoogleMapProviderProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  
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
            center: center,  // 초기 중심 좌표
            zoom: 13,
            mapTypeControl: false,  // 지도/위성 전환 버튼 숨김
            streetViewControl: false,  // 스트리트뷰 버튼 숨김
            fullscreenControl: false,  // 전체화면 버튼 숨김
            styles: [  // POI(관심지점) 라벨 숨기기 설정
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
          })

          const infoWindowInstance = new google.maps.InfoWindow();

          // 인포윈도우 닫기 이벤트 리스너(선택 상태도 함께 해제) 추가
          infoWindowInstance.addListener('closeclick', () => {
            onMarkerClick(null);
          });

          setMap(mapInstance)
          setInfoWindow(infoWindowInstance)
        }
      } catch (error) {
        console.error("Google Maps 로드 실패:", error)
      }
    }

    initMap()
  }, [])

  // 지도 이벤트 리스너
  useEffect(() => {
    if (!map) return

    let boundsChangeTimeout: NodeJS.Timeout;

    const dragEndListener = map.addListener("dragend", () => {  // dragend: 드래그 끝났을 때
      const newCenter = map.getCenter();  // 새로운 중심점 가져오기
      if (newCenter) {
        onCenterChanged({ lat: newCenter.lat(), lng: newCenter.lng() });
      }

      clearTimeout(boundsChangeTimeout);
      boundsChangeTimeout = setTimeout(() => {
        const bounds = map.getBounds();
        if (bounds) {
          onBoundsChanged(bounds);
        }
      }, 100);
    });
    
    const zoomListener = map.addListener("zoom_changed", () => {  // zoom_changed: 줌 레벨 변경시
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


  // 마커 생성 및 클러스터링
  useEffect(() => {
    if (!map || !map.getProjection()) return;

    // 현재 마커들을 Map으로 변환 (빠른 조회를 위해)
    const currentMarkerMap = new Map<string, google.maps.Marker>(
      markersRef.current.map(marker => [marker.getTitle() || '', marker])
    );

    // 새로운 stores의 UUID Set
    const newStoreIds = new Set<string>(stores.map(store => store.uuid));
    
    // 1. 삭제할 마커 찾기 (stores에 없는 마커)
    const markersToRemove: string[] = [];
    currentMarkerMap.forEach((marker, uuid) => {
      if (!newStoreIds.has(uuid)) {
        marker.setMap(null);  // 지도에서 제거
        markersToRemove.push(uuid);
      }
    });
    
    // 2. 추가할 stores 찾기
    const storesToAdd = stores.filter(store => 
      !currentMarkerMap.has(store.uuid)
    );
    
    // 3. 새 마커만 생성
    const newMarkers = storesToAdd.map(store => {
      const marker = new google.maps.Marker({
        position: { lat: store.latitude, lng: store.longitude },
        title: store.uuid,
        map: map,
        icon: {  // 커스텀 SVG 아이콘
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#3B82F6" stroke="white" strokeWidth="3"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),  // 아이콘 크기
          anchor: new google.maps.Point(16, 16),  // 아이콘 기준점 (중앙)
        },
      });
      
      marker.addListener("click", () => {
        onMarkerClick(store);
      });
      
      return marker;
    });
    
    // 4. markersRef 업데이트
    markersToRemove.forEach(uuid => currentMarkerMap.delete(uuid));
    newMarkers.forEach(marker => {
      const title = marker.getTitle();
      if (title) {
        currentMarkerMap.set(title, marker);
      }
    });
    
    markersRef.current = Array.from(currentMarkerMap.values());
    
    // 5. 클러스터러 업데이트
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(markersRef.current);
    } else if (markersRef.current.length > 0) {
      // 첫 렌더링 시 클러스터러 생성
      clustererRef.current = new MarkerClusterer({
        map,
        markers: markersRef.current,
        algorithm: new GridAlgorithm({ gridSize: 60, maxZoom: 16 }),
        renderer: {
          render: ({ count, position }) => {
            const color = count > 10 ? "#DC2626" : count > 5 ? "#F59E0B" : "#3B82F6";
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
            });
          },
        },
      });
    }
    return () => {
      try {
        if (clustererRef.current) {
          clustererRef.current.clearMarkers();
          clustererRef.current = null;  // ref 초기화
        }
      } catch (error) {
        console.warn("클러스터러 정리 중 사.소.한 에러 (무시 요망):", error);
        clustererRef.current = null;
      }
    };
  }, [map, stores, onMarkerClick]);

  // 현재 인포윈도우가 열린 마커를 추적하기 위한 ref
  const currentInfoWindowMarkerRef = useRef<google.maps.Marker | null>(null);

  // 선택된 가게 정보로 인포윈도우 표시
  useEffect(() => {
    if (!map || !infoWindow) return;

    if (!selectedStore) {
      infoWindow.close();
      currentInfoWindowMarkerRef.current = null;
      return;
    }
    
    const targetMarker = markersRef.current.find(marker =>
      marker.getTitle() === selectedStore.uuid
    );

    if (targetMarker) {
      // 위치가 같으면 스킵
      if (currentInfoWindowMarkerRef.current === targetMarker) {
        console.log("같은 마커의 인포윈도우가 이미 열려있음");
        return;
      }

      const detailedStore = selectedStore;
      // HTML 형식의 정보창 내용 설정
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
      // 특정 마커 위에 정보창 열기
      infoWindow.open(map, targetMarker);
      currentInfoWindowMarkerRef.current = targetMarker; // 현재 열린 마커 추적
    }

  }, [map, infoWindow, selectedStore]);

  // 지도 상태 동기화 (중심점 변경 시 지도 이동)
  useEffect(() => {
    if (map && center) {
      map.panTo(new google.maps.LatLng(center.lat, center.lng));  // 중심점 변경 시 지도 이동
    }
  }, [map, center, selectedStore]);

  // 지도 상태 동기화  (줌 레벨 변경 시 지도 이동)
  useEffect(() => {
    if (map && zoom) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  // 선택된 상점 마커 강조
  useEffect(() => {
    if (!selectedStore || !markersRef.current.length) return

    markersRef.current.forEach((marker) => {
      const isSelected = marker.getTitle() === selectedStore.uuid;
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
      });
    });
  }, [selectedStore])

  useEffect(() => {
    if (!map || !selectedStore) return;

    const checkBounds = () => {
      const bounds = map.getBounds();
      if (!bounds) return;

      // 지도 영역에서 안전 마진 계산 (인포윈도우 크기 고려)
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      // 현재 보이는 영역의 크기 계산
      const latRange = ne.lat() - sw.lat();
      const lngRange = ne.lng() - sw.lng();

      // 인포윈도우를 고려한 여유 공간 (화면의 85%만 안전 영역으로)
      const latMargin = latRange * 0.15;
      const lngMargin = lngRange * 0.15;

      // 안전 영역 범위 설정
      // 인포윈도우는 마커 위에 뜨므로 상단 여유를 적게 둠
      const safeArea = {
        north: ne.lat() - latMargin * 0.3,  // 상단 여유 적게
        south: sw.lat() + latMargin,        // 하단 여유 크게
        east: ne.lng() - lngMargin,
        west: sw.lng() + lngMargin
      };

      // 선택된 가게 위치
      const storeLat = selectedStore.latitude;
      const storeLng = selectedStore.longitude;

      // 안전 영역 안에 있는지 체크
      const isInSafeArea = 
        storeLat <= safeArea.north &&  // 북쪽 경계 안
        storeLat >= safeArea.south &&  // 남쪽 경계 안
        storeLng <= safeArea.east &&   // 동쪽 경계 안
        storeLng >= safeArea.west;     // 서쪽 경계 안

      // 안전 영역을 벗어났을 때만 인포윈도우만 닫기 (선택 해제 아님)
      if (!isInSafeArea && infoWindow) {
        console.log("[안전 영역을 벗어남] 인포윈도우만 닫습니다.");
      
        // 인포윈도우만 닫기 (선택 상태는 유지)
        infoWindow.close();
        
        // currentInfoWindowMarkerRef도 초기화 (다시 화면에 들어왔을 때 재표시를 위해)
        if (currentInfoWindowMarkerRef) {
          currentInfoWindowMarkerRef.current = null;
        }
      } else if (infoWindow) {
        // 안전 영역 안에 다시 들어왔을 때 인포윈도우가 닫혀있다면 다시 열기
        const targetMarker = markersRef.current.find(marker =>
          marker.getTitle() === selectedStore.uuid
        );
        
        if (targetMarker && !currentInfoWindowMarkerRef.current) {
          console.log("[안전 영역] 인포윈도우 재표시");
          
          const detailedStore = selectedStore;
          infoWindow.setContent(`
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${detailedStore.storeName}</h3>
              <p style="margin: 4px 0; font-size: 14px; color: #666; font-weight: bold;">${detailedStore.address}</p>
              <p style="margin: 4px 0; font-size: 14px;">📞 ${detailedStore.telNumber || '정보 없음'}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <span style="background: #E5E7EB; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${detailedStore.localBill}</span>
                <span style="font-size: 12px;">${detailedStore.region}</span>
              </div>
            </div>
          `);
          infoWindow.open(map, targetMarker);
          currentInfoWindowMarkerRef.current = targetMarker;
      }
    }
    };

    // bounds_changed 이벤트에 연결
    const listener = map.addListener("bounds_changed", () => {
      // 살짝 딜레이를 줘서 성능 최적화
      setTimeout(checkBounds, 100);
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
