# Correcciones del Notebook — Proyecto Diabetes

---

## A. Propósito del documento

Este archivo registra las diferencias entre el notebook original y la versión corregida del proyecto. Conserva el historial acumulativo de las correcciones metodológicas, estructurales y de evaluación, y no se limita al último cambio realizado.

La fuente de verdad para los resultados finales es `Proyecto_Diabetes_actual.ipynb`, ejecutado completamente desde un entorno limpio en Google Colab.

---

## B. Resumen ejecutivo de correcciones

| Aspecto | Notebook original | Problema detectado | Notebook corregido | Impacto de la corrección |
| :--- | :--- | :--- | :--- | :--- |
| **Codificación categórica** | Se reutilizaba un único `LabelEncoder` global. | El segundo `fit()` sobrescribía las clases del primero y dificultaba conservar los mapeos para despliegue. | Se implementan `gender_encoder` y `smoking_encoder` de forma independiente. | Conservación correcta e independiente de los mapeos para cada variable categórica. |
| **Tratamiento de outliers** | Se aplicaba `np.clip()` y se modificaba directamente el dataset global. | Alteración artificial de la variabilidad del conjunto de prueba, introduciendo sesgo y modificando los datos reales evaluados. | El IQR se utiliza únicamente para identificación exploratoria y estadística; el dataset original no se altera. | Evaluación sobre datos reales con su variabilidad natural intacta. |
| **Orden entre split y balanceo** | SMOTE se aplicaba sobre el dataset completo antes del split. | Fuga de información masiva (data leakage) desde el conjunto de prueba al conjunto de entrenamiento, inflando artificialmente el desempeño. | SMOTENC se aplica de forma exclusiva sobre el conjunto de entrenamiento. | Evaluación más realista y metodológicamente consistente. |
| **SMOTE frente a SMOTENC** | SMOTE trataba todas las variables como continuas. | Generación de valores decimales ficticios sin sentido real para variables categóricas o binarias (p. ej., género = 0.45). | SMOTENC que considera y maneja de forma explícita las variables categóricas y continuas. | Muestras sintéticas coherentes que respetan los tipos de datos de los atributos originales. |
| **Conservación del test original** | Conjunto de prueba balanceado artificialmente (35 066 observaciones). | Evaluación ficticia que no representa la distribución original del dataset. | Test original desbalanceado (19 230 observaciones) sin muestras sintéticas. | Métricas más representativas con la distribución original del dataset. |
| **Normalización** | Se ajustaba y transformaba `X_train_scaled` y `X_test_scaled` de forma global sin encapsular. | El escalado estaba separado del modelo y era menos reproducible. | El `StandardScaler` se integra y ejecuta de forma interna dentro de los pipelines (`cv_pipeline` y `final_pipeline`). | Normalización consistente, reproducible y acoplada al pipeline de predicción. |
| **Validación cruzada** | Se realizaba sobre datos previamente balanceados de forma global. | Estimación sesgada del error de generalización y métricas artificialmente elevadas. | SMOTENC y normalización se recalculan dentro de cada fold mediante `cv_pipeline`. | Estimación robusta y fiable de la estabilidad del modelo frente a nuevos datos. |
| **Modelo preliminar y modelo final** | No se distinguía formalmente entre la experimentación inicial y el modelo final de despliegue. | Confusión sobre qué importancia de atributos y métricas corresponden al entregable final. | Separación estricta entre el modelo preliminar (`rf_model`) y el pipeline final (`final_pipeline`). | Trazabilidad del proceso, claridad metodológica y consistencia del modelo preparado para integración o despliegue académico. |
| **Umbral de decisión** | Umbral estándar implícito de 0.5 a través del método `.predict()`. | Falta de declaración explícita y trazabilidad del criterio empleado. | Declaración explícita mediante la constante `DECISION_THRESHOLD = 0.5`. | criterio del proyecto explícito, transparente y reproducible. |
| **Exportación del modelo** | No existía un bundle completo para despliegue. | Dificultad para garantizar que el modelo cargado para integración o despliegue académico aplique los mismos encoders y umbrales. | Exportación en formato Joblib conteniendo el pipeline completo, encoders, umbral, métricas y metadata. | Pipeline autocontenido, auditable y listo para integración o despliegue académico. |

