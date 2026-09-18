import { cn } from "@/lib/cn";

const sizes = {
  sm: "h-7 min-w-[1.5rem] text-xs",
  md: "h-10 min-w-[2.25rem] text-lg",
  lg: "h-16 min-w-[3.25rem] text-3xl",
};

export default function RoomCode({
  code,
  size = "md",
  className,
  style,
}: {
  code: string;
  size?: keyof typeof sizes;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("tnum flex flex-wrap gap-1.5 font-display", className)}
      style={style}
      aria-label={`Room code ${code}`}
    >
      {code.split("").map((char, i) => (
        <span
          key={i}
          className={cn(
            "flex items-center justify-center rounded-lg border border-border-strong bg-bg-raised px-1 text-foreground",
            sizes[size],
          )}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
