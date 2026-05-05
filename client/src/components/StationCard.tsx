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
    ? Math.max(8, 100 - ((price - minPrice) / priceRange) * 80)
    : 0;

  const isActive = isSelected || isHovered;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(station.id)}
      onMouseEnter={() => onHover(station.id)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(station.id)}
      className={`mx-3 mb-2 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-[#FF4500]/60 bg-[#FF4500]/10 shadow-lg shadow-[#FF4500]/10'
          : isHovered
          ? 'border-white/20 bg-[#222] shadow-md'
          : isBestPick
          ? 'border-[#FFD600]/40 bg-[#1A1A1A]'
          : 'border-white/[0.07] bg-[#1A1A1A] hover:border-white/20 hover:bg-[#222]'
      }`}
    >
      {isBestPick && (
        <div className="px-3 pt-2 pb-0.5 flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-widest text-[#FFD600] uppercase flex items-center gap-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            BESTE KEUZE
          </span>
        </div>
      )}

      <div className="px-3 py-2.5 flex items-start gap-3">
        {/* Rank */}
        <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold mt-0.5 ${
          isBestPick ? 'bg-[#FFD600] text-[#111]' : isActive ? 'bg-[#FF4500] text-white' : 'bg-white/5 text-white/40'
        }`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          {/* Brand + name */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/60 uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {station.brand}
            </span>
            <span className="text-sm font-semibold text-white truncate">{station.name}</span>
          </div>

          <p className="text-xs text-white/35 truncate">{station.address}, {station.city}</p>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1.5">
            {station.distanceKm !== undefined && (
              <span className="text-xs text-white/40 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                {station.distanceKm.toFixed(1)} km
              </span>
            )}
            {station.openingHours && (
              <span className="text-xs text-white/40 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {station.openingHours}
              </span>
            )}
          </div>

          {/* Price bar */}
          {price !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isBestPick ? 'bg-[#FFD600]' : 'bg-[#FF4500]'}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              {priceDiff !== null && priceDiff > 0 && tankDiff !== null && (
                <span className="text-[10px] text-white/30 flex-shrink-0">
                  +€{tankDiff.toFixed(2)}/tank
                </span>
              )}
              {priceDiff === 0 && (
                <span className="text-[10px] text-[#FFD600] font-bold flex-shrink-0"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>GOEDKOOPST</span>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          {price !== undefined ? (
            <>
              <span className={`text-2xl font-black leading-none ${isBestPick ? 'text-[#FFD600]' : isActive ? 'text-[#FF4500]' : 'text-white'}`}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                €{price.toFixed(3)}
              </span>
              <span className="text-[10px] text-white/30 block">/liter</span>
            </>
          ) : (
            <span className="text-sm text-white/20">n.b.</span>
          )}
        </div>
      </div>
    </div>
  );
}
