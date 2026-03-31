import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { Topbar } from "../components/layout/Topbar";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "query" | "question" | "error" | "text";
  sql?: string;
  rows?: Record<string, any>[];
  rowCount?: number;
  executionMs?: number;
  explanation?: string;
}

function ResultChart({ rows }: { rows: Record<string, any>[] }) {
  if (!rows || rows.length === 0) return null;
  const keys = Object.keys(rows[0]);
  const numericKeys = keys.filter((k) => typeof rows[0][k] === "number");
  const labelKey = keys.find((k) => typeof rows[0][k] === "string") ?? keys[0];
  const valueKey = numericKeys[0];
  if (!valueKey) return null;

  const isTimeSeries =
    labelKey.toLowerCase().includes("date") ||
    labelKey.toLowerCase().includes("month") ||
    labelKey.toLowerCase().includes("mes");

  const data = rows.slice(0, 20).map((r) => ({
    name: String(r[labelKey]).substring(0, 12),
    value: Number(r[valueKey]),
  }));

  return (
    <div className="mt-3 h-48">
      <ResponsiveContainer width="100%" height="100%">
        {isTimeSeries ? (
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-tertiary)"
            />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1D9E75"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-tertiary)"
            />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#1D9E75" radius={[3, 3, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function ResultTable({ rows }: { rows: Record<string, any>[] }) {
  if (!rows || rows.length === 0) return null;
  const columns = Object.keys(rows[0]);
  return (
    <div className="mt-3 overflow-auto max-h-48 rounded-md border border-border">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="text-left px-3 py-2 font-medium text-muted-foreground bg-muted border-b border-border whitespace-nowrap text-[11px] uppercase tracking-wide"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((row, i) => (
            <tr
              key={i}
              className="border-b border-border last:border-0 hover:bg-muted/50"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-3 py-1.5 whitespace-nowrap text-foreground"
                >
                  {row[col] === null ? (
                    <span className="text-muted-foreground italic">null</span>
                  ) : (
                    String(row[col])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MessageBubble({
  message,
  onSqlToggle,
  showSql,
}: {
  message: Message;
  onSqlToggle: () => void;
  showSql: boolean;
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
          <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[11px] font-medium text-muted-foreground">
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
          {message.explanation && (
            <p className="text-sm text-foreground mb-3">
              {message.explanation}
            </p>
          )}

          {message.type === "question" && (
            <p className="text-sm text-foreground">{message.content}</p>
          )}

          {message.type === "error" && (
            <p className="text-sm text-red-600">{message.content}</p>
          )}

          {message.type === "text" && (
            <p className="text-sm text-foreground">{message.content}</p>
          )}

          {message.rows && message.rows.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {message.rowCount}{" "}
                  {message.rowCount === 1 ? "resultado" : "resultados"}
                </span>
              </div>
              <ResultChart rows={message.rows} />
              <ResultTable rows={message.rows} />
            </>
          )}

          {message.rows && message.rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </p>
          )}

          {message.sql && (
            <div className="mt-3 pt-3 border-t border-border">
              <button
                onClick={onSqlToggle}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showSql ? "Ocultar SQL" : "Ver SQL gerado"}
              </button>
              {showSql && (
                <pre className="mt-2 p-3 bg-muted rounded-md text-xs font-mono text-foreground overflow-auto">
                  {message.sql}
                </pre>
              )}
            </div>
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sqlVisible, setSqlVisible] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: datasource } = useQuery({
    queryKey: ["datasource", datasourceId],
    queryFn: () => api.get(`/datasources/${datasourceId}`).then((r) => r.data),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            err.response?.data?.message ?? "Erro ao processar sua mensagem.",
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const suggestions = [
    "Quantos registros tem no banco?",
    "Mostre os 10 primeiros registros",
    "Qual o total por mês?",
    "Quais são as tabelas disponíveis?",
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
          <button
            onClick={() =>
              window.open(
                `/workspaces/${workspaceId}/context/${datasourceId}`,
                "_self",
              )
            }
            className="text-xs px-3 py-1.5 border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Configurar contexto
          </button>
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
                  Descreva em português o que você quer ver. A IA vai buscar os
                  dados e montar o relatório.
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
              showSql={sqlVisible[msg.id] ?? false}
              onSqlToggle={() =>
                setSqlVisible((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))
              }
            />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
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
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 border border-border rounded-xl overflow-hidden focus-within:border-foreground transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
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
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40 transition-opacity flex-shrink-0"
            >
              Enviar
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
