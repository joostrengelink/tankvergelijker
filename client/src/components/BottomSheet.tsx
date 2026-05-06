import { useEffect } from 'react';
import { X, MapPin, Clock, Navigation } from 'lucide-react';

export interface BottomSheetData {
  name: string;
  subtitle: string;
  address: string;
  price: string;
  priceUnit: string;
  distanceKm?: number;
  lat: number;
  lon: number;
  isBestPick?: boolean;
  mode: 'fuel' | 'ev';
}

interface Props {
  data: BottomSheetData;
  onClose: () => void;
}

function travelMin(km: number): number {
  return Math.max(1, Math.round((km / 40) * 60));
}

function navigate(lat: number, lon: number) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
    '_blank', 'noopener,noreferrer'
  );
}

export default function BottomSheet({ data, onClose }: Props) {
  const isEV = data.mode === 'ev';
  const primaryColor = isEV ? 'var(--c-ev)' : 'var(--c-primary)';

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1500] bg-black/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[1600] animate-sheet-enter
                   md:left-auto md:right-4 md:bottom-4 md:w-[360px]"
        style={{
          background: 'var(--c-surface)',
          border: '1.5px solid var(--c-border-strong)',
          borderRadius: 'var(--r-2xl) var(--r-2xl) 0 0',
          boxShadow: 'var(--shadow-float)',
        }}
        // On desktop: rounded everywhere
        onClick={(e) => e.stopPropagation()}
      >
        {/* Desktop override: fully rounded */}
        <style>{`
          @media (min-width: 768px) {
            .bottom-sheet-inner { border-radius: var(--r-2xl) !important; }
          }
        `}</style>

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--c-surface-3)' }} />
        </div>

        <div className="px-5 pt-2 md:pb-5" style={{ paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 20px))' }}>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              {data.isBestPick && (
                <div className="flex items-center gap-1 mb-1">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: 'var(--c-highlight)', fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    ★ Beste keuze
                  </span>
                </div>
              )}
              <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--c-text)' }}>
                {data.name}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-3)' }}>{data.subtitle}</p>
              {data.address && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--c-text-3)' }}>{data.address}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl mt-0.5 transition-colors"
              style={{ background: 'var(--c-surface-2)', color: 'var(--c-text-3)' }}
              aria-label="Sluiten"
            >
              <X size={16} />
            </button>
          </div>

          {/* Price + meta */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl mb-4"
            style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
          >
            <div>
              <div
                className="text-3xl font-black leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: primaryColor, letterSpacing: '-0.01em' }}
              >
                {data.price}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--c-text-3)' }}>{data.priceUnit}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {data.distanceKm !== undefined && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-3)' }}>
                  <MapPin size={12} />
                  {data.distanceKm.toFixed(1)} km
                </span>
              )}
              {data.distanceKm !== undefined && (
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-text-3)' }}>
                  <Clock size={12} />
                  ≈ {travelMin(data.distanceKm)} min rijden
                </span>
              )}
            </div>
          </div>

          {/* Navigate button */}
          <button
            onClick={() => navigate(data.lat, data.lon)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{
              background: primaryColor,
              color: isEV ? '#0A1412' : '#fff',
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.05em',
              fontSize: '16px',
              boxShadow: isEV ? '0 4px 16px var(--c-ev-glow)' : '0 4px 16px var(--c-primary-glow)',
            }}
          >
            <Navigation size={18} />
            Navigeer hierheen
          </button>
        </div>
      </div>
    </>
  );
}
