interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

const widths = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
};

export function PageLayout({ children, maxWidth = "md" }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-muted">
      <div className={`${widths[maxWidth]} mx-auto px-5 py-10`}>{children}</div>
    </div>
  );
}
