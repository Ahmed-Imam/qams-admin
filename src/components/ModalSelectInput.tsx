import React, { useState } from "react";
import ReactDOM from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { MultiSelectModal, type SelectOption } from "./MultiSelectModal";

interface ModalSelectInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: (string | SelectOption)[];
  label: string;
  placeholder?: string;
}

export const ModalSelectInput: React.FC<ModalSelectInputProps> = ({
  value,
  onChange,
  options,
  label,
  placeholder = "Click to select options...",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const normalizedOptions: SelectOption[] = React.useMemo(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt
    );
  }, [options]);

  const handleRemove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-secondary-300">
        {label}
      </label>

      {/* Trigger button — looks like an input field */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full min-h-[46px] bg-secondary-800/80 border border-secondary-600/50 rounded-xl px-3 py-2 flex items-center gap-2 text-left hover:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all group"
      >
        <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
          {value.length === 0 ? (
            <span className="text-secondary-400 text-sm">{placeholder}</span>
          ) : (
            value.map((item) => {
              const opt = normalizedOptions.find((o) => o.value === item);
              const displayLabel = opt ? opt.label : item;
              return (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary-500/20 text-primary-300 text-xs font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="max-w-[180px] truncate" title={displayLabel}>
                    {displayLabel}
                  </span>
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(item);
                    }}
                    className="hover:text-primary-200 hover:bg-primary-500/20 rounded p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-secondary-400 flex-shrink-0 group-hover:text-secondary-300 transition-colors" />
      </button>

      {/* Portal: renders outside any stacking context so it always sits on top */}
      {isModalOpen &&
        ReactDOM.createPortal(
          <MultiSelectModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            options={normalizedOptions}
            value={value}
            onChange={onChange}
            title={label.replace(" *", "").replace(" (optional)", "")}
          />,
          document.body
        )}
    </div>
  );
};
