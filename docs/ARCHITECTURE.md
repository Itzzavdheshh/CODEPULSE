# CodePulse Architectural Blueprint & Technical Specification

## 1. Executive Summary & Vision

**CodePulse** is an Intelligent Software Analysis & Engineering Intelligence Platform designed to bridge the gap between low-level compiler mechanics, data analytics, predictive machine learning models, and interactive software visualization.

The platform provides dual utility:
1. **Developer Tooling Mode**: High-density diagnostic view for software engineers, compiler developers, and ML engineers needing precise control flow graphs, AST inspections, data profiling, model performance metrics, and prediction confidence distributions.
2. **Academic & Pedagogical Mode ("Professor Mode")**: Structured breakdown of academic computer science principles across Compiler Design, Data Engineering, Machine Learning, and Web Application Architecture.

---

## 2. Platform Architecture & Separation of Concerns

The system enforces strict boundaries between engines, ensuring zero hidden dependencies across engines.

### Engine Communication Model
```
[Compiler Engine] ──(compiler_analysis.json)──► [Artifact Exchange Layer]
                                                         │
                                                         ├──► [Data Engine] ──(data_profile.json)
                                                         │
                                                         └──► [ML Engine]   ──(ml_model_result.json)
                                                                 │
                                                                 ▼
                                                        [Reporting Engine] ──► (integrated_report.json / PDF / HTML)
```

Each engine follows an identical contract:
`INPUT -> VALIDATION -> PROCESSING -> DIAGNOSTICS -> RESULT -> EXPORT ARTIFACT`

---

## 3. Engine Specifications

