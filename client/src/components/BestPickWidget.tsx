import { Star, MapPin, Clock, Navigation } from 'lucide-react';
import type { Station, FuelType } from '../types';
import type { EVStation } from '../types/ev';

function travelMin(km: number): number {
  return Math.max(1, Math.round((km / 40) * 60));
}

function navigate(lat: number, lon: number) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
    '_blank', 'noopener,noreferrer'
  );
}

function fuelReason(station: Station, fuel: FuelType, minPrice: number, radius: number): string {
  const price = station.prices[fuel]!;
  if (Math.abs(price - minPrice) < 0.001) return `Laagste prijs binnen ${radius} km`;
  if ((station.distanceKm ?? 999) < 1.5) return 'Dichtste station met goede prijs';
  return 'Beste prijs-afstand verhouding';
}

function evReason(station: EVStation, radius: number): string {
  if (station.pricePerKwh !== null && station.pricePerKwh > 0) return `Goedkoopste laadpaal binnen ${radius} km`;
  if ((station.distanceKm ?? 999) < 1) return 'Dichtste laadpaal';
  return 'Beste optie in de buurt';
}

interface FuelProps {
  mode: 'fuel';
  station: Station;
  selectedFuel: FuelType;
  minPrice: number;
  radius: number;
}

interface EVProps {
  mode: 'ev';
  station: EVStation;
  radius: number;
}

type Props = FuelProps | EVProps;

export default function BestPickWidget(props: Props) {
  const isEV = props.mode === 'ev';
  const primaryColor = isEV ? 'var(--c-ev)' : 'var(--c-primary)';
  const primaryDim   = isEV ? 'var(--c-ev-dim)' : 'var(--c-primary-dim)';

  if (props.mode === 'fuel') {
    const { station, selectedFuel, minPrice, radius } = props;
    const price = station.prices[selectedFuel];
    const dist  = station.distanceKm;
    const reason = fuelReason(station, selectedFuel, minPrice, radius);

    return (
      <div
        className="mx-3 mb-2 mt-2 rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: 'var(--c-highlight-dim)', border: '1.5px solid var(--c-highlight)', boxShadow: '0 4px 20px var(--c-highlight-glow)' }}
      >
        {/* Header row */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
          <Star size={11} fill="var(--c-highlight)" style={{ color: 'var(--c-highlight)' }} />
          <span
            className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: 'var(--c-highlight)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
          >
            Beste keuze voor jou
          </span>
        </div>

        {/* Main row */}
        <div className="px-4 pb-3 flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>
              {station.name}
            </p>
            <p className="text-xs truncate mb-2" style={{ color: 'var(--c-text-3)' }}>
              {station.brand} · {station.city}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {dist !== undefined && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-3)' }}>
                  <MapPin size={11} />
                  {dist.toFixed(1)} km
                </span>
              )}
              {dist !== undefined && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-3)' }}>
                  <Clock size={11} />
                  ≈ {travelMin(dist)} min
                </span>
              )}
            </div>
            <p className="text-[11px] mt-1.5 italic" style={{ color: 'var(--c-text-3)' }}>{reason}</p>
          </div>

          {/* Price + button */}
          <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
            <div>
              <div
                className="text-3xl font-black leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--c-highlight)', letterSpacing: '-0.01em' }}
              >
                {price !== undefined ? `€${price.toFixed(3)}` : '—'}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>/liter</div>
            </div>
            <button
              onClick={() => navigate(station.lat, station.lon)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{ background: 'var(--c-highlight)', color: '#111', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.04em' }}
            >
              <Navigation size={12} />
              NAVIGEER
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EV mode
  const { station, radius } = props;
  const reason = evReason(station, radius);

  return (
    <div
      className="mx-3 mb-2 mt-2 rounded-2xl overflow-hidden animate-fade-in"
      style={{ background: primaryDim, border: `1.5px solid ${primaryColor}`, boxShadow: '0 4px 20px var(--c-ev-glow)' }}
    >
      <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
        <Star size={11} fill={primaryColor} style={{ color: primaryColor }} />
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: primaryColor, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
        >
          Beste laadpaal voor jou
        </span>
      </div>

      <div className="px-4 pb-3 flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>
            {station.name}
          </p>
          <p className="text-xs truncate mb-2" style={{ color: 'var(--c-text-3)' }}>
            {station.operator}{station.city ? ` · ${station.city}` : ''}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {station.distanceKm !== undefined && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-3)' }}>
                <MapPin size={11} />
                {station.distanceKm.toFixed(1)} km
              </span>
            )}
            {station.distanceKm !== undefined && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-3)' }}>
                <Clock size={11} />
                ≈ {travelMin(station.distanceKm)} min
              </span>
            )}
          </div>
          <p className="text-[11px] mt-1.5 italic" style={{ color: 'var(--c-text-3)' }}>{reason}</p>
        </div>

        <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
          <div>
            <div
              className="text-3xl font-black leading-none"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: primaryColor, letterSpacing: '-0.01em' }}
            >
              {station.pricePerKwh !== null && station.pricePerKwh > 0
                ? `€${station.pricePerKwh.toFixed(2)}`
                : station.pricePerKwh === 0 ? 'GRATIS' : '—'}
            </div>
            {station.pricePerKwh !== null && station.pricePerKwh > 0 && (
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>/kWh</div>
            )}
          </div>
          <button
            onClick={() => navigate(station.lat, station.lon)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{ background: primaryColor, color: '#0A1412', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.04em' }}
          >
            <Navigation size={12} />
            NAVIGEER
          </button>
        </div>
      </div>
    </div>
  );
}
