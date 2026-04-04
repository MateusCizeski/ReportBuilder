import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`px-3 py-2 border rounded-md text-sm outline-none transition-colors bg-background
          ${error ? "border-red-400 focus:border-red-500" : "border-border focus:border-foreground"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  ),
);
Input.displayName = "Input";
