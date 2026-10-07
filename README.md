# CodePulse — Intelligent Software Analysis & Engineering Intelligence Platform

> **Independent by Default. Integrated by Choice.**

[![Tests](https://img.shields.io/badge/tests-116%20passed-brightgreen)](#testing) [![Frontend Build](https://img.shields.io/badge/frontend%20build-clean-brightgreen)](#frontend-setup) [![Python](https://img.shields.io/badge/python-3.12-blue)](#backend-setup) [![React](https://img.shields.io/badge/react-18-blue)](#frontend-setup)

CodePulse is a unified, modular developer platform and software engineering intelligence suite. It integrates four core computer science disciplines into an extensible, schema-driven environment:

1. **Compiler Intelligence Engine**: Lexical scanning, LALR/recursive-descent parsing, AST generation, symbol table scoping, type/semantic analysis, Three-Address Code (TAC) generation, constant folding optimization, Control-Flow Graph (CFG) basic block analysis, and code complexity metrics.
2. **Data Intelligence & Visualization Engine**: Structured dataset ingestion (CSV/JSON), dynamic type inference, statistical profiling, missing value imputation, outlier detection, distribution analysis, and interactive canvas/SVG visual analytics.
3. **Machine Learning Intelligence Engine**: Supervised and unsupervised ML workflow (Logistic Regression, Decision Trees, Random Forest, Naive Bayes, K-Means clustering), automated feature encoding/scaling, metrics evaluation (Precision, Recall, F1, ROC-AUC, Confusion Matrix), and prediction explainability.
4. **JavaScript Interactive Application Layer**: Responsive dark-first developer workspace built with React, TypeScript, modern CSS tokens, dynamic AST/CFG rendering, cross-engine artifact exchange, and contextual explanations ("Professor Mode").

---

## Architecture Overview

```
                          ┌───────────────────────────────────────────┐
                          │               CODEPULSE UI                │
                          │       Interactive Developer Workspace     │
                          └─────────────────────┬─────────────────────┘
                                                │
                                                ▼
                          ┌───────────────────────────────────────────┐
                          │          APPLICATION / API LAYER          │
                          │          (FastAPI REST Endpoints)         │
                          └───────────┬────────────┬──────────────────┘
                                      │            │
                             ┌────────▼──────┐ ┌──▼───────────────┐
                             │ COMPILER      │ │ DATA / ML        │
                             │ ENGINE        │ │ ENGINES          │
                             └──────┬────────┘ └────────┬─────────┘
                                    │                   │
                                    └──────────┬────────┘
                                               ▼
                                     ┌────────────────────┐
                                     │ ARTIFACT / DATA    │
                                     │ EXCHANGE LAYER     │
                                     └─────────┬──────────┘
                                               │
                                               ▼
                                     ┌────────────────────┐
                                     │ REPORTING ENGINE   │
                                     └────────────────────┘
```

---

## Core Product Principles

- **Independent by Default**: Every engine operates standalone with complete inputs, validation, diagnostics, visual results, and file exports.
- **Integrated by Choice**: Engines communicate via standardized, schema-validated JSON artifacts (e.g. `compiler_analysis` -> `ml_dataset` -> `risk_report`).
- **No Fake Data**: All compiler statistics, AST nodes, data profiles, ML performance metrics, and prediction probabilities are computed dynamically from real algorithms.
- **Academic & Industry Dual Purpose**: Provides high-level summaries for students/professors alongside deep raw diagnostic structures for compiler, data, and ML engineers.

---

## Repository Structure

```
/CODEPULSE
│
├── /docs                     # System architecture, API specs, and academic mappings
├── /shared                   # JSON Schemas and cross-engine artifact contracts
├── /backend                  # FastAPI modular backend application
│   ├── /app
│   │   ├── /api              # REST route controllers
│   │   ├── /compiler         # Lexer, Parser, AST, Semantic, Symbol Table, IR, CFG, Metrics
│   │   ├── /data             # Ingestion, Profiling, Cleaning, Transformation
│   │   ├── /ml               # Training, Evaluation, Prediction, Explainability
│   │   ├── /artifacts        # Schema-driven Artifact Exchange engine
│   │   ├── /reports          # Integrated Executive & Academic Report generator
│   │   ├── /core             # App configuration, security, database models
│   │   └── main.py           # FastAPI entrypoint
│   └── requirements.txt
│
├── /frontend                 # Vite + React + TypeScript frontend
│   ├── /src
│   │   ├── /components       # UI Design System components & visualizations
│   │   ├── /features         # Studio views: Compiler, Data, ML, Visualizations, Reports, Academic
│   │   ├── /services         # API client & Artifact Exchange service
│   │   ├── /types            # TypeScript domain interfaces
│   │   └── App.tsx           # Workspace main shell
│   └── package.json
│
└── /tests                    # Comprehensive test suite (pytest & frontend tests)
```

---

## Quick Start

### Backend Setup (Python 3.10+)
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
pip install -r requirements.txt
pytest
python -m app.main
```

### Frontend Setup (Node.js 18+)
```bash
cd frontend
npm install
npm run dev
```

---

## License & Credits
Built for **CodePulse — Intelligent Software Analysis & Engineering Intelligence Platform**.
