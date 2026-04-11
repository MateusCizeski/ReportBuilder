interface QueryResult {
  rows: Record<string, any>[];
  rowCount: number;
  executionMs: number;
  sql: string;
}

interface ResultPanelProps {
  result: QueryResult | null;
  isLoading: boolean;
  error: string | null;
}

export function ResultPanel({ result, isLoading, error }: ResultPanelProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-10 border-b border-border flex items-center px-4 gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">Executando...</span>
          <div className="flex-1 h-1 bg-muted rounded overflow-hidden">
            <div className="h-full bg-foreground/20 rounded animate-pulse w-2/3" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">
              Executando query...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-10 border-b border-border flex items-center px-4 flex-shrink-0">
          <span className="text-xs text-muted-foreground">Resultado</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-medium text-red-700 mb-1">
              Erro na query
            </p>
            <p className="text-xs text-red-600 font-mono break-all">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-10 border-b border-border flex items-center px-4 flex-shrink-0">
          <span className="text-xs text-muted-foreground">Resultado</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Execute uma query para ver os resultados.
          </p>
        </div>
      </div>
    );
  }

  const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

  function formatValue(val: any): string {
    if (val === null || val === undefined) return "null";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  }

  function isNumeric(val: any): boolean {
    return typeof val === "number";
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-10 border-b border-border flex items-center px-4 gap-3 flex-shrink-0">
        <span className="text-xs text-muted-foreground">Resultado</span>
        <span className="text-xs font-medium text-foreground">
          {result.rowCount} {result.rowCount === 1 ? "linha" : "linhas"}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">
          {result.executionMs}ms
        </span>
        <div className="flex-1" />
        <button
          onClick={() => {
            const csv = [
              columns.join(","),
              ...result.rows.map((r) =>
                columns.map((c) => `"${formatValue(r[c])}"`).join(","),
              ),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "resultado.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-xs px-2.5 py-1 border border-border rounded text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="text-left px-3 py-2 font-medium text-muted-foreground bg-muted border-b border-border whitespace-nowrap text-[11px] uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-muted/50 transition-colors border-b border-border last:border-0"
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className={`px-3 py-2 whitespace-nowrap ${
                      row[col] === null
                        ? "text-muted-foreground italic"
                        : isNumeric(row[col])
                          ? "text-right font-mono"
                          : ""
                    }`}
                  >
                    {row[col] === null ? "null" : formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
