import type { AppMode } from '../types/ev';

interface Props {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex mx-4 mb-3 bg-white/10 rounded-xl p-1 gap-1">
      <button
        onClick={() => onChange('fuel')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
          mode === 'fuel' ? 'bg-orange-500 text-white shadow-sm' : 'text-white/60 hover:text-white/80'
        }`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 002.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5a2.5 2.5 0 005 0V9c0-.69-.28-1.32-.73-1.77zM12 12.5H8V9h4v3.5z"/>
        </svg>
        Brandstof
      </button>
      <button
        onClick={() => onChange('ev')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
          mode === 'ev' ? 'bg-green-500 text-white shadow-sm' : 'text-white/60 hover:text-white/80'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Elektrisch
      </button>
    </div>
  );
}
