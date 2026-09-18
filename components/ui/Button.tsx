import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-[#ff7f4f] active:bg-[#e85a28]",
  secondary:
    "bg-bg-raised text-foreground border border-border-strong hover:border-secondary hover:text-secondary",
  ghost: "text-foreground-muted hover:text-foreground hover:bg-bg-raised",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
};

interface SharedProps {
  variant?: Variant;
  size?: Size;
  display?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export type ButtonProps = SharedProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps> & { href?: undefined };

type ButtonLinkProps = SharedProps &
  Omit<React.ComponentProps<typeof Link>, keyof SharedProps> & { href: string };

function classesFor({
  variant = "primary",
  size = "md",
  display = false,
  className,
}: Pick<SharedProps, "variant" | "size" | "display" | "className">) {
  return cn(base, variants[variant], sizes[size], display && "font-display tracking-wide", className);
}

const Button = forwardRef<HTMLButtonElement, ButtonProps | ButtonLinkProps>(function Button(
  { variant = "primary", size = "md", display = false, className, ...props },
  ref,
) {
  const classes = classesFor({ variant, size, display, className });

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as ButtonLinkProps;
    return <Link href={href} className={classes} {...rest} />;
  }

  return <button ref={ref} className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)} />;
});

export default Button;
