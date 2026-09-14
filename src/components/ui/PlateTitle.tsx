import { cn } from "@/lib/utils";

/**
 * The lockup the homepage section headings and the account cards share: type
 * on a solid ink plate, sized to the words rather than the column, with a
 * trailing second word picked out in bloom.
 */

const SIZES = {
  sm: "text-[28px]",
  md: "text-[34px]",
  lg: "text-[40px]",
} as const;

interface PlateTitleProps {
  title: string;
  size?: keyof typeof SIZES;
  as?: "h1" | "h2";
  className?: string;
}

export default function PlateTitle({
  title,
  size = "md",
  as: Tag = "h1",
  className,
}: PlateTitleProps) {
  const words = title.trim().split(/\s+/);
  const lead = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];

  return (
    <Tag className={cn("mx-auto w-fit max-w-full bg-ink px-5 py-1.5 text-center", className)}>
      <span className={cn("font-display leading-none text-ivory", SIZES[size])}>
        {lead ? `${lead} ` : ""}
      </span>
      <span
        className={cn(
          "font-display leading-none",
          SIZES[size],
          lead ? "text-bloom" : "text-ivory",
        )}
      >
        {last}
      </span>
    </Tag>
  );
}
