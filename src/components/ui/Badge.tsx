import { cn } from "@/lib/utils";

type BadgeVariant = "sage" | "butter" | "neutral" | "success" | "error";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",

        variant === "sage" && "bg-sage-pale text-olive",
        variant === "butter" && "bg-butter-pale text-espresso",
        variant === "neutral" && "bg-cream text-text-secondary",
        variant === "success" && "bg-success-light text-success",
        variant === "error" && "bg-error-light text-error",

        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
