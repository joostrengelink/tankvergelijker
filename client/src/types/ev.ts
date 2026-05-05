export interface EVSocket {
  type: string;
  label: string;
  count: number;
  powerKw: number | null;
}

export interface EVStation {
  id: string;
  name: string;
  operator: string;
  lat: number;
  lon: number;
  address: string;
  city: string;
  capacity: number;
  maxPowerKw: number | null;
  sockets: EVSocket[];
  isFastCharger: boolean;
  pricePerKwh: number | null;
  priceNote: string | null;
  distanceKm?: number;
}

export type AppMode = 'fuel' | 'ev';
