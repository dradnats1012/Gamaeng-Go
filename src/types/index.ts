export interface Store {
  id: number;
  storeName: string;
  localBill: string;
  region: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
  telNumber?: string; // 추가
  sectorName?: string; // 추가
  address?: string; // 추가
}