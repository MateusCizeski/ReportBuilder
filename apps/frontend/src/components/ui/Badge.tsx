interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-muted border-border text-muted-foreground",
    success: "bg-green-50 border-green-200 text-green-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    danger: "bg-red-50 border-red-200 text-red-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 border rounded font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
