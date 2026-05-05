import { useReducer, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AppState, AppAction } from './types';
import type { EVStation, AppMode } from './types/ev';
import { geocodeQuery } from './services/geocoding';
import { fetchStations } from './services/stations';
import { fetchEVStations } from './services/evStations';
import { haversineKm } from './utils/distance';
import { generateMockStations } from './utils/mockData';
import SearchBar from './components/SearchBar';
import FuelTypeSelector from './components/FuelTypeSelector';
import ModeToggle from './components/ModeToggle';
import MapView from './components/MapView';
import StationList from './components/StationList';
import EVStationList from './components/EVStationList';

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
    case 'SEARCH_SUBMITTED':   return { ...state, status: 'geocoding', errorMessage: null };
    case 'GEOCODE_SUCCESS':    return { ...state, status: 'loading', searchLocation: action.location };
    case 'GEOCODE_ERROR':      return { ...state, status: 'error', errorMessage: action.message };
    case 'STATIONS_LOADED':    return { ...state, status: 'success', stations: action.stations, usingMockData: false };
    case 'STATIONS_FALLBACK':  return { ...state, status: 'success', stations: action.stations, usingMockData: true };
    case 'FUEL_CHANGED':       return { ...state, selectedFuel: action.fuel, selectedStationId: null };
    case 'STATION_HOVERED':    return { ...state, hoveredStationId: action.id };
    case 'STATION_SELECTED':   return { ...state, selectedStationId: action.id };
    case 'GEOLOCATION_START':  return { ...state, geolocationLoading: true };
    case 'GEOLOCATION_DONE':   return { ...state, geolocationLoading: false };
    case 'ERROR':              return { ...state, status: 'error', errorMessage: action.message };
    default:                   return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mode, setMode] = useState<AppMode>('fuel');
  const [evStations, setEvStations] = useState<EVStation[]>([]);
  const [evLoading, setEvLoading] = useState(false);

  useEffect(() => {
    if (!state.searchLocation || state.status !== 'loading') return;
    const { lat, lon } = state.searchLocation;
    fetchStations(lat, lon)
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

  useEffect(() => {
    if (!state.searchLocation || mode !== 'ev') return;
    const { lat, lon } = state.searchLocation;
    setEvLoading(true);
    fetchEVStations(lat, lon)
      .then((stations) => {
        const enriched = stations.map((s) => ({ ...s, distanceKm: haversineKm(lat, lon, s.lat, s.lon) }));
        setEvStations(enriched);
      })
      .catch(() => setEvStations([]))
      .finally(() => setEvLoading(false));
  }, [state.searchLocation, mode]);

  const enrichedStations = useMemo(() => {
    if (!state.searchLocation) return state.stations;
    return state.stations.map((s) => {
      const price = s.prices[state.selectedFuel];
      return { ...s, smartScore: price !== undefined ? smartScore(price, s.distanceKm ?? 0) : Infinity };
    });
  }, [state.stations, state.selectedFuel, state.searchLocation]);

  function handleSearch(query: string) {
    dispatch({ type: 'SEARCH_SUBMITTED', query });
    geocodeQuery(query)
      .then((location) => dispatch({ type: 'GEOCODE_SUCCESS', location }))
      .catch((err: Error) => dispatch({ type: 'GEOCODE_ERROR', message: err.message }));
  }

  function handleGeolocate() {
    if (!navigator.geolocation) {
      dispatch({ type: 'ERROR', message: 'Geolocatie wordt niet ondersteund door deze browser' });
      return;
    }
    dispatch({ type: 'GEOLOCATION_START' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch({ type: 'GEOLOCATION_DONE' });
        dispatch({ type: 'GEOCODE_SUCCESS', location: {
          query: 'Mijn locatie', lat: pos.coords.latitude,
          lon: pos.coords.longitude, displayName: 'Mijn locatie',
        }});
      },
      () => {
        dispatch({ type: 'GEOLOCATION_DONE' });
        dispatch({ type: 'ERROR', message: 'Kon locatie niet bepalen. Controleer de browserinstellingen.' });
      },
      { timeout: 10000 }
    );
  }

  function handleModeChange(newMode: AppMode) {
    setMode(newMode);
    dispatch({ type: 'STATION_SELECTED', id: null });
    dispatch({ type: 'STATION_HOVERED', id: null });
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

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--c-bg)' }}>
      {/* Header */}
      <header className="flex-shrink-0" style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--c-accent)' }}>
              <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 002.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5a2.5 2.5 0 005 0V9c0-.69-.28-1.32-.73-1.77zM12 12.5H8V9h4v3.5z" />
            </svg>
            <span className="font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', letterSpacing: '0.05em', color: 'var(--c-text)' }}>
              TANKVERGELIJKER
            </span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--c-text-3)' }}>
              <Loader2 size={12} className="animate-spin" style={{ color: 'var(--c-accent)' }} />
              {evLoading ? 'Laadpalen ophalen…' : 'Ophalen…'}
            </div>
          )}
        </div>

        <SearchBar
          onSearch={handleSearch}
          onGeolocate={handleGeolocate}
          status={state.status}
          geolocationLoading={state.geolocationLoading}
          currentLocation={state.searchLocation?.displayName ?? null}
        />

        <ModeToggle mode={mode} onChange={handleModeChange} />

        {mode === 'fuel' && enrichedStations.length > 0 && (
          <FuelTypeSelector
            selected={state.selectedFuel}
            onChange={(fuel) => dispatch({ type: 'FUEL_CHANGED', fuel })}
          />
        )}
      </header>

      {state.status === 'error' && state.errorMessage && (
        <div className="flex-shrink-0 mx-3 mt-2 px-3 py-2.5 rounded-xl text-sm flex items-center gap-2"
          style={{
            background: 'var(--c-accent-dim)',
            border: '1px solid var(--c-accent)',
            color: 'var(--c-accent)',
          }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {state.errorMessage}
        </div>
      )}

      {/* Mobile: map top, list below. Desktop: side by side */}
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

        <div className="flex-1 min-h-0 md:flex-none md:w-[380px] flex flex-col overflow-hidden"
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
