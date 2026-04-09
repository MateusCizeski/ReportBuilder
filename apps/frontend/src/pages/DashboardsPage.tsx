import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { Topbar } from "../components/layout/Topbar";
import { PageLayout } from "../components/layout/PageLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";

interface Dashboard {
  id: string;
  name: string;
  items: any[];
  createdAt: string;
}

export function DashboardsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { data: dashboards = [], isLoading } = useQuery({
    queryKey: ["dashboards", workspaceId],
    queryFn: () =>
      api.get(`/dashboards?workspaceId=${workspaceId}`).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/dashboards", { name, workspaceId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["dashboards", workspaceId] });
      navigate(`/workspaces/${workspaceId}/dashboards/${res.data.id}`);
    },
    onError: (err: any) =>
      setError(err.response?.data?.message ?? "Erro ao criar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dashboards/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboards", workspaceId] }),
  });

  return (
    <div className="min-h-screen bg-muted">
      <Topbar title="Dashboards" back={{ label: "Workspaces", to: "/" }} />
      <PageLayout>
        <PageHeader
          title="Dashboards"
          description="Visões personalizadas com seus relatórios favoritos."
          action={
            !showForm ? (
              <Button size="sm" onClick={() => setShowForm(true)}>
                + Novo dashboard
              </Button>
            ) : undefined
          }
        />

        {showForm && (
          <Card className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Novo dashboard</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
              >
                Cancelar
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              <Input
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Visão de vendas, Financeiro mensal..."
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button
                onClick={() => createMutation.mutate()}
                loading={createMutation.isPending}
                disabled={!name.trim()}
              >
                Criar e abrir
              </Button>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-background border border-border rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : dashboards.length === 0 && !showForm ? (
          <EmptyState
            title="Nenhum dashboard ainda"
            description="Crie um dashboard e adicione seus relatórios salvos."
            action={{
              label: "Criar primeiro dashboard",
              onClick: () => setShowForm(true),
            }}
            steps={[
              { number: 1, label: "Crie um dashboard com um nome" },
              { number: 2, label: "Adicione relatórios salvos como blocos" },
              { number: 3, label: "Arraste e redimensione como quiser" },
            ]}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {dashboards.map((db: Dashboard) => (
              <Card
                key={db.id}
                hover
                className="px-4 py-3 flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 text-sm">
                  ▦
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{db.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {db.items?.length ?? 0}{" "}
                    {db.items?.length === 1 ? "bloco" : "blocos"} ·{" "}
                    {new Date(db.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate(`/workspaces/${workspaceId}/dashboards/${db.id}`)
                    }
                  >
                    Abrir
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      confirm(`Remover "${db.name}"?`) &&
                      deleteMutation.mutate(db.id)
                    }
                  >
                    Remover
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageLayout>
    </div>
  );
}
