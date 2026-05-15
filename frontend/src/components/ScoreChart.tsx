import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";

interface ScoreChartProps {
  total: number;
  vascular: number;
  skeletal: number;
}

export default function ScoreChart({ total, vascular, skeletal }: ScoreChartProps) {
  const { t } = useTranslation();
  const data = [
    { name: t("risk.total"), score: total, fill: "#0f766e" },
    { name: t("risk.vascular"), score: vascular, fill: "#2563eb" },
    { name: t("risk.skeletal"), score: skeletal, fill: "#7c3aed" }
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => [t("common.scoreOutOf100", { score: value }), t("common.status")]} />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
