import { useState } from "react";

interface Column {
  name: string;
  type: string;
}

interface SchemaExplorerProps {
  schema: Record<string, Column[]>;
  onColumnClick: (table: string, column: string) => void;
  isLoading: boolean;
}

export function SchemaExplorer({
  schema,
  onColumnClick,
  isLoading,
}: SchemaExplorerProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const tables = Object.keys(schema).filter((t) =>
    t.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleTable(table: string) {
    setExpanded((e) => ({ ...e, [table]: !e[table] }));
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-border">
          <div className="h-7 bg-muted rounded-md animate-pulse" />
        </div>
        <div className="p-3 flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-6 bg-muted rounded animate-pulse"
              style={{ width: `${70 + i * 5}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-2.5 border-b border-border flex-shrink-0">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tabela..."
          className="w-full px-2.5 py-1.5 bg-muted border border-border rounded-md text-xs outline-none focus:border-foreground transition-colors"
        />
      </div>

      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {tables.length} tabelas
        </span>
      </div>

      <div className="overflow-y-auto flex-1">
        {tables.length === 0 ? (
          <p className="text-xs text-muted-foreground px-3 py-2">
            Nenhuma tabela encontrada.
          </p>
        ) : (
          tables.map((table) => (
            <div key={table}>
              <button
                onClick={() => toggleTable(table)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted transition-colors text-left"
              >
                <span className="text-[10px] text-muted-foreground w-3 flex-shrink-0">
                  {expanded[table] ? "▾" : "▸"}
                </span>
                <span className="text-xs font-medium text-foreground truncate">
                  {table}
                </span>
                <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0">
                  {schema[table].length}
                </span>
              </button>

              {expanded[table] && (
                <div>
                  {schema[table].map((col) => (
                    <button
                      key={col.name}
                      onClick={() => onColumnClick(table, col.name)}
                      className="w-full flex items-center gap-2 pl-7 pr-3 py-1 hover:bg-muted transition-colors text-left group"
                    >
                      <span className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">
                        {col.name}
                      </span>
                      <span className="ml-auto text-[10px] text-muted-foreground flex-shrink-0 font-mono">
                        {col.type
                          .replace("character varying", "varchar")
                          .replace("timestamp without time zone", "timestamp")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
