const Sk = ({ className = '' }) => (
  <div className={`skeleton rounded-lg ${className}`} />
);

/** Stats grid — 4 cards across */
export const StatsGridSkeleton = () => (
  <>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-2xl p-6 bg-white border border-stone-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <Sk className="h-3 w-24 mb-4" />
        <Sk className="h-10 w-20" />
      </div>
    ))}
  </>
);

/** Pending review queries — 2 cards */
export const PendingQueriesSkeleton = () => (
  <div className="grid gap-6 mb-12">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex gap-2 mb-4">
          <Sk className="h-5 w-20 rounded-lg" />
          <Sk className="h-5 w-24 rounded-lg" />
        </div>
        <Sk className="h-5 w-3/4 mb-6" />
        <div className="space-y-3">
          <Sk className="h-3 w-32 mb-2" />
          <Sk className="h-20 w-full rounded-xl" />
          <Sk className="h-20 w-full rounded-xl" />
        </div>
        <Sk className="h-24 w-full rounded-xl mt-4" />
      </div>
    ))}
  </div>
);

/** Pending FAQs — 2 cards */
export const PendingFAQsSkeleton = () => (
  <div className="grid gap-6">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex gap-2 mb-4">
          <Sk className="h-5 w-16 rounded-lg" />
          <Sk className="h-5 w-20 rounded-lg" />
        </div>
        <Sk className="h-5 w-2/3 mb-4" />
        <Sk className="h-20 w-full rounded-xl mb-6" />
        <div className="flex justify-end gap-3">
          <Sk className="h-9 w-20 rounded-xl" />
          <Sk className="h-9 w-32 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

/** Rejected/Flagged queries — 2 cards */
export const RejectedQueriesSkeleton = () => (
  <div className="grid gap-6">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex gap-2 mb-4">
          <Sk className="h-5 w-16 rounded-lg" />
          <Sk className="h-5 w-24 rounded-lg" />
        </div>
        <Sk className="h-5 w-3/4 mb-4" />
        <Sk className="h-16 w-full rounded-xl mb-4" />
        <div className="flex gap-2">
          <Sk className="h-7 w-24 rounded-xl" />
          <Sk className="h-7 w-20 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);
