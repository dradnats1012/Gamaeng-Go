import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InstitutionRegion } from "@/types"

interface StoreSearchProps {
  storeNameQuery: string
  regionQuery: string
  institutions: InstitutionRegion[]
  selectedInstitution: string
  onStoreNameSearch: (query: string) => void
  onRegionSearch: (query: string) => void
  onInstitutionChange: (institution: string) => void
}

export const StoreSearch = ({
  storeNameQuery,
  regionQuery,
  institutions,
  selectedInstitution,
  onStoreNameSearch,
  onRegionSearch,
  onInstitutionChange,
}: StoreSearchProps) => {
  return (
  <div className="p-4 border-b space-y-4">
    <Select onValueChange={onInstitutionChange} value={selectedInstitution}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="지역 선택..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">전체</SelectItem>
        {Array.isArray(institutions) && institutions.map((inst) => (
          <SelectItem key={inst.regionName} value={inst.regionName}>
            {inst.regionName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

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
}