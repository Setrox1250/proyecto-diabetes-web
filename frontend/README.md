# Frontend — Evaluador Académico de Perfiles Asociados a Diabetes

Interfaz web estática que consume la API FastAPI del proyecto de clasificación académica de diabetes.

> **Advertencia académica:** Esta herramienta es un prototipo experimental para uso educativo.
> No constituye diagnóstico médico ni sustituye la evaluación de un profesional de la salud.

---

## 1. Descripción

Formulario web que permite ingresar las ocho variables del dataset (`gender`, `age`,
`hypertension`, `heart_disease`, `smoking_history`, `bmi`, `HbA1c_level`,
`blood_glucose_level`), enviarlas a `/api/predict` y visualizar la clasificación
con probabilidad y umbral devueltos por el modelo.

---

## 2. Estructura

```
frontend/
├── index.html    # Estructura HTML
├── styles.css    # Estilos (sin framework)
├── app.js        # Lógica de la aplicación
├── config.js     # URL de la API (editar aquí para cambiar entorno)
├── vercel.json   # Configuración de despliegue estático
└── README.md     # Este archivo
```

---

## 3. Configuración de `API_BASE_URL`

La URL del backend se controla únicamente desde **`config.js`**:

```javascript
window.APP_CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000"   // desarrollo local
};
```

`app.js` la lee así:

```javascript
const API_BASE_URL = (
  window.APP_CONFIG?.API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");
```

---

## 4. Ejecución local

### Backend

```powershell
cd backend
uvicorn app:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
python -m http.server 5500
```

Abrir en el navegador:

```
http://localhost:5500
```

> No abras `index.html` directamente como archivo (`file://`) — los módulos JS
> y las llamadas a la API requieren un servidor HTTP.

---

## 5. Prueba con backend local

1. Inicia el backend en el puerto 8000 (ver sección 4).
2. Verifica que `config.js` tenga `API_BASE_URL: "http://127.0.0.1:8000"`.
3. Inicia el servidor frontend en el puerto 5500.
4. El indicador "Estado del backend" debe mostrar **API conectada**.
5. Los selectores de género y tabaquismo se cargan desde `/api/model-info`.
6. Completa el formulario o usa **Cargar ejemplo** y pulsa **Evaluar perfil**.

---

## 6. Cambiar a la URL de Render

Cuando el backend esté desplegado en Render, edita **solo** `config.js`:

```javascript
window.APP_CONFIG = {
  API_BASE_URL: "https://NOMBRE-REAL-DEL-BACKEND.onrender.com"
};
```

Reemplaza `NOMBRE-REAL-DEL-BACKEND` con el subdominio real asignado por Render.
No modifiques `app.js`.

---

## 7. Despliegue en Vercel

1. Crea un proyecto en [vercel.com](https://vercel.com) y vincula el repositorio.
2. Configura el **Root Directory** como `frontend/` (o usa un monorepo).
3. No se necesita comando de build — es un sitio estático.
4. Vercel servirá `index.html` directamente.
5. El `vercel.json` ya configura `cleanUrls` y `trailingSlash: false`.

---

## 8. Solución de errores CORS

El backend ya incluye `CORSMiddleware` con `allow_origins=["*"]`, que permite
cualquier origen durante el desarrollo.

**Antes de producción**, reemplaza el comodín en `backend/app.py`:

```python
allow_origins=[
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://TU-PROYECTO.vercel.app",
],
```

Si ves un error CORS en la consola del navegador:
- Confirma que el backend esté corriendo.
- Confirma que la URL en `config.js` sea exactamente la del backend (sin barra final).
- Confirma que el dominio del frontend esté en `allow_origins`.

---

## 9. Advertencia académica

Esta interfaz es un prototipo de evaluación académica. Los resultados del modelo
son orientativos y no deben interpretarse como diagnóstico clínico. El modelo
fue entrenado con datos del dataset de diabetes utilizado en el proyecto y su
rendimiento está documentado en el notebook correspondiente.
