import type { RiskCategory } from "../types";
import { useTranslation } from "react-i18next";

const categories: RiskCategory[] = ["low", "medium", "high"];
const colorClass: Record<RiskCategory, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-400",
  high: "bg-red-500"
};

export default function TrafficLight({ category }: { category: RiskCategory }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2" aria-label={t("risk.category")}>
      {categories.map((item) => (
        <span
          key={item}
          className={[
            "h-5 w-5 rounded-full border border-white shadow-sm ring-1 ring-slate-300",
            item === category ? colorClass[item] : "bg-slate-200"
          ].join(" ")}
        />
      ))}
    </div>
  );
}
