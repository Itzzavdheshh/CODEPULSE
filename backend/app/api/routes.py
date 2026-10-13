from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import Dict, Any, List, Optional, Union
import pandas as pd
import zipfile
import base64
import io
import math
from app.compiler.service import CompilerService
from app.compiler.grammar import GrammarAnalyzer
from app.compiler.project import MultiFileProjectAnalyzer
from app.compiler.interpreter import extract_param_map, TACInterpreter, run_both
from app.compiler.growth_lab import inspect_source, analyze_growth
from app.data.service import DataService
from app.ml.service import MLService
from app.artifacts.store import ArtifactStore
from app.core.workspace import WorkspaceManager
from app.reports.generator import IntegratedReportGenerator
from app.visualization.service import VisualizationService

router = APIRouter(prefix="/api/v1")

compiler_service = CompilerService()
grammar_analyzer = GrammarAnalyzer()
project_analyzer = MultiFileProjectAnalyzer()
data_service = DataService()
ml_service = MLService()
artifact_store = ArtifactStore()
workspace_manager = WorkspaceManager()
report_generator = IntegratedReportGenerator()
visualization_service = VisualizationService()

# Request Models
class CompilerAnalysisRequest(BaseModel):
    source_code: str
    file_name: str = "SoftwareRiskAnalyzer.java"
    save_artifact: bool = True

class CompilerInterpretRequest(BaseModel):
    source_code: Optional[str] = None
    compiler_artifact_id: Optional[str] = None
    method: str
    args: Union[List[Any], Dict[str, Any]]
    variant: Optional[str] = "optimized"
    include_trace: Optional[bool] = False
    save_artifact: Optional[bool] = False

class GrowthLabInspectRequest(BaseModel):
    source_code: str

class GrowthLabRequest(BaseModel):
    source_code: str
    method: str
    size_param: Union[str, int]
    fixed_args: Optional[Dict[str, Any]] = None
    sizes: Optional[List[int]] = None
    variant: Optional[str] = "optimized"
    save_artifact: Optional[bool] = False

class GrammarAnalysisRequest(BaseModel):
    productions: Optional[Dict[str, List[str]]] = None
    recursive_descent_input: str = "c a b d"
    shift_reduce_input: str = "i + i * i"

class ProjectAnalysisRequest(BaseModel):
    files: List[Dict[str, str]]

class ProjectZipUploadRequest(BaseModel):
    zip_base64: str
    file_name: Optional[str] = "project.zip"

class MLTrainRequest(BaseModel):
    csv_text: str
    target_column: Optional[str] = "risk_level"
    model_name: str = "random_forest"
    task_type: str = "classification"
    test_size: float = 0.2
    save_artifact: bool = True

class MLPredictRequest(BaseModel):
    ml_artifact_id: str
    instance_data: Dict[str, Any]

class DataProfileRequest(BaseModel):
    csv_text: str
    file_type: str = "csv"
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

