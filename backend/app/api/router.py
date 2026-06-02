from fastapi import APIRouter

from app.api.v1 import auth, health, model, patients, pdf, predictions, risk, screenings, users


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(screenings.router, prefix="/screenings", tags=["screenings"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(model.router, prefix="/model", tags=["model"])
api_router.include_router(risk.router, prefix="/risk", tags=["risk"])
api_router.include_router(pdf.router, prefix="/pdf", tags=["pdf"])
