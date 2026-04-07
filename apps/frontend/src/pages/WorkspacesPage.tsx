import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { Topbar } from "../components/layout/Topbar";
import { PageLayout } from "../components/layout/PageLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export function WorkspacesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.get("/workspaces").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/workspaces", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setShowForm(false);
      setForm({ name: "", description: "" });
      setError("");
    },
    onError: (err: any) =>
      setError(err.response?.data?.message ?? "Erro ao criar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/workspaces/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });

  return (
    <div className="min-h-screen bg-muted">
      <Topbar />
      <PageLayout>
        <PageHeader
          title="Workspaces"
          description="Organize seus projetos de análise de dados."
          action={
            !showForm ? (
              <Button size="sm" onClick={() => setShowForm(true)}>
                + Novo workspace
              </Button>
            ) : undefined
          }
        />

        {showForm && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Novo workspace</span>
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
            <div className="flex flex-col gap-4">
              <Input
                label="Nome"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="ex: Loja XPTO, Financeiro 2026..."
              />
              <Input
                label="Descrição (opcional)"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Para que serve este workspace..."
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button
                onClick={() => createMutation.mutate(form)}
                loading={createMutation.isPending}
                disabled={!form.name.trim()}
              >
                Criar workspace
              </Button>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-background border border-border rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : workspaces.length === 0 && !showForm ? (
          <EmptyState
            title="Nenhum workspace ainda"
            description="Crie um workspace para começar a analisar seus dados."
            action={{
              label: "Criar primeiro workspace",
              onClick: () => setShowForm(true),
            }}
            steps={[
              { number: 1, label: "Crie um workspace para seu projeto" },
              { number: 2, label: "Conecte um banco de dados" },
              { number: 3, label: "Converse com a IA para gerar relatórios" },
            ]}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {workspaces.map((ws: Workspace) => (
              <Card
                key={ws.id}
                hover
                className="p-4 flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 text-sm font-medium text-muted-foreground">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{ws.name}</div>
                  {ws.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {ws.description}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(ws.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/workspaces/${ws.id}/datasources`)}
                  >
                    Fontes de dados
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/workspaces/${ws.id}/datasources`)}
                  >
                    Abrir
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      confirm(`Remover "${ws.name}"?`) &&
                      deleteMutation.mutate(ws.id)
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
