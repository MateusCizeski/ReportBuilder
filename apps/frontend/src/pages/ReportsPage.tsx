import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { Topbar } from "../components/layout/Topbar";
import { PageLayout } from "../components/layout/PageLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { QueryResult } from "../components/data/QueryResult";

interface Report {
  id: string;
  name: string;
  sql: string;
  visualType: "table" | "bar" | "line" | "pie";
  rowCount: number;
  datasourceId: string;
  createdAt: string;
  rows?: Record<string, any>[];
  executionMs?: number;
}

function ReportCard({
  report,
  onOpen,
  onDelete,
  isOpen,
  isRerunning,
  onRerun,
  result,
}: {
  report: Report;
  onOpen: () => void;
  onDelete: () => void;
  isOpen: boolean;
  isRerunning: boolean;
  onRerun: () => void;
  result: {
    rows: Record<string, any>[];
    rowCount: number;
    executionMs: number;
  } | null;
}) {
  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onOpen}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{report.name}</span>
            <Badge
              variant={
                report.visualType === "bar"
                  ? "info"
                  : report.visualType === "line"
                    ? "success"
                    : report.visualType === "pie"
                      ? "warning"
                      : "default"
              }
            >
              {report.visualType}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {report.rowCount} linhas
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Salvo em{" "}
            {new Date(report.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRerun();
            }}
            loading={isRerunning}
          >
            Atualizar dados
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Remover
          </Button>
          <span className="text-xs text-muted-foreground ml-1">
            {isOpen ? "▾" : "▸"}
          </span>
        </div>
      </div>

      {/* Resultado expandido */}
      {isOpen && (
        <div className="border-t border-border px-4 py-4">
          {result ? (
            <QueryResult
              rows={result.rows}
              rowCount={result.rowCount}
              executionMs={result.executionMs}
              sql={report.sql}
              reportId={report.id}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Dados do momento em que foi salvo — clique em "Atualizar dados"
                para buscar os mais recentes.
              </p>
              {report.rows && report.rows.length > 0 && (
                <QueryResult
                  rows={report.rows ?? []}
                  rowCount={report.rowCount}
                  sql={report.sql}
                  reportId={report.id}
                />
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function ReportsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const [rerunResults, setRerunResults] = useState<Record<string, any>>({});

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports", workspaceId],
    queryFn: () =>
      api.get(`/reports?workspaceId=${workspaceId}`).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reports/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reports", workspaceId] }),
  });

  async function handleRerun(report: Report) {
    setRerunningId(report.id);
    try {
      const { data } = await api.post("/queries/execute", {
        datasourceId: report.datasourceId,
        sql: report.sql,
      });
      setRerunResults((prev) => ({ ...prev, [report.id]: data }));
      setOpenId(report.id);
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Erro ao reexecutar");
    } finally {
      setRerunningId(null);
    }
  }

  function toggleOpen(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="min-h-screen bg-muted">
      <Topbar
        title="Relatórios"
        back={{ label: "Workspaces", to: "/" }}
        actions={
          <Button
            size="sm"
            onClick={() => navigate(`/workspaces/${workspaceId}/datasources`)}
          >
            + Novo relatório
          </Button>
        }
      />
      <PageLayout>
        <PageHeader
          title="Relatórios salvos"
          description="Relatórios criados no chat com IA. Atualize para ver os dados mais recentes."
        />

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-background border border-border rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            title="Nenhum relatório salvo"
            description="Converse com a IA no chat e salve os resultados que interessarem."
            action={{
              label: "Ir para o chat",
              onClick: () => navigate(`/workspaces/${workspaceId}/datasources`),
            }}
            steps={[
              { number: 1, label: "Abra uma fonte de dados" },
              { number: 2, label: "Faça uma pergunta no chat com IA" },
              { number: 3, label: 'Clique em "Salvar relatório" no resultado' },
            ]}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((report: Report) => (
              <ReportCard
                key={report.id}
                report={report}
                isOpen={openId === report.id}
                onOpen={() => toggleOpen(report.id)}
                onDelete={() =>
                  confirm(`Remover "${report.name}"?`) &&
                  deleteMutation.mutate(report.id)
                }
                isRerunning={rerunningId === report.id}
                onRerun={() => handleRerun(report)}
                result={rerunResults[report.id] ?? null}
              />
            ))}
          </div>
        )}
      </PageLayout>
    </div>
  );
}
