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
  PieChart,
  Pie,
  Cell,
} from "recharts";

type ChartType = "bar" | "line" | "pie" | "auto";

interface DataChartProps {
  rows: Record<string, any>[];
  type?: ChartType;
  height?: number;
}

function detectChartType(
  rows: Record<string, any>[],
  labelKey: string,
): "line" | "bar" {
  if (!labelKey) return "bar";
  const lk = labelKey.toLowerCase();
  if (
    lk.includes("date") ||
    lk.includes("month") ||
    lk.includes("mes") ||
    lk.includes("week") ||
    lk.includes("year") ||
    lk.includes("ano")
  )
    return "line";
  return "bar";
}

const COLORS = [
  "#1D9E75",
  "#378ADD",
  "#BA7517",
  "#D85A30",
  "#7F77DD",
  "#1D9E75",
];

export function DataChart({
  rows,
  type = "auto",
  height = 200,
}: DataChartProps) {
  if (!rows || rows.length === 0) return null;

  const keys = Object.keys(rows[0]);
  const numericKey =
    keys.find((k) => typeof rows[0][k] === "number") ?? keys[1];
  const labelKey = keys.find((k) => typeof rows[0][k] === "string") ?? keys[0];

  if (!numericKey) return null;

  const data = rows.slice(0, 24).map((r) => ({
    name: String(r[labelKey] ?? "").substring(0, 14),
    value: Number(r[numericKey] ?? 0),
  }));

  const resolvedType = type === "auto" ? detectChartType(rows, labelKey) : type;

  const commonProps = {
    data,
    margin: { top: 4, right: 4, left: -16, bottom: 0 },
  };

  const axisProps = {
    tick: { fontSize: 10, fill: "var(--color-text-tertiary)" },
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {resolvedType === "line" ? (
          <LineChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-tertiary)"
            />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: 6,
                background: "var(--color-background-primary)",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1D9E75"
              strokeWidth={1.5}
              dot={{ r: 2, fill: "#1D9E75" }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        ) : resolvedType === "pie" ? (
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name }) => name}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border-tertiary)"
            />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: 6,
                background: "var(--color-background-primary)",
              }}
            />
            <Bar dataKey="value" fill="#1D9E75" radius={[3, 3, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
