# Proyecto Diabetes — API de inferencia

API académica de clasificación de perfiles asociados a diabetes, construida con FastAPI y Random Forest (scikit-learn 1.6.1).

> **Advertencia:** Este proyecto tiene carácter exclusivamente académico.
> Los resultados **no constituyen un diagnóstico médico**.

---

## Descripción

El modelo fue entrenado con el dataset *Diabetes Prediction Dataset* de Kaggle.
Utiliza un pipeline `SMOTENC → StandardScaler → RandomForestClassifier` con un umbral de decisión estándar de 0.5 establecido como criterio del proyecto.

Métricas en test:

| Métrica | Valor |
|---------|-------|
| Accuracy | 95.48 % |
| Recall | 75.00 % |
| Precision | 74.04 % |
| F1-score | 74.52 % |
| ROC-AUC | 0.9633 |
| Umbral | 0.50 |

---

## Requisitos

- Python 3.12
- Windows PowerShell

---

## Creación del entorno virtual

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## Verificación del modelo

```powershell
python verify_model.py
```

Salida esperada:

```
MODELO CARGADO CORRECTAMENTE
...
PRUEBA DE INFERENCIA
...
verify_model.py completado sin errores.
```

---

## Ejecución de FastAPI

```powershell
uvicorn app:app --reload
```

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Estado de la aplicación |
| GET | `/api/health` | Salud del servicio y umbral |
| GET | `/api/model-info` | Información completa del modelo |
| POST | `/api/predict` | Clasificación de un perfil |
| GET | `/docs` | Documentación Swagger interactiva |

Rutas locales:

```
http://127.0.0.1:8000
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/api/health
```

---

## Ejemplo de predicción

```powershell
$body = @{
    gender              = "Female"
    age                 = 55
    hypertension        = 1
    heart_disease       = 0
    smoking_history     = "former"
    bmi                 = 31.5
    HbA1c_level         = 6.8
    blood_glucose_level = 190
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/predict" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Categorías válidas para `gender`: `Female`, `Male`, `Other`

Categorías válidas para `smoking_history`: `No Info`, `current`, `ever`, `former`, `never`, `not current`

Respuesta esperada:

```json
{
  "prediction": 1,
  "classification": "Perfil clasificado como positivo",
  "probability": 0.82,
  "probability_percentage": 82.0,
  "threshold": 0.5,
  "model_version": "1.0.0",
  "disclaimer": "Resultado académico. No constituye un diagnóstico médico."
}
```

---

## Estructura del proyecto

```
proyecto-diabetes-web/
├── app.py
├── verify_model.py
├── requirements.txt
├── .python-version
├── .gitignore
├── README.md
└── model/
    └── diabetes_model_bundle.joblib
```
