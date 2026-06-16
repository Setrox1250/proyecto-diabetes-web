from pathlib import Path

import joblib
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent

MODEL_PATH = ROOT_DIR / "model" / "diabetes_model_bundle.joblib"

# ── 1. Verificar existencia ───────────────────────────────────────────────────
if not MODEL_PATH.exists():
    raise FileNotFoundError(f"No se encontró el modelo en: {MODEL_PATH}")

print("=" * 60)
print("MODELO CARGADO CORRECTAMENTE")
print(f"Ruta absoluta : {MODEL_PATH}")
print(f"Tamaño        : {MODEL_PATH.stat().st_size / 1_048_576:.2f} MB")
print("=" * 60)

# ── 2. Cargar bundle ─────────────────────────────────────────────────────────
bundle = joblib.load(MODEL_PATH)

available_keys = list(bundle.keys())
print(f"\nClaves disponibles: {available_keys}")

# ── 3. Validar claves obligatorias ───────────────────────────────────────────
required_keys = {"pipeline", "threshold", "feature_order", "category_mappings"}
missing = required_keys - set(available_keys)
if missing:
    raise KeyError(f"Claves obligatorias ausentes en el bundle: {missing}")

# ── 4. Extraer componentes ───────────────────────────────────────────────────
pipeline = bundle["pipeline"]
threshold = float(bundle["threshold"])
feature_order = bundle["feature_order"]
category_mappings = bundle["category_mappings"]

# ── 5. Validar umbral ────────────────────────────────────────────────────────
if not (0 < threshold < 1):
    raise ValueError(f"Umbral fuera de rango (0, 1): {threshold}")

print(f"\nUmbral                 : {threshold:.4f}")

# ── 6. Validar orden de características ──────────────────────────────────────
expected_features = [
    "gender",
    "age",
    "hypertension",
    "heart_disease",
    "smoking_history",
    "bmi",
    "HbA1c_level",
    "blood_glucose_level",
]

if feature_order != expected_features:
    raise ValueError(
        f"Orden de características incorrecto.\n"
        f"  Esperado : {expected_features}\n"
        f"  Recibido : {feature_order}"
    )

print(f"Orden de características: {feature_order}")

# ── 7. Validar categorías ────────────────────────────────────────────────────
for cat_field in ("gender", "smoking_history"):
    if cat_field not in category_mappings:
        raise KeyError(f"Mapeo de categorías ausente para: '{cat_field}'")

print(f"\nMapeos categóricos:")
for field, mapping in category_mappings.items():
    print(f"  {field}: {mapping}")

# ── 8. Mostrar información opcional ──────────────────────────────────────────
metrics = bundle.get("metrics")
if metrics is not None:
    print(f"\nMétricas del modelo:")
    for k, v in metrics.items():
        print(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")

metadata = bundle.get("metadata")
if metadata is not None:
    print(f"\nMetadata:")
    for k, v in metadata.items():
        print(f"  {k}: {v}")

encoders = bundle.get("encoders")
if encoders is not None:
    print(f"\nEncoders: presentes ({type(encoders).__name__})")

input_ranges = bundle.get("input_ranges")
if input_ranges is not None:
    print(f"\nRangos de entrada: {input_ranges}")

# ── 9. Prueba de inferencia ───────────────────────────────────────────────────
print("\n" + "=" * 60)
print("PRUEBA DE INFERENCIA")
print("=" * 60)

gender_value = next(iter(category_mappings["gender"]))
smoking_value = next(iter(category_mappings["smoking_history"]))

sample_data = {
    "gender": category_mappings["gender"][gender_value],
    "age": 55.0,
    "hypertension": 1,
    "heart_disease": 0,
    "smoking_history": category_mappings["smoking_history"][smoking_value],
    "bmi": 31.5,
    "HbA1c_level": 6.8,
    "blood_glucose_level": 190.0,
}

sample_df = pd.DataFrame([sample_data], columns=feature_order)

probability = float(pipeline.predict_proba(sample_df)[0, 1])
prediction = int(probability >= threshold)

print(f"Categoria de genero usada    : {gender_value} -> {sample_data['gender']}")
print(f"Categoria de tabaquismo usada: {smoking_value} -> {sample_data['smoking_history']}")
print(f"Probabilidad                 : {probability:.4f}")
print(f"Umbral                       : {threshold:.4f}")
print(f"Predicción                   : {prediction}  ({'Positivo' if prediction == 1 else 'Negativo'})")
print("=" * 60)
print("verify_model.py completado sin errores.")
