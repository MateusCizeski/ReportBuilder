import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  back?: { label: string; to: string };
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, back, actions }: TopbarProps) {
  const navigate = useNavigate();
  const { name, logout } = useAuthStore();

  return (
    <div className="h-11 flex items-center px-5 gap-3 border-b border-border bg-background flex-shrink-0">
      {back && (
        <>
          <button
            onClick={() => navigate(back.to)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {back.label}
          </button>
          <span className="text-muted-foreground text-xs">/</span>
        </>
      )}
      {title && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
      {!back && !title && (
        <span className="text-sm font-medium">ReportBuilder</span>
      )}
      <div className="flex-1" />
      {actions}
      <span className="text-xs text-muted-foreground">{name}</span>
      <button
        onClick={logout}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Sair
      </button>
    </div>
  );
}