---

## C. Comparación entre notebook original y corregido

El notebook corregido conserva la estructura general del proyecto con fines didácticos, permitiendo comparar visual y metodológicamente la fase preliminar frente a la definitiva. Sin embargo, modifica decisiones clave que producían una evaluación excesivamente optimista.

### Estructura de Flujo del Notebook Original
```text
Dataset completo
→ SMOTE
→ dataset balanceado
→ train/test split
→ entrenamiento
→ evaluación sobre test balanceado
```

### Estructura de Flujo del Notebook Corregido
```text
Dataset sin duplicados
→ codificación
→ split estratificado
→ conservación del test original
→ SMOTENC solo en entrenamiento
→ validación cruzada con pipeline
→ entrenamiento de final_pipeline
→ evaluación sobre test original
```

### Tabla comparativa original vs. corregido

| Aspecto | Notebook original | Notebook corregido | Problema detectado | Impacto de la corrección |
| :--- | :--- | :--- | :--- | :--- |
| **Codificación categórica** | Un único `LabelEncoder` reutilizado | `gender_encoder` y `smoking_encoder` independientes | El segundo `fit()` sobrescribía las clases del primero y dificultaba conservar los mapeos | Mapeos separados y preservación correcta de mapeos para despliegue |
| **Valores extremos** | `np.clip()` alterando el dataset | IQR solo para identificación exploratoria | Distorsión artificial de la variabilidad natural del test | Evaluación sobre el test con distribución intacta |
| **Balanceo** | SMOTE antes de dividir los datos | SMOTENC solo en el entrenamiento | Fuga de información masiva (leakage) de test a train | Evaluación sobre la distribución original del dataset y métricas realistas |
| **Variables categóricas** | SMOTE estándar (todas las variables como continuas) | SMOTENC específico para categóricas | Generación de valores fraccionarios inválidos en variables categóricas | Muestras sintéticas válidas y correctas |
| **Conjunto de prueba** | Test balanceado artificialmente (35 066 observaciones) | Test original desbalanceado (19 230 observaciones) | Evaluación no representativa del mundo real | Métricas realistas en función del desbalance original |
| **Validación cruzada** | Ejecutada sobre datos previamente balanceados globalmente | SMOTENC y scaling dentro de cada fold en `cv_pipeline` | Estimación sesgada de la generalización del modelo | Estimación confiable de la robustez del modelo |
| **Evaluación final** | `.predict()` sobre test balanceado | `final_pipeline` sobre test original | Métricas sobreestimadas artificialmente | Medición del rendimiento sobre datos no balanceados en condiciones de evaluación más realistas |
| **Umbral** | Implícito de 0.5 mediante `.predict()` | Explícito con `DECISION_THRESHOLD = 0.5` | Falta de control y claridad del umbral fijo | Trazabilidad del criterio del proyecto establecido |
| **Exportación** | Sin bundle de despliegue | Exportación con pipeline, encoders, umbral, métricas y metadatos | Dificultad de replicabilidad para integración o despliegue académico | Bundle preparado para integración o despliegue académico y validado post-carga |

---

## D. Flujo metodológico final

El flujo de procesamiento definitivo implementado en el notebook sigue la siguiente secuencia:

```text
Dataset de 100 000 registros
→ eliminación de duplicados: 96 146 registros
→ codificación categórica independiente
→ split estratificado 80/20
→ conservación de X_train_original e y_train_original
→ SMOTENC solo sobre entrenamiento
→ validación cruzada con SMOTENC dentro de cada fold
→ entrenamiento de final_pipeline con todo el train
→ cálculo de probabilidades sobre el test
→ clasificación con DECISION_THRESHOLD = 0.5
→ evaluación final
→ exportación del bundle
```

---

## E. Distribuciones

El dataset mantiene las siguientes dimensiones y conteos de registros por clase en cada etapa:

* **Dataset sin duplicados:**
  * Clase negativa (0): 87 664
  * Clase positiva (1): 8 482
  * Total: 96 146
* **Entrenamiento original (`X_train_original`):**
  * Clase negativa (0): 70 130
  * Clase positiva (1): 6 786
  * Total: 76 916
