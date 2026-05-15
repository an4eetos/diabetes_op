from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.db.models import User
from app.schemas.risk import RiskInput, RiskResult
from app.services.risk_service import RiskService


router = APIRouter()


@router.post("/calculate", response_model=RiskResult)
def calculate_risk(payload: RiskInput, _: User = Depends(get_current_user)) -> RiskResult:
    return RiskService().calculate(payload)

