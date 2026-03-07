import React from "react";
import { Skeleton } from "./Skeleton";

interface GridSkeletonProps {
  itemCount?: number;
  hasHeader?: boolean;
  hasFilters?: boolean;
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  itemCount = 6,
  hasHeader = true,
  hasFilters = true,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      {hasHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      {/* Filters Skeleton */}
      {hasFilters && (
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
      )}

      {/* Grid Skeleton — p-6 matches real cards exactly to prevent layout shift on swap */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(itemCount)].map((_, i) => (
          <div key={i} className="glass-card p-6 border-transparent">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="mt-6 pt-4 border-t border-secondary-700/50">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
