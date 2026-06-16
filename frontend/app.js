"use strict";

// ── API base URL ─────────────────────────────────────────────────────────────
const API_BASE_URL = (
  window.APP_CONFIG?.API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

// ── Label dictionaries ───────────────────────────────────────────────────────
const GENDER_LABELS = {
  Female: "Femenino",
  Male:   "Masculino",
  Other:  "Otro",
};

const SMOKING_LABELS = {
  "No Info":     "Sin información",
  "never":       "Nunca",
  "former":      "Anteriormente",
  "current":     "Actualmente",
  "not current": "No actualmente",
  "ever":        "Alguna vez",
};

// ── State ────────────────────────────────────────────────────────────────────
let apiAvailable = false;
let modelCategories = {};
let isSubmitting   = false;

// ── DOM references ───────────────────────────────────────────────────────────
const statusBadge        = document.getElementById("status-badge");
const statusText         = document.getElementById("status-text");
const apiMetaEl          = document.getElementById("api-meta");
const apiNoteEl          = document.getElementById("api-note");
const retryContainer     = document.getElementById("retry-container");
const btnRetry           = document.getElementById("btn-retry");

const form               = document.getElementById("prediction-form");
const btnSubmit          = document.getElementById("btn-submit");
const btnExample         = document.getElementById("btn-example");
const btnClear           = document.getElementById("btn-clear");
const loadingNote        = document.getElementById("loading-note");
const validationMsg      = document.getElementById("validation-message");
const errorMsg           = document.getElementById("error-message");
const errorTitle         = document.getElementById("error-title");
const errorBody          = document.getElementById("error-body");

const resultSection      = document.getElementById("result-section");
const classificationBanner = document.getElementById("classification-banner");
const bannerIcon         = document.getElementById("banner-icon");
const bannerTitle        = document.getElementById("banner-title");
const bannerDesc         = document.getElementById("banner-desc");
const probValue          = document.getElementById("prob-value");
const probBar            = document.getElementById("prob-bar");
const thresholdMarker    = document.getElementById("threshold-marker");
const thresholdLabel     = document.getElementById("threshold-label");
const metaThreshold      = document.getElementById("meta-threshold");
const metaVersion        = document.getElementById("meta-version");
const metaClassification = document.getElementById("meta-classification");
const jsonResponse       = document.getElementById("json-response");
const resultDisclaimer   = document.getElementById("result-disclaimer");

const genderSelect       = document.getElementById("gender");
const smokingSelect      = document.getElementById("smoking_history");

// ── Helpers ──────────────────────────────────────────────────────────────────
function escapeText(str) {
  return String(str ?? "").replace(/[<>&"']/g, c => ({
    "<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;", "'":"&#39;"
  })[c]);
}

function setStatus(state, text) {
  statusBadge.className = `status-badge ${state}`;
  statusText.textContent = text;
}

function showApiMeta(health) {
  apiMetaEl.innerHTML =
    `<span><strong>Modelo:</strong> ${escapeText(health.model_loaded ? "Cargado" : "No disponible")}</span>` +
    `<span><strong>Versión:</strong> ${escapeText(health.model_version ?? "—")}</span>` +
    `<span><strong>Umbral:</strong> ${escapeText(health.threshold ?? "—")}</span>`;
  apiMetaEl.hidden = false;
}

function populateSelect(selectEl, categories, labelDict) {
  const current = selectEl.value;
  selectEl.innerHTML = '<option value="">Selecciona...</option>';
  for (const key of Object.keys(categories)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = labelDict[key] ?? key;
    selectEl.appendChild(opt);
  }
  if (current && selectEl.querySelector(`option[value="${CSS.escape(current)}"]`)) {
    selectEl.value = current;
  }
}

function showValidation(msg) {
  validationMsg.textContent = msg;
  validationMsg.classList.add("visible");
}

function clearValidation() {
  validationMsg.textContent = "";
  validationMsg.classList.remove("visible");
}

function showError(title, body) {
  errorTitle.textContent = title;
  errorBody.textContent  = body;
  errorMsg.classList.add("visible");
}

function clearError() {
  errorMsg.classList.remove("visible");
  errorTitle.textContent = "";
  errorBody.textContent  = "";
}

