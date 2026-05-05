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

export type AppStatus = 'idle' | 'geocoding' | 'loading' | 'success' | 'error';

export interface AppState {
  searchLocation: SearchLocation | null;
  selectedFuel: FuelType;
  stations: Station[];
  hoveredStationId: string | null;
  selectedStationId: string | null;
  status: AppStatus;
  errorMessage: string | null;
  usingMockData: boolean;
  geolocationLoading: boolean;
}

export type AppAction =
  | { type: 'SEARCH_SUBMITTED'; query: string }
  | { type: 'GEOCODE_SUCCESS'; location: SearchLocation }
  | { type: 'GEOCODE_ERROR'; message: string }
  | { type: 'STATIONS_LOADED'; stations: Station[] }
  | { type: 'STATIONS_FALLBACK'; stations: Station[] }
  | { type: 'FUEL_CHANGED'; fuel: FuelType }
  | { type: 'STATION_HOVERED'; id: string | null }
  | { type: 'STATION_SELECTED'; id: string | null }
  | { type: 'GEOLOCATION_START' }
  | { type: 'GEOLOCATION_DONE' }
  | { type: 'ERROR'; message: string };
