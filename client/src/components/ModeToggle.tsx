import type { AppMode } from '../types/ev';

interface Props {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex mx-4 mb-3 p-1 gap-1 rounded-xl"
      style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}>
      <button
        onClick={() => onChange('fuel')}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: '0.06em',
          background: mode === 'fuel' ? 'var(--c-accent)' : 'transparent',
          color: mode === 'fuel' ? '#fff' : 'var(--c-text-3)',
          boxShadow: mode === 'fuel' ? '0 2px 8px var(--c-accent-glow)' : 'none',
        }}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 002.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5a2.5 2.5 0 005 0V9c0-.69-.28-1.32-.73-1.77zM12 12.5H8V9h4v3.5z" />
        </svg>
        BRANDSTOF
      </button>
      <button
        onClick={() => onChange('ev')}
        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: '0.06em',
          background: mode === 'ev' ? 'var(--c-ev)' : 'transparent',
          color: mode === 'ev' ? '#111' : 'var(--c-text-3)',
          boxShadow: mode === 'ev' ? '0 2px 8px var(--c-ev-glow)' : 'none',
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        ELEKTRISCH
      </button>
    </div>
  );
}
