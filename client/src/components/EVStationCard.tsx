import type { EVStation } from '../types/ev';

interface Props {
  station: EVStation;
  rank: number;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

function PowerBadge({ kw }: { kw: number | null }) {
  if (!kw) return <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-50 text-slate-400 border-slate-200">Vermogen onbekend</span>;
  const { label, cls } =
    kw >= 150 ? { label: `${kw} kW · Ultra DC`, cls: 'bg-purple-100 text-purple-700 border-purple-200' } :
    kw >= 50  ? { label: `${kw} kW · Snel DC`,  cls: 'bg-blue-100 text-blue-700 border-blue-200' } :
    kw >= 22  ? { label: `${kw} kW · Snel AC`,  cls: 'bg-teal-100 text-teal-700 border-teal-200' } :
                { label: `${kw} kW · AC`,        cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls}`}>{label}</span>;
}

const OPERATOR_COLORS: Record<string, string> = {
  'Fastned':      'bg-yellow-50 text-yellow-800 border-yellow-300',
  'Allego':       'bg-blue-50 text-blue-700 border-blue-200',
  'Shell':        'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Vattenfall':   'bg-green-50 text-green-700 border-green-200',
  'NUON':         'bg-green-50 text-green-700 border-green-200',
  'EVBox':        'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Eneco':        'bg-teal-50 text-teal-700 border-teal-200',
  'IONITY':       'bg-rose-50 text-rose-700 border-rose-200',
  'Tesla':        'bg-red-50 text-red-700 border-red-200',
};

export default function EVStationCard({ station, rank, isHovered, isSelected, onHover, onSelect }: Props) {
  const opColor = OPERATOR_COLORS[station.operator] ?? 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(station.id)}
      onMouseEnter={() => onHover(station.id)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(station.id)}
      className={`mx-3 mb-2 rounded-xl border cursor-pointer transition-all ${
        isSelected ? 'border-green-400 bg-green-50 shadow-md'
        : isHovered ? 'border-slate-300 bg-white shadow-md'
        : 'border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300'
      }`}
    >
      <div className="px-3 py-2.5 flex items-start gap-3">
        {/* Rank */}
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold mt-0.5">
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + operator */}
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${opColor}`}>
              {station.operator}
            </span>
            <span className="text-sm font-semibold text-slate-800 truncate">{station.name}</span>
          </div>

          {/* Address */}
          {(station.address || station.city) && (
            <p className="text-xs text-slate-400 truncate mb-1.5">
              {[station.address, station.city].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            {station.distanceKm !== undefined && (
              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                {station.distanceKm.toFixed(1)} km
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {station.capacity} {station.capacity === 1 ? 'punt' : 'punten'}
            </span>
            <PowerBadge kw={station.maxPowerKw} />
          </div>

          {/* Sockets */}
          {station.sockets.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {station.sockets.map((s) => (
                <span key={s.type} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                  {s.label}{s.count > 1 ? ` ×${s.count}` : ''}{s.powerKw ? ` · ${s.powerKw}kW` : ''}
                </span>
              ))}
            </div>
          )}

          {/* Price note */}
          {station.priceNote && (
            <p className="text-[10px] text-slate-400 mt-1.5 italic">{station.priceNote}</p>
          )}
        </div>

        {/* Price block */}
        <div className="flex-shrink-0 text-right">
          {station.pricePerKwh !== null ? (
            <div>
              {station.pricePerKwh === 0 ? (
                <span className="text-sm font-bold text-green-600">Gratis</span>
              ) : (
                <>
                  <span className="text-xl font-bold text-slate-900">€{station.pricePerKwh.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 block">/kWh</span>
                </>
              )}
            </div>
          ) : (
            <div>
              <span className="text-xs text-slate-300 block">Prijs</span>
              <span className="text-xs text-slate-300 block">onbekend</span>
            </div>
          )}
          <div className={`mt-1.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
            station.isFastCharger ? 'bg-blue-500' : 'bg-slate-300'
          }`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
