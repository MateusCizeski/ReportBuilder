import { useState } from "react";
import { DataChart } from "./DataChart";
import { DataTable } from "./DataTable";
import { Button } from "../ui/Button";
import { api } from "../../lib/axios";

type ViewMode = "chart" | "table" | "both";

interface QueryResultProps {
  rows: Record<string, any>[];
  rowCount: number;
  executionMs?: number;
  sql?: string;
  reportId?: string;
  onSave?: () => void;
}

export function QueryResult({
  rows,
  rowCount,
  executionMs,
  sql,
  reportId,
  onSave,
}: QueryResultProps) {
  const [view, setView] = useState<ViewMode>("both");
  const [showSql, setShowSql] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!rows || rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Nenhum resultado encontrado.
      </p>
    );
  }

  function downloadCsv() {
    const columns = Object.keys(rows[0]);
    const csv = [
      columns.join(","),
      ...rows.map((r) =>
        columns
          .map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resultado.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadExcel() {
    if (!reportId) return;
    const token = localStorage.getItem("reportbuilder-auth")
      ? JSON.parse(localStorage.getItem("reportbuilder-auth")!).state
          ?.accessToken
      : null;
    const link = document.createElement("a");
    link.href = `${import.meta.env.VITE_API_URL}/exports/excel/${reportId}`;
    link.click();
  }

  async function downloadPdf() {
    if (!reportId) return;
    window.open(
      `${import.meta.env.VITE_API_URL}/exports/pdf/${reportId}`,
      "_blank",
    );
  }

  async function handleShare() {
    if (!reportId) return;
    setSharing(true);
    try {
      const { data } = await api.post(`/shares/${reportId}`);
      const link = `${window.location.origin}/public/${data.token}`;
      setShareLink(link);
    } finally {
      setSharing(false);
    }
  }

  async function copyLink() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={downloadCsv}>
            CSV
          </Button>
          {reportId && (
            <>
              <Button variant="secondary" size="sm" onClick={downloadExcel}>
                Excel
              </Button>
              <Button variant="secondary" size="sm" onClick={downloadPdf}>
                PDF
              </Button>
            </>
          )}
        </div>

        {onSave && (
          <Button size="sm" onClick={onSave}>
            Salvar relatório
          </Button>
        )}
      </div>

      {(view === "chart" || view === "both") && (
        <DataChart rows={rows} height={180} />
      )}

      {(view === "table" || view === "both") && (
        <DataTable rows={rows} maxHeight="180px" />
      )}

      {reportId && (
        <div className="pt-2 border-t border-border flex flex-col gap-2">
          {!shareLink ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              loading={sharing}
              className="self-start text-muted-foreground"
            >
              Compartilhar via link público
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareLink}
                className="flex-1 px-2.5 py-1.5 border border-border rounded-md text-xs font-mono bg-muted text-muted-foreground outline-none"
              />
              <Button size="sm" variant="secondary" onClick={copyLink}>
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
          )}
        </div>
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