* **Entrenamiento post-SMOTENC (entrenamiento balanceado):**
  * Clase negativa (0): 70 130
  * Clase positiva (1): 70 130
  * Total: 140 260
* **Test original (`X_test`):**
  * Clase negativa (0): 17 534
  * Clase positiva (1): 1 696
  * Total: 19 230

### Aclaraciones metodológicas:
1. El test no fue balanceado artificialmente en ninguna circunstancia.
2. El test no contiene ninguna muestra sintética generada por SMOTENC.
3. El test no interviene en el entrenamiento ni en el balanceo del modelo.
4. El test conserva estrictamente la distribución resultante del split estratificado (aproximadamente 91.2% negativos y 8.8% positivos), reflejando fielmente la distribución natural del dataset.

---

## F. Validación cruzada

Los resultados promedio obtenidos con `cv_pipeline` sobre `X_train_original` e `y_train_original` usando `StratifiedKFold(n_splits=5, shuffle=True, random_state=42)` son:

```text
accuracy: 0.955 ± 0.001
precision: 0.749 ± 0.006
recall: 0.745 ± 0.011
f1: 0.747 ± 0.008
roc_auc: 0.965 ± 0.003
```

### Análisis de sobreajuste:
* **Accuracy de entrenamiento interno:** 0.999 (promedio de los folds de entrenamiento interno)
* **Accuracy de validación interna:** 0.955
* **Diferencia:** 0.044

### Aclaraciones y observaciones:
* El `cv_pipeline` integra en cascada: SMOTENC (balanceo), StandardScaler (normalización) y RandomForestClassifier.
* Se utiliza exclusivamente `X_train_original` y `y_train_original` como datos de entrenamiento.
* SMOTENC se ejecuta de forma interna y exclusiva dentro de cada fold para evitar la fuga de información hacia los datos de validación de ese fold.
* La diferencia entre el accuracy de entrenamiento interno (0.999) y validación (0.955) indica un ajuste fuerte a los datos de entrenamiento. No se afirma que el sobreajuste esté completamente descartado.
* La cercanía entre las métricas de validación cruzada y de test sugiere estabilidad razonable en la generalización del modelo.

---

## G. Modelo preliminar y modelo final

El notebook está diseñado para mostrar la transición didáctica entre un enfoque experimental preliminar y el pipeline definitivo.

### Modelo preliminar
* **Variables y objetos:** `rf_model`, `X_train_scaled`, `X_test_scaled`.
* **Propósito:** Conservar la estructura original, mostrar resultados exploratorios iniciales, generar una primera importancia de atributos y facilitar la comparación metodológica.
* **Nota técnica:** Sus métricas sobre el test no deben ser utilizadas en la sección final del informe, ya que representan una aproximación preliminar y simplificada que no encapsula la pipeline completa.

### Modelo final
* **Variables y objetos:** `final_pipeline` (objeto de clase `ImbPipeline`).
* **Componentes integrados:**
  `SMOTENC (balanceo) → StandardScaler (normalización) → RandomForestClassifier`
* **Propósito:** Se utiliza para generar las probabilidades finales (`y_probs_final`), realizar las predicciones finales (`y_pred_final`), reportar las métricas de evaluación definitivas, construir la matriz de confusión e importancia de atributos para el despliegue y la exportación del bundle.

> [!IMPORTANT]
> Para el informe y el despliegue deben utilizarse exclusivamente los resultados producidos por `final_pipeline`. Las salidas de `rf_model` se conservan únicamente como resultados preliminares y didácticos.

---

## H. Umbral de decisión

La asignación de clases binarias se realiza explícitamente de la siguiente forma en la celda de evaluación final:

```python
DECISION_THRESHOLD = 0.5
y_probs_final = final_pipeline.predict_proba(X_test)[:, 1]
y_pred_final = (y_probs_final >= DECISION_THRESHOLD).astype(int)
```

### Aclaraciones:
* **Umbral fijo:** El umbral de decisión se establece en 0.5 como un criterio fijo adoptado para la versión final.
* No se ha realizado calibración, optimización ni búsqueda de umbrales utilizando el conjunto de prueba para evitar sobreajustar el criterio de decisión a este conjunto.
* No debe catalogarse este umbral como "óptimo" ni como "calibrado", sino como el umbral de decisión por defecto de la regla de clasificación.

