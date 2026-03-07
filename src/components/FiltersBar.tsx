import React, { useEffect, useRef, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  /** Icon shown inside the select */
  icon: LucideIcon;
  /** Controlled value of this filter */
  value: string;
  onChange: (value: string) => void;
  /** Options list — first entry should be the "all" sentinel (value === "all") */
  options: FilterOption[];
  placeholder?: string;
  minWidth?: string;
}

export interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Optional additional dropdown filters */
  filters?: FilterConfig[];
  /** Called when the user clicks "Reset all" — clear everything */
  onResetAll?: () => void;
  className?: string;
  /** Debounce delay in ms (default 400) */
  debounceMs?: number;
}

/**
 * FiltersBar
 *
 * A controlled, composable filter bar that provides:
 * - A debounced search input (fires `onSearchChange` ~400 ms after typing stops)
 * - Instant clear when the user clicks × or backspaces the field empty
 * - Optional dropdown filters with icons and an active-filter badge
 * - A "Reset all" link when any filter is active
 */
export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onResetAll,
  className,
  debounceMs = 400,
}) => {
  // Internal input value so the input feels instant even while debounce is pending
  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExternalUpdate = useRef(false);

  // Sync when parent resets the query externally (e.g., "Reset all")
  useEffect(() => {
    if (searchQuery !== inputValue) {
      isExternalUpdate.current = true;
      setInputValue(searchQuery);
    }
    // We only want to react to parent changes, not our own typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Debounce logic: fire onSearchChange after debounceMs of inactivity
  useEffect(() => {
    if (isExternalUpdate.current) {
      isExternalUpdate.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // If the field is now empty, fire immediately (instant clear)
    if (inputValue === "") {
      onSearchChange("");
      return;
    }

    debounceRef.current = setTimeout(() => {
      onSearchChange(inputValue);
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Backspace/Delete empties the field, fire immediately
    if (
      (e.key === "Backspace" || e.key === "Delete") &&
      inputValue.length <= 1
    ) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setInputValue("");
      onSearchChange("");
    }
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue("");
    onSearchChange("");
  };

  // Count active (non-"all") dropdown filters
  const activeFilterCount = filters.filter((f) => f.value !== "all").length;
  const hasAnyActive = inputValue !== "" || activeFilterCount > 0;

  return (
    <div className={clsx("glass-card p-4", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="input-field pl-10 pr-10 w-full"
            autoComplete="off"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-secondary-500 hover:text-white hover:bg-secondary-700 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown filters */}
        {filters.map((filter, idx) => {
          const Icon = filter.icon;
          const isActive = filter.value !== "all";
          return (
            <div key={idx} className="relative flex-shrink-0">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 pointer-events-none" />
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className={clsx(
                  "input-field pl-10 pr-8",
                  filter.minWidth ?? "min-w-[150px]",
                  isActive && "border-primary-500/50 text-primary-300",
                )}
              >
                {filter.options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-secondary-800 capitalize"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary-500" />
              )}
            </div>
          );
        })}

        {/* Filter badge + reset */}
        {filters.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {activeFilterCount > 0 && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary-500/20 border border-primary-500/30 text-xs font-medium text-primary-300">
                <Filter className="w-3.5 h-3.5" />
                {activeFilterCount} active
              </span>
            )}
          </div>
        )}
      </div>

      {/* Reset all row */}
      {hasAnyActive && onResetAll && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              handleClear();
              onResetAll();
            }}
            className="text-xs text-secondary-500 hover:text-white transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};
