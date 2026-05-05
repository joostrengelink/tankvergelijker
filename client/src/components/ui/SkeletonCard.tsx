export function FuelSkeletonCard() {
  return (
    <div className="mx-3 mb-2 rounded-[16px] border overflow-hidden" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
      <div className="px-4 py-3.5 flex items-start gap-3">
        <div className="skeleton w-8 h-8 rounded-[10px] flex-shrink-0" />
        <div className="flex-1 space-y-2.5 pt-0.5">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-2.5 w-44 rounded" />
          <div className="skeleton h-1.5 w-full rounded-full mt-3" />
        </div>
        <div className="flex-shrink-0 space-y-1.5 pt-0.5">
          <div className="skeleton h-7 w-16 rounded" />
          <div className="skeleton h-2 w-10 rounded ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function EVSkeletonCard() {
  return (
    <div className="mx-3 mb-2 rounded-[16px] border overflow-hidden" style={{ background: 'var(--c-surface)', borderColor: 'var(--c-border)' }}>
      <div className="px-4 py-3.5 flex items-start gap-3">
        <div className="skeleton w-8 h-8 rounded-[10px] flex-shrink-0" />
        <div className="flex-1 space-y-2.5 pt-0.5">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton h-2.5 w-40 rounded" />
          <div className="flex gap-1.5 mt-2">
            <div className="skeleton h-4 w-20 rounded-full" />
            <div className="skeleton h-4 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex-shrink-0 space-y-1.5 pt-0.5">
          <div className="skeleton h-7 w-14 rounded" />
          <div className="skeleton h-2 w-8 rounded ml-auto" />
        </div>
      </div>
    </div>
  );
}
