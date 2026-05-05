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
  if (!kw) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/25 border border-white/10">? kW</span>;
  const { label, cls } =
    kw >= 150 ? { label: `${kw} kW · Ultra DC`, cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' } :
    kw >= 50  ? { label: `${kw} kW · Snel DC`,  cls: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30' } :
    kw >= 22  ? { label: `${kw} kW · Snel AC`,  cls: 'bg-teal-500/10 text-teal-300 border-teal-500/30' } :
                { label: `${kw} kW · AC`,        cls: 'bg-white/5 text-white/40 border-white/10' };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cls}`}
    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{label}</span>;
}

export default function EVStationCard({ station, rank, isHovered, isSelected, onHover, onSelect }: Props) {
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
          ? 'border-[#00E5FF]/50 bg-[#00E5FF]/5 shadow-lg shadow-[#00E5FF]/10'
          : isHovered
          ? 'border-white/20 bg-[#222] shadow-md'
          : 'border-white/[0.07] bg-[#1A1A1A] hover:border-white/20 hover:bg-[#222]'
      }`}
    >
      <div className="px-3 py-2.5 flex items-start gap-3">
        {/* Rank */}
        <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold mt-0.5 ${
          isActive ? 'bg-[#00E5FF] text-[#111]' : 'bg-white/5 text-white/30'
        }`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          {/* Operator + name */}
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF]/80 border border-[#00E5FF]/20 uppercase tracking-wider flex-shrink-0"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {station.operator}
            </span>
            <span className="text-sm font-semibold text-white truncate">{station.name}</span>
          </div>

          {(station.address || station.city) && (
            <p className="text-xs text-white/35 truncate mb-1.5">
              {[station.address, station.city].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 flex-wrap">
            {station.distanceKm !== undefined && (
              <span className="text-xs text-white/40 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                {station.distanceKm.toFixed(1)} km
              </span>
            )}
            <span className="text-xs text-white/40 flex items-center gap-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {station.capacity} {station.capacity === 1 ? 'punt' : 'punten'}
            </span>
            <PowerBadge kw={station.maxPowerKw} />
          </div>

          {/* Sockets */}
          {station.sockets.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {station.sockets.map((s) => (
                <span key={s.type} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-white/35 rounded border border-white/10">
                  {s.label}{s.count > 1 ? ` ×${s.count}` : ''}{s.powerKw ? ` · ${s.powerKw}kW` : ''}
                </span>
              ))}
            </div>
          )}

          {station.priceNote && (
            <p className="text-[10px] text-white/25 mt-1.5 italic">{station.priceNote}</p>
          )}
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          {station.pricePerKwh !== null ? (
            <>
              {station.pricePerKwh === 0 ? (
                <span className="text-xl font-black text-[#00E5FF]"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>GRATIS</span>
              ) : (
                <>
                  <span className={`text-2xl font-black leading-none ${isActive ? 'text-[#00E5FF]' : 'text-white'}`}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    €{station.pricePerKwh.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-white/30 block">/kWh</span>
                </>
              )}
            </>
          ) : (
            <div className="text-right">
              <span className="text-xs text-white/20 block">Prijs</span>
              <span className="text-xs text-white/20 block">onbekend</span>
            </div>
          )}
          <div className={`mt-1.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
            station.isFastCharger ? 'bg-[#00E5FF]/20 border border-[#00E5FF]/40' : 'bg-white/5 border border-white/10'
          }`}>
            <svg className={`w-4 h-4 ${station.isFastCharger ? 'text-[#00E5FF]' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
