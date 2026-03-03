import React from "react";
import { Skeleton } from "./Skeleton";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  hasHeader?: boolean;
  hasFilters?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns = 6,
  rows = 5,
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
          <Skeleton className="h-10 w-40" />
        </div>
      )}

      {/* Table Skeleton */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-secondary-700/50 flex gap-4">
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} className="h-6 flex-1" />
          ))}
        </div>
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className="p-4 border-b border-secondary-700/30 flex gap-4"
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
            {[...Array(columns - 1)].map((_, j) => (
              <Skeleton key={j} className="h-5 flex-1 mt-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
