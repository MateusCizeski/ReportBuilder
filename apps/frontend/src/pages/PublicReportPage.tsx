import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { DataChart } from "../components/data/DataChart";
import { DataTable } from "../components/data/DataTable";

export function PublicReportPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-report", token],
    queryFn: () => api.get(`/shares/public/${token}`).then((r) => r.data),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">
            Carregando relatório...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="bg-background border border-border rounded-xl p-8 max-w-sm w-full text-center mx-4">
          <div className="text-3xl mb-3">🔗</div>
          <h2 className="text-base font-medium mb-2">Link não encontrado</h2>
          <p className="text-sm text-muted-foreground">
            Este link pode ter sido removido ou não existe.
          </p>
        </div>
      </div>
    );
  }

  const { reportName, rows, rowCount, createdAt } = data;

  return (
    <div className="min-h-screen bg-muted">
      <div className="h-11 bg-background border-b border-border flex items-center px-5 gap-3">
        <span className="text-sm font-medium">ReportBuilder</span>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">Relatório público</span>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-medium">{reportName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rowCount} {rowCount === 1 ? "registro" : "registros"} ·
            Compartilhado em{" "}
            {new Date(createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="bg-background border border-border rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum dado disponível.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-background border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium mb-4">Visualização</h3>
              <DataChart rows={rows} height={240} />
            </div>

            <div className="bg-background border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Dados</h3>
                <button
                  onClick={() => {
                    const columns = Object.keys(rows[0]);
                    const csv = [
                      columns.join(","),
                      ...rows.map((r) =>
                        columns.map((c) => `"${String(r[c] ?? "")}"`).join(","),
                      ),
                    ].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${reportName}.csv`;
                    a.click();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Baixar CSV
                </button>
              </div>
              <DataTable rows={rows} maxHeight="400px" />
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Gerado por{" "}
            <a
              href="/"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              ReportBuilder
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
