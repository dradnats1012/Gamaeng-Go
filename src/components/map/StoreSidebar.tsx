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
  handleStoreSelectById: (storeId : number) => void
}

export const StoreSidebar = ({
  stores,
  selectedStore,
  zoomLevel,
  storeNameQuery,
  regionQuery,
  institutions,
  selectedInstitution,
  handleStoreSelectById,
  onStoreNameSearch,
  onRegionSearch,
  onInstitutionChange,
}: StoreSidebarProps) => (
  <div className="w-96 bg-white shadow-lg overflow-hidden flex flex-col">
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
      handleStoreSelectById={handleStoreSelectById}
    />
  </div>
)