### 3.1 Compiler Intelligence Engine
- **Language Scope**: Java-like language subset supporting:
  - Primitive types (`int`, `float`, `boolean`, `String`, `void`)
  - Variable declarations & assignments
  - Binary/unary arithmetic & logical operators (`+`, `-`, `*`, `/`, `%`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`)
  - Control flow structures (`if-else`, `while`, `for`, `return`)
  - Functions / Methods with parameterized signatures
  - Blocks and lexical scoping
  - Classes & method declarations
  - Print statements (`System.out.println`)
- **Pipeline Components**:
  1. `Lexer`: Scans source text into strongly-typed Token stream with line and column numbers.
  2. `Parser`: Construct Abstract Syntax Tree (AST) using recursive descent parsing.
  3. `SymbolTable`: Hierarchical scope manager storing variable/method types, definitions, and usage locations.
  4. `SemanticAnalyzer`: Type checking, scope resolution, unreachable code detection, and unused variable diagnostics.
  5. `IRGenerator`: Converts AST into Three-Address Code (TAC) representation using quadruples `(op, arg1, arg2, result)`.
  6. `Optimizer`: Performs constant folding, constant propagation, and dead code elimination on TAC.
  7. `CFGBuilder`: Partitions optimized TAC into Basic Blocks and builds directed Control-Flow Graphs (CFG).
  8. `CodeMetrics`: Computes Cyclomatic Complexity (Mccabe $V(G) = E - N + 2P$), Halstead Volume, LOC, and risk classifications.

### 3.2 Data Intelligence & Visualization Engine
- **Capabilities**:
  1. `Ingestion`: Ingests CSV, JSON, or compiler artifact tables.
  2. `Profiling`: Dynamic column type detection (numeric, categorical, datetime, text), missing count/percentage, unique value counts, mean, std, min, 25%, 50%, 75%, max, skewness, and kurtosis.
  3. `Correlation Analysis`: Computes Pearson correlation matrix across numeric attributes.
  4. `Data Cleaning`: Missing value imputation (Mean, Median, Mode, Drop), outlier handling (IQR clipping, Z-score truncation), and min-max / standard scaling.

### 3.3 Machine Learning Intelligence Engine
- **Capabilities**:
  1. `Preprocessing`: Target encoding, standard scaling, train-test splitting (stratified where appropriate).
  2. `Supervised Learning`:
     - Classification: Logistic Regression, Decision Tree, Random Forest, Naive Bayes.
     - Regression: Linear Regression, Decision Tree Regressor, Random Forest Regressor.
  3. `Unsupervised Learning`: K-Means Clustering (dynamic K selection, inertia calculation, silhouette evaluation).
  4. `Model Evaluation`: Accuracy, Precision, Recall, F1 Score, ROC-AUC curve datapoints, Confusion Matrix heatmap coordinates.
  5. `Explainability Engine`: Computes feature importance weights and per-sample feature contributions.

### 3.4 Shared Artifact Exchange Layer
- Schema-driven contract format:
```json
{
  "artifact_id": "uuid-v4",
  "artifact_type": "compiler_analysis | data_profile | ml_model_result | integrated_report",
  "schema_version": "1.0.0",
  "created_at": "ISO-8601 UTC timestamp",
  "producer": {
    "engine": "compiler | data | ml | reports",
    "version": "1.0.0"
  },
  "metadata": {
    "title": "Artifact Title",
    "source_name": "source.java",
    "summary": "High-level summary of artifact payload"
  },
  "payload": {}
}
```

---

## 4. Academic Laboratory Mapping Matrix

| Laboratory Domain | Product Feature | Technical Implementation |
| :--- | :--- | :--- |
| **Compiler Design** | Lexical Analysis | Tokenizer regex scanner, token classification, line/column tracking |
| **Compiler Design** | Syntax Analysis & AST | LL(k)/Recursive descent parser, Abstract Syntax Tree construction |
| **Compiler Design** | Semantic & Scope Analysis | Hierarchical Symbol Table, type enforcement, scope diagnostics |
| **Compiler Design** | Intermediate Code & Optimization | Three-Address Code (TAC), constant folding, dead code elimination |
| **Compiler Design** | Control-Flow Analysis | Basic block partitioning, CFG adjacency list & visual graph rendering |
| **Compiler Design** | Code Metrics | Cyclomatic complexity $V(G)$, Halstead metrics, maintainability index |
| **Data Handling** | Ingestion & Schema Inference | Multi-format parser, automated data typing, null value audit |
| **Data Handling** | Statistical Profiling | Distribution moments, Pearson correlation matrix, skewness |
| **Data Handling** | Data Cleaning & Prep | Imputation strategies, IQR filtering, min-max / z-score scaling |
| **Machine Learning** | Supervised Classification | Decision Tree, Random Forest, Logistic Regression, Naive Bayes |
| **Machine Learning** | Supervised Regression | Linear Regression, Decision Tree Regressor, Random Forest Regressor |
| **Machine Learning** | Model Evaluation | Confusion matrix, ROC-AUC, Precision/Recall/F1 metrics breakdown |
| **Machine Learning** | Model Explainability | Feature importance ranking, confidence scoring per prediction |
| **JavaScript / UI** | Reactive State & Workspace | React 18 hooks, TypeScript domain types, dynamic tab routing |
| **JavaScript / UI** | Custom Visual Analytics | SVG CFG rendering, HTML5 Canvas heatmaps, interactive charts |
| **JavaScript / UI** | Asynchronous API & Storage | Fetch API client, REST endpoints, JSON artifact export & import |

---

## 5. Security & Safety Strategy

1. **Input Sandboxing**: Uploaded Java-like source files capped at 1 MB; datasets capped at 50 MB for local processing.
2. **Execution Safety**: Code is parsed and analyzed statically in Python memory; no host system `eval()`, `exec()`, or subprocess compiler invocation is performed on untrusted code.
3. **AST & Recursion Guard**: Parser depth limit set to 256 nested levels to prevent stack overflow attacks on recursive descent routines.
4. **Sanitized Diagnostics**: No stack traces or server file paths exposed to front-end clients in production mode.

---

## 6. Testing Strategy

- **Backend Tests (pytest)**:
  - Lexer tests (valid tokens, invalid characters, string literals).
  - Parser tests (expressions, control flows, nested scopes, malformed syntax error diagnostics).
  - Semantic tests (undeclared variable detection, type mismatch warnings).
  - Data tests (profiling accuracy, missing imputation correctness, correlation calculation).
  - ML tests (model convergence, metric computation, zero-variance target handling).
- **API Integration Tests**: Verify REST response schemas and artifact compatibility.
