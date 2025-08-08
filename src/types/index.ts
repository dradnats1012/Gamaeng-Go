export interface Store {
  id: number;
  storeName: string;
  localBill: string;
  region: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
  telNumber?: string; 
  sectorName?: string; 
  address?: string; 
}

export interface StoreListProps {
  stores: Store[];
  selectedStore: Store | null;
  zoomLevel: number;
  onStoreSelect: (store: Store) => void;
}

export interface SimpleStore {
  id: number;
  latitude: number;
  longitude: number;
}