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
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all tracking-wide ${
            selected === fuel
              ? 'bg-[#FF4500] text-white shadow-md shadow-[#FF4500]/30'
              : 'bg-[#1A1A1A] text-white/40 border border-white/10 hover:border-[#FF4500]/40 hover:text-white/70'
          }`}
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.05em' }}
        >
          {FUEL_LABELS[fuel]}
        </button>
      ))}
    </div>
  );
}
