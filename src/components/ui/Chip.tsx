"use client";

import { cn } from "@/lib/utils";

interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "onToggle"> {
  selected?: boolean;
  onToggle?: (selected: boolean) => void;
}

function Chip({
  selected = false,
  onToggle,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onToggle?.(!selected)}
      className={cn(
        "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2",
        "active:scale-[0.97]",
        selected
          ? "bg-sage-pale border-sage text-olive"
          : "bg-white border-border text-text-secondary hover:border-sage-light hover:text-charcoal",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { Chip };
export type { ChipProps };
