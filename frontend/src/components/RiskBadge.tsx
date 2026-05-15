import { useTranslation } from "react-i18next";

import type { RiskCategory } from "../types";

const classByCategory: Record<RiskCategory, string> = {
  low: "bg-green-100 text-green-800 ring-green-200",
  medium: "bg-yellow-100 text-yellow-900 ring-yellow-200",
  high: "bg-red-100 text-red-800 ring-red-200"
};

export default function RiskBadge({ category }: { category: RiskCategory }) {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase ring-1 ${classByCategory[category]}`}
    >
      {t(`risk.categories.${category}`)}
    </span>
  );
}
