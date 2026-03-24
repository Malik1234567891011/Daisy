import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

const sizeConfig = {
  sm: { text: "text-xl", flower: 16 },
  md: { text: "text-2xl", flower: 20 },
  lg: { text: "text-3xl", flower: 26 },
} as const;

interface DaisyFlowerProps {
  size?: number;
  className?: string;
}

function DaisyFlower({ size = 20, className }: DaisyFlowerProps) {
  const petals = [0, 60, 120, 180, 240, 300];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="12"
          cy="7"
          rx="2.5"
          ry="4.8"
          fill="currentColor"
          opacity="0.85"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="2.8" fill="var(--color-butter)" />
    </svg>
  );
}

interface DaisyLogoProps {
  size?: keyof typeof sizeConfig;
  className?: string;
}

export default function DaisyLogo({ size = "md", className }: DaisyLogoProps) {
  const { text, flower } = sizeConfig[size];

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-1.5 transition-opacity hover:opacity-80 focus-visible:opacity-80",
        className
      )}
      aria-label={`${SITE_NAME} — return to homepage`}
    >
      <DaisyFlower size={flower} className="text-sage flex-shrink-0" />
      <span className={cn("font-display text-charcoal leading-none", text)}>
        {SITE_NAME}
      </span>
    </Link>
  );
}
