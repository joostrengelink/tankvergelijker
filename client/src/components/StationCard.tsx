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

const BRAND_COLORS: Record<string, string> = {
  Shell: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  BP: 'bg-green-50 text-green-700 border-green-200',
  Esso: 'bg-blue-50 text-blue-700 border-blue-200',
  Tango: 'bg-orange-50 text-orange-700 border-orange-200',
  Total: 'bg-red-50 text-red-700 border-red-200',
  Q8: 'bg-purple-50 text-purple-700 border-purple-200',
};

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

  const brandColor = BRAND_COLORS[station.brand] ?? 'bg-slate-50 text-slate-600 border-slate-200';

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
          ? 'border-orange-400 bg-orange-50 shadow-md'
          : isHovered
          ? 'border-slate-300 bg-white shadow-md'
          : isBestPick
          ? 'border-green-300 bg-white shadow-sm'
          : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300'
      }`}
    >
      {isBestPick && (
        <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-wide text-green-600 uppercase flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Beste keuze voor jou
          </span>
        </div>
      )}

      <div className="px-3 py-2.5 flex items-start gap-3">
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
          isBestPick ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'
        }`}>
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${brandColor}`}>
              {station.brand}
            </span>
            <span className="text-sm font-semibold text-slate-800 truncate">{station.name}</span>
          </div>
          <p className="text-xs text-slate-400 truncate">{station.address}, {station.city}</p>

          <div className="flex items-center gap-3 mt-2">
            {station.distanceKm !== undefined && (
              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                {station.distanceKm.toFixed(1)} km
              </span>
            )}
            {station.openingHours && (
              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {station.openingHours}
              </span>
            )}
          </div>

          {price !== undefined && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isBestPick ? 'bg-green-400' : 'bg-orange-400'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {priceDiff !== null && priceDiff > 0 && tankDiff !== null && (
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    +€{priceDiff.toFixed(3)}/L (+€{tankDiff.toFixed(2)} per tank)
                  </span>
                )}
                {priceDiff === 0 && (
                  <span className="text-[10px] text-green-600 font-semibold flex-shrink-0">Goedkoopste</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 text-right">
          {price !== undefined ? (
            <div>
              <span className="text-xl font-bold text-slate-900">€{price.toFixed(3)}</span>
              <span className="text-xs text-slate-400 block">/liter</span>
            </div>
          ) : (
            <span className="text-sm text-slate-300">n.b.</span>
          )}
        </div>
      </div>
    </div>
  );
}
