import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variantStyles = {
  primary:
    "bg-sage text-white hover:bg-olive active:bg-olive/90 shadow-sm hover:shadow-md",
  secondary:
    "bg-cream text-charcoal hover:bg-cream-dark border border-border active:bg-cream-dark/80",
  ghost:
    "text-text-secondary hover:text-charcoal hover:bg-sage-pale/60 active:bg-sage-pale",
  link: "text-sage hover:text-olive underline-offset-4 hover:underline !p-0 !h-auto shadow-none",
} as const;

const sizeStyles = {
  sm: "h-9 px-4 text-sm rounded-full",
  md: "h-11 px-6 text-sm rounded-full",
  lg: "h-12 px-7 text-base rounded-full",
} as const;

type Variant = keyof typeof variantStyles;
type Size = keyof typeof sizeStyles;

interface ButtonBaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps & {
  href: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, children, ...props },
    ref
  ) {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap",
      "transition-all duration-150 ease-out",
      "focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      variantStyles[variant],
      variant !== "link" && sizeStyles[size],
      className
    );

    if ("href" in props && props.href) {
      const { href, ...rest } = props as ButtonAsLink;
      return (
        <Link
          href={href}
          className={classes}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...rest}
        >
          {children}
        </Link>
      );
    }

    const { ...buttonProps } = props as ButtonAsButton;
    return (
      <button
        className={classes}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...buttonProps}
      >
        {children}
      </button>
    );
  }
);

export default Button;
