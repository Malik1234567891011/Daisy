import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variantStyles = {
  primary:
    "font-medium bg-sage text-white hover:bg-olive active:bg-olive/90 shadow-sm hover:shadow-md",
  secondary:
    "font-medium bg-cream text-charcoal hover:bg-cream-dark border border-border active:bg-cream-dark/80",
  ghost:
    "font-medium text-text-secondary hover:text-charcoal hover:bg-sage-pale/50 active:bg-sage-pale/80",
  link: "font-medium text-sage hover:text-olive underline-offset-4 hover:underline !p-0 !h-auto shadow-none",
  /* For placement on dark grounds (the landing hero, the floating navbar).
     These exist as variants rather than className overrides because `cn` is
     plain clsx with no tailwind-merge -- passing `bg-ivory` alongside a
     variant's `bg-sage` leaves both in the class list and lets stylesheet
     order decide, which silently ignores the override. */
  /* Primary call to action while still over the hero: glass, but carrying a
     heavier fill than the quiet pill beside it so it still reads as primary. */
  onDark: "font-medium liquid-glass bg-ivory/25 text-ivory hover:bg-ivory/35",
  onDarkGhost: "font-medium liquid-glass bg-ivory/10 text-ivory hover:bg-ivory/20 hover:text-ivory",
  onDarkQuiet: "font-medium liquid-glass bg-ivory/10 text-ivory hover:bg-ivory/20",
  /* Once past the first screen the same pill goes solid with accent text.
     That swap is the only thing marking scroll progress on a bar that never
     changes its own background. */
  /* Bold once it goes solid. Weight lives on variants rather than on the size
     scale so there is only ever one font-weight class per button — with two,
     `cn` (plain clsx, no tailwind-merge) leaves both in the list and the
     cascade decides, which is not what the caller asked for. */
  onDarkAccent: "font-bold liquid-glass bg-ivory text-sage hover:bg-bloom-soft",
} as const;

/* Measured directly off the reference at a 1512px viewport rather than
   guessed: nav pills are 40px tall at 14px/500 with 16px of side padding;
   the primary call to action is 48px tall at 16px/700 with a 28px radius. */
const sizeStyles = {
  sm: "h-10 px-4 text-sm rounded-full gap-1.5",
  md: "h-11 px-6 text-sm rounded-full gap-2",
  lg: "h-12 px-8 text-base rounded-[28px] gap-2",
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
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, children, ...props },
    ref
  ) {
    const classes = cn(
      "inline-flex items-center justify-center whitespace-nowrap select-none",
      "transition-all duration-200 ease-out",
      "focus-visible:outline-2 focus-visible:outline-sage focus-visible:outline-offset-2",
      "disabled:pointer-events-none disabled:opacity-40",
      "active:scale-[0.98]",
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