function hideResult() {
  resultSection.classList.remove("visible");
}

function setLoadingState(loading) {
  isSubmitting = loading;
  btnSubmit.disabled = loading;
  btnSubmit.setAttribute("aria-busy", String(loading));
  loadingNote.hidden = !loading;

  const icon = btnSubmit.querySelector("svg");
  if (loading) {
    btnSubmit.innerHTML =
      '<span class="spinner" aria-hidden="true"></span> Evaluando...';
  } else {
    btnSubmit.innerHTML =
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg> Evaluar perfil`;
  }
}

// ── Health check ─────────────────────────────────────────────────────────────
async function checkHealth(showRetry = true) {
  setStatus("connecting", "Conectando con la API...");
  apiNoteEl.textContent = "El servidor puede tardar algunos segundos en activarse.";
  retryContainer.hidden = true;

  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const health = await res.json();

    apiAvailable = true;
    setStatus("connected", "API conectada");
    showApiMeta(health);
    apiNoteEl.textContent = "";
    retryContainer.hidden = true;
  } catch {
    apiAvailable = false;
    setStatus("disconnected", "API no disponible");
    apiMetaEl.hidden = true;
    apiNoteEl.textContent = "No se pudo conectar con el backend.";
    if (showRetry) retryContainer.hidden = false;
  }
}

// ── Load model categories ─────────────────────────────────────────────────────
async function loadModelInfo() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/model-info`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const info = await res.json();

    modelCategories = info.available_categories ?? {};

    if (modelCategories.gender) {
      populateSelect(genderSelect, modelCategories.gender, GENDER_LABELS);
    }
    if (modelCategories.smoking_history) {
      populateSelect(smokingSelect, modelCategories.smoking_history, SMOKING_LABELS);
    }
  } catch {
    genderSelect.innerHTML  = '<option value="">No disponible</option>';
    smokingSelect.innerHTML = '<option value="">No disponible</option>';
  }
}

// ── Validate form ─────────────────────────────────────────────────────────────
function validateForm(payload) {
  const fields = [
    { name: "gender",              label: "Género" },
    { name: "age",                 label: "Edad" },
    { name: "hypertension",        label: "Hipertensión" },
    { name: "heart_disease",       label: "Enfermedad cardíaca" },
    { name: "smoking_history",     label: "Historial de tabaquismo" },
    { name: "bmi",                 label: "IMC" },
    { name: "HbA1c_level",         label: "HbA1c" },
    { name: "blood_glucose_level", label: "Glucosa sanguínea" },
  ];

  for (const f of fields) {
    const el = document.getElementById(f.name) || form.elements[f.name];
    if (!el) continue;
    if (el.value === "" || el.value === null || el.value === undefined) {
      el.focus();
      return `El campo "${f.label}" es obligatorio.`;
    }
    if (el.type === "number") {
      const val = Number(el.value);
      if (!isFinite(val)) {
        el.focus();
        return `El campo "${f.label}" debe ser un número válido.`;
      }
      if (el.min !== "" && val < Number(el.min)) {
        el.focus();
        return `El campo "${f.label}" debe ser mayor o igual que ${el.min}.`;
      }
      if (el.max !== "" && val > Number(el.max)) {
        el.focus();
        return `El campo "${f.label}" debe ser menor o igual que ${el.max}.`;
      }
    }
  }
  return null;
}

// ── Parse FastAPI 422 errors ──────────────────────────────────────────────────
function parse422(detail) {
  if (!Array.isArray(detail)) return String(detail);
  return detail.map(err => {
    const field = err.loc ? err.loc[err.loc.length - 1] : "campo";
    return `El campo ${field}: ${err.msg}.`;
  }).join(" ");
}

