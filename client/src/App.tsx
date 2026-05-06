import { useReducer, useEffect, useMemo, useState } from 'react';
import type { AppState, AppAction, FuelType } from './types';
import type { EVStation } from './types/ev';
import { fetchStations } from './services/stations';
import { fetchEVStations } from './services/evStations';
import { haversineKm } from './utils/distance';
import { generateMockStations } from './utils/mockData';
import DashboardScreen, { type DashboardSearchParams } from './screens/DashboardScreen';
import ResultsScreen from './screens/ResultsScreen';

function smartScore(price: number, distKm: number) {
  return price + (distKm * 2 * 0.07 * price) / 50;
}

const initialState: AppState = {
  searchLocation: null,
  selectedFuel: 'euro95',
  stations: [],
  hoveredStationId: null,
  selectedStationId: null,
  status: 'idle',
  errorMessage: null,
  usingMockData: false,
  geolocationLoading: false,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'GEOCODE_SUCCESS':   return { ...state, status: 'loading', searchLocation: action.location };
    case 'STATIONS_LOADED':   return { ...state, status: 'success', stations: action.stations, usingMockData: false };
    case 'STATIONS_FALLBACK': return { ...state, status: 'success', stations: action.stations, usingMockData: true };
    case 'FUEL_CHANGED':      return { ...state, selectedFuel: action.fuel, selectedStationId: null };
    case 'STATION_HOVERED':   return { ...state, hoveredStationId: action.id };
    case 'STATION_SELECTED':  return { ...state, selectedStationId: action.id };
    case 'ERROR':             return { ...state, status: 'error', errorMessage: action.message };
    default:                  return state;
  }
}

export default function App() {
  const [screen, setScreen] = useState<'dashboard' | 'results'>('dashboard');
  const [searchParams, setSearchParams] = useState<DashboardSearchParams | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [evStations, setEvStations] = useState<EVStation[]>([]);
  const [evLoading, setEvLoading] = useState(false);

  const mode = searchParams?.fuel === 'ev' ? 'ev' : 'fuel';

  // Fetch fuel stations
  useEffect(() => {
    if (!state.searchLocation || state.status !== 'loading' || mode === 'ev') return;
    const { lat, lon } = state.searchLocation;
    const radius = searchParams?.radius ?? 10;
    fetchStations(lat, lon, radius)
      .then((stations) => {
        const enriched = stations.map((s) => {
          const dist  = haversineKm(lat, lon, s.lat, s.lon);
          const price = s.prices[state.selectedFuel];
          return { ...s, distanceKm: dist, smartScore: price !== undefined ? smartScore(price, dist) : Infinity };
        });
        dispatch({ type: 'STATIONS_LOADED', stations: enriched });
      })
      .catch(() => {
        const mock = generateMockStations(lat, lon).map((s) => {
          const dist  = haversineKm(lat, lon, s.lat, s.lon);
          const price = s.prices[state.selectedFuel];
          return { ...s, distanceKm: dist, smartScore: price !== undefined ? smartScore(price, dist) : Infinity };
        });
        dispatch({ type: 'STATIONS_FALLBACK', stations: mock });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.searchLocation]);

  // Fetch EV stations
  useEffect(() => {
    if (!state.searchLocation || mode !== 'ev') return;
    const { lat, lon } = state.searchLocation;
    const radius = searchParams?.radius ?? 10;
    setEvLoading(true);
    fetchEVStations(lat, lon, radius)
      .then((stations) => {
        const enriched = stations.map((s) => ({ ...s, distanceKm: haversineKm(lat, lon, s.lat, s.lon) }));
        setEvStations(enriched);
      })
      .catch(() => setEvStations([]))
      .finally(() => setEvLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.searchLocation]);

  const enrichedStations = useMemo(() => {
    if (!state.searchLocation) return state.stations;
    return state.stations.map((s) => {
      const price = s.prices[state.selectedFuel];
      return { ...s, smartScore: price !== undefined ? smartScore(price, s.distanceKm ?? 0) : Infinity };
    });
  }, [state.stations, state.selectedFuel, state.searchLocation]);

  function handleSearch(params: DashboardSearchParams) {
    setSearchParams(params);
    setScreen('results');
    setEvStations([]);
    if (params.fuel !== 'ev') {
      dispatch({ type: 'FUEL_CHANGED', fuel: params.fuel as FuelType });
    }
    dispatch({
      type: 'GEOCODE_SUCCESS',
      location: { query: params.displayName, lat: params.lat, lon: params.lon, displayName: params.displayName },
    });
  }

  function handleRefresh() {
    if (!searchParams) return;
    setEvStations([]);
    dispatch({
      type: 'GEOCODE_SUCCESS',
      location: { query: searchParams.displayName, lat: searchParams.lat, lon: searchParams.lon, displayName: searchParams.displayName },
    });
  }

  if (screen === 'dashboard') {
    return <DashboardScreen onSearch={handleSearch} />;
  }

  return (
    <ResultsScreen
      searchParams={searchParams!}
      stations={enrichedStations}
      selectedFuel={state.selectedFuel}
      status={state.status}
      usingMockData={state.usingMockData}
      onFuelChange={(fuel) => dispatch({ type: 'FUEL_CHANGED', fuel })}
      evStations={evStations}
      evLoading={evLoading}
      hoveredId={state.hoveredStationId}
      selectedId={state.selectedStationId}
      onHover={(id) => dispatch({ type: 'STATION_HOVERED', id })}
      onSelect={(id) => dispatch({ type: 'STATION_SELECTED', id })}
      onBack={() => setScreen('dashboard')}
      onRefresh={handleRefresh}
    />
  );
}
