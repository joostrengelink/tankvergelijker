import { useState, type FormEvent } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import type { AppStatus } from '../types';

interface Props {
  onSearch: (query: string) => void;
  onGeolocate: () => void;
  status: AppStatus;
  geolocationLoading: boolean;
  currentLocation: string | null;
}

const POSTCODE_RE = /^\d{4}\s?[A-Z]{2}$/i;

export default function SearchBar({ onSearch, onGeolocate, status, geolocationLoading, currentLocation }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isLoading = status === 'geocoding' || status === 'loading';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    if (trimmed.length < 2 && !POSTCODE_RE.test(trimmed)) {
      setError('Voer een plaatsnaam of postcode in');
      return;
    }
    setError(null);
    onSearch(POSTCODE_RE.test(trimmed) ? trimmed.toUpperCase().replace(/\s/, '') : trimmed);
  }

  return (
    <div className="px-4 py-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--c-text-3)' }} />
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null); }}
            placeholder="Stad of postcode..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#059669]/50 transition-colors"
            style={{
              background: 'var(--c-surface-2)',
              border: '1px solid var(--c-border)',
              color: 'var(--c-text)',
            }}
            disabled={isLoading || geolocationLoading}
          />
        </div>
        <button
          type="button"
          onClick={onGeolocate}
          disabled={geolocationLoading || isLoading}
          title="Gebruik mijn locatie"
          className="px-3 py-2.5 rounded-xl disabled:opacity-40 transition-colors"
          style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--c-text-3)' }}
        >
          {geolocationLoading
            ? <Loader2 size={16} className="animate-spin" style={{ color: 'var(--c-primary)' }} />
            : <MapPin size={16} />
          }
        </button>
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          style={{
            background: 'var(--c-primary)',
            color: '#fff',
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.05em',
          }}
        >
          {isLoading ? 'ZOEKEN…' : 'ZOEK'}
        </button>
      </form>
      {error && <p className="mt-1.5 text-xs pl-1" style={{ color: 'var(--c-primary)' }}>{error}</p>}
      {currentLocation && !error && (
        <p className="mt-1.5 text-xs pl-1 flex items-center gap-1" style={{ color: 'var(--c-text-3)' }}>
          <MapPin size={11} />
          {currentLocation}
        </p>
      )}
    </div>
  );
}
