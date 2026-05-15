import type { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "green" | "yellow" | "red" | "blue" | "violet";
}

const toneClass = {
  neutral: "text-slate-950",
  green: "text-green-700",
  yellow: "text-yellow-700",
  red: "text-red-700",
  blue: "text-blue-700",
  violet: "text-violet-700"
};

export default function StatTile({ label, value, tone = "neutral" }: StatTileProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium leading-5 text-slate-500">{label}</p>
      <p className={`mt-2 break-words text-3xl font-bold leading-none ${toneClass[tone]}`}>{value}</p>
    </div>
  );
}

