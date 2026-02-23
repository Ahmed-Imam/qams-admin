import React, { useEffect, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import clsx from "clsx";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, isLoading, onClose]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-400",
      iconBg: "bg-red-500/20 border-red-500/30",
      button: "bg-red-500 hover:bg-red-600 text-white",
    },
    warning: {
      icon: "text-amber-400",
      iconBg: "bg-amber-500/20 border-amber-500/30",
      button: "bg-amber-500 hover:bg-amber-600 text-white",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div className="glass-card relative w-full max-w-md p-6 animate-fadeIn">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 p-2 rounded-lg hover:bg-secondary-700/50 text-secondary-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={clsx("p-4 rounded-2xl border", styles.iconBg)}>
            <AlertTriangle className={clsx("w-8 h-8", styles.icon)} />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-secondary-400 mb-2">{message}</p>
          {itemName && (
            <p className="text-white font-semibold mt-3 px-4 py-2 rounded-lg bg-secondary-800/50 border border-secondary-700/50">
              "{itemName}"
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={clsx(
              "flex-1 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
              styles.button,
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
