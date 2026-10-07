from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.compiler.service import CompilerService
from app.compiler.grammar import GrammarAnalyzer
from app.compiler.project import MultiFileProjectAnalyzer
from app.data.service import DataService
from app.ml.service import MLService
from app.artifacts.store import ArtifactStore
from app.core.workspace import WorkspaceManager
from app.reports.generator import IntegratedReportGenerator

router = APIRouter(prefix="/api/v1")

compiler_service = CompilerService()
grammar_analyzer = GrammarAnalyzer()
project_analyzer = MultiFileProjectAnalyzer()
data_service = DataService()
ml_service = MLService()
artifact_store = ArtifactStore()
workspace_manager = WorkspaceManager()
report_generator = IntegratedReportGenerator()

# Request Models
class CompilerAnalysisRequest(BaseModel):
    source_code: str
    file_name: str = "Source.java"
    save_artifact: bool = True

class GrammarAnalysisRequest(BaseModel):
    productions: Optional[Dict[str, List[str]]] = None
    recursive_descent_input: str = "c a b d"
    shift_reduce_input: str = "i + i * i"

class ProjectAnalysisRequest(BaseModel):
    files: List[Dict[str, str]]

class MLTrainRequest(BaseModel):
    csv_text: str
    target_column: str
    model_name: str = "random_forest"
    task_type: str = "classification"
    test_size: float = 0.2
    save_artifact: bool = True

class DataProfileRequest(BaseModel):
    csv_text: str
    dataset_name: str = "Uploaded Dataset"
    save_artifact: bool = True

class DataCleanRequest(BaseModel):
    csv_text: str
    impute_strategy: str = "mean"
    handle_outliers: bool = True
    normalize: bool = False

class ReportRequest(BaseModel):
    compiler_artifact_id: Optional[str] = None
    data_artifact_id: Optional[str] = None
    ml_artifact_id: Optional[str] = None
    title: str = "CodePulse Integrated Intelligence Report"

# --- Healthcheck ---
@router.get("/health")
def healthcheck():
    return {
        "status": "healthy",
        "platform": "CodePulse — Intelligent Software Analysis & Engineering Intelligence Platform",
        "engines": ["compiler", "grammar", "data", "ml", "artifacts", "reports"]
    }

# --- Compiler Endpoints ---
@router.post("/compiler/analyze")
def analyze_compiler_code(req: CompilerAnalysisRequest):
    if not req.source_code.strip():
        raise HTTPException(status_code=400, detail="Source code cannot be empty.")

    analysis = compiler_service.analyze_source(req.source_code, req.file_name)

    artifact = None
    if req.save_artifact:
        artifact = artifact_store.create_artifact(
            artifact_type="compiler_analysis",
            payload=analysis,
            title=f"Compiler Analysis of {req.file_name}",
            engine="compiler",
            source_name=req.file_name,
            summary=f"Lexed {analysis['stats']['tokens_count']} tokens, V(G)={analysis['metrics']['cyclomatic_complexity']}, {len(analysis['diagnostics'])} diagnostics."
        )

    return {
        "analysis": analysis,
        "artifact": artifact
    }

@router.post("/compiler/grammar/analyze")
def analyze_grammar(req: GrammarAnalysisRequest):
    grammar_res = grammar_analyzer.analyze_grammar(req.productions)
    rd_res = grammar_analyzer.simulate_recursive_descent(req.recursive_descent_input)
    sr_res = grammar_analyzer.simulate_shift_reduce(req.shift_reduce_input)

    return {
        "grammar_analysis": grammar_res,
        "recursive_descent_trace": rd_res,
        "shift_reduce_trace": sr_res
    }

@router.post("/compiler/project/analyze")
def analyze_project(req: ProjectAnalysisRequest):
    if not req.files:
        raise HTTPException(status_code=400, detail="Project file list cannot be empty.")
    res = project_analyzer.analyze_project(req.files)
    return res

@router.get("/compiler/export/{artifact_id}/{export_format}")
def export_compiler_artifact(artifact_id: str, export_format: str):
    art = artifact_store.get_artifact(artifact_id)
    if not art or art["artifact_type"] != "compiler_analysis":
        raise HTTPException(status_code=404, detail="Compiler analysis artifact not found.")

    res = artifact_store.export_compiler_dataset(art, export_format)

    if "bytes" in res:
        return Response(content=res["bytes"], media_type=res["content_type"], headers={"Content-Disposition": f"attachment; filename={res['filename']}"})
    return Response(content=res["data"], media_type=res["content_type"], headers={"Content-Disposition": f"attachment; filename={res['filename']}"})

# --- Data Endpoints ---
@router.post("/data/profile")
def profile_dataset(req: DataProfileRequest):
    res = data_service.process_csv_content(req.csv_text, req.dataset_name)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])

    artifact = None
    if req.save_artifact:
        artifact = artifact_store.create_artifact(
            artifact_type="data_profile",
            payload=res["profile"],
            title=f"Data Profile of {req.dataset_name}",
            engine="data",
            source_name=req.dataset_name,
            summary=f"Profiled {res['profile']['shape']['rows']} rows, {res['profile']['shape']['columns']} cols. Completeness: {res['profile']['completeness_percentage']}%"
        )

    return {
        "data_summary": res,
        "artifact": artifact
    }

@router.post("/data/clean")
def clean_dataset(req: DataCleanRequest):
    res = data_service.clean_and_transform(
        req.csv_text,
        impute_strategy=req.impute_strategy,
        handle_outliers=req.handle_outliers,
        normalize=req.normalize
    )
    return res

