import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { Topbar } from "../components/layout/Topbar";
import { Button } from "../components/ui/Button";
import { QueryResult } from "../components/data/QueryResult";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "query" | "question" | "error" | "text";
  sql?: string;
  rows?: Record<string, unknown>[];
  rowCount?: number;
  executionMs?: number;
  explanation?: string;
}

interface SaveReportModalProps {
  message: Message;
  onSave: (name: string) => void;
  onClose: () => void;
  saving: boolean;
}

function SaveReportModal({ onSave, onClose, saving }: SaveReportModalProps) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-lg">
        <div>
          <h3 className="text-sm font-medium">Salvar relatório</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Dê um nome para este relatório para acessá-lo depois.
          </p>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex: Vendas de março, Top clientes..."
          className="px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-foreground transition-colors bg-background"
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => onSave(name)}
            loading={saving}
            disabled={!name.trim()}
            className="flex-1"
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onSaveClick,
}: {
  message: Message;
  onSaveClick?: () => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-md px-4 py-2.5 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-medium text-muted-foreground">
            IA
          </div>
          <span className="text-xs text-muted-foreground">
            ReportBuilder AI
          </span>
          {message.executionMs !== undefined && (
            <span className="text-xs text-muted-foreground">
              · {message.executionMs}ms
            </span>
          )}
        </div>

        <div className="bg-background border border-border rounded-2xl rounded-tl-sm p-4">
          {message.type === "error" && (
            <p className="text-sm text-red-600">{message.content}</p>
          )}
          {(message.type === "question" || message.type === "text") && (
            <p className="text-sm text-foreground">{message.content}</p>
          )}
          {message.explanation && (
            <p className="text-sm text-foreground mb-3">
              {message.explanation}
            </p>
          )}
          {message.rows !== undefined && (
            <QueryResult
              rows={message.rows}
              rowCount={message.rowCount ?? 0}
              executionMs={message.executionMs}
              sql={message.sql}
              onSave={onSaveClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { workspaceId, datasourceId } = useParams<{
    workspaceId: string;
    datasourceId: string;
  }>();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingMessage, setSavingMessage] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: datasource } = useQuery({
    queryKey: ["datasource", datasourceId],
    queryFn: () => api.get(`/datasources/${datasourceId}`).then((r) => r.data),
  });

  const saveReportMutation = useMutation({
    mutationFn: ({ name, message }: { name: string; message: Message }) =>
      api.post("/reports", {
        name,
        sql: message.sql,
        datasourceId,
        workspaceId,
        rows: message.rows,
        rowCount: message.rowCount,
        executionMs: message.executionMs,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", workspaceId] });
      setSavingMessage(null);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const { data } = await api.post("/ai/chat", {
        datasourceId,
        message: input,
        history,
      });
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.explanation ?? data.content ?? "",
        type: data.type,
        sql: data.sql,
        rows: data.rows,
        rowCount: data.rowCount,
        executionMs: data.executionMs,
        explanation: data.explanation,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMessage =
        (err as any)?.response?.data?.message ?? "Erro ao processar.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: errorMessage,
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "Quantos registros existem no banco?",
    "Mostre os 10 primeiros registros",
    "Qual o total agrupado por mês?",
    "Quais tabelas estão disponíveis?",
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Topbar
        title={datasource?.name ?? "..."}
        subtitle={datasource?.type}
        back={{
          label: "Fontes de dados",
          to: `/workspaces/${workspaceId}/datasources`,
        }}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              (window.location.href = `/workspaces/${workspaceId}/context/${datasourceId}`)
            }
          >
            Configurar contexto
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-3 text-lg font-medium text-muted-foreground">
                  IA
                </div>
                <h3 className="text-base font-medium mb-1">
                  Pergunte sobre seus dados
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Descreva em português o que quer ver. A IA busca os dados e
                  monta o relatório.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left px-3 py-2.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors bg-background"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onSaveClick={
                msg.rows?.length ? () => setSavingMessage(msg) : undefined
              }
            />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  Analisando...
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border p-4 bg-background flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <div className="flex-1 border border-border rounded-xl overflow-hidden focus-within:border-foreground transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Descreva o que você quer ver nos dados..."
              rows={1}
              className="w-full px-4 py-3 text-sm outline-none resize-none bg-background text-foreground placeholder:text-muted-foreground"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-xl flex-shrink-0"
          >
            Enviar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>

      {savingMessage && (
        <SaveReportModal
          message={savingMessage}
          onSave={(name) =>
            saveReportMutation.mutate({ name, message: savingMessage })
          }
          onClose={() => setSavingMessage(null)}
          saving={saveReportMutation.isPending}
        />
      )}
    </div>
  );
}
