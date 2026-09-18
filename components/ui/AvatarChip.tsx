import { useId } from "react";
import { cn } from "@/lib/cn";
import { generateIdenticonGrid } from "@/lib/identicon";

// 6 buckets: the 3 committed accent roles plus a lighter tint of each, so
// groups larger than 3 stay visually distinct without introducing new hues.
const PALETTE = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-tertiary)",
  "color-mix(in srgb, var(--color-primary) 65%, white)",
  "color-mix(in srgb, var(--color-secondary) 65%, white)",
  "color-mix(in srgb, var(--color-tertiary) 65%, white)",
];

function hashOf(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash;
}

function colorFor(seed: string) {
  return PALETTE[hashOf(seed) % PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase();
}

const sizes = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-14 w-14 text-lg",
};

function IdenticonPattern({ seed }: { seed: string }) {
  const clipId = useId();
  const grid = generateIdenticonGrid(seed);
  const color = colorFor(seed);
  return (
    <svg viewBox="0 0 5 5" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <circle cx="2.5" cy="2.5" r="2.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="5" height="5" fill="var(--color-bg-raised-2)" />
        {grid.map((row, y) =>
          row.map(
            (on, x) =>
              on && <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />,
          ),
        )}
      </g>
    </svg>
  );
}

/**
 * `pattern` renders a decorative generative identicon (no initials) — for
 * demo/hero contexts where visual variety matters more than recognizing a
 * specific person. Default renders a solid-color circle with initials — for
 * functional contexts (member lists, chat, call tiles) where legibility of
 * who's who matters more than decoration.
 */
export default function AvatarChip({
  name,
  seed,
  size = "md",
  ring = false,
  pattern = false,
  className,
  style,
}: {
  name: string;
  seed?: string;
  size?: keyof typeof sizes;
  ring?: boolean;
  pattern?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const key = seed ?? name;
  // the 5x5 grid isn't legible at 24px, especially when chips overlap — fall
  // back to solid+initials rather than ship an illegible avatar
  const showPattern = pattern && size !== "sm";

  if (showPattern) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          sizes[size],
          ring && "ring-2 ring-bg ring-offset-2 ring-offset-bg",
          className,
        )}
        style={style}
        title={name}
      >
        <IdenticonPattern seed={key} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-[#15101e]",
        sizes[size],
        ring && "ring-2 ring-bg ring-offset-2 ring-offset-bg",
        className,
      )}
      style={{ background: colorFor(key), ...style }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
