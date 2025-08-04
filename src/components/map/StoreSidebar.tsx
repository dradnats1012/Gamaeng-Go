import { Store } from "@/types"
import { StoreSearch } from "./StoreSearch"
import { StoreList } from "./StoreList"

interface StoreSidebarProps {
  stores: Store[]
  selectedStore: Store | null
  zoomLevel: number
  storeNameQuery: string
  regionQuery: string
  institutions: string[]
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
  <div className="min-w-96 bg-white shadow-lg overflow-hidden flex flex-col">
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