# --- ML Endpoints ---
@router.post("/ml/train")
def train_ml_model(req: MLTrainRequest):
    res = ml_service.train_and_evaluate(
        csv_text=req.csv_text,
        target_column=req.target_column,
        model_name=req.model_name,
        task_type=req.task_type,
        test_size=req.test_size
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])

    artifact = None
    if req.save_artifact:
        score_val = res.get("evaluation", {}).get("accuracy", res.get("evaluation", {}).get("silhouette_score", 0.0))
        artifact = artifact_store.create_artifact(
            artifact_type="ml_model_result",
            payload=res,
            title=f"ML Model: {req.model_name} on target '{req.target_column}'",
            engine="ml",
            source_name=req.model_name,
            summary=f"Trained {req.model_name} ({req.task_type}). Performance score: {score_val:.4f}"
        )

    return {
        "ml_result": res,
        "artifact": artifact
    }

# --- Artifact Endpoints ---
@router.get("/artifacts")
def list_artifacts(artifact_type: Optional[str] = None):
    return {"artifacts": artifact_store.list_artifacts(artifact_type)}

@router.get("/artifacts/{artifact_id}")
def get_artifact(artifact_id: str):
    art = artifact_store.get_artifact(artifact_id)
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found.")
    return art

@router.post("/artifacts/convert-compiler-to-ml")
def convert_compiler_artifact(compiler_artifact_id: str):
    art = artifact_store.get_artifact(compiler_artifact_id)
    if not art or art["artifact_type"] != "compiler_analysis":
        raise HTTPException(status_code=400, detail="Invalid compiler analysis artifact ID.")

    csv_output = artifact_store.convert_compiler_to_ml_dataset(art)
    return {
        "csv_dataset": csv_output,
        "suggested_target": "risk_level"
    }

# --- Workspaces ---
@router.get("/workspaces")
def list_workspaces():
    return {"workspaces": workspace_manager.list_workspaces()}

# --- Reports ---
@router.post("/reports/generate")
def generate_report(req: ReportRequest):
    comp_art = artifact_store.get_artifact(req.compiler_artifact_id) if req.compiler_artifact_id else None
    data_art = artifact_store.get_artifact(req.data_artifact_id) if req.data_artifact_id else None
    ml_art = artifact_store.get_artifact(req.ml_artifact_id) if req.ml_artifact_id else None

    rep = report_generator.generate_report(
        compiler_data=comp_art["payload"] if comp_art else None,
        data_profile=data_art["payload"] if data_art else None,
        ml_results=ml_art["payload"] if ml_art else None,
        title=req.title
    )
    return rep

# --- Academic Mapping Endpoint ---
@router.get("/academic/mapping")
def get_academic_mappings():
    return {
        "academic_laboratories": [
            {
                "domain": "Compiler Design",
                "laboratory_concepts": [
                    "Comment Removal Analysis", "Keyword Frequency Analysis", "Macro Preprocessor (#define)",
                    "Lexical Analysis & Tokenizer", "FIRST & FOLLOW Sets", "Left Recursion Elimination",
                    "Recursive Descent Trace Parser", "Shift-Reduce Parsing", "Syntax Analysis & AST",
                    "Hierarchical Symbol Table", "Semantic Analysis & Diagnostics", "Three-Address Code (TAC)",
                    "Constant Folding & Propagation", "Control-Flow Graph (CFG)", "Cyclomatic Complexity V(G)",
                    "Target Code Generation (JVM Assembly)"
                ],
                "codepulse_features": [
                    "String-aware comment stripper", "Keyword frequency statistics", "Macro expansion engine",
                    "Token stream inspector", "FIRST/FOLLOW calculator", "Direct left recursion converter",
                    "Interactive RD parse step logger", "Stack-based Shift-Reduce trace viewer", "AST Explorer",
                    "Scoped symbol table exporter", "Type & scope error diagnostics", "TAC Quadruples generator",
                    "Constant Folding optimizer", "Interactive SVG CFG visualizer", "Software metrics dashboard",
                    "JVM-like educational bytecode target emitter"
                ]
            },
            {
                "domain": "Data Handling & Visualization",
                "laboratory_concepts": ["CSV Data Ingestion", "Statistical Profiling", "Data Cleaning & Imputation", "Correlation Matrix", "Outlier Truncation"],
                "codepulse_features": ["Data Hub file uploader", "Descriptive moments summary", "Missing value auto-imputer", "Pearson heatmap visualizer", "IQR outlier filter"]
            },
            {
                "domain": "Machine Learning",
                "laboratory_concepts": ["Supervised Classification & Regression", "Unsupervised Clustering", "Model Evaluation Metrics", "Prediction Explainability"],
                "codepulse_features": ["Random Forest / Decision Tree / Logistic Regression / K-Means studio", "Accuracy, F1, ROC-AUC & Confusion Matrix heatmap", "Feature importance & sample contribution breakdown"]
            },
            {
                "domain": "JavaScript & Web Engineering",
                "laboratory_concepts": ["Modern Reactive Architecture", "Dynamic Canvas/SVG Graphics", "Asynchronous API Integration", "Schema-Driven Artifact Exchange"],
                "codepulse_features": ["React 18 + TypeScript Developer Workspace", "Interactive CFG/Heatmap SVG renderers", "FastAPI REST client", "Cross-engine artifact pipelines"]
            }
        ]
    }
