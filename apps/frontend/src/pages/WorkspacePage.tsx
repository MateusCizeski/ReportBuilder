import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { SchemaExplorer } from "../components/workspace/SchemaExplorer";
import { SqlEditor } from "../components/workspace/SqlEditor";
import { ResultPanel } from "../components/workspace/ResultPanel";
import { useAuthStore } from "../store/auth.store";

type Tab = "sql" | "ai";

interface QueryResult {
  rows: Record<string, any>[];
  rowCount: number;
  executionMs: number;
  sql: string;
}

export function WorkspacePage() {
  const { datasourceId } = useParams<{ datasourceId: string }>();
  const navigate = useNavigate();
  const { name, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("sql");
  const [sql, setSql] = useState("SELECT * FROM ");
  const [aiInput, setAiInput] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const { data: schema = {}, isLoading: schemaLoading } = useQuery({
    queryKey: ["schema", datasourceId],
    queryFn: () =>
      api.get(`/datasources/${datasourceId}/schema`).then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

  const { data: datasource } = useQuery({
    queryKey: ["datasource", datasourceId],
    queryFn: () => api.get(`/datasources/${datasourceId}`).then((r) => r.data),
  });

  const executeMutation = useMutation({
    mutationFn: (sqlToRun: string) =>
      api
        .post("/queries/execute", { datasourceId, sql: sqlToRun })
        .then((r) => r.data),
    onSuccess: (data) => {
      setResult(data);
      setQueryError(null);
    },
    onError: (err: any) => {
      setQueryError(err.response?.data?.message ?? "Erro ao executar query");
      setResult(null);
    },
  });

  const handleColumnClick = useCallback((table: string, column: string) => {
    setSql((prev) => {
      const insertion = prev.trim().toUpperCase().includes("SELECT *")
        ? prev.replace("*", `${table}.${column}`)
        : prev + `${table}.${column}`;
      return insertion;
    });
    setActiveTab("sql");
  }, []);

  function handleExecute() {
    if (!sql.trim()) return;
    executeMutation.mutate(sql);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleExecute();
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <div className="h-11 flex items-center px-4 gap-3 border-b border-border flex-shrink-0">
        <button
          onClick={() => navigate("/datasources")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-sm font-medium">
            {datasource?.name ?? "..."}
          </span>
          <span className="text-xs text-muted-foreground">
            {datasource?.type}
          </span>
        </div>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">{name}</span>
        <button
          onClick={logout}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sair
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-52 flex-shrink-0 border-r border-border overflow-hidden flex flex-col bg-background">
          <SchemaExplorer
            schema={schema}
            onColumnClick={handleColumnClick}
            isLoading={schemaLoading}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="flex flex-col border-b border-border"
            style={{ height: "50%" }}
          >
            <div className="flex items-center border-b border-border px-4 h-9 gap-1 flex-shrink-0">
              <button
                onClick={() => setActiveTab("sql")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "sql"
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                SQL
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === "ai"
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                IA
                <span className="text-[10px] px-1.5 py-0.5 bg-background border border-border rounded text-muted-foreground">
                  Gemini
                </span>
              </button>
              <div className="flex-1" />
              <span className="text-[10px] text-muted-foreground">
                Ctrl+Enter para executar
              </span>
            </div>

            {activeTab === "sql" && (
              <div className="flex-1 overflow-hidden" onKeyDown={handleKeyDown}>
                <SqlEditor value={sql} onChange={setSql} schema={schema} />
              </div>
            )}

            {activeTab === "ai" && (
              <div className="flex-1 flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">
                    Descreva o que você quer ver nos dados
                  </label>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="ex: mostrar total de vendas por mês nos últimos 3 meses..."
                    rows={3}
                    className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors resize-none"
                  />
                </div>
                <button
                  disabled
                  className="self-start px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium opacity-50 cursor-not-allowed"
                >
                  Gerar SQL — em breve
                </button>
                <p className="text-xs text-muted-foreground">
                  A feature de IA com Gemini Flash será implementada na Semana
                  5.
                </p>
              </div>
            )}
          </div>

          <div className="h-10 flex items-center px-4 gap-2 border-b border-border flex-shrink-0">
            <button
              onClick={handleExecute}
              disabled={executeMutation.isPending || !sql.trim()}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium disabled:opacity-40 transition-opacity"
            >
              {executeMutation.isPending ? "Executando..." : "Executar"}
            </button>
            <button
              onClick={() => {
                setSql("");
                setResult(null);
                setQueryError(null);
              }}
              className="px-3 py-1.5 border border-border rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpar
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <ResultPanel
              result={result}
              isLoading={executeMutation.isPending}
              error={queryError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
