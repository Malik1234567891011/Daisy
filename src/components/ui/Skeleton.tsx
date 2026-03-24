import { cn } from "@/lib/utils";

type SkeletonVariant = "text" | "heading" | "avatar" | "card" | "input";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

function Skeleton({ variant = "text", className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-cream-dark/50",

        variant === "text" && "h-4 w-full rounded",
        variant === "heading" && "h-8 w-3/4 rounded",
        variant === "avatar" && "h-12 w-12 rounded-full",
        variant === "card" && "h-48 w-full rounded-2xl",
        variant === "input" && "h-12 w-full rounded-xl",

        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
export type { SkeletonProps, SkeletonVariant };
