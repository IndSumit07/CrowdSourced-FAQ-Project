export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton rounded-lg ${className}`} />
);

export const CardSkeleton = () => (
  <div className="card space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
    <div className="flex gap-2 pt-1">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  </div>
);

export const TableRowSkeleton = ({ cols = 4 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);
