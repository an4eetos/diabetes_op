import uuid

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import Prediction
from app.domain.enums import AuditAction, PredictionRiskCategory
from app.ml.feature_builder import build_features
from app.ml.joblib_model_adapter import JoblibModelAdapter
from app.ml.mock_model_adapter import MockModelAdapter
from app.ml.model_adapter import ModelAdapter
from app.ml.onnx_model_adapter import OnnxModelAdapter
from app.ml.shap_adapter import ShapAdapter
from app.repositories.prediction_repository import PredictionRepository
from app.schemas.prediction import ModelStatus, PredictionRead, PredictionRequest
from app.schemas.shap import ShapFactor
from app.services.audit_service import AuditService
from app.services.patient_service import PatientService
from app.services.recommendation_service import RecommendationService
from app.services.screening_service import ScreeningService


def risk_category_from_probability(probability: float) -> PredictionRiskCategory:
    if probability < 0.20:
        return PredictionRiskCategory.LOW
    if probability <= 0.60:
        return PredictionRiskCategory.BORDERLINE
    return PredictionRiskCategory.HIGH


class PredictionService:
    def __init__(self, db: Session, model_adapter: ModelAdapter | None = None):
        self.db = db
        self.settings = get_settings()
        self.model_adapter = model_adapter or self._build_model_adapter()
        self.shap_adapter = ShapAdapter(self.model_adapter)
        self.prediction_repository = PredictionRepository(db)
        self.recommendation_service = RecommendationService()

    def create_prediction(self, payload: PredictionRequest, actor_user_id: uuid.UUID | None) -> PredictionRead:
        patient = PatientService(self.db).get_or_create_by_external_id(payload.patient_id, created_by_id=actor_user_id)
        screening = ScreeningService(self.db).create(patient.id, actor_user_id, payload.screening_data)
        if screening is None:
            raise RuntimeError("screening_creation_failed")

        features = build_features(payload.screening_data)
        feature_vector = self.model_adapter.build_feature_vector(features)
        probability = self.model_adapter.predict_proba(feature_vector)
        category = risk_category_from_probability(probability)
        shap_factors = self.shap_adapter.explain(feature_vector, payload.language)
        recommendation_code = self.recommendation_service.code_for_prediction_category(category)
        recommendation_text = self.recommendation_service.localized_text(recommendation_code, payload.language)

        prediction = Prediction(
            screening_id=screening.id,
            probability=probability,
            risk_category=category.value,
            recommendation_code=recommendation_code,
            shap_factors_json=[factor.model_dump(mode="json") for factor in shap_factors],
            model_version=self.model_adapter.model_version,
            model_type=self.model_adapter.model_type,
        )
        self.prediction_repository.add(prediction)

        AuditService(self.db).log(
            actor_user_id=actor_user_id,
            action=AuditAction.PREDICTION_CREATED.value,
            entity_type="prediction",
            entity_id=str(prediction.id),
            metadata={
                "prediction_id": str(prediction.id),
                "screening_id": str(screening.id),
                "risk_category": category.value,
                "model_version": self.model_adapter.model_version,
                "model_type": self.model_adapter.model_type,
                "recommendation_code": recommendation_code,
            },
        )

        self.db.commit()
        self.db.refresh(prediction)
        return self._to_read(prediction, shap_factors, recommendation_text)

    def get_prediction(self, prediction_id: uuid.UUID, language: str = "ru") -> PredictionRead | None:
        prediction = self.prediction_repository.get(prediction_id)
        if not prediction:
            return None
        factors = [ShapFactor.model_validate(item) for item in prediction.shap_factors_json]
        recommendation_text = self.recommendation_service.localized_text(prediction.recommendation_code, language)
        return self._to_read(prediction, factors, recommendation_text)

    def model_status(self) -> ModelStatus:
        return ModelStatus(**self.model_adapter.status())

    def _to_read(self, prediction: Prediction, shap_factors: list[ShapFactor], recommendation_text: str) -> PredictionRead:
        category = PredictionRiskCategory(prediction.risk_category)
        return PredictionRead(
            prediction_id=prediction.id,
            screening_id=prediction.screening_id,
            probability=prediction.probability,
            probability_percent=round(prediction.probability * 100, 1),
            risk_category=category,
            shap_factors=shap_factors[:3],
            recommendation_code=prediction.recommendation_code,
            recommendation_text=recommendation_text,
            model_version=prediction.model_version,
            model_type=prediction.model_type,
            created_at=prediction.created_at,
        )

    def _build_model_adapter(self) -> ModelAdapter:
        model_type = self.settings.osteorisk_model_type.lower()
        if model_type == "joblib":
            return JoblibModelAdapter(self.settings.osteorisk_model_path, model_version=self.settings.osteorisk_model_version)
        if model_type == "onnx":
            return OnnxModelAdapter(self.settings.osteorisk_model_path, model_version=self.settings.osteorisk_model_version)
        return MockModelAdapter(model_version=self.settings.osteorisk_model_version)