// ── Render result ─────────────────────────────────────────────────────────────
function renderResult(data) {
  const isPositive = data.prediction === 1;
  const pct        = Number(data.probability_percentage ?? (data.probability * 100)).toFixed(2);
  const thr        = Number(data.threshold);
  const thrPct     = (thr * 100).toFixed(1);

  // Banner
  classificationBanner.className = `classification-banner ${isPositive ? "positive" : "negative"}`;
  bannerIcon.textContent  = isPositive ? "⚠" : "✓";
  bannerTitle.textContent = data.classification ?? (isPositive ? "Perfil clasificado como positivo" : "Perfil clasificado como negativo");
  bannerDesc.textContent  = isPositive
    ? "El perfil superó el umbral de decisión configurado en el modelo. Este resultado no confirma una enfermedad."
    : "El perfil no superó el umbral de decisión configurado en el modelo. Este resultado no descarta una condición médica.";

  // Probability
  probValue.textContent = `${pct} %`;
  probBar.style.width   = `${Math.min(100, Math.max(0, pct))}%`;

  thresholdMarker.style.left    = `${Math.min(100, Math.max(0, thrPct))}%`;
  thresholdMarker.dataset.label = `Umbral ${thrPct}%`;
  thresholdLabel.textContent    = `${thrPct}%`;

  // Meta
  metaThreshold.textContent      = thr.toFixed(4);
  metaVersion.textContent        = data.model_version ?? "—";
  metaClassification.textContent = isPositive ? "Positivo" : "Negativo";

  // Technical JSON
  jsonResponse.textContent = JSON.stringify(data, null, 2);

  // Disclaimer
  resultDisclaimer.textContent = data.disclaimer ?? "";

  resultSection.classList.add("visible");
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Submit handler ────────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  clearValidation();
  clearError();
  hideResult();

  const formData = new FormData(form);
  const payload  = {
    gender:               formData.get("gender"),
    age:                  Number(formData.get("age")),
    hypertension:         Number(formData.get("hypertension")),
    heart_disease:        Number(formData.get("heart_disease")),
    smoking_history:      formData.get("smoking_history"),
    bmi:                  Number(formData.get("bmi")),
    HbA1c_level:          Number(formData.get("HbA1c_level")),
    blood_glucose_level:  Number(formData.get("blood_glucose_level")),
  };

  const validationError = validateForm(payload);
  if (validationError) {
    showValidation(validationError);
    return;
  }

  setLoadingState(true);

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 422) {
        showError("Error de validación (422)", parse422(data.detail));
      } else if (res.status === 400) {
        showError("Solicitud incorrecta (400)", typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail));
      } else if (res.status === 500) {
        showError("Error del servidor (500)", "La API no pudo procesar la predicción.");
      } else {
        showError(`Error HTTP ${res.status}`, typeof data.detail === "string" ? data.detail : "Error inesperado.");
      }
      return;
    }

    renderResult(data);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      showError(
        "Tiempo de espera agotado",
        "La API tardó demasiado en responder. El servicio puede estar iniciándose; inténtalo nuevamente."
      );
    } else {
      showError(
        "Error de red",
        "No fue posible conectar con la API. Verifica que el backend esté activo y que CORS permita el dominio actual."
      );
    }
  } finally {
    setLoadingState(false);
  }
});

// ── Clear button ──────────────────────────────────────────────────────────────
btnClear.addEventListener("click", () => {
  form.reset();
  clearValidation();
  clearError();
  hideResult();
  // Restore dynamic selects placeholder
  genderSelect.value  = "";
  smokingSelect.value = "";
});

// ── Load example ──────────────────────────────────────────────────────────────
btnExample.addEventListener("click", () => {
  form.reset();
  clearValidation();
  clearError();
  hideResult();

  document.getElementById("age").value                  = "55";
  document.getElementById("hypertension").value         = "1";
  document.getElementById("heart_disease").value        = "0";
  document.getElementById("bmi").value                  = "31.5";
  document.getElementById("HbA1c_level").value          = "6.8";
  document.getElementById("blood_glucose_level").value  = "190";

  // Gender: pick first available category
  const genderKeys = Object.keys(modelCategories.gender ?? {});
  if (genderKeys.length > 0) genderSelect.value = genderKeys[0];

  // Smoking: pick first available category
  const smokingKeys = Object.keys(modelCategories.smoking_history ?? {});
  if (smokingKeys.length > 0) smokingSelect.value = smokingKeys[0];
});

// ── Retry button ──────────────────────────────────────────────────────────────
btnRetry.addEventListener("click", async () => {
  await checkHealth(true);
  if (apiAvailable) await loadModelInfo();
});

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  await checkHealth(true);
  await loadModelInfo();
})();