> [!NOTE]
> El notebook original también utilizaba implícitamente el umbral de 0.5 mediante `rf_model.predict()`. Por tanto, la reducción de recall y otras métricas no se debe principalmente al umbral, sino a la corrección de la fuga de información y a la evaluación sobre el test original desbalanceado.

> [!TIP]
> La curva ROC y el ROC-AUC se calculan a partir de `y_probs_final` y evalúan múltiples umbrales. Modificar el umbral fijo cambia precision, recall, F1-score y la matriz de confusión, pero no modifica el ROC-AUC si las probabilidades permanecen iguales.

---

## I. Evaluación final

Evaluación del pipeline definitivo (`final_pipeline`) sobre el conjunto de test original (`X_test`) utilizando `DECISION_THRESHOLD = 0.5`:

* **Accuracy:** 0.9548
* **Precision (clase positiva):** 0.7404
* **Recall (clase positiva):** 0.7500
* **F1-score (clase positiva):** 0.7452
* **Especificidad:** 0.9746
* **Tasa de falsos negativos (FNR):** 0.2500
* **ROC-AUC:** 0.9633

### Matriz de confusión final:
* **Verdaderos Negativos (TN):** 17 088
* **Falsos Positivos (FP):** 446
* **Falsos Negativos (FN):** 424
* **Verdaderos Positivos (TP):** 1 272

### Reporte de clasificación detallado:
```text
                precision    recall  f1-score   support

Clase negativa       0.98      0.97      0.98     17534
Clase positiva       0.74      0.75      0.75      1696

      accuracy                           0.95     19230
     macro avg       0.86      0.86      0.86     19230
  weighted avg       0.96      0.95      0.95     19230
```

### Análisis del rendimiento:
* **Falsos negativos:** Con un recall del 75%, el modelo no detecta el 25% de las observaciones etiquetadas como clase positiva presentes en el test (424 de las 1 696 observaciones positivas del test no fueron detectadas).
* **Diagnóstico clínico:** Se debe enfatizar en el informe que el modelo es una herramienta exploratoria de soporte predictivo y no debe ser presentado ni utilizado como diagnóstico clínico definitivo sin supervisión médica especializada y validación clínica externa.

---

## J. Importancia de atributos

Se distinguen dos análisis de importancia en el notebook:
1. **Importancia exploratoria (de `rf_model`):** Calculada al inicio con fines exploratorios para observar el comportamiento de las variables tras la codificación inicial.
2. **Importancia final (de `final_pipeline`):** Obtenida directamente del RandomForest entrenado dentro del pipeline final.

### Importancia de características definitiva (`final_pipeline`):

```text
HbA1c_level            0.408231
blood_glucose_level    0.241750
age                    0.181145
bmi                    0.114374
smoking_history        0.022099
hypertension           0.018950
heart_disease          0.008656
gender                 0.004796
```

### Aclaraciones conceptuales:
* **Contribución predictiva:** La métrica describe la contribución relativa de cada atributo para reducir la impureza en los nodos del árbol durante el entrenamiento del modelo.
* **No causalidad:** No demuestra relaciones causales o clínicas entre las variables y la presencia de diabetes.
* **Sesgo hacia variables continuas:** Los árboles de decisión pueden tener un sesgo inherente que favorece variables con mayor número de puntos de corte (como variables continuas `HbA1c_level`, `blood_glucose_level`, `age`, `bmi`) frente a variables binarias o categóricas discretas.
* Para el informe final, se debe utilizar exclusivamente la importancia generada por `final_pipeline`.

---

## K. Exportación del bundle

El modelo y sus artefactos asociados fueron exportados en un bundle binario:

* **Archivo:** `diabetes_model_bundle.joblib`
* **Ruta de exportación:** `/content/diabetes_model_bundle.joblib`
* **Tamaño:** 18.20 MB
* **Umbral guardado:** 0.50

