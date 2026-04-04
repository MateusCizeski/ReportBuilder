import { useState } from "react";
import { DataChart } from "./DataChart";
import { DataTable } from "./DataTable";

type ViewMode = "chart" | "table" | "both";

interface QueryResultProps {
  rows: Record<string, any>[];
  rowCount: number;
  executionMs?: number;
  sql?: string;
  onSave?: () => void;
}

export function QueryResult({
  rows,
  rowCount,
  executionMs,
  sql,
  onSave,
}: QueryResultProps) {
  const [view, setView] = useState<ViewMode>("both");
  const [showSql, setShowSql] = useState(false);

  if (!rows || rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Nenhum resultado encontrado.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">
          {rowCount} {rowCount === 1 ? "resultado" : "resultados"}
          {executionMs !== undefined && ` · ${executionMs}ms`}
        </span>
        <div className="flex-1" />
        <div className="flex border border-border rounded-md overflow-hidden">
          {(["both", "chart", "table"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-[11px] transition-colors border-r border-border last:border-0 ${
                view === v
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "both" ? "Ambos" : v === "chart" ? "Gráfico" : "Tabela"}
            </button>
          ))}
        </div>
        {onSave && (
          <button
            onClick={onSave}
            className="text-xs px-3 py-1 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            Salvar relatório
          </button>
        )}
      </div>

      {(view === "chart" || view === "both") && (
        <DataChart rows={rows} height={180} />
      )}

      {(view === "table" || view === "both") && (
        <DataTable rows={rows} maxHeight="180px" />
      )}

      {sql && (
        <div className="pt-2 border-t border-border">
          <button
            onClick={() => setShowSql((s) => !s)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSql ? "Ocultar SQL" : "Ver SQL gerado"}
          </button>
          {showSql && (
            <pre className="mt-2 p-3 bg-muted rounded-md text-xs font-mono text-foreground overflow-auto">
              {sql}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
