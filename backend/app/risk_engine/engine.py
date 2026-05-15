from __future__ import annotations

from dataclasses import dataclass, field
import json
from pathlib import Path
from typing import Any

from app.domain.enums import RiskCategory, Sex


@dataclass(frozen=True)
class RiskInputData:
    age: int
    sex: Sex | str
    diabetes_duration_years: float
    hba1c_percent: float
    previous_low_energy_fractures: bool = False
    previous_myocardial_infarction: bool = False
    previous_stroke: bool = False
    bmi: float | None = None
    egfr: float | None = None
    creatinine_umol_l: float | None = None
    bone_metabolism_markers: dict[str, str | float | int | bool | None] | None = None


@dataclass(frozen=True)
class RuleContribution:
    risk_type: str
    field: str
    points: int
    reason: str


@dataclass(frozen=True)
class RiskOutput:
    total_risk: int
    vascular_risk: int
    skeletal_risk: int
    category: RiskCategory
    algorithm_version: str
    algorithm_disclaimer: str
    contributions: list[RuleContribution] = field(default_factory=list)


class RiskEngine:
    """Configurable placeholder risk engine.

    The implementation is deliberately transparent and rule-based for MVP validation.
    The shipped rule set is not a clinical model and must be replaced or approved by
    qualified clinical governance before real-world medical use.
    """

    def __init__(self, rules_path: Path):
        self.rules_path = rules_path
        self.config = self._load_config(rules_path)

    def calculate(self, data: RiskInputData) -> RiskOutput:
        vascular, vascular_contributions = self._score_group("vascular", data)
        skeletal, skeletal_contributions = self._score_group("skeletal", data)
        total = self._bounded_score(round((vascular + skeletal) / 2))
        category = self._category(total)

        return RiskOutput(
            total_risk=total,
            vascular_risk=vascular,
            skeletal_risk=skeletal,
            category=category,
            algorithm_version=self.config["version"],
            algorithm_disclaimer=self.config["disclaimer"],
            contributions=[*vascular_contributions, *skeletal_contributions],
        )

    def _score_group(self, risk_type: str, data: RiskInputData) -> tuple[int, list[RuleContribution]]:
        score = 0
        contributions: list[RuleContribution] = []
        for rule in self.config["rules"].get(risk_type, []):
            if self._matches(rule, data):
                points = int(rule["points"])
                score += points
                contributions.append(
                    RuleContribution(
                        risk_type=risk_type,
                        field=rule["field"],
                        points=points,
                        reason=rule.get("reason", "Configured MVP rule"),
                    )
                )
        return self._bounded_score(score), contributions

    def _matches(self, rule: dict[str, Any], data: RiskInputData) -> bool:
        field_name = rule["field"]
        actual = getattr(data, field_name, None)
        op = rule["op"]
        expected = rule.get("value")

        if actual is None:
            return False

        if op == "eq":
            return actual == expected
        if op == "gte":
            return actual >= expected
        if op == "gt":
            return actual > expected
        if op == "lte":
            return actual <= expected
        if op == "lt":
            return actual < expected
        if op == "exists":
            return actual is not None

        raise ValueError(f"Unsupported risk rule operator: {op}")

    def _category(self, score: int) -> RiskCategory:
        thresholds = self.config["thresholds"]
        if score <= int(thresholds["low_max"]):
            return RiskCategory.LOW
        if score <= int(thresholds["medium_max"]):
            return RiskCategory.MEDIUM
        return RiskCategory.HIGH

    @staticmethod
    def _bounded_score(score: int) -> int:
        return max(0, min(100, score))

    @staticmethod
    def _load_config(path: Path) -> dict[str, Any]:
        with path.open(encoding="utf-8") as rules_file:
            config = json.load(rules_file)

        required_top_level = {"version", "disclaimer", "thresholds", "rules"}
        missing = required_top_level.difference(config)
        if missing:
            raise ValueError(f"Risk rules config is missing keys: {sorted(missing)}")
        return config

