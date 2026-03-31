import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { Topbar } from "../components/layout/Topbar";

interface SchemaColumn {
  name: string;
  type: string;
}

interface BusinessContext {
  id: string;
  tableName: string;
  description: string;
  columnDescriptions: Record<string, string> | null;
}

export function ContextPage() {
  const { workspaceId, datasourceId } = useParams<{
    workspaceId: string;
    datasourceId: string;
  }>();
  const queryClient = useQueryClient();
  const [suggesting, setSuggesting] = useState(false);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { description: string; columns: Record<string, string> }>
  >({});

  const { data: schema = {}, isLoading: schemaLoading } = useQuery({
    queryKey: ["schema", datasourceId],
    queryFn: () =>
      api.get(`/datasources/${datasourceId}/schema`).then((r) => r.data),
  });

  const { data: contexts = [] } = useQuery({
    queryKey: ["contexts", datasourceId],
    queryFn: () => api.get(`/ai/context/${datasourceId}`).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: {
      tableName: string;
      description: string;
      columnDescriptions: Record<string, string>;
      datasourceId: string;
    }) => api.post("/ai/context", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contexts", datasourceId] });
      setEditingTable(null);
    },
  });

  async function handleSuggest() {
    setSuggesting(true);
    try {
      const { data } = await api.get(`/ai/context/${datasourceId}/suggest`);
      const newDrafts: typeof drafts = {};
      Object.entries(data).forEach(([table, desc]) => {
        newDrafts[table] = {
          description: desc as string,
          columns: drafts[table]?.columns ?? {},
        };
      });
      setDrafts((prev) => ({ ...prev, ...newDrafts }));
    } finally {
      setSuggesting(false);
    }
  }

  function getContext(tableName: string): BusinessContext | undefined {
    return contexts.find((c: BusinessContext) => c.tableName === tableName);
  }

  function getDraft(tableName: string) {
    const ctx = getContext(tableName);
    return (
      drafts[tableName] ?? {
        description: ctx?.description ?? "",
        columns: ctx?.columnDescriptions ?? {},
      }
    );
  }

  function handleSave(tableName: string) {
    const draft = getDraft(tableName);
    saveMutation.mutate({
      tableName,
      description: draft.description,
      columnDescriptions: draft.columns,
      datasourceId: datasourceId!,
    });
  }

  const tables = Object.keys(schema);

  return (
    <div className="min-h-screen bg-muted">
      <Topbar
        title="Contexto de negócio"
        back={{
          label: "Chat",
          to: `/workspaces/${workspaceId}/chat/${datasourceId}`,
        }}
        actions={
          <button
            onClick={handleSuggest}
            disabled={suggesting || schemaLoading}
            className="text-xs px-3 py-1.5 border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40"
          >
            {suggesting ? "Sugerindo..." : "Sugerir com IA"}
          </button>
        }
      />

      <div className="max-w-3xl mx-auto px-5 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-medium">Contexto de negócio</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Descreva o que cada tabela representa no seu negócio. A IA usa isso
            para entender pedidos em linguagem natural.
          </p>
        </div>

        {schemaLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-background border border-border rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tables.map((table) => {
              const ctx = getContext(table);
              const draft = getDraft(table);
              const isEditing = editingTable === table;
              const cols = (schema[table] as SchemaColumn[]) ?? [];

              return (
                <div
                  key={table}
                  className="bg-background border border-border rounded-lg overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setEditingTable(isEditing ? null : table)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium font-mono">
                          {table}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {cols.length} colunas
                        </span>
                        {ctx && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded">
                            configurado
                          </span>
                        )}
                        {drafts[table] && !ctx && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded">
                            sugerido
                          </span>
                        )}
                      </div>
                      {draft.description && !isEditing && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {draft.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {isEditing ? "▾" : "▸"}
                    </span>
                  </div>

                  {isEditing && (
                    <div className="px-4 pb-4 border-t border-border pt-4 flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                          O que esta tabela representa?
                        </label>
                        <textarea
                          value={draft.description}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [table]: {
                                ...getDraft(table),
                                description: e.target.value,
                              },
                            }))
                          }
                          placeholder={`ex: Guarda os pedidos dos clientes. status='paid' significa pedido confirmado.`}
                          rows={2}
                          className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors resize-none bg-background"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                          Colunas com significado especial{" "}
                          <span className="normal-case font-normal">
                            (opcional)
                          </span>
                        </label>
                        {cols.slice(0, 8).map((col) => (
                          <div
                            key={col.name}
                            className="flex items-center gap-2"
                          >
                            <span className="text-xs font-mono text-muted-foreground w-32 flex-shrink-0 truncate">
                              {col.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground w-16 flex-shrink-0">
                              {col.type
                                .replace("character varying", "varchar")
                                .substring(0, 10)}
                            </span>
                            <input
                              value={draft.columns[col.name] ?? ""}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [table]: {
                                    ...getDraft(table),
                                    columns: {
                                      ...getDraft(table).columns,
                                      [col.name]: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder={`ex: valor em R$, status do pedido...`}
                              className="flex-1 px-2 py-1 border border-border rounded text-xs outline-none focus:border-foreground transition-colors bg-background"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(table)}
                          disabled={
                            saveMutation.isPending || !draft.description.trim()
                          }
                          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium disabled:opacity-40"
                        >
                          {saveMutation.isPending ? "Salvando..." : "Salvar"}
                        </button>
                        <button
                          onClick={() => setEditingTable(null)}
                          className="px-4 py-1.5 border border-border rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