@router.post("/compiler/project/upload-zip")
def upload_project_zip(req: ProjectZipUploadRequest):
    if not req.zip_base64.strip():
        raise HTTPException(status_code=400, detail="ZIP archive payload cannot be empty.")

    b64_str = req.zip_base64
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]

    try:
        raw_bytes = base64.b64decode(b64_str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 encoding: {str(e)}")

    try:
        zf = zipfile.ZipFile(io.BytesIO(raw_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read ZIP archive: {str(e)}")

    SUPPORTED_EXTS = {'.java', '.c', '.cpp', '.h', '.hpp', '.js', '.ts', '.txt', '.py'}
    extracted_files = []

    for name in zf.namelist():
        # Skip folders, macOS metadata, hidden files
        if name.endswith('/') or name.startswith('__MACOSX/') or '/.' in name or name.startswith('.'):
            continue
        ext = '.' + name.split('.')[-1].lower() if '.' in name else ''
        if ext in SUPPORTED_EXTS:
            try:
                data = zf.read(name)
                try:
                    text = data.decode('utf-8')
                except UnicodeDecodeError:
                    text = data.decode('latin-1', errors='replace')

                clean_name = name.split('/')[-1] if '/' in name else name
                extracted_files.append({
                    "file_name": clean_name,
                    "relative_path": name,
                    "source_code": text
                })
            except Exception:
                continue

    if not extracted_files:
        raise HTTPException(
            status_code=400,
            detail="No supported source code files (.java, .c, .cpp, .ts, etc.) were found inside this ZIP archive."
        )

    res = project_analyzer.analyze_project(extracted_files)
    proj_name = req.file_name or "UploadedProject.zip"
    res["project_name"] = proj_name
    res["zip_filename"] = proj_name
    return {
        "project_name": proj_name,
        "files": extracted_files,
        "analysis": res
    }

@router.get("/compiler/export/{artifact_id}/{export_format}")
def export_compiler_artifact(artifact_id: str, export_format: str):
    art = artifact_store.get_artifact(artifact_id)
    if not art or art["artifact_type"] != "compiler_analysis":
        raise HTTPException(status_code=404, detail="Compiler analysis artifact not found.")

    res = artifact_store.export_compiler_dataset(art, export_format)

    if "bytes" in res:
        return Response(content=res["bytes"], media_type=res["content_type"], headers={"Content-Disposition": f"attachment; filename={res['filename']}"})
    return Response(content=res["data"], media_type=res["content_type"], headers={"Content-Disposition": f"attachment; filename={res['filename']}"})

@router.post("/compiler/interpret", summary="Execute TAC quadruples with the TAC interpreter")
def interpret_compiler_tac(req: CompilerInterpretRequest):
    """
    Executes raw, optimized, or both TAC variants with explicit call frame stack,
    32-bit signed wrapping, CFG basic block tracking, and step/opcode counting.
    """
    # 1. Exactly one of source_code / compiler_artifact_id must be given
    has_source = req.source_code is not None and req.source_code.strip() != ""
    has_artifact = req.compiler_artifact_id is not None and req.compiler_artifact_id.strip() != ""
    if (has_source and has_artifact) or (not has_source and not has_artifact):
        raise HTTPException(
            status_code=422,
            detail="Exactly one of 'source_code' or 'compiler_artifact_id' must be provided."
        )

    # 2. Validate variant
    variant = (req.variant or "optimized").lower()
    if variant not in ("raw", "optimized", "both"):
        raise HTTPException(
            status_code=422,
            detail="Invalid variant: must be 'raw', 'optimized', or 'both'."
        )

    # 3. Validate numbers are finite
    def validate_finite(v: Any):
        if isinstance(v, (int, float)):
            if math.isnan(v) or math.isinf(v):
                raise HTTPException(status_code=422, detail="Arguments must contain only finite numbers.")
        elif isinstance(v, list):
            for item in v:
                validate_finite(item)
        elif isinstance(v, dict):
            for val in v.values():
                validate_finite(val)

    validate_finite(req.args)

    # 4. Obtain compiler analysis
    if has_source:
        analysis = compiler_service.analyze_source(req.source_code)
        errors = [d for d in analysis.get("diagnostics", []) if d.get("severity") == "error"]
        if errors:
            raise HTTPException(
                status_code=422,
                detail=f"Compiler diagnostics reported fatal errors: {errors[0].get('message')}"
            )
    else:
        art = artifact_store.get_artifact(req.compiler_artifact_id)
        if not art or art.get("artifact_type") != "compiler_analysis":
            raise HTTPException(
                status_code=422,
                detail=f"Compiler analysis artifact '{req.compiler_artifact_id}' not found or invalid type."
            )
        analysis = art.get("payload", {})

    # 5. Method existence and parameter validation
    param_map = extract_param_map(analysis.get("ast", {}))
    target_method = req.method
    if target_method not in param_map:
        matched = None
        for m in param_map:
            if m.lower() == target_method.lower():
                matched = m
                break
        if not matched:
            raise HTTPException(
                status_code=422,
                detail=f"Method '{req.method}' not found in compiler analysis. Available methods: {list(param_map.keys())}"
            )
        target_method = matched

    expected_params = param_map[target_method]
    if isinstance(req.args, list):
        if len(req.args) != len(expected_params):
            raise HTTPException(
                status_code=422,
                detail=f"Argument count mismatch for method '{target_method}': expected {len(expected_params)}, got {len(req.args)}."
            )
    elif isinstance(req.args, dict):
        missing = [p for p in expected_params if p not in req.args]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Missing arguments for method '{target_method}': {missing}. Expected: {expected_params}."
            )
    else:
        raise HTTPException(status_code=422, detail="Arguments must be a list or dictionary.")

    # 6. Execution
    max_trace = 5000
    if variant == "both":
        res = run_both(analysis, target_method, req.args, include_trace=bool(req.include_trace), max_steps=1_000_000)
    else:
        quads = analysis.get("intermediate_code" if variant == "raw" else "optimized_code", [])
        interp = TACInterpreter(quads, param_map=param_map, max_steps=1_000_000)
        res = interp.run(target_method, req.args, variant=variant, trace=bool(req.include_trace), max_trace=max_trace)

    # 7. Optional artifact persistence
    artifact = None
    if req.save_artifact:
        step_val = res.get("step_count", res.get("optimized", {}).get("step_count", 0))
        artifact = artifact_store.create_artifact(
            artifact_type="tac_execution_trace",
            payload=res,
            title=f"TAC Trace: {target_method} ({variant})",
            engine="compiler",
            source_name=analysis.get("file_name", "source.java"),
            summary=f"TAC execution of {target_method} ({variant} variant). Steps: {step_val}."
        )

    return {
        "result": res,
        "artifact": artifact
    }

# --- Growth Lab Endpoints ---
@router.post("/compiler/growth-lab/inspect")
def inspect_growth_source_endpoint(req: GrowthLabInspectRequest):
    if not req.source_code:
        raise HTTPException(status_code=422, detail="source_code is required.")
    return inspect_source(req.source_code)

@router.post("/compiler/growth-lab")
def run_growth_lab_endpoint(req: GrowthLabRequest):
    if not req.source_code or not req.source_code.strip():
        raise HTTPException(status_code=422, detail="source_code is required.")
    if not req.method or not req.method.strip():
        raise HTTPException(status_code=422, detail="method name is required.")
    if req.size_param is None or (isinstance(req.size_param, str) and not req.size_param.strip()):
        raise HTTPException(status_code=422, detail="size_param is required.")

    # Validate variant
    variant = (req.variant or "optimized").lower()
    if variant not in ("raw", "optimized", "both"):
        raise HTTPException(status_code=422, detail="variant must be 'raw', 'optimized', or 'both'.")

    # Validate sizes
    if req.sizes is not None:
        if not isinstance(req.sizes, list):
            raise HTTPException(status_code=422, detail="sizes must be a list of integers.")
        if len(req.sizes) > 40:
            raise HTTPException(status_code=422, detail="sizes list exceeds maximum limit of 40 values.")
        for s in req.sizes:
            if not isinstance(s, int) or isinstance(s, bool) or s <= 0 or s > 100_000:
                raise HTTPException(status_code=422, detail=f"Each size must be a positive integer <= 100000 (got {s}).")

    # Validate fixed_args
    if req.fixed_args is not None:
        if not isinstance(req.fixed_args, dict):
            raise HTTPException(status_code=422, detail="fixed_args must be a dictionary.")
        for k, v in req.fixed_args.items():
            if not isinstance(v, (int, float)) or isinstance(v, bool) or math.isnan(v) or math.isinf(v):
                raise HTTPException(status_code=422, detail=f"fixed_args['{k}'] must be a finite numeric value.")

    try:
        result = analyze_growth(
            source_code=req.source_code,
            method=req.method,
            size_param=req.size_param,
            fixed_args=req.fixed_args,
            sizes=req.sizes,
            variant=variant,
            max_steps_per_run=300_000,
            time_budget_s=5.0
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Optional artifact persistence
    if req.save_artifact:
        classification = result.get("fit", {}).get("classification", "Unknown")
        confidence = result.get("fit", {}).get("confidence", "low")
        artifact = artifact_store.create_artifact(
            artifact_type="growth_analysis",
            payload={
                "method": req.method,
                "size_param": str(req.size_param),
                "variant": variant,
                "samples": result.get("samples", []),
                "fit": result.get("fit", {}),
                "static_hint": result.get("static_hint", {}),
                "variants": result.get("variants"),
                "truncated_reason": result.get("truncated_reason")
            },
            title=f"Growth Analysis: {req.method} ({classification})",
            engine="compiler",
            source_name="source.java",
            summary=f"Algorithmic growth analysis for {req.method}: {classification} ({confidence} confidence)."
        )
        result["artifact"] = artifact

    return result

# --- Data Endpoints ---
@router.post("/data/profile")
def profile_dataset(req: DataProfileRequest):
    try:
        res = data_service.process_dataset(req.csv_text, req.file_type, req.dataset_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    artifact = None
    if req.save_artifact:
        artifact = artifact_store.create_artifact(
            artifact_type="data_profile",
            payload=res,
            title=f"Data Profile of {req.dataset_name}",
            engine="data",
            source_name=req.dataset_name,
            summary=f"Profiled {res['summary']['rows']} rows, {res['summary']['columns']} cols. Completeness: {res['summary']['completeness_percentage']}%"
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

@router.get("/data/export/{artifact_id}")
def export_data_artifact(artifact_id: str):
    art = artifact_store.get_artifact(artifact_id)
    if not art or art["artifact_type"] != "data_profile":
        raise HTTPException(status_code=404, detail="Data profile artifact not found.")

    res = data_service.export_data_bundle(art["payload"])
    return Response(content=res["bytes"], media_type=res["content_type"], headers={"Content-Disposition": f"attachment; filename={res['filename']}"})

# --- ML Endpoints ---
@router.post("/ml/train", summary="Train ML model with multi-model comparison")
def train_ml_model(req: MLTrainRequest):
    """Train and evaluate models for classification, regression, or clustering (kmeans, mean_shift)."""
    try:
        res = ml_service.train_and_compare(
            csv_text=req.csv_text,
            target_column=req.target_column,
            primary_model_name=req.model_name,
            task_type=req.task_type,
            test_size=req.test_size
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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

    # Strip non-JSON-serializable Python references (*_ref) from direct HTTP response
    clean_res = {k: v for k, v in res.items() if not k.endswith("_ref")}

    return {
        "ml_result": clean_res,
        "artifact": artifact
    }

@router.post("/ml/predict")
def predict_instance(req: MLPredictRequest):
    art = artifact_store.get_artifact(req.ml_artifact_id)
    if not art or art["artifact_type"] != "ml_model_result":
        raise HTTPException(status_code=404, detail="ML model result artifact not found.")

    payload = dict(art["payload"])
    refs = artifact_store.get_model_refs(req.ml_artifact_id)
    if refs:
        payload.update(refs)

    res = ml_service.predict_instance(payload, req.instance_data)
    if not res.get("prediction_available"):
        raise HTTPException(status_code=400, detail=res.get("error"))

    return res

@router.get("/ml/export/{artifact_id}")
def export_ml_artifact(artifact_id: str):
    art = artifact_store.get_artifact(artifact_id)
    if not art or art["artifact_type"] != "ml_model_result":
        raise HTTPException(status_code=404, detail="ML model result artifact not found.")

    res = ml_service.export_ml_bundle(art["payload"])
    return Response(content=res["bytes"], media_type=res["content_type"], headers={"Content-Disposition": f"attachment; filename={res['filename']}"})

# --- Artifact Endpoints ---
@router.get("/artifacts")
def list_artifacts(artifact_type: Optional[str] = None):
    return {"artifacts": artifact_store.list_artifacts(artifact_type)}

@router.delete("/artifacts")
def clear_artifacts():
    artifact_store.clear()
    return {"status": "cleared", "count": 0}

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

@router.post("/reports/pdf")
def generate_pdf_report(req: ReportRequest):
    comp_art = artifact_store.get_artifact(req.compiler_artifact_id) if req.compiler_artifact_id else None
    if not comp_art or comp_art.get("artifact_type") != "compiler_analysis":
        raise HTTPException(status_code=404, detail="Compiler analysis artifact not found for PDF generation.")

    from app.reports.pdf_generator import CompilerPDFReportGenerator
    pdf_gen = CompilerPDFReportGenerator()
    pdf_bytes = pdf_gen.generate_pdf(comp_art["payload"], title=req.title or "Compiler Intelligence Report")
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=CodePulse_Compiler_Report.pdf"})

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
                "laboratory_concepts": [
                    "Multi-format Dataset Ingestion (CSV/JSON/Excel)", "Statistical Profiling & Moments",
                    "Automated Quality Audit (Duplicates/Outliers/Nulls)", "Data Cleaning & Imputation",
                    "Pearson & Spearman Rank Correlation", "Time-Series Aggregation & Trend Analysis",
                    "Calendar Heatmap Activity Grid", "Automatic Visualization Recommendation Engine"
                ],
                "codepulse_features": [
                    "Multi-format file loader", "Descriptive moments summary (Mean/Std/IQR/Skewness)",
                    "Audit issue table with severity & recommendations", "Missing value auto-imputer & scaler",
                    "Correlation heatmap & covariance matrix", "Daily/weekly resampling & SMA moving averages",
                    "Date intensity activity heatmap", "Deterministic chart rule recommender"
                ]
            },
            {
                "domain": "Machine Learning",
                "laboratory_concepts": [
                    "Data Leakage Prevention Pipeline", "Supervised Classification & Regression",
                    "Unsupervised K-Means & Mean-Shift Clustering", "Model Comparison Matrix",
                    "K-Fold Cross Validation", "Class Imbalance Warning Guard",
                    "Feature Importance & Prediction Explainability", "Feature Compatibility Schema Guard"
                ],
                "codepulse_features": [
                    "Training-set fitted Scalers & Encoders", "Random Forest / Decision Tree / Logistic Regression / SVM / K-Means studio",
                    "Multi-model performance comparison table", "K-Fold mean & std score evaluator",
                    "Majority class >80% warning banner", "Feature contribution breakdown",
                    "Mandatory feature schema compatibility checker before prediction"
                ]
            },
            {
                "domain": "JavaScript & Web Engineering",
                "laboratory_concepts": ["Modern Reactive Architecture", "Dynamic Canvas/SVG Graphics", "Asynchronous API Integration", "Schema-Driven Artifact Exchange"],
                "codepulse_features": ["React 18 + TypeScript Developer Workspace", "Interactive CFG/Heatmap SVG renderers", "FastAPI REST client", "Cross-Engine Interoperability Pipelines"]
            }
        ]
    }

# --- Visualization Request Models ---
class VisualProfileRequest(BaseModel):
    dataset_content: Optional[str] = None
    dataset: Optional[List[Dict[str, Any]]] = None
    columns: Optional[List[str]] = None
    file_type: str = "csv"
    dataset_name: str = "Uploaded Dataset"

class VisualAnomalyRequest(BaseModel):
    dataset_content: Optional[str] = None
    dataset: Optional[List[Dict[str, Any]]] = None
    columns: Optional[List[str]] = None
    method: str = "iqr"

class VisualTimeSeriesRequest(BaseModel):
    dataset_content: Optional[str] = None
    dataset: Optional[List[Dict[str, Any]]] = None
    date_column: str
    value_column: str
    frequency: str = "D"

class VisualHierarchyRequest(BaseModel):
    dataset_content: Optional[str] = None
    dataset: Optional[List[Dict[str, Any]]] = None
    hierarchy_columns: List[str]
    value_column: Optional[str] = None

class VisualStoryRequest(BaseModel):
    dataset_content: Optional[str] = None
    dataset: Optional[List[Dict[str, Any]]] = None
    columns: Optional[List[str]] = None
    compiler_data: Optional[Dict[str, Any]] = None

class VisualQueryRequest(BaseModel):
    query_text: str
    artifact_id: Optional[str] = None
    dataset: Optional[List[Dict[str, Any]]] = None
    numeric_columns: Optional[List[str]] = None
    compiler_data: Optional[Dict[str, Any]] = None

class VisualExperimentExecuteRequest(BaseModel):
    experiment_id: str
    sample_csv: Optional[str] = None

def _extract_visualization_dataframe(req: Any) -> pd.DataFrame:
    if getattr(req, "dataset", None) is not None and len(req.dataset) > 0:
        return pd.DataFrame(req.dataset)
    if getattr(req, "dataset_content", None) is not None and req.dataset_content.strip():
        file_type = getattr(req, "file_type", "csv")
        return visualization_service.parse_dataset(req.dataset_content, file_type)
    raise ValueError("Neither dataset list nor dataset_content was provided.")

# --- Visualization Intelligence Endpoints ---
@router.post("/visualization/profile")
def profile_visualization_dataset(req: VisualProfileRequest):
    try:
        df = _extract_visualization_dataframe(req)
        profile = visualization_service.profile_dataset(df, req.dataset_name)
        recommendations = visualization_service.recommend_visualizations(profile)
        correlations = visualization_service.compute_correlation_matrix(df)
        anomalies = visualization_service.detect_anomalies(df)
        story = visualization_service.generate_visual_story(profile_data=profile)
        return {
            "profile": profile,
            "recommendations": recommendations,
            "correlations": correlations,
            "anomalies": anomalies,
            "story": story
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/visualization/recommendations")
def recommend_visualizations(req: VisualProfileRequest):
    try:
        df = _extract_visualization_dataframe(req)
        profile = visualization_service.profile_dataset(df, req.dataset_name)
        recs = visualization_service.recommend_visualizations(profile)
        return {"recommendations": recs}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/visualization/correlation")
def analyze_correlation(req: VisualProfileRequest):
    try:
        df = _extract_visualization_dataframe(req)
        if req.columns:
            valid_cols = [c for c in req.columns if c in df.columns]
            if len(valid_cols) >= 2:
                df = df[valid_cols]
        res = visualization_service.compute_correlation_matrix(df)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/visualization/anomalies")
def analyze_anomalies(req: VisualAnomalyRequest):
    try:
        df = _extract_visualization_dataframe(req)
        if req.columns:
            valid_cols = [c for c in req.columns if c in df.columns]
            if valid_cols:
                df = df[valid_cols]
        res = visualization_service.detect_anomalies(df, method=req.method)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/visualization/story")
def get_visual_story(req: VisualStoryRequest):
    try:
        profile = None
        if (req.dataset is not None and len(req.dataset) > 0) or (req.dataset_content and req.dataset_content.strip()):
            df = _extract_visualization_dataframe(req)
            profile = visualization_service.profile_dataset(df)
        story = visualization_service.generate_visual_story(compiler_data=req.compiler_data, profile_data=profile)
        return {"steps": story}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/visualization/time-series")
def analyze_time_series(req: VisualTimeSeriesRequest):
    try:
        df = _extract_visualization_dataframe(req)
        res = visualization_service.analyze_time_series(df, req.date_column, req.value_column, req.frequency)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/visualization/hierarchy")
def analyze_hierarchy(req: VisualHierarchyRequest):
    try:
        df = _extract_visualization_dataframe(req)
        res = visualization_service.generate_hierarchy_data(df, req.hierarchy_columns, req.value_column)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/visualization/lineage")
def get_artifact_lineage():
    arts = artifact_store.list_artifacts()
    res = visualization_service.build_artifact_lineage_graph(arts)
    return res

@router.post("/visualization/query")
def parse_visual_query(req: VisualQueryRequest):
    if not req.query_text or not req.query_text.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")
    try:
        compiler_data = req.compiler_data
        if compiler_data is None and req.artifact_id:
            art = artifact_store.get_artifact(req.artifact_id)
            if art and art.get("artifact_type") == "compiler_analysis":
                compiler_data = art.get("payload")
        if compiler_data is None:
            comp_arts = artifact_store.list_artifacts("compiler_analysis")
            if comp_arts:
                compiler_data = comp_arts[0].get("payload")

        dataset = req.dataset
        if dataset is None:
            data_arts = artifact_store.list_artifacts("data_profile")
            if not data_arts:
                data_arts = artifact_store.list_artifacts("dataset_profile")
            if data_arts and "dataset" in data_arts[0].get("payload", {}):
                dataset = data_arts[0]["payload"]["dataset"]

        res = visualization_service.parse_visual_query(
            query_text=req.query_text,
            compiler_data=compiler_data,
            dataset=dataset,
            numeric_columns=req.numeric_columns
        )
        return res
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/visualization/experiments")
def get_lab_experiments():
    return {"experiments": visualization_service.get_lab_experiments()}

@router.post("/visualization/experiments/execute")
def execute_lab_experiment(req: VisualExperimentExecuteRequest):
    try:
        res = visualization_service.execute_lab_experiment(req.experiment_id, req.sample_csv)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

