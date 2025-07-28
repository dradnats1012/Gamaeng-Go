
import { Store } from "@/types"
import { StoreCard } from "./StoreCard"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

interface StoreListProps {
  stores: Store[]
  selectedStore: Store | null
  zoomLevel: number
  onStoreSelect: (store: Store) => void
}

export const StoreList = ({ stores, selectedStore, zoomLevel, onStoreSelect }: StoreListProps) => (
  <div className="flex-1 overflow-y-auto">
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">검색 결과</h2>
        <Badge variant="secondary">{stores.length}개</Badge>
      </div>

      <div className="space-y-3">
        {stores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            isSelected={selectedStore?.id === store.id}
            onClick={() => onStoreSelect(store)}
          />
        ))}
      </div>

      {stores.length === 0 && zoomLevel < 14 && (
        <div className="text-center py-8 text-gray-500">
          <p>지도를 확대하여 주변 상점을 검색하세요.</p>
        </div>
      )}

      {stores.length === 0 && zoomLevel >= 14 && (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  </div>
)
