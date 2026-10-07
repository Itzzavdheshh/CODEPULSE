# CODEPULSE — Product Experience & Frontend Specification

## 1. Executive Summary & Information Architecture

CodePulse is a unified developer platform combining:
1. **Compiler Intelligence Engine**: 10-phase analysis from source to bytecode assembly.
2. **Data Intelligence Engine**: Statistical profiling, data quality auditing, controlled cleaning, and custom visualization builder.
3. **Machine Learning Engine**: Leakage-free training, multi-model evaluation, feature importance, explainability, and live inference.
4. **Shared Artifact Exchange**: Traceable provenance lineage connecting compiler outputs directly to data and ML pipelines.

### Core Navigation Structure:
- **Home / Workspace**: Central hero dashboard (`Understand → Analyze → Explain → Act`), active workspace metrics, and prepared demonstration workspace ("Payment System Analysis").
- **Compiler Studio**: Source Editor with line jump, 10-phase stepper bar, interactive AST explorer tree, searchable symbol table, side-by-side TAC optimization comparison, and SVG CFG visualizer.
- **Data Studio**: Paginated dataset table preview, statistical moments, quality audit findings, IQR outlier capping, Pearson correlation matrix, and custom SVG chart builder.
- **ML Studio**: Model setup, classification/regression model comparison matrix, interactive confusion matrix, feature importance ranking, and live single-instance inference form.
- **Visual Analytics**: Interactive multi-chart visualizer.
- **Shared Artifacts**: Artifact exchange repository with visual SVG Provenance Lineage Graph.
- **Executive Reports**: Synthesized Markdown report generator combining compiler, data, and ML artifact findings.
- **Academic Mode**: University Computer Science syllabus mapping (Compiler Design, Data Handling, ML, and JavaScript Web Engineering) with "Open in Studio" deep links.
- **Engineer Mode**: Toggleable developer bar exposing raw JSON payloads, memory addresses, low-level JVM assembly, and execution timings.

---

## 2. Interactive Component Specifications

### 2.1 Compiler Studio & 10-Phase Stepper
- **Line Gutter & Jump**: Interactive line number column highlighting syntax/semantic errors and jumping directly from diagnostic items or symbol table rows.
- **Interactive AST Tree**: Expandable/collapsible node hierarchy showing node types, line spans, values, and children.
- **Side-by-Side TAC & Optimization**: Compares original quadruples against constant-folded quadruples with transformation descriptions.
- **Interactive SVG CFG Visualizer**: Rendered graph of basic blocks (B1, B2...) with instruction lists, jump targets, and block detail inspector.

### 2.2 Data Studio & Visualization Builder
- **Interactive Dataset Preview**: Paginated table (8 rows per page) with column search filter, data type badges, and missing value indicators.
- **Custom Chart Builder**: Dynamic SVG chart renderer supporting Bar Charts, Line Charts, and Scatter Plots across selected X (Dimension) and Y (Metric) attributes.
- **Quality Audit View**: Severity-coded findings with automated recommendations for null handling, outliers, and type anomalies.

### 2.3 ML Studio & Live Prediction
- **Interactive Confusion Matrix**: Hover/click cell detail showing exact count and test-set percentage for actual vs predicted labels.
- **Model Comparison Matrix**: Compares Random Forest, Decision Tree, Logistic Regression, SVR/SVM, Naïve Bayes across Accuracy, Precision, Recall, F1, ROC-AUC, MAE, RMSE, R².
- **Live Prediction Form**: Interactive input fields for feature schema values executing real inference against backend `/api/v1/ml/predict`.

### 2.4 Artifact Provenance Lineage Graph
- Rendered SVG pipeline graph visualizing execution flow:
  `SOURCE FILES` → `Compiler Analysis Artifact` → `Data Profile Artifact` → `ML Model Artifact` → `Executive Report`.

---

## 3. Mode Switchers & Accessibility

- **Engineer Mode**: Toggleable top banner revealing low-level JVM stack depth, bytecode instructions, and memory layout.
- **Global Search (`Ctrl+K`)**: Keyboard-driven modal searching studios, artifacts, metrics, and syllabus concepts.
- **Design System**: Sleek dark developer theme (`#070A11` background, `#0F172A` cards, `#6366F1` accents) with WCAG compliant contrast ratios.
