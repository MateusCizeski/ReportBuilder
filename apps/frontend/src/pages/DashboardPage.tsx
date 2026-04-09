import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { api } from "../lib/axios";
import { Topbar } from "../components/layout/Topbar";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { DataChart } from "../components/data/DataChart";
import { DataTable } from "../components/data/DataTable";

const ResponsiveGrid = WidthProvider(Responsive);

interface DashboardItem {
  id: string;
  reportId: string;
  reportName: string;
  visualType: string;
}

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Dashboard {
  id: string;
  name: string;
  items: DashboardItem[];
  layout: LayoutItem[];
  workspaceId: string;
}

interface Report {
  id: string;
  name: string;
  visualType: string;
  rowCount: number;
  rows?: Record<string, any>[];
  datasourceId: string;
  sql: string;
}

function DashboardBlock({
  item,
  onRemove,
  onRefresh,
}: {
  item: DashboardItem;
  onRemove: () => void;
  onRefresh: (reportId: string) => void;
}) {
  const { data: report } = useQuery({
    queryKey: ["report", item.reportId],
    queryFn: () => api.get(`/reports/${item.reportId}`).then((r) => r.data),
  });

  const [liveRows, setLiveRows] = useState<Record<string, any>[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    if (!report) return;
    setRefreshing(true);
    try {
      const { data } = await api.post("/queries/execute", {
        datasourceId: report.datasourceId,
        sql: report.sql,
      });
      setLiveRows(data.rows);
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  }

  const rows = liveRows ?? report?.rows ?? [];

  return (
    <div className="h-full flex flex-col bg-background border border-border rounded-lg overflow-hidden">
      {/* Block header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0 bg-muted/50">
        <span className="text-xs font-medium flex-1 truncate">
          {item.reportName}
        </span>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          {refreshing ? "..." : "↻"}
        </button>
        <button
          onClick={onRemove}
          className="text-[10px] text-muted-foreground hover:text-red-600 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Block content */}
      <div className="flex-1 overflow-hidden p-2">
        {rows.length > 0 ? (
          item.visualType === "table" ? (
            <DataTable rows={rows} maxHeight="100%" />
          ) : (
            <DataChart rows={rows} type={item.visualType as any} height={160} />
          )
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Sem dados</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AddReportModal({
  reports,
  onAdd,
  onClose,
}: {
  reports: Report[];
  onAdd: (report: Report) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-xl w-full max-w-md flex flex-col shadow-lg max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h3 className="text-sm font-medium">Adicionar relatório</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2">
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum relatório salvo ainda.
            </p>
          ) : (
            reports.map((r) => (
              <button
                key={r.id}
                onClick={() => onAdd(r)}
                className="w-full text-left px-4 py-3 border border-border rounded-lg hover:border-foreground hover:bg-muted/50 transition-colors"
              >
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {r.rowCount} linhas · {r.visualType}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { workspaceId, dashboardId } = useParams<{
    workspaceId: string;
    dashboardId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard", dashboardId],
    queryFn: () => api.get(`/dashboards/${dashboardId}`).then((r) => r.data),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["reports", workspaceId],
    queryFn: () =>
      api.get(`/reports?workspaceId=${workspaceId}`).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { items: DashboardItem[]; layout: LayoutItem[] }) =>
      api.put(`/dashboards/${dashboardId}`, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboard", dashboardId] }),
  });

  const handleLayoutChange = useCallback(
    (layout: Layout[]) => {
      if (!dashboard) return;
      updateMutation.mutate({
        items: dashboard.items,
        layout: layout.map((l) => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })),
      });
    },
    [dashboard],
  );

  function handleAddReport(report: Report) {
    if (!dashboard) return;
    const newItem: DashboardItem = {
      id: report.id,
      reportId: report.id,
      reportName: report.name,
      visualType: report.visualType,
    };
    const newLayoutItem: LayoutItem = {
      i: report.id,
      x: (dashboard.items.length * 2) % 12,
      y: Infinity,
      w: 6,
      h: 4,
    };
    updateMutation.mutate({
      items: [...dashboard.items, newItem],
      layout: [...dashboard.layout, newLayoutItem],
    });
    setShowAddModal(false);
  }

  function handleRemoveItem(itemId: string) {
    if (!dashboard) return;
    updateMutation.mutate({
      items: dashboard.items.filter((i: DashboardItem) => i.id !== itemId),
      layout: dashboard.layout.filter((l: LayoutItem) => l.i !== itemId),
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <Topbar
          title="Dashboard"
          back={{
            label: "Dashboards",
            to: `/workspaces/${workspaceId}/dashboards`,
          }}
        />
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Topbar
        title={dashboard?.name ?? "Dashboard"}
        back={{
          label: "Dashboards",
          to: `/workspaces/${workspaceId}/dashboards`,
        }}
        actions={
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            + Adicionar bloco
          </Button>
        }
      />

      <div className="px-4 py-6">
        {!dashboard?.items?.length ? (
          <div className="max-w-3xl mx-auto">
            <EmptyState
              title="Dashboard vazio"
              description="Adicione relatórios para montar sua visão personalizada."
              action={{
                label: "+ Adicionar primeiro bloco",
                onClick: () => setShowAddModal(true),
              }}
            />
          </div>
        ) : (
          <ResponsiveGrid
            className="layout"
            layouts={{ lg: dashboard.layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768 }}
            cols={{ lg: 12, md: 10, sm: 6 }}
            rowHeight={60}
            onLayoutChange={handleLayoutChange}
            isDraggable
            isResizable
            margin={[12, 12]}
          >
            {dashboard.items.map((item: DashboardItem) => (
              <div key={item.id}>
                <DashboardBlock
                  item={item}
                  onRemove={() => handleRemoveItem(item.id)}
                  onRefresh={() => {}}
                />
              </div>
            ))}
          </ResponsiveGrid>
        )}
      </div>

      {showAddModal && (
        <AddReportModal
          reports={reports}
          onAdd={handleAddReport}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
