from app.core.config import get_settings
from app.risk_engine import RiskEngine, RiskInputData
from app.schemas.risk import RiskInput, RiskResult, RiskRuleContribution


class RiskService:
    def __init__(self) -> None:
        self.engine = RiskEngine(get_settings().risk_rules_path)

    def calculate(self, payload: RiskInput) -> RiskResult:
        output = self.engine.calculate(RiskInputData(**payload.model_dump()))
        return RiskResult(
            total_risk=output.total_risk,
            vascular_risk=output.vascular_risk,
            skeletal_risk=output.skeletal_risk,
            category=output.category,
            algorithm_version=output.algorithm_version,
            algorithm_disclaimer=output.algorithm_disclaimer,
            contributions=[
                RiskRuleContribution(
                    risk_type=item.risk_type,
                    field=item.field,
                    points=item.points,
                    reason=item.reason,
                )
                for item in output.contributions
            ],
        )

