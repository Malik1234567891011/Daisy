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
          "rounded-2xl bg-white p-6 transition-all duration-200",

          variant === "default" && "border border-border-light shadow-sm",
          variant === "elevated" && "border border-border-light shadow-md",
          variant === "outlined" && "border border-border shadow-none",

          hover &&
            "hover:shadow-md hover:-translate-y-0.5 hover:border-border cursor-pointer",

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
