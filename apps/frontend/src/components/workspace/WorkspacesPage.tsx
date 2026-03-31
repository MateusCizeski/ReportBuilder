import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { Topbar } from "../components/layout/Topbar";

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
    onError: (err: any) => {
      setError(err.response?.data?.message ?? "Erro ao criar workspace");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/workspaces/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });

  return (
    <div className="min-h-screen bg-muted">
      <Topbar />

      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium">Workspaces</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organize seus projetos de análise de dados.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            >
              + Novo workspace
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-background border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Novo workspace</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Nome
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="ex: Loja XPTO, Financeiro 2026..."
                  className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors bg-background"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Descrição{" "}
                  <span className="normal-case font-normal">(opcional)</span>
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Para que serve este workspace..."
                  className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors bg-background"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending || !form.name.trim()}
                className="py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-40"
              >
                {createMutation.isPending ? "Criando..." : "Criar workspace"}
              </button>
            </div>
          </div>
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
          <div className="border border-dashed border-border rounded-lg p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum workspace ainda.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm underline underline-offset-2 text-foreground"
            >
              Criar primeiro workspace
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {workspaces.map((ws: Workspace) => (
              <div
                key={ws.id}
                className="bg-background border border-border rounded-lg p-4 flex items-center gap-4 group hover:border-foreground/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-base">
                    {ws.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{ws.name}</div>
                  {ws.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {ws.description}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Criado em{" "}
                    {new Date(ws.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate(`/workspaces/${ws.id}/datasources`)}
                    className="text-xs px-3 py-1.5 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    Fontes de dados
                  </button>
                  <button
                    onClick={() => navigate(`/workspaces/${ws.id}/datasources`)}
                    className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md font-medium"
                  >
                    Abrir
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${ws.name}"?`))
                        deleteMutation.mutate(ws.id);
                    }}
                    className="text-xs text-muted-foreground hover:text-red-600 transition-colors ml-1"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
