import { useState } from 'react';
import { Droplets, Fuel, Flame, Zap, Search, ArrowRight, Loader2, CheckCircle2, Navigation } from 'lucide-react';
import { geocodeQuery } from '../services/geocoding';
import type { FuelType } from '../types';

export type FuelChoice = FuelType | 'ev';
export type SearchRadius = 5 | 10 | 25 | 50;

export interface DashboardSearchParams {
  lat: number;
  lon: number;
  displayName: string;
  fuel: FuelChoice;
  radius: SearchRadius;
}

interface Props {
  onSearch: (params: DashboardSearchParams) => void;
}

const FUEL_OPTIONS: {
  id: FuelChoice;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>;
  isEV?: boolean;
}[] = [
  { id: 'euro95',  label: 'Benzine',    sublabel: 'Euro 95 · E10',     icon: Droplets },
  { id: 'diesel',  label: 'Diesel',     sublabel: 'Standaard diesel',   icon: Fuel },
  { id: 'lpg',     label: 'LPG',        sublabel: 'Autogas',            icon: Flame },
  { id: 'ev',      label: 'Elektrisch', sublabel: 'Laadpalen',          icon: Zap, isEV: true },
];

const RADII: SearchRadius[] = [5, 10, 25, 50];

export default function DashboardScreen({ onSearch }: Props) {
  const [selectedFuel, setSelectedFuel] = useState<FuelChoice>('euro95');
  const [radius, setRadius] = useState<SearchRadius>(10);
  const [locationInput, setLocationInput] = useState('');
  const [resolvedLocation, setResolvedLocation] = useState<{ lat: number; lon: number; displayName: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function vibrate(ms = 10) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  }

  function handleGPS() {
    if (!navigator.geolocation) {
      setError('Geolocatie niet ondersteund door deze browser');
      return;
    }
    setGpsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setResolvedLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, displayName: 'Mijn locatie' });
        setLocationInput('');
        setGpsLoading(false);
      },
      () => {
        setError('Kon locatie niet bepalen — controleer de browserinstellingen');
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  }

  async function handleSubmit() {
    setError(null);
    let location = resolvedLocation;

    if (!location) {
      const trimmed = locationInput.trim();
      if (trimmed.length < 2) {
        setError('Stel eerst een locatie in via GPS of zoek een stad of postcode');
        return;
      }
      setSearchLoading(true);
      try {
        location = await geocodeQuery(trimmed);
        setResolvedLocation(location);
      } catch {
        setError('Locatie niet gevonden — probeer een andere plaatsnaam of postcode');
        setSearchLoading(false);
        return;
      }
      setSearchLoading(false);
    }

    onSearch({ ...location, fuel: selectedFuel, radius });
  }

  const isLoading = gpsLoading || searchLoading;

  return (
    <div
      className="flex flex-col min-h-screen overflow-y-auto"
      style={{ background: 'var(--c-bg)' }}
    >
      {/* Header */}
      <header className="flex-shrink-0 px-5 pb-8 flex items-center justify-between"
        style={{ paddingTop: 'max(48px, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--c-primary-dim)', border: '1.5px solid var(--c-primary)' }}
          >
            <Fuel size={20} style={{ color: 'var(--c-primary)' }} />
          </div>
          <div>
            <p
              className="font-black text-xl leading-none tracking-wide"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--c-text)', letterSpacing: '0.07em' }}
            >
              TANKVERGELIJKER
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>
              Altijd de beste prijs nabij
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 pb-12 flex flex-col gap-8">

        {/* ── Brandstofkeuze ── */}
        <section>
          <h2
            className="text-base font-semibold mb-4"
            style={{ color: 'var(--c-text)' }}
          >
            Wat wil je vergelijken?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {FUEL_OPTIONS.map(({ id, label, sublabel, icon: Icon, isEV }) => {
              const isSelected = selectedFuel === id;
              const activeColor = isEV ? 'var(--c-ev)' : 'var(--c-primary)';
              const activeDim   = isEV ? 'var(--c-ev-dim)' : 'var(--c-primary-dim)';
              const activeGlow  = isEV ? 'var(--c-ev-glow)' : 'var(--c-primary-glow)';
              const iconBg      = isEV
                ? (isSelected ? 'rgba(6,182,212,0.22)' : 'var(--c-surface-2)')
                : (isSelected ? 'rgba(5,150,105,0.22)' : 'var(--c-surface-2)');
              return (
                <button
                  key={id}
                  onClick={() => { setSelectedFuel(id); vibrate(10); }}
                  className="flex flex-col items-center justify-center gap-3 py-6 rounded-2xl transition-all duration-200 active:scale-95"
                  style={{
                    background: isSelected ? activeDim : 'var(--c-surface)',
                    border: `1.5px solid ${isSelected ? activeColor : 'var(--c-border)'}`,
                    boxShadow: isSelected
                      ? `0 0 0 3px ${activeGlow}, var(--shadow-card)`
                      : 'var(--shadow-card)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: iconBg }}
                  >
                    <Icon
                      size={26}
                      strokeWidth={1.6}
                      style={{ color: isSelected ? activeColor : 'var(--c-text-3)' }}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: isSelected ? activeColor : 'var(--c-text)' }}
                    >
                      {label}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>
                      {sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Locatie ── */}
        <section>
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--c-text)' }}>
            Jouw locatie
          </h2>

          {resolvedLocation ? (
            /* Confirmed location pill */
            <div
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-3"
              style={{
                background: 'var(--c-primary-dim)',
                border: '1.5px solid var(--c-primary)',
              }}
            >
              <CheckCircle2 size={20} style={{ color: 'var(--c-primary)', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>
                  {resolvedLocation.displayName}
                </p>
                <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>Locatie ingesteld</p>
              </div>
              <button
                onClick={() => { setResolvedLocation(null); setLocationInput(''); }}
                className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                style={{
                  background: 'var(--c-surface-3)',
                  color: 'var(--c-text-3)',
                  border: '1px solid var(--c-border)',
                }}
              >
                Wijzig
              </button>
            </div>
          ) : (
            <>
              {/* GPS button */}
              <button
                onClick={handleGPS}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-3 transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: 'var(--c-surface)',
                  border: '1.5px solid var(--c-border)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {gpsLoading
                  ? <Loader2 size={20} className="animate-spin" style={{ color: 'var(--c-primary)', flexShrink: 0 }} />
                  : <Navigation size={20} style={{ color: 'var(--c-primary)', flexShrink: 0 }} />
                }
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                    {gpsLoading ? 'Locatie bepalen…' : 'Gebruik mijn huidige locatie'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--c-text-3)' }}>Snelste optie — GPS</p>
                </div>
              </button>

              {/* Or divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
                <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>of zoek handmatig</span>
                <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
              </div>

              {/* Search input */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--c-text-3)' }}
                />
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => { setLocationInput(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Stad of postcode…"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-colors"
                  style={{
                    background: 'var(--c-surface)',
                    border: '1.5px solid var(--c-border)',
                    color: 'var(--c-text)',
                  }}
                  disabled={isLoading}
                />
              </div>
            </>
          )}
        </section>

        {/* ── Zoekradius ── */}
        <section>
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--c-text)' }}>
            Zoekradius
          </h2>
          <div className="flex gap-2">
            {RADII.map((r) => (
              <button
                key={r}
                onClick={() => { setRadius(r); vibrate(8); }}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: '0.03em',
                  background: radius === r ? 'var(--c-primary)' : 'var(--c-surface)',
                  color: radius === r ? '#fff' : 'var(--c-text-3)',
                  border: `1.5px solid ${radius === r ? 'var(--c-primary)' : 'var(--c-border)'}`,
                  boxShadow: radius === r ? '0 2px 8px var(--c-primary-glow)' : 'none',
                }}
              >
                {r} km
              </button>
            ))}
          </div>
        </section>

        {/* ── Foutmelding ── */}
        {error && (
          <div
            className="px-4 py-3 rounded-2xl text-sm flex items-start gap-2.5 animate-fade-in"
            style={{
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#F87171',
            }}
          >
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* ── CTA ── */}
        <button
          onClick={() => { vibrate(20); handleSubmit(); }}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: selectedFuel === 'ev' ? 'var(--c-ev)' : 'var(--c-primary)',
            color: selectedFuel === 'ev' ? '#0A1412' : '#fff',
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.04em',
            fontSize: '17px',
            padding: '18px 24px',
            boxShadow: selectedFuel === 'ev'
              ? '0 4px 20px var(--c-ev-glow)'
              : '0 4px 20px var(--c-primary-glow)',
          }}
        >
          {searchLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Even kijken waar je het goedkoopst tankt…
            </>
          ) : (
            <>
              Vind de beste optie
              <ArrowRight size={20} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
