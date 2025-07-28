
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface StoreSearchProps {
  storeNameQuery: string
  regionQuery: string
  onStoreNameSearch: (query: string) => void
  onRegionSearch: (query: string) => void
}

export const StoreSearch = ({ storeNameQuery, regionQuery, onStoreNameSearch, onRegionSearch }: StoreSearchProps) => (
  <div className="p-4 border-b space-y-4">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder="상점명으로 검색..."
        value={storeNameQuery}
        onChange={(e) => onStoreNameSearch(e.target.value)}
        className="pl-10"
      />
    </div>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        placeholder="지역명으로 검색..."
        value={regionQuery}
        onChange={(e) => onRegionSearch(e.target.value)}
        className="pl-10"
      />
    </div>
  </div>
)
