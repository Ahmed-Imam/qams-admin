import React from "react";
import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  variant?: "rectangle" | "circle";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangle",
}) => {
  return (
    <div
      className={clsx(
        "animate-pulse bg-secondary-800/50",
        variant === "circle" ? "rounded-full" : "rounded-xl",
        className,
      )}
    />
  );
};
