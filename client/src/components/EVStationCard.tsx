import { MapPin, Zap } from 'lucide-react';
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
  if (!kw) return (
    <span className="text-[10px] px-1.5 py-0.5 rounded"
      style={{ background: 'var(--c-surface-3)', color: 'var(--c-text-3)', border: '1px solid var(--c-border)' }}>
      ? kW
    </span>
  );
  const config =
    kw >= 150 ? { label: `${kw} kW · Ultra DC`, bg: 'rgba(139,92,246,0.15)', color: '#C084FC', border: 'rgba(139,92,246,0.3)' } :
    kw >= 50  ? { label: `${kw} kW · Snel DC`,  bg: 'var(--c-ev-dim)',        color: 'var(--c-ev)', border: 'rgba(0,224,255,0.3)' } :
    kw >= 22  ? { label: `${kw} kW · Snel AC`,  bg: 'rgba(20,184,166,0.1)',   color: '#2DD4BF',    border: 'rgba(20,184,166,0.3)' } :
                { label: `${kw} kW · AC`,        bg: 'var(--c-surface-3)',     color: 'var(--c-text-3)', border: 'var(--c-border)' };
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}`, fontFamily: "'Barlow Condensed', sans-serif" }}>
      {config.label}
    </span>
  );
}

export default function EVStationCard({ station, rank, isHovered, isSelected, onHover, onSelect }: Props) {
  const isActive = isSelected || isHovered;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${station.name}, ${station.pricePerKwh !== null ? '€' + station.pricePerKwh.toFixed(2) + ' per kWh' : 'prijs onbekend'}, ${station.distanceKm?.toFixed(1) ?? '?'} kilometer`}
      onClick={() => onSelect(station.id)}
      onMouseEnter={() => onHover(station.id)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(station.id)}
      className="mx-3 mb-2 cursor-pointer transition-all duration-150 animate-fade-up"
      style={{
        background: isSelected ? 'var(--c-ev-dim)' : 'var(--c-surface)',
        border: `1.5px solid ${isSelected ? 'var(--c-ev)' : isHovered ? 'var(--c-border-strong)' : 'var(--c-border)'}`,
        borderRadius: 'var(--r-lg)',
        boxShadow: isActive ? 'var(--shadow-active)' : 'var(--shadow-card)',
        transform: isActive ? 'translateY(-1px)' : 'none',
      }}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Rank badge */}
        <div
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-black rounded-[10px]"
          style={{
            background: isActive ? 'var(--c-ev)' : 'var(--c-surface-2)',
            color: isActive ? '#111' : 'var(--c-text-3)',
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          {/* Operator + name */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{
                background: 'var(--c-ev-dim)',
                color: 'var(--c-ev)',
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.08em',
              }}>
              {station.operator}
            </span>
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>
              {station.name}
            </span>
          </div>

          {(station.address || station.city) && (
            <p className="text-xs truncate mb-2" style={{ color: 'var(--c-text-3)' }}>
              {[station.address, station.city].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            {station.distanceKm !== undefined && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-3)' }}>
                <MapPin size={11} />
                {station.distanceKm.toFixed(1)} km
              </span>
            )}
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-3)' }}>
              <Zap size={11} />
              {station.capacity} {station.capacity === 1 ? 'punt' : 'punten'}
            </span>
            <PowerBadge kw={station.maxPowerKw} />
          </div>

          {/* Sockets */}
          {station.sockets.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {station.sockets.map((s) => (
                <span key={s.type} className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--c-surface-3)', color: 'var(--c-text-3)', border: '1px solid var(--c-border)' }}>
                  {s.label}{s.count > 1 ? ` ×${s.count}` : ''}{s.powerKw ? ` · ${s.powerKw}kW` : ''}
                </span>
              ))}
            </div>
          )}

          {station.priceNote && (
            <p className="text-[10px] mt-1.5 italic" style={{ color: 'var(--c-text-3)' }}>{station.priceNote}</p>
          )}
        </div>

        {/* Price + charger icon */}
        <div className="flex-shrink-0 text-right pt-0.5">
          {station.pricePerKwh !== null ? (
            station.pricePerKwh === 0 ? (
              <span className="text-xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'var(--c-ev)' }}>
                GRATIS
              </span>
            ) : (
              <>
                <div className="text-2xl font-black leading-none"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    color: isActive ? 'var(--c-ev)' : 'var(--c-text)',
                    letterSpacing: '-0.01em',
                  }}>
                  €{station.pricePerKwh.toFixed(2)}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>/kWh</div>
              </>
            )
          ) : (
            <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>n.b.</span>
          )}
          <div className="mt-2 w-7 h-7 rounded-full flex items-center justify-center ml-auto"
            style={{
              background: station.isFastCharger ? 'var(--c-ev-dim)' : 'var(--c-surface-2)',
              border: `1px solid ${station.isFastCharger ? 'var(--c-ev)' : 'var(--c-border)'}`,
            }}>
            <Zap size={14} strokeWidth={2.5}
              style={{ color: station.isFastCharger ? 'var(--c-ev)' : 'var(--c-text-3)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
