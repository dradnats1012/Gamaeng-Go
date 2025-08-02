'use client'
import { Button } from "@/components/ui/button"
import { Navigation } from "lucide-react"
import GoogleMap from "@/components/google-map"
import { useStores } from "@/hooks/use-stores"
import { StoreSidebar } from "@/components/map/StoreSidebar"

export default function MapApp() {
  const {
    stores,
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
    setMapCenter,
    setZoomLevel,
    institutions,
    selectedInstitution,
    handleInstitutionChange,
  } = useStores()

  return (
    <div className="flex h-screen bg-gray-50">
      <StoreSidebar
        stores={filteredStores}
        selectedStore={selectedStore}
        zoomLevel={zoomLevel}
        storeNameQuery={storeNameQuery}
        regionQuery={regionQuery}
        onStoreNameSearch={handleStoreNameSearch}
        onRegionSearch={handleRegionSearch}
        onStoreSelect={handleStoreSelect}
        onInstitutionChange={handleInstitutionChange}
        institutions={institutions}
        selectedInstitution={selectedInstitution}
      />

      <div className="flex-1 relative">
        <GoogleMap
          stores={filteredStores}
          center={mapCenter}
          selectedStore={selectedStore}
          onMarkerClick={handleMarkerClick}
          onCenterChanged={setMapCenter}
          onZoomChanged={setZoomLevel}
        />

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
