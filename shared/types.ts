export type FuelType = 'euro95' | 'diesel' | 'superplus98' | 'lpg';

export const FUEL_LABELS: Record<FuelType, string> = {
  euro95: 'Euro 95',
  diesel: 'Diesel',
  superplus98: 'Super 98',
  lpg: 'LPG',
};

export interface Station {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  lat: number;
  lon: number;
  prices: Partial<Record<FuelType, number>>;
  openingHours: string | null;
  distanceKm?: number;
  smartScore?: number;
  lastUpdated: string;
}

export interface SearchLocation {
  query: string;
  lat: number;
  lon: number;
  displayName: string;
}
