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
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            selected === fuel
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white text-slate-500 border border-slate-200 hover:border-orange-300 hover:text-orange-500'
          }`}
        >
          {FUEL_LABELS[fuel]}
        </button>
      ))}
    </div>
  );
}
