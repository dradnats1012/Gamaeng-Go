
import { Store } from "@/types"
import { StoreSearch } from "./StoreSearch"
import { StoreList } from "./StoreList"

interface StoreSidebarProps {
  stores: Store[]
  selectedStore: Store | null
  zoomLevel: number
  storeNameQuery: string
  regionQuery: string
  onStoreNameSearch: (query: string) => void
  onRegionSearch: (query: string) => void
  onStoreSelect: (store: Store) => void
}

export const StoreSidebar = ({ stores, selectedStore, zoomLevel, storeNameQuery, regionQuery, onStoreNameSearch, onRegionSearch, onStoreSelect }: StoreSidebarProps) => (
  <div className="w-96 bg-white shadow-lg overflow-hidden flex flex-col">
    <StoreSearch
      storeNameQuery={storeNameQuery}
      regionQuery={regionQuery}
      onStoreNameSearch={onStoreNameSearch}
      onRegionSearch={onRegionSearch}
    />
    <StoreList
      stores={stores}
      selectedStore={selectedStore}
      zoomLevel={zoomLevel}
      onStoreSelect={onStoreSelect}
    />
  </div>
)
