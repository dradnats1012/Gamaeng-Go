'use client'
import { useState, useCallback, useEffect } from "react"
import { useDebouncedCallback } from "use-debounce"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Navigation } from "lucide-react"
import GoogleMap from "@/components/google-map"

interface Store {
  id: number
  storeName: string
  localBill: string
  region: string
  roadAddress: string
  latitude: number
  longitude: number
}

export default function MapApp() {
  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [storeNameQuery, setStoreNameQuery] = useState("")
  const [regionQuery, setRegionQuery] = useState("")
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 })
  const [zoomLevel, setZoomLevel] = useState(13) // 초기 줌 레벨 설정

  const fetchNearbyStores = useCallback(async (latitude: number, longitude: number) => {
    try {
      // API 경로와 파라미터를 사용하여 주변 가맹점 정보를 요청합니다.
      const response = await fetch(
        `http://localhost:8080/api/v1/local-stores/nearby?latitude=${latitude}&longitude=${longitude}&distance=5000`,
      )
      if (!response.ok) {
        throw new Error("API 요청에 실패했습니다.")
      }
      const data: Store[] = await response.json()
      setStores(data)
      setFilteredStores(data)
    } catch (error) {
      console.error("가맹점 정보를 불러오는 중 오류가 발생했습니다:", error)
      // 사용자에게 오류를 알리는 UI를 추가할 수 있습니다.
    }
  }, [])

  const debouncedFetchNearbyStores = useDebouncedCallback((center) => {
    fetchNearbyStores(center.lat, center.lng)
  }, 500) // 500ms 디바운스

  useEffect(() => {
    if (zoomLevel >= 14) {
      // 줌 레벨이 14 이상일 때만 API 호출
      debouncedFetchNearbyStores(mapCenter)
    } else {
      // 줌 레벨이 너무 낮으면 목록을 비움
      setStores([])
      setFilteredStores([])
    }
  }, [mapCenter, zoomLevel, debouncedFetchNearbyStores])

  const searchStores = useCallback(async (url: string, paramName: string, query: string) => {
    if (!query.trim()) {
      // 검색어가 없으면 주변 가게를 다시 불러옴
      fetchNearbyStores(mapCenter.lat, mapCenter.lng)
      return
    }

    try {
      const params = new URLSearchParams({
        [paramName]: query,
        page: "0",
        size: "20",
      })
      const response = await fetch(`${url}?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`)
      }
      const data = await response.json()
      const searchResults = data.content || [] // Slice 객체에서 content를 추출

      setStores(searchResults)
      setFilteredStores(searchResults)

      if (searchResults.length > 0) {
        const firstResult = searchResults[0]
        setMapCenter({ lat: firstResult.latitude, lng: firstResult.longitude })
        setZoomLevel(16) // 검색 결과가 있으면 확대
      } else {
        // 검색 결과가 없으면 현재 위치 기준으로 가게 목록을 다시 불러오지 않도록
        // 목록만 비워줍니다.
        setStores([])
        setFilteredStores([])
      }
    } catch (error) {
      console.error("검색 중 오류 발생:", error)
      setStores([])
      setFilteredStores([])
    }
  }, [fetchNearbyStores, mapCenter.lat, mapCenter.lng])

  const debouncedStoreNameSearch = useDebouncedCallback((query) => {
    searchStores("http://localhost:8080/api/v1/local-stores/name", "storeName", query)
  }, 500)

  const debouncedRegionSearch = useDebouncedCallback((query) => {
    searchStores("http://localhost:8080/api/v1/local-stores/region", "region", query)
  }, 500)

  const handleStoreNameSearch = (query: string) => {
    setStoreNameQuery(query)
    setRegionQuery("") // 다른 검색창 초기화
    debouncedStoreNameSearch(query)
  }

  const handleRegionSearch = (query: string) => {
    setRegionQuery(query)
    setStoreNameQuery("") // 다른 검색창 초기화
    debouncedRegionSearch(query)
  }

  const handleStoreSelect = (store: Store) => {
    setSelectedStore(store)
    setMapCenter({ lat: store.latitude, lng: store.longitude })
  }

  const handleMarkerClick = (store: Store) => {
    setSelectedStore(store)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <div className="w-96 bg-white shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="상점명으로 검색..."
              value={storeNameQuery}
              onChange={(e) => handleStoreNameSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="지역명으로 검색..."
              value={regionQuery}
              onChange={(e) => handleRegionSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">검색 결과</h2>
              <Badge variant="secondary">{filteredStores.length}개</Badge>
            </div>

            <div className="space-y-3">
              {filteredStores.map((store) => (
                <Card
                  key={store.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedStore?.id === store.id ? "ring-2 ring-blue-500" : ""
                    }`}
                  onClick={() => handleStoreSelect(store)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">{store.storeName}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center text-xs text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {store.roadAddress}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {store.localBill}
                        </Badge>
                        <span className="text-xs text-gray-500">{store.region}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredStores.length === 0 && zoomLevel < 14 && (
              <div className="text-center py-8 text-gray-500">
                <p>지도를 확대하여 주변 상점을 검색하세요.</p>
              </div>
            )}

            {filteredStores.length === 0 && zoomLevel >= 14 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 지도 영역 */}
      <div className="flex-1 relative">
        <GoogleMap
          stores={filteredStores}
          center={mapCenter}
          selectedStore={selectedStore}
          onMarkerClick={handleMarkerClick}
          onCenterChanged={setMapCenter}
          onZoomChanged={setZoomLevel}
        />

        {/* 현재 위치 버튼 */}
        <Button
          size="icon"
          className="absolute top-4 right-4 z-10 shadow-lg"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((position) => {
                setMapCenter({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                })
              })
            }
          }}
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
