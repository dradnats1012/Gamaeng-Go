import { useState, useCallback, useEffect, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Store, SimpleStore } from "@/types";

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [markerStores, setMarkerStores] = useState<SimpleStore[]>([]); // 마커용 데이터
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [storeNameQuery, setStoreNameQuery] = useState("");
  const [regionQuery, setRegionQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 });
  const [zoomLevel, setZoomLevel] = useState(13);
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/institutions/names`);
        if (!response.ok) {
          throw new Error("API 요청에 실패했습니다.");
        }
        const data = await response.json();
        setInstitutions(data.regionNames || []);
      } catch (error) {
        console.error("기관 목록을 불러오는 중 오류가 발생했습니다:", error);
      }
    };
    fetchInstitutions();
  }, []);

  const mapCenterRef = useRef(mapCenter);
  useEffect(() => {
    mapCenterRef.current = mapCenter;
  }, [mapCenter]);

  const fetchNearbyStores = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/local-stores/nearby?latitude=${latitude}&longitude=${longitude}&distance=3000`
      );
      if (!response.ok) {
        throw new Error("API 요청에 실패했습니다.");
      }
      const data: Store[] = await response.json();
      setStores(data);
      setFilteredStores(data);
    } catch (error) {
      console.error("가맹점 정보를 불러오는 중 오류가 발생했습니다:", error);
    }
  }, [BACKEND_BASE_URL]);

  const fetchNearbyStoresByLineString = useCallback(async (leftLatitude: number, leftLongitude: number, rightLatitude: number, rightLongitude: number) => {
    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/local-stores/nearby/linestring?leftLatitude=${leftLatitude}&leftLongitude=${leftLongitude}&rightLatitude=${rightLatitude}&rightLongitude=${rightLongitude}`
      );
      if (!response.ok) {
        throw new Error("API 요청에 실패했습니다.");
      }
      const data: Store[] = await response.json();
      setStores(data);
      setFilteredStores(data);
    } catch (error) {
      console.error("가맹점 정보를 불러오는 중 오류가 발생했습니다:", error);
    }
  }, [BACKEND_BASE_URL]);

  const fetchStoreDetails = useCallback(async (storeUuid: string) => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/local-stores/${storeUuid}`);
      if (!response.ok) {
        throw new Error("상세 정보 API 요청 실패");
      }
      const data: Store = await response.json(); // 상세 정보 타입은 일단 Store로 받습니다.
      setSelectedStore(data);
      setMapCenter({ lat: data.latitude, lng: data.longitude });
    } catch (error) {
      console.error("가게 상세 정보를 불러오는 중 오류 발생:", error);
    }
  }, [BACKEND_BASE_URL]);

  const handleStoreSelectById = (storeUuid: string) => {
    fetchStoreDetails(storeUuid);
  }

  const debouncedFetchNearbyStores = useDebouncedCallback((center) => {
    fetchNearbyStores(center.lat, center.lng);
  }, 500);

  const mapBoundsRef = useRef<google.maps.LatLngBounds | null>(null);
  
  // const setMapBounds = (bounds: google.maps.LatLngBounds) => {
  //   mapBoundsRef.current = bounds;
  // };

  const debouncedFetchNearbyStoresByBounds = useDebouncedCallback(() => {
    const bounds = mapBoundsRef.current;
    if (!bounds) return;
  
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
  
    fetchNearbyStoresByLineString(
      sw.lat(), sw.lng(), // 왼쪽 아래
      ne.lat(), ne.lng()  // 오른쪽 위
    );
  }, 500);

  useEffect(() => {
    if (zoomLevel >= 15) {
      debouncedFetchNearbyStoresByBounds();
    } else {
      setStores([]);
      setFilteredStores([]);
    }
  }, [zoomLevel, debouncedFetchNearbyStoresByBounds]);

  const searchStores = useCallback(async (url: string, paramName: string, query: string) => {
    if (!query.trim()) {
      fetchNearbyStores(mapCenterRef.current.lat, mapCenterRef.current.lng);
      return;
    }

    try {
      const params = new URLSearchParams({
        [paramName]: query,
        page: "0",
        size: "20",
      });
      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      const data = await response.json();
      const searchResults = data.content || [];

      setStores(searchResults);
      setFilteredStores(searchResults);

      if (searchResults.length > 0) {
        const firstResult = searchResults[0];

        if (firstResult && typeof firstResult.latitude !== 'undefined' && typeof firstResult.longitude !== 'undefined') {
          const lat = parseFloat(firstResult.latitude);
          const lng = parseFloat(firstResult.longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            setMapCenter({ lat: lat, lng: lng });
            setZoomLevel(16);
          } else {
            console.warn("Invalid latitude or longitude received for store:", firstResult);
          }
        } else {
          console.warn("Latitude or longitude missing for store:", firstResult);
        }
      } else {
        setStores([]);
        setFilteredStores([]);
      }
    } catch (error) {
      console.error("검색 중 오류가 발생했습니다:", error);
      setStores([]);
      setFilteredStores([]);
    }
  }, [fetchNearbyStores]);

  const debouncedStoreNameSearch = useDebouncedCallback((query) => {
    searchStores(`${BACKEND_BASE_URL}/api/local-stores/search/name`, "storeName", query);
  }, 500);

  const debouncedRegionSearch = useDebouncedCallback((query) => {
    searchStores(`${BACKEND_BASE_URL}/api/local-stores/search/region`, "region", query);
  }, 500);

  const handleStoreNameSearch = (query: string) => {
    setStoreNameQuery(query);
    setRegionQuery("");
    debouncedStoreNameSearch(query);
  };

  const handleRegionSearch = (query: string) => {
    setRegionQuery(query);
    setStoreNameQuery("");
    debouncedRegionSearch(query);
  };

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store);
    setMapCenter({ lat: store.latitude, lng: store.longitude });
  };

  const handleMarkerClick = (store: SimpleStore | null) => {
    if (!store) {
      setSelectedStore(null); 
      return;
    }
    fetchStoreDetails(store.uuid);
  };

  const handleInstitutionChange = (institution: string) => {
    setSelectedInstitution(institution);
    if (institution && institution !== "all") {
      searchStores(`${BACKEND_BASE_URL}/api/local-stores/region`, "region", institution);
    } else {
      fetchNearbyStores(mapCenterRef.current.lat, mapCenterRef.current.lng);
    }
  };

  const fetchMarkers = useCallback(async (leftLatitude: number, leftLongitude: number, rightLatitude: number, rightLongitude: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/local-stores/nearby/marker?leftLatitude=${leftLatitude}&leftLongitude=${leftLongitude}&rightLatitude=${rightLatitude}&rightLongitude=${rightLongitude}`
      );
      if (!response.ok) {
        throw new Error('마커 정보를 불러오는데 실패했습니다.');
      }
      const data: SimpleStore[] = await response.json();
      setMarkerStores(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [BACKEND_BASE_URL]);

  
// 지도 경계가 변경될 때 호출될 디바운스된 함수
const debouncedFetchMarkersByBounds = useDebouncedCallback(() => {
  const bounds = mapBoundsRef.current;
  if (bounds) {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    fetchMarkers(sw.lat(), sw.lng(), ne.lat(), ne.lng());
  }
}, 500); // 500ms 디바운스

// setMapBounds 함수 수정: 경계 설정 후 디바운스된 마커 fetch 호출
const setMapBounds = useCallback((bounds: google.maps.LatLngBounds) => {
  mapBoundsRef.current = bounds;
  debouncedFetchMarkersByBounds(); // 경계가 설정되면 마커 fetch를 디바운스하여 호출
}, [debouncedFetchMarkersByBounds]);

  return {
    stores,
    markerStores,
    filteredStores,
    storeNameQuery,
    regionQuery,
    selectedStore,
    mapCenter,
    zoomLevel,
    handleStoreNameSearch,
    handleRegionSearch,
    handleStoreSelect,
    handleMarkerClick,
    handleStoreSelectById,
    setMapCenter,
    setZoomLevel,
    setMapBounds,
    institutions,
    selectedInstitution,
    handleInstitutionChange,
    error,
    isLoading,
    fetchNearbyStores,
    fetchNearbyStoresByLineString,
    fetchMarkers,
  };
};