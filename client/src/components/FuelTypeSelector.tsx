import type { FuelType } from '../types';
import { FUEL_LABELS } from '../types';

interface Props {
  selected: FuelType;
  onChange: (fuel: FuelType) => void;
}

const FUEL_TYPES: FuelType[] = ['euro95', 'diesel', 'superplus98', 'lpg'];

export default function FuelTypeSelector({ selected, onChange }: Props) {
  return (
    <div className="flex gap-1 px-4 pb-3">
      {FUEL_TYPES.map((fuel) => (
        <button
          key={fuel}
          onClick={() => onChange(fuel)}
          className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.05em',
            background: selected === fuel ? 'var(--c-accent)' : 'var(--c-surface-2)',
            color: selected === fuel ? '#fff' : 'var(--c-text-3)',
            border: `1px solid ${selected === fuel ? 'var(--c-accent)' : 'var(--c-border)'}`,
            boxShadow: selected === fuel ? '0 2px 8px var(--c-accent-glow)' : 'none',
          }}
        >
          {FUEL_LABELS[fuel]}
        </button>
      ))}
    </div>
  );
}
