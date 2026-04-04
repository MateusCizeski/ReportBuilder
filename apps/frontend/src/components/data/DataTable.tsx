interface DataTableProps {
  rows: Record<string, any>[];
  maxRows?: number;
  maxHeight?: string;
}

export function DataTable({
  rows,
  maxRows = 50,
  maxHeight = "200px",
}: DataTableProps) {
  if (!rows || rows.length === 0) return null;
  const columns = Object.keys(rows[0]);

  function formatValue(val: any): React.ReactNode {
    if (val === null || val === undefined)
      return (
        <span className="text-muted-foreground italic text-[10px]">null</span>
      );
    if (typeof val === "boolean")
      return <span className="font-mono">{val ? "true" : "false"}</span>;
    return String(val);
  }

  return (
    <div
      className="rounded-md border border-border overflow-auto"
      style={{ maxHeight }}
    >
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
          {rows.slice(0, maxRows).map((row, i) => (
            <tr
              key={i}
              className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className={`px-3 py-1.5 whitespace-nowrap ${
                    typeof row[col] === "number" ? "text-right font-mono" : ""
                  }`}
                >
                  {formatValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground bg-muted">
          Mostrando {maxRows} de {rows.length} linhas
        </div>
      )}
    </div>
  );
}
