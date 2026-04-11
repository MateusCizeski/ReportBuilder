import Editor from "@monaco-editor/react";
import { useRef } from "react";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  schema?: Record<string, { name: string; type: string }[]>;
}

export function SqlEditor({ value, onChange, schema = {} }: SqlEditorProps) {
  const editorRef = useRef<any>(null);

  function handleMount(editor: any, monaco: any) {
    editorRef.current = editor;

    monaco.languages.registerCompletionItemProvider("sql", {
      provideCompletionItems: () => {
        const suggestions: any[] = [];

        const keywords = [
          "SELECT",
          "FROM",
          "WHERE",
          "JOIN",
          "LEFT JOIN",
          "INNER JOIN",
          "ORDER BY",
          "GROUP BY",
          "HAVING",
          "LIMIT",
          "OFFSET",
          "AS",
          "ON",
          "AND",
          "OR",
          "NOT",
          "IN",
          "LIKE",
          "IS NULL",
          "IS NOT NULL",
          "COUNT",
          "SUM",
          "AVG",
          "MAX",
          "MIN",
          "DISTINCT",
          "ASC",
          "DESC",
        ];

        keywords.forEach((kw) => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
          });
        });

        Object.entries(schema).forEach(([table, columns]) => {
          suggestions.push({
            label: table,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: table,
            detail: `tabela · ${columns.length} colunas`,
          });
          columns.forEach((col) => {
            suggestions.push({
              label: col.name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: col.name,
              detail: `${table} · ${col.type}`,
            });
          });
        });

        return { suggestions };
      },
    });
  }

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language="sql"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleMount}
        theme="vs"
        options={{
          fontSize: 13,
          fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          renderLineHighlight: "line",
          tabSize: 2,
          wordWrap: "on",
          suggest: { showKeywords: true },
          padding: { top: 12, bottom: 12 },
          scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
        }}
      />
    </div>
  );
}
