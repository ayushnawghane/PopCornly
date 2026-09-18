import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-border bg-bg-raised px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/60 outline-none transition-colors focus:border-tertiary",
        className,
      )}
      {...props}
    />
  );
});

export default Input;