### Contenido del bundle según código de exportación:
1. **`pipeline`:** El objeto `ImbPipeline` final entrenado.
2. **`threshold`:** El umbral de decisión fijo (`0.50`).
3. **`feature_order`:** El orden exacto y los nombres de las columnas.
4. **`encoders`:** Los objetos LabelEncoder independientes y sus mapeos categóricos.
5. **`metrics`:** Diccionario con las métricas finales en test (`accuracy`, `precision`, `recall`, `f1`, `specificity`, `false_negative_rate`, `roc_auc`).
6. **`metadata`:** Información complementaria (fecha, nombre del modelo, versión `1.0.0`, versión de Python `3.12.13`, método del umbral: "Umbral fijo estándar de 0.5 definido como criterio del proyecto").

### Verificación post-carga:
Se realizó una verificación cargando nuevamente el bundle desde disco y validando sus salidas frente al pipeline original con un registro de test.
* Probabilidad original: 0.11000000 | Probabilidad recargada: 0.11000000
* Predicción original: 0 | Predicción recargada: 0
* Las salidas coinciden exactamente, demostrando consistencia en el proceso de serialización.

> [!WARNING]
> El archivo Joblib corresponde a la implementación y entorno de ejecución Python. No puede cargarse directamente en lenguajes como Java sin una librería de conversión (como PMML/ONNX) o a través de un servicio web de inferencia Python.

---

## L. Resultados originales descartados

Los siguientes resultados del notebook original corresponden a un flujo metodológico inapropiado y se consideran **resultados metodológicamente optimistas y descartados para la versión final**:

* **Distribución artificial de test:** Test balanceado con 17 533 observaciones de la clase 0 y 17 533 de la clase 1 (total 35 066).
* **Métricas estimadas:**
  * Accuracy: ~0.974
  * Recall: ~0.971
  * ROC-AUC: 0.9969
* **Matriz de confusión antigua:**
  * Verdaderos Negativos (TN): 17 130
  * Falsos Positivos (FP): 403
  * Falsos Negativos (FN): 503
  * Verdaderos Positivos (TP): 17 030

> [!IMPORTANT]
> Estas métricas fueron calculadas sobre datos de test que contenían muestras sintéticas del algoritmo SMOTE aplicado globalmente, por lo que sufren de fuga de información severa. No deben presentarse como resultados finales, aunque pueden conservarse para documentar la comparación metodológica.

---

## M. Mapa de actualización del informe

| Sección del informe | Elemento a actualizar | Detalle / Valor definitivo |
| :--- | :--- | :--- |
| **Normalización** | Aclaración metodológica | `StandardScaler` integrado en `cv_pipeline` y `final_pipeline` |
| **Entrenamiento** | Distribución de entrenamiento | Clase 0 = 70 130 / Clase 1 = 70 130 (post-SMOTENC) |
| **Test** | Distribución de test | Clase 0 = 17 534 / Clase 1 = 1 696 (original desbalanceado) |
| **Validación cruzada** | Desempeño estimado | Accuracy 0.955 ± 0.001; Recall 0.745 ± 0.011; AUC 0.965 ± 0.003 |
| **Modelo final** | Estructura del pipeline | `SMOTENC → StandardScaler → RandomForestClassifier` |
| **Umbral** | Criterio de clasificación | Umbral fijo de 0.50 (`DECISION_THRESHOLD = 0.5`) |
| **Predicción** | Métricas finales de test | Accuracy 0.9548; Precision 0.7404; Recall 0.7500; F1-score 0.7452 |
| **Matriz** | Matriz de confusión final | TN = 17 088, FP = 446, FN = 424, TP = 1 272 |
| **Reporte** | Tabla de clasificación final | Precision 0.74; Recall 0.75; F1 0.75 (para clase positiva) |
| **ROC** | Curva ROC final | ROC-AUC = 0.9633 |
| **Importancia final** | Ranking de características | HbA1c (40.8%), Glucose (24.2%), Age (18.1%), BMI (11.4%), etc. |
| **Exportación** | Bundle preparado para integración o despliegue académico | `diabetes_model_bundle.joblib` (18.20 MB, con encoders e histórico) |
| **Conclusión** | Criterio de decisión | Clasificador con umbral estático de 0.5; sin optimización posterior |
| **Limitaciones** | Advertencias técnicas | No apto para diagnóstico clínico autónomo; FNR de 25% |

