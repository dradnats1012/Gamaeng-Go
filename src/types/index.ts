export interface Store {
  uuid: string;
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
  uuid: string;
  latitude: number;
  longitude: number;
}