import { useReducer, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Loader2, RotateCw } from 'lucide-react';
import type { AppState, AppAction, FuelType } from './types';
import type { EVStation } from './types/ev';
import { fetchStations } from './services/stations';
import { fetchEVStations } from './services/evStations';
import { haversineKm } from './utils/distance';
import { generateMockStations } from './utils/mockData';
import DashboardScreen, { type DashboardSearchParams } from './screens/DashboardScreen';
import FuelTypeSelector from './components/FuelTypeSelector';
import MapView from './components/MapView';
import StationList from './components/StationList';
import EVStationList from './components/EVStationList';

// ─── Smart-score: effective price including round-trip fuel cost ───
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
    case 'GEOCODE_SUCCESS':    return { ...state, status: 'loading', searchLocation: action.location };
    case 'STATIONS_LOADED':    return { ...state, status: 'success', stations: action.stations, usingMockData: false };
    case 'STATIONS_FALLBACK':  return { ...state, status: 'success', stations: action.stations, usingMockData: true };
    case 'FUEL_CHANGED':       return { ...state, selectedFuel: action.fuel, selectedStationId: null };
    case 'STATION_HOVERED':    return { ...state, hoveredStationId: action.id };
    case 'STATION_SELECTED':   return { ...state, selectedStationId: action.id };
    case 'ERROR':              return { ...state, status: 'error', errorMessage: action.message };
    default:                   return state;
  }
}

type Screen = 'dashboard' | 'results';

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [searchParams, setSearchParams] = useState<DashboardSearchParams | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [evStations, setEvStations] = useState<EVStation[]>([]);
  const [evLoading, setEvLoading] = useState(false);

  const mode: 'fuel' | 'ev' = searchParams?.fuel === 'ev' ? 'ev' : 'fuel';

  // Fetch fuel stations when searchLocation is set and status is 'loading'
  useEffect(() => {
    if (!state.searchLocation || state.status !== 'loading') return;
    if (searchParams?.fuel === 'ev') return; // EV handled separately
    const { lat, lon } = state.searchLocation;
    const radius = searchParams?.radius ?? 10;
    fetchStations(lat, lon, radius)
      .then((stations) => {
        const enriched = stations.map((s) => {
          const dist = haversineKm(lat, lon, s.lat, s.lon);
          const price = s.prices[state.selectedFuel];
          return { ...s, distanceKm: dist, smartScore: price !== undefined ? smartScore(price, dist) : Infinity };
        });
        dispatch({ type: 'STATIONS_LOADED', stations: enriched });
      })
      .catch(() => {
        const mock = generateMockStations(lat, lon).map((s) => {
          const dist = haversineKm(lat, lon, s.lat, s.lon);
          const price = s.prices[state.selectedFuel];
          return { ...s, distanceKm: dist, smartScore: price !== undefined ? smartScore(price, dist) : Infinity };
        });
        dispatch({ type: 'STATIONS_FALLBACK', stations: mock });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.searchLocation]);

  // Fetch EV stations
  useEffect(() => {
    if (!state.searchLocation || searchParams?.fuel !== 'ev') return;
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
    // Set selected fuel for fuel mode
    if (params.fuel !== 'ev') {
      dispatch({ type: 'FUEL_CHANGED', fuel: params.fuel as FuelType });
    }
    dispatch({
      type: 'GEOCODE_SUCCESS',
      location: { query: params.displayName, lat: params.lat, lon: params.lon, displayName: params.displayName },
    });
  }

  function handleBack() {
    setScreen('dashboard');
  }

  function handleRefresh() {
    if (!searchParams) return;
    dispatch({
      type: 'GEOCODE_SUCCESS',
      location: { query: searchParams.displayName, lat: searchParams.lat, lon: searchParams.lon, displayName: searchParams.displayName },
    });
    setEvStations([]);
  }

  const mapCenter: [number, number] | null = state.searchLocation
    ? [state.searchLocation.lat, state.searchLocation.lon] : null;

  const cheapestId = useMemo(() => {
    const withPrice = enrichedStations.filter((s) => s.prices[state.selectedFuel] !== undefined);
    if (!withPrice.length) return null;
    return withPrice.reduce((a, b) =>
      (a.prices[state.selectedFuel] ?? Infinity) <= (b.prices[state.selectedFuel] ?? Infinity) ? a : b
    ).id;
  }, [enrichedStations, state.selectedFuel]);

  const isLoading = state.status === 'loading' || state.status === 'geocoding' || evLoading;

  // ─── Dashboard ───────────────────────────────────────────────────
  if (screen === 'dashboard') {
    return <DashboardScreen onSearch={handleSearch} />;
  }

  // ─── Results ─────────────────────────────────────────────────────
  const fuelLabel: Record<string, string> = {
    euro95: 'Euro 95', diesel: 'Diesel', lpg: 'LPG', superplus98: 'Super 98', ev: 'Elektrisch',
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--c-bg)' }}>

      {/* Results header */}
      <header
        className="flex-shrink-0"
        style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}
      >
        <div className="px-3 py-2.5 flex items-center gap-2">
          {/* Back */}
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors flex-shrink-0"
            style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
            aria-label="Terug naar dashboard"
          >
            <ChevronLeft size={20} style={{ color: 'var(--c-text-2)' }} />
          </button>

          {/* Context */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>
              {searchParams?.displayName}
            </p>
            <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
              {fuelLabel[searchParams?.fuel ?? 'euro95']} · {searchParams?.radius ?? 10} km
            </p>
          </div>

          {/* Loading / Refresh */}
          {isLoading ? (
            <div className="flex items-center gap-1.5 flex-shrink-0" style={{ color: 'var(--c-text-3)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--c-primary)' }} />
              <span className="text-xs">Ophalen…</span>
            </div>
          ) : (
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-colors"
              style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
              aria-label="Vernieuwen"
            >
              <RotateCw size={16} style={{ color: 'var(--c-text-3)' }} />
            </button>
          )}
        </div>

        {/* Fuel type switcher (fuel mode only) */}
        {mode === 'fuel' && enrichedStations.length > 0 && (
          <FuelTypeSelector
            selected={state.selectedFuel}
            onChange={(fuel) => dispatch({ type: 'FUEL_CHANGED', fuel })}
          />
        )}
      </header>

      {/* Error banner */}
      {state.status === 'error' && state.errorMessage && (
        <div
          className="flex-shrink-0 mx-3 mt-2 px-3 py-2.5 rounded-xl text-sm flex items-center gap-2"
          style={{
            background: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#F87171',
          }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {state.errorMessage}
        </div>
      )}

      {/* Map + list layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="h-[42vh] md:h-auto md:flex-1 relative shrink-0">
          <MapView
            center={mapCenter}
            stations={mode === 'fuel' ? enrichedStations : []}
            evStations={mode === 'ev' ? evStations : []}
            mode={mode}
            selectedFuel={state.selectedFuel}
            hoveredId={state.hoveredStationId}
            selectedId={state.selectedStationId}
            cheapestId={mode === 'fuel' ? cheapestId : null}
            onMarkerClick={(id) => dispatch({ type: 'STATION_SELECTED', id })}
          />
        </div>

        <div
          className="flex-1 min-h-0 md:flex-none md:w-[380px] flex flex-col overflow-hidden"
          style={{ background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)' }}
        >
          {mode === 'fuel' ? (
            <StationList
              stations={enrichedStations}
              selectedFuel={state.selectedFuel}
              hoveredId={state.hoveredStationId}
              selectedId={state.selectedStationId}
              usingMockData={state.usingMockData}
              status={state.status}
              onHover={(id) => dispatch({ type: 'STATION_HOVERED', id })}
              onSelect={(id) => dispatch({ type: 'STATION_SELECTED', id })}
            />
          ) : (
            <EVStationList
              stations={evStations}
              hoveredId={state.hoveredStationId}
              selectedId={state.selectedStationId}
              isLoading={evLoading}
              onHover={(id) => dispatch({ type: 'STATION_HOVERED', id })}
              onSelect={(id) => dispatch({ type: 'STATION_SELECTED', id })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