---

## N. Capturas del informe

### Capturas que deben reemplazarse
Debido a cambios en los resultados, el código o la metodología, las siguientes capturas deben ser actualizadas obligatoriamente:
1. **Codificación categórica:** Mapeos independientes para `gender` y `smoking_history`.
2. **Análisis IQR:** Si antes mostraba que se recortaban o modificaban los datos, ahora debe mostrar solo identificación sin modificación del dataset.
3. **Split Train/Test:** La celda de partición estratificada sin balancear.
4. **Distribución del entrenamiento original y post-SMOTENC:** Gráficas de distribución de clases.
5. **Distribución del test original:** La distribución desbalanceada real de prueba.
6. **Normalización:** La comparación estadística o gráfica antes y después de normalizar.
7. **Métricas de validación cruzada:** Promedio de los folds y reporte por fold.
8. **Matriz de confusión y reporte de validación cruzada.**
9. **Evaluación final:** Reporte impreso con el umbral 0.50 y las métricas de test.
10. **`metrics_summary`:** Tabla final formateada con los resultados en test.
11. **Matriz de confusión final:** El heatmap de 2x2.
12. **Curva ROC final:** El gráfico ROC con AUC = 0.9633.
13. **Importancia de atributos final:** El gráfico o salida de variables de `final_pipeline`.
14. **Exportación y verificación del bundle:** Outputs de guardado y carga del archivo `.joblib`.

### Capturas que pueden conservarse
Se pueden mantener las capturas originales del informe para los siguientes elementos, ya que su código y resultados son idénticos:
1. **Importación de librerías iniciales.**
2. **Carga inicial del dataset y dimensiones originales (100 000 filas).**
3. **Reporte de nulos y duplicados iniciales (3 854 duplicados encontrados).**
4. **Distribución original de clases del dataset (87 664 vs 8 482).**
5. **Matriz de correlación exploratoria inicial.**
6. **Gráficos exploratorios e histogramas iniciales del EDA.**

> [!NOTE]
> No debe reemplazarse una captura únicamente porque el notebook fue ejecutado nuevamente. Solo se reemplazan las capturas cuyo código, metodología, título o resultado cambió.

---

## O. Limitaciones

* **Probabilidades no calibradas clínicamente:** `predict_proba` representa una puntuación probabilística del modelo, pero no debe interpretarse como una probabilidad clínica individual sin calibración y validación externa.
* **Importancia no causal:** la importancia de Random Forest describe contribución predictiva dentro del modelo y no demuestra relaciones causales.
* **Dependencia del dataset:** el rendimiento está condicionado por la calidad, cobertura, distribución y variables disponibles en el conjunto de datos.
* **Representatividad geográfica:** el dataset no ha sido validado específicamente para población peruana.
* **Falsos negativos:** con recall de 0.75, el modelo no detecta el 25 % de las observaciones positivas del test (424 de 1 696 casos en el test).
* **Carácter académico:** los resultados no deben utilizarse para diagnóstico clínico.
* **Ausencia de validación clínica externa:** el modelo fue desarrollado con un dataset de Kaggle y no ha sido probado con datos hospitalarios locales.
* **Posible sobreajuste no completamente descartado:** la diferencia entre el accuracy de entrenamiento (0.999) y validación cruzada (0.955) indica ajuste fuerte a los datos de entrenamiento.

---

## P. Variables actuales e intermedias

### Variables retiradas de iteraciones intermedias
Estas variables surgieron en versiones intermedias del proceso de corrección, no necesariamente existían en el notebook original y han sido sustituidas por la implementación final:
* `best_threshold` (reemplazada por `DECISION_THRESHOLD`)
* `threshold_pipeline` (retirada al eliminarse la fase de calibración)
* `requirements_results` (reemplazada por `metrics_summary`)
* `y_test_proba_final` (renombrada a `y_probs_final`)
* `y_test_pred_final` (renombrada a `y_pred_final`)

