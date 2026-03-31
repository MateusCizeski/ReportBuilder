import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { Topbar } from "../components/layout/Topbar";

interface Datasource {
  id: string;
  name: string;
  type: "postgresql" | "mysql" | "mssql";
  host: string;
  port: number;
  database: string;
  username: string;
  useSsl: boolean;
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
  const { name, logout } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);

  const { data: datasources = [], isLoading } = useQuery({
    queryKey: ["datasources"],
    queryFn: () => api.get("/datasources").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => api.post("/datasources", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasources"] });
      setShowForm(false);
      setForm(EMPTY_FORM);
      setTestResult(null);
      setError("");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message ?? "Erro ao salvar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/datasources/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["datasources"] }),
  });

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    let createdId: string | null = null;
    try {
      const create = await api.post("/datasources", form);
      createdId = create.data.id;
      const test = await api.post(`/datasources/${createdId}/test`);
      setTestResult(test.data);
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.response?.data?.message ?? "Falha na conexão",
        latencyMs: 0,
      });
    } finally {
      if (createdId) {
        await api.delete(`/datasources/${createdId}`).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ["datasources"] });
      }
      setTesting(false);
    }
  }

  function handleTypeChange(type: typeof form.type) {
    setForm((f) => ({ ...f, type, port: DEFAULT_PORTS[type] }));
  }

  function resetForm() {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setTestResult(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-muted">
      <Topbar
        title="Fontes de dados"
        back={{ label: "Workspaces", to: "/" }}
        actions={
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/datasources`)}
            className="text-xs px-3 py-1.5 border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            + Adicionar
          </button>
        }
      />

      <div className="h-11 bg-background border-b border-border flex items-center px-5 gap-3">
        <span className="text-sm font-medium">ReportBuilder</span>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">{name}</span>
        <button
          onClick={logout}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sair
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium">Fontes de dados</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Conecte seus bancos de dados para criar relatórios.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            >
              + Adicionar
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-background border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-medium">Nova conexão</h3>
              <button
                onClick={resetForm}
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
                  placeholder="ex: production-db"
                  className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors bg-background"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Tipo
                </label>
                <div className="flex gap-2">
                  {DB_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() =>
                        handleTypeChange(t.value as typeof form.type)
                      }
                      className={`flex-1 py-2 border rounded-md text-sm transition-colors ${
                        form.type === t.value
                          ? "border-foreground bg-primary text-primary-foreground font-medium"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_100px] gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Host
                  </label>
                  <input
                    value={form.host}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, host: e.target.value }))
                    }
                    placeholder="localhost"
                    className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors bg-background"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Porta
                  </label>
                  <input
                    type="number"
                    value={form.port}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, port: Number(e.target.value) }))
                    }
                    className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors bg-background"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Nome do banco
                </label>
                <input
                  value={form.database}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, database: e.target.value }))
                  }
                  placeholder="meu_banco"
                  className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Usuário
                  </label>
                  <input
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                    placeholder="postgres"
                    className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors bg-background"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, password: e.target.value }))
                    }
                    placeholder="••••••••"
                    className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors bg-background"
                  />
                </div>
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
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      testResult.ok ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {testResult.ok
                    ? `Conexão bem-sucedida · ${testResult.latencyMs}ms`
                    : testResult.message}
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleTest}
                  disabled={
                    testing ||
                    !form.host ||
                    !form.database ||
                    !form.username ||
                    !form.password
                  }
                  className="flex-1 py-2 border border-border rounded-md text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {testing ? "Testando..." : "Testar conexão"}
                </button>
                <button
                  onClick={() => createMutation.mutate(form)}
                  disabled={
                    createMutation.isPending ||
                    !form.name ||
                    !form.host ||
                    !form.database ||
                    !form.username ||
                    !form.password
                  }
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {createMutation.isPending ? "Salvando..." : "Salvar conexão"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-background border border-border rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : datasources.length === 0 && !showForm ? (
          <div className="border border-border border-dashed rounded-lg p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma conexão ainda.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm underline underline-offset-2 text-foreground"
            >
              Adicionar primeira conexão
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {datasources.map((ds: Datasource) => (
              <div
                key={ds.id}
                className="bg-background border border-border rounded-lg px-4 py-3 flex items-center gap-3 group hover:border-foreground/30 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{ds.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {ds.host}:{ds.port} · {ds.database} · {ds.type}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/workspace/${ds.id}`)}
                  className="text-xs px-3 py-1.5 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground transition-colors opacity-0 group-hover:opacity-100"
                >
                  Abrir workspace
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remover "${ds.name}"?`))
                      deleteMutation.mutate(ds.id);
                  }}
                  className="text-xs text-muted-foreground hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 ml-1"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
