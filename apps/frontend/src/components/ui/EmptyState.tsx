interface Step {
  number: number;
  label: string;
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  steps?: Step[];
}

export function EmptyState({
  title,
  description,
  action,
  steps,
}: EmptyStateProps) {
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center flex flex-col items-center gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {steps && (
        <div className="flex flex-col gap-2 text-left w-full max-w-xs">
          {steps.map((s) => (
            <div key={s.number} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-medium text-muted-foreground flex-shrink-0">
                {s.number}
              </div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="text-sm underline underline-offset-2 text-foreground"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
