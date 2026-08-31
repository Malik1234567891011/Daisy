import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

const sizeConfig = {
  sm: { text: "text-xl", flower: 18 },
  md: { text: "text-2xl", flower: 22 },
  lg: { text: "text-3xl", flower: 28 },
} as const;

function DaisyFlower({ size = 22, className }: { size?: number; className?: string }) {
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
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <ellipse
          key={angle}
          cx="12"
          cy="7"
          rx="2.6"
          ry="5"
          fill="currentColor"
          opacity="0.8"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="3" fill="var(--color-butter)" />
    </svg>
  );
}

interface DaisyLogoProps {
  size?: keyof typeof sizeConfig;
  /** "light" for placement over dark grounds (the landing hero). */
  tone?: "dark" | "light";
  className?: string;
}

export default function DaisyLogo({ size = "md", tone = "dark", className }: DaisyLogoProps) {
  const { text, flower } = sizeConfig[size];
  const onDark = tone === "light";

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-1.5 transition-opacity duration-200 hover:opacity-75",
        className
      )}
      aria-label={`${SITE_NAME} — return to homepage`}
    >
      <DaisyFlower
        size={flower}
        className={cn("flex-shrink-0", onDark ? "text-ivory" : "text-sage")}
      />
      <span
        className={cn(
          "font-display leading-none",
          onDark ? "text-ivory" : "text-charcoal",
          text,
        )}
      >
        {SITE_NAME}
      </span>
    </Link>
  );
}
