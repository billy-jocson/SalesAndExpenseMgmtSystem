import { Skeleton } from "@heroui/react";

function SkeletonLine({ className = "", style }) {
  return (
    <Skeleton
      animationType="shimmer"
      className={`rounded-lg ${className}`}
      style={style}
    />
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="col-span-full grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-2xl bg-white p-4 shadow-sm">
          <SkeletonLine className="mb-4 h-36 w-full" />
          <SkeletonLine className="mb-2 h-4 w-3/4" />
          <SkeletonLine className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function ListCardSkeleton({ count = 6 }) {
  return (
    <div className="col-span-full grid w-full grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex gap-4">
            <SkeletonLine className="size-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-4 w-2/3" />
              <SkeletonLine className="h-3 w-1/2" />
              <SkeletonLine className="h-3 w-4/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 6 }) {
  return (
    <div className="col-span-full w-full space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-3">
          {Array.from({ length: columns }, (_, column) => (
            <SkeletonLine key={column} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="col-span-full flex h-full w-full items-end gap-3 rounded-xl bg-white p-6">
      {[40, 65, 50, 80, 58, 72, 46].map((height) => (
        <SkeletonLine
          key={height}
          className="flex-1"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

export default SkeletonLine;
