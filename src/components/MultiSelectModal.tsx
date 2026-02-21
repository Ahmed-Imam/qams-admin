import React, { useState, useMemo, useEffect } from "react";
import { Search, X, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface MultiSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  title: string;
}

export const MultiSelectModal: React.FC<MultiSelectModalProps> = ({
  isOpen,
  onClose,
  options,
  value,
  onChange,
  title,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [localValue, setLocalValue] = useState<string[]>(value);

  // keep localValue in sync with value when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalValue(value);
      setSearchTerm("");
    }
  }, [isOpen, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        opt.value.toLowerCase().includes(term) ||
        (opt.description && opt.description.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  const toggleOption = (optValue: string) => {
    setLocalValue((prev) =>
      prev.includes(optValue)
        ? prev.filter((v) => v !== optValue)
        : [...prev, optValue]
    );
  };

  const handleSave = () => {
    onChange(localValue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — fixed height so flex-1 children have a concrete bound to scroll within */}
      <div
        className="glass-card relative w-full max-w-2xl animate-fadeIn"
        style={{ height: "85vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-secondary-700/50 shrink-0">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + stats */}
        <div className="p-4 border-b border-secondary-700/50 bg-secondary-900/50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search by ID, label or question name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary-800 border border-secondary-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-secondary-500">
              Showing {filteredOptions.length} of {options.length} options
            </span>
            <span className="text-xs text-primary-400 font-medium">
              {localValue.length} selected
            </span>
          </div>
        </div>

        {/* Options List — this is the only scrollable region */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="p-4 space-y-1.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = localValue.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? "bg-primary-500/10 border-primary-500/40"
                        : "bg-secondary-800/40 border-secondary-700/40 hover:bg-secondary-700/50 hover:border-secondary-600"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-primary-500 border-primary-500 text-white"
                          : "border-secondary-600 bg-secondary-800"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium truncate ${
                          isSelected ? "text-primary-300" : "text-white"
                        }`}
                      >
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-secondary-500 mt-0.5 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 text-secondary-400">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>No options found for "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-secondary-700/50 bg-secondary-900/50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setLocalValue([])}
            className="text-sm text-secondary-400 hover:text-white transition-colors"
          >
            Clear all
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn-primary px-4 py-2">
              Confirm ({localValue.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
