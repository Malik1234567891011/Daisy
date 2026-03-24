import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "outlined";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", hover = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl bg-white p-6 sm:p-7 transition-all duration-300 ease-out",

          variant === "default" && "border border-border-light/80 shadow-card",
          variant === "elevated" && "border border-border-light/60 shadow-md",
          variant === "outlined" && "border border-border shadow-none",

          hover &&
            "hover:shadow-card-hover hover:-translate-y-1 cursor-pointer",

          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
export type { CardProps, CardVariant };
