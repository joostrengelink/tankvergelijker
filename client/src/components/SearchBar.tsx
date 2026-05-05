import { useState, type FormEvent } from 'react';
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
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null); }}
            placeholder="Stad of postcode, bijv. Amsterdam of 1011AB"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
            disabled={isLoading || geolocationLoading}
          />
        </div>
        <button
          type="button"
          onClick={onGeolocate}
          disabled={geolocationLoading || isLoading}
          title="Gebruik mijn locatie"
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-orange-500 hover:border-orange-300 disabled:opacity-50 shadow-sm transition-colors"
        >
          {geolocationLoading
            ? <span className="block w-4 h-4 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin" />
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          }
        </button>
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
        >
          {isLoading ? 'Zoeken…' : 'Zoek'}
        </button>
      </form>
      {error && <p className="mt-1.5 text-xs text-red-500 pl-1">{error}</p>}
      {currentLocation && !error && (
        <p className="mt-1.5 text-xs text-slate-400 pl-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
          {currentLocation}
        </p>
      )}
    </div>
  );
}
