import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { Topbar } from "../components/layout/Topbar";
import { PageLayout } from "../components/layout/PageLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";

interface Datasource {
  id: string;
  name: string;
  type: "postgresql" | "mysql" | "mssql";
  host: string;
  port: number;
  database: string;
}

const DB_TYPES = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mssql", label: "SQL Server" },
];

const DEFAULT_PORTS: Record<string, number> = {
  postgresql: 5432,
  mysql: 3306,
  mssql: 1433,
};

const EMPTY_FORM = {
  name: "",
  type: "postgresql" as const,
  host: "",
  port: 5432,
  database: "",
  username: "",
  password: "",
  useSsl: false,
};

export function DatasourcesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  const { data: datasources = [], isLoading } = useQuery({
    queryKey: ["datasources", workspaceId],
    queryFn: () => api.get("/datasources").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) =>
      api.post("/datasources", { ...data, workspaceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasources", workspaceId] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      setTestResult(null);
      setError("");
    },
    onError: (err: any) =>
      setError(err.response?.data?.message ?? "Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/datasources/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datasources", workspaceId] }),
  });

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    let createdId: string | null = null;
    try {
      const { data: created } = await api.post("/datasources", {
        ...form,
        workspaceId,
      });
      createdId = created.id;
      const { data: test } = await api.post(`/datasources/${createdId}/test`);
      setTestResult(test);
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.response?.data?.message ?? "Falha",
        latencyMs: 0,
      });
    } finally {
      if (createdId) {
        await api.delete(`/datasources/${createdId}`).catch(() => {});
        queryClient.invalidateQueries({
          queryKey: ["datasources", workspaceId],
        });
      }
      setTesting(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setTestResult(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-muted">
      <Topbar title="Fontes de dados" back={{ label: "Workspaces", to: "/" }} />
      <PageLayout>
        <PageHeader
          title="Fontes de dados"
          description="Conecte bancos de dados para começar a conversar com seus dados."
          action={
            !showForm ? (
              <Button size="sm" onClick={() => setShowForm(true)}>
                + Adicionar
              </Button>
            ) : undefined
          }
        />

        {showForm && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-sm font-medium">Nova conexão</span>
              <Button variant="ghost" size="sm" onClick={resetForm}>
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
                placeholder="ex: production-db"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Tipo
                </label>
                <div className="flex gap-2">
                  {DB_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          type: t.value as typeof form.type,
                          port: DEFAULT_PORTS[t.value],
                        }))
                      }
                      className={`flex-1 py-2 border rounded-md text-sm transition-colors ${
                        form.type === t.value
                          ? "border-foreground bg-primary text-primary-foreground font-medium"
                          : "border-border text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_100px] gap-3">
                <Input
                  label="Host"
                  value={form.host}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, host: e.target.value }))
                  }
                  placeholder="localhost"
                />
                <Input
                  label="Porta"
                  type="number"
                  value={String(form.port)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, port: Number(e.target.value) }))
                  }
                />
              </div>

              <Input
                label="Nome do banco"
                value={form.database}
                onChange={(e) =>
                  setForm((f) => ({ ...f, database: e.target.value }))
                }
                placeholder="meu_banco"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Usuário"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                  placeholder="postgres"
                />
                <Input
                  label="Senha"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="••••••••"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.useSsl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, useSsl: e.target.checked }))
                  }
                  className="w-3.5 h-3.5 accent-foreground"
                />
                <span className="text-sm text-muted-foreground">Usar SSL</span>
              </label>

              {testResult && (
                <div
                  className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 ${
                    testResult.ok
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${testResult.ok ? "bg-green-500" : "bg-red-500"}`}
                  />
                  {testResult.ok
                    ? `Conexão bem-sucedida · ${testResult.latencyMs}ms`
                    : testResult.message}
                </div>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button
                  variant="secondary"
                  onClick={handleTest}
                  loading={testing}
                  disabled={
                    !form.host ||
                    !form.database ||
                    !form.username ||
                    !form.password
                  }
                  className="flex-1"
                >
                  Testar conexão
                </Button>
                <Button
                  onClick={() => createMutation.mutate(form)}
                  loading={createMutation.isPending}
                  disabled={
                    !form.name ||
                    !form.host ||
                    !form.database ||
                    !form.username ||
                    !form.password
                  }
                  className="flex-1"
                >
                  Salvar conexão
                </Button>
              </div>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-background border border-border rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : datasources.length === 0 && !showForm ? (
          <EmptyState
            title="Nenhuma fonte de dados"
            description="Conecte um banco para começar a gerar relatórios com IA."
            action={{
              label: "Adicionar primeira conexão",
              onClick: () => setShowForm(true),
            }}
            steps={[
              { number: 1, label: "Adicione um banco de dados" },
              { number: 2, label: "Configure o contexto de negócio" },
              { number: 3, label: "Converse com a IA em português" },
            ]}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {datasources.map((ds: Datasource) => (
              <Card
                key={ds.id}
                className="px-4 py-3 flex items-center gap-3 group hover:border-foreground/30 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{ds.name}</span>
                    <Badge>{ds.type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {ds.host}:{ds.port} · {ds.database}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      navigate(`/workspaces/${workspaceId}/context/${ds.id}`)
                    }
                  >
                    Contexto
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate(`/workspaces/${workspaceId}/chat/${ds.id}`)
                    }
                  >
                    Abrir chat
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      confirm(`Remover "${ds.name}"?`) &&
                      deleteMutation.mutate(ds.id)
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
