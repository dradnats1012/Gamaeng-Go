
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
  </Card>
)
