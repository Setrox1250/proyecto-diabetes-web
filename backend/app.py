import os
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Carga del bundle (una sola vez al iniciar el módulo) ────────────────────
ROOT_DIR = Path(__file__).resolve().parent
MODEL_PATH = ROOT_DIR / "model" / "diabetes_model_bundle.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"No se encontró el modelo en: {MODEL_PATH}")

_bundle = joblib.load(MODEL_PATH)

PIPELINE = _bundle["pipeline"]
THRESHOLD = float(_bundle["threshold"])
FEATURE_ORDER: list[str] = _bundle["feature_order"]
CATEGORY_MAPPINGS: dict[str, dict[str, int]] = _bundle["category_mappings"]
MODEL_METADATA: dict = _bundle.get("metadata", {})
MODEL_METRICS: dict = _bundle.get("metrics", {})

# ── Aplicación FastAPI ───────────────────────────────────────────────────────
app = FastAPI(
    title="Clasificador académico de diabetes",
    version=str(MODEL_METADATA.get("model_version", "1.0.0")),
    description=(
        "API académica para clasificar perfiles "
        "asociados a diabetes."
    ),
)


# ── Modelo de entrada ────────────────────────────────────────────────────────
class PredictionInput(BaseModel):
    gender: str
    age: float = Field(ge=0.08, le=80)
    hypertension: Literal[0, 1]
    heart_disease: Literal[0, 1]
    smoking_history: str
    bmi: float = Field(ge=10, le=100)
    HbA1c_level: float = Field(ge=3, le=10)
    blood_glucose_level: float = Field(ge=50, le=400)


# ── Función de codificación dinámica ─────────────────────────────────────────
def encode_category(field: str, value: str) -> int:
    mapping = CATEGORY_MAPPINGS.get(field)
    if mapping is None:
        raise ValueError(
            f"Campo categórico no reconocido: '{field}'. "
            f"Campos disponibles: {list(CATEGORY_MAPPINGS.keys())}"
        )
    code = mapping.get(value)
    if code is None:
        raise ValueError(
            f"Categoría no reconocida para {field}: '{value}'. "
            f"Valores permitidos: {list(mapping.keys())}"
        )
    return int(code)


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "application": "Proyecto Diabetes",
        "status": "running",
        "documentation": "/docs",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model_loaded": True,
        "threshold": round(THRESHOLD, 4),
        "model_version": MODEL_METADATA.get("model_version", "1.0.0"),
    }


@app.get("/api/model-info")
def model_info():
    return {
        "threshold": round(THRESHOLD, 4),
        "features": FEATURE_ORDER,
        "metrics": {k: round(v, 4) if isinstance(v, float) else v for k, v in MODEL_METRICS.items()},
        "metadata": MODEL_METADATA,
        "available_categories": CATEGORY_MAPPINGS,
    }


@app.post("/api/predict")
def predict(data: PredictionInput):
    try:
        gender_code = encode_category("gender", data.gender)
        smoking_code = encode_category("smoking_history", data.smoking_history)

        row = {
            "gender": gender_code,
            "age": data.age,
            "hypertension": data.hypertension,
            "heart_disease": data.heart_disease,
            "smoking_history": smoking_code,
            "bmi": data.bmi,
            "HbA1c_level": data.HbA1c_level,
            "blood_glucose_level": data.blood_glucose_level,
        }

        input_df = pd.DataFrame([row], columns=FEATURE_ORDER)

        probability = float(PIPELINE.predict_proba(input_df)[0, 1])
        prediction = int(probability >= THRESHOLD)

        classification = (
            "Perfil clasificado como positivo"
            if prediction == 1
            else "Perfil clasificado como negativo"
        )

        return {
            "prediction": prediction,
            "classification": classification,
            "probability": round(probability, 4),
            "probability_percentage": round(probability * 100, 2),
            "threshold": round(THRESHOLD, 4),
            "model_version": MODEL_METADATA.get("model_version", "1.0.0"),
            "disclaimer": (
                "Resultado académico. No constituye un diagnóstico médico."
            ),
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    except Exception as error:
        print("Error durante la predicción:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="No fue posible procesar la predicción.",
        ) from error


# ── CORS (necesario para el frontend en Vercel) ──────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)
