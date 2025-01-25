//app/dashboard/components/overview.jsx
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function Overview({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-sm text-muted-foreground">
        No overview data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="average"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ strokeWidth: 2 }}
          name="Average Grade"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
