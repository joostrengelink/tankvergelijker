import { MapPin, Clock, TrendingDown, Star } from 'lucide-react';
import type { Station, FuelType } from '../types';

interface Props {
  station: Station;
  rank: number;
  selectedFuel: FuelType;
  minPrice: number;
  maxPrice: number;
  isBestPick: boolean;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const TANK_LITERS = 50;

export default function StationCard({
  station, rank, selectedFuel, minPrice, maxPrice, isBestPick,
  isHovered, isSelected, onHover, onSelect
}: Props) {
  const price = station.prices[selectedFuel];
  const priceDiff = price !== undefined && minPrice > 0 ? price - minPrice : null;
  const tankDiff = priceDiff !== null ? priceDiff * TANK_LITERS : null;
  const priceRange = maxPrice - minPrice || 0.01;
  const barWidth = price !== undefined
    ? Math.max(6, 100 - ((price - minPrice) / priceRange) * 82)
    : 0;

  const isActive = isSelected || isHovered;
  const isCheapest = priceDiff === 0;

  const cardBg = isSelected
    ? 'var(--c-accent-dim)'
    : isBestPick
    ? 'var(--c-gold-dim)'
    : 'var(--c-surface)';

  const cardBorder = isSelected
    ? 'var(--c-accent)'
    : isBestPick && !isActive
    ? 'var(--c-gold)'
    : isHovered
    ? 'var(--c-border-strong)'
    : 'var(--c-border)';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${station.name}, ${price !== undefined ? '€' + price.toFixed(3) + ' per liter' : 'prijs onbekend'}, ${station.distanceKm?.toFixed(1) ?? '?'} kilometer`}
      onClick={() => onSelect(station.id)}
      onMouseEnter={() => onHover(station.id)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(station.id)}
      className="mx-3 mb-2 cursor-pointer transition-all duration-150 animate-fade-up"
      style={{
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        borderRadius: 'var(--r-lg)',
        boxShadow: isActive ? 'var(--shadow-active)' : 'var(--shadow-card)',
        transform: isActive ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Best pick banner */}
      {isBestPick && (
        <div className="px-4 pt-3 pb-0 flex items-center gap-1.5">
          <Star size={11} style={{ color: 'var(--c-gold)' }} strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: 'var(--c-gold)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}>
            Beste keuze voor jou
          </span>
        </div>
      )}

      <div className="px-4 py-3 flex items-start gap-3">
        {/* Rank badge */}
        <div
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-black rounded-[10px]"
          style={{
            background: isBestPick ? 'var(--c-gold)' : isActive ? 'var(--c-accent)' : 'var(--c-surface-2)',
            color: isBestPick ? '#111' : isActive ? '#fff' : 'var(--c-text-3)',
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          {rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Brand + name */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                background: 'var(--c-surface-3)',
                color: 'var(--c-text-2)',
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.08em',
              }}>
              {station.brand}
            </span>
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>
              {station.name}
            </span>
          </div>

          {/* Address */}
          <p className="text-xs truncate mb-2" style={{ color: 'var(--c-text-3)' }}>
            {station.address}, {station.city}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            {station.distanceKm !== undefined && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-3)' }}>
                <MapPin size={11} />
                {station.distanceKm.toFixed(1)} km
              </span>
            )}
            {station.openingHours && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-3)' }}>
                <Clock size={11} />
                {station.openingHours}
              </span>
            )}
          </div>

          {/* Price bar */}
          {price !== undefined && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--c-surface-3)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    background: isBestPick ? 'var(--c-gold)' : 'var(--c-accent)',
                  }}
                />
              </div>
              {isCheapest ? (
                <span className="flex items-center gap-0.5 text-[10px] font-black flex-shrink-0"
                  style={{ color: 'var(--c-gold)', fontFamily: "'Barlow Condensed', sans-serif" }}>
                  <TrendingDown size={10} />GOEDKOOPST
                </span>
              ) : priceDiff !== null && priceDiff > 0 && tankDiff !== null ? (
                <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--c-text-3)' }}>
                  +€{tankDiff.toFixed(2)} per tank
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Price block */}
        <div className="flex-shrink-0 text-right pt-0.5">
          {price !== undefined ? (
            <>
              <div className="text-2xl font-black leading-none"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: isBestPick ? 'var(--c-gold)' : isActive ? 'var(--c-accent)' : 'var(--c-text)',
                  letterSpacing: '-0.01em',
                }}>
                €{price.toFixed(3)}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>/liter</div>
            </>
          ) : (
            <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>n.b.</span>
          )}
        </div>
      </div>
    </div>
  );
}