### Variables actuales en el notebook
Corresponden a las variables definitivas validadas en el notebook:
* `DECISION_THRESHOLD` (definida como `0.5`)
* `y_probs_final` (probabilidades estimadas en test)
* `y_pred_final` (predicciones finales usando el umbral)
* `final_pipeline` (objeto `ImbPipeline` final)
* `metrics_summary` (DataFrame de métricas de test)
* `accuracy_final`, `precision_final`, `recall_final`, `f1_final`, `specificity_final`, `false_negative_rate_final`, `roc_auc_final` (métricas escalares individuales)
* `cm_final` (objeto de matriz de confusión)
* `model_bundle` (diccionario exportado con `joblib`)

---

## Q. Mapa de celdas del notebook actual

> [!NOTE]
> Los índices corresponden a la posición interna base cero del archivo `.ipynb` y pueden diferir del número visual mostrado por Google Colab.

| Índice interno | Tipo de celda | Propósito | Variables principales | ¿Genera captura? | Clasificación: preliminar, validación o final |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **00** | Code | Montar Drive y cargar dataset inicial | `df` | No | Preliminar |
| **01** | Code | Análisis de duplicados y nulos | `df` | No | Preliminar |
| **02** | Code | Codificación de variables categóricas | `gender_encoder`, `smoking_encoder` | Sí | Preliminar |
| **04** | Code | Importancia de características exploratoria | `rf_model` | Sí | Preliminar |
| **06** | Code | Gráfica de distribución de clases original | `sns.countplot` | Sí | Preliminar |
| **08** | Code | Visualización de matriz de correlación | `sns.heatmap` | Sí | Preliminar |
| **11** | Code | Identificación exploratoria de outliers con IQR | - | Sí | Preliminar |
| **12** | Code | Partición de datos train/test (80/20) | `X_train`, `X_test`, `y_train`, `y_test` | Sí | Preliminar |
| **15** | Code | Balanceo SMOTENC y gráfica en entrenamiento | `smote_nc`, `X_train_res`, `y_train_res` | Sí | Preliminar |
| **17** | Code | Normalización (StandardScaler) exploratoria y comparativa | `StandardScaler` | Sí | Preliminar |
| **18** | Code | Configuración de StratifiedKFold | `kfold` | Sí | Validación |
| **19** | Code | Entrenamiento de RandomForestClassifier preliminar | `rf_model` | No | Preliminar |
| **20** | Code | Gráfica de importancia de atributos preliminar | `importances` | Sí | Preliminar |
| **28** | Code | Creación de `cv_pipeline` y evaluación cross-validation | `cv_pipeline`, `cv_results`, `y_cv_pred` | No | Validación |
| **29** | Code | Reporte de clasificación y matriz de cross-validation | `confusion_matrix`, `classification_report` | Sí | Validación |
| **30** | Code | Evaluación de overfitting en cross-validation | `train_acc_mean`, `val_acc_mean` | Sí | Validación |
| **32** | Markdown | Celda explicativa: Introducción a la evaluación final | - | No | Final |
| **33** | Code | Entrenamiento definitivo de `final_pipeline` | `final_pipeline` | No | Final |
| **34** | Code | Evaluación en test con `DECISION_THRESHOLD = 0.5` | `DECISION_THRESHOLD`, `y_probs_final`, `y_pred_final` | Sí | Final |
| **35** | Code | Presentación del DataFrame `metrics_summary` | `metrics_summary` | Sí | Final |
| **36** | Code | Graficado de la matriz de confusión final | `cm_final` | Sí | Final |
| **37** | Code | Graficado de la curva ROC final | `fpr_final`, `tpr_final`, `roc_auc_final` | Sí | Final |
| **39** | Code | Importancia de atributos final del modelo definitivo | `final_importances` | Sí | Final |
| **41** | Code | Exportación del bundle en formato Joblib | `model_bundle` | Sí | Final |
| **42** | Code | Recarga y verificación post-carga del bundle | `loaded_bundle`, `loaded_pipeline` | Sí | Final |
| **45** | Markdown | Conclusiones y limitaciones finales | - | No | Final |

---

## R. Declaración de ejecución

El notebook fue ejecutado completamente desde un entorno limpio en Google Colab. Todas las celdas finalizaron sin errores.

Las métricas documentadas coinciden con las salidas almacenadas en `Proyecto_Diabetes_actual.ipynb`.
