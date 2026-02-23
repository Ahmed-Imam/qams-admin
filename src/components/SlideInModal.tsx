import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface SlideInModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: LucideIcon;
  iconColor?: "primary" | "amber" | "emerald" | "blue" | "purple";
  badges?: Array<{ label: string; variant?: "default" | "primary" }>;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const iconColorClasses = {
  primary: "bg-primary-500/20 border border-primary-500/30 text-primary-400",
  amber: "bg-amber-500/20 border border-amber-500/30 text-amber-400",
  emerald: "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400",
  blue: "bg-blue-500/20 border border-blue-500/30 text-blue-400",
  purple: "bg-purple-500/20 border border-purple-500/30 text-purple-400",
};

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
};

export const SlideInModal: React.FC<SlideInModalProps> = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  iconColor = "primary",
  badges = [],
  size = "lg",
  children,
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm "
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={clsx(
          "absolute right-0 top-0 h-full w-full bg-secondary-900 shadow-2xl flex flex-col animate-slide-in border-l border-secondary-700/50",
          sizeClasses[size],
        )}
      >
        {/* Header */}
        <div className="bg-secondary-800/50 border-b border-secondary-700/50 p-6 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className={clsx("p-3 rounded-2xl", iconColorClasses[iconColor])}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {title}
                </h2>
                {badges.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    {badges.map((badge, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && (
                          <span className="text-secondary-500">•</span>
                        )}
                        <span
                          className={clsx(
                            "px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border",
                            badge.variant === "primary"
                              ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                              : "bg-secondary-700 text-secondary-300 border-secondary-600",
                          )}
                        >
                          {badge.label}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 text-secondary-400 hover:text-white hover:bg-secondary-700/50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="bg-secondary-800/50 border-t border-secondary-700/50 p-6 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
