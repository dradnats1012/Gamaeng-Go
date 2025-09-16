import { InstitutionRegion, Store } from "@/types"
import { StoreSearch } from "./StoreSearch"
import { StoreList } from "./StoreList"

interface StoreSidebarProps {
  stores: Store[]
  selectedStore: Store | null
  zoomLevel: number
  storeNameQuery: string
  regionQuery: string
  institutions: InstitutionRegion[]
  selectedInstitution: string
  onStoreNameSearch: (query: string) => void
  onRegionSearch: (query: string) => void
  onInstitutionChange: (institution: string) => void
  onStoreSelect: (store: Store) => void
}

export const StoreSidebar = ({
  stores,
  selectedStore,
  zoomLevel,
  storeNameQuery,
  regionQuery,
  institutions,
  selectedInstitution,
  onStoreSelect,
  onStoreNameSearch,
  onRegionSearch,
  onInstitutionChange,
}: StoreSidebarProps) => (
  <div className="w-1/4 max-w-md min-w-100 bg-white shadow-lg overflow-hidden flex flex-col">
    <StoreSearch
      storeNameQuery={storeNameQuery}
      regionQuery={regionQuery}
      institutions={institutions}
      selectedInstitution={selectedInstitution}
      onStoreNameSearch={onStoreNameSearch}
      onRegionSearch={onRegionSearch}
      onInstitutionChange={onInstitutionChange}
    />
    <StoreList
      stores={stores}
      selectedStore={selectedStore}
      zoomLevel={zoomLevel}
      onStoreSelect={onStoreSelect}
    />
  </div>
)
