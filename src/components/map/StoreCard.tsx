
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import { Store } from "@/types"

interface StoreCardProps {
  store: Store
  isSelected: boolean
  onClick: () => void
}

export const StoreCard = ({ store, isSelected, onClick }: StoreCardProps) => (
  <Card
    className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-blue-500" : ""}`}
    onClick={onClick}
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
)
