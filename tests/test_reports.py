import pytest
from app.reports.generator import IntegratedReportGenerator

def test_compiler_report_generation():
    gen = IntegratedReportGenerator()
    compiler_data = {
        "file_name": "PaymentGateway.java",
        "stats": {"lines": 45, "characters": 1200, "tokens_count": 140, "keywords_count": 25, "identifiers_count": 30, "errors_count": 0, "warnings_count": 1},
        "metrics": {"total_loc": 45, "cyclomatic_complexity": 8, "cognitive_complexity": 6, "maintainability_index": "HIGH", "risk_level": "MODERATE"},
        "preprocessing": {"comment_stats": {"single_line_comments_count": 3, "block_comments_count": 1, "total_comment_lines": 5}, "macros": [], "macro_expansions": []},
        "tokens": [{"type": "KEYWORD", "value": "public", "line": 1, "column": 1}],
        "ast": {"node_type": "ClassDecl", "children": []},
        "symbol_table": [{"name": "calculate", "category": "method", "data_type": "int", "scope": "global", "line": 2}],
        "diagnostics": [{"severity": "warning", "phase": "Semantic", "line": 14, "column": 5, "message": "Implicit float to int cast"}],
        "intermediate_code": [{"op": "=", "arg1": "10", "arg2": "", "result": "t1", "line": 3}],
        "optimized_code": [{"op": "=", "arg1": "10", "arg2": "", "result": "t1", "line": 3}],
        "cfg": {"nodes": [{"id": "B0", "label": "Entry", "instructions_count": 2}], "edges": []},
        "target_code": {"target_architecture": "JVM Assembly", "instructions_count": 12, "max_stack_depth": 3}
    }

    rep = gen.generate_compiler_report(compiler_data)
    content = rep["markdown_content"]

    assert "Compiler Intelligence Report" in content
    assert "PaymentGateway.java" in content
    assert "Lines of Code (LOC)" in content
    assert "45" in content
    assert "Cyclomatic Complexity V(G):** 8" in content
    assert "Maintainability Index:** `HIGH`" in content

def test_ai_report_generation():
    gen = IntegratedReportGenerator()
    data_profile = {
        "dataset_name": "SoftwareMetrics.csv",
        "summary": {"rows": 11, "columns": 7, "completeness_percentage": 100, "numeric_columns": 5, "categorical_columns": 2},
        "profile": {"shape": {"rows": 11, "columns": 7}, "completeness_percentage": 100},
        "quality": {"issues_detected": []}
    }
    ml_results = {
        "model_name": "random_forest",
        "task_type": "classification",
        "target_column": "risk_level",
        "features": ["loc", "cyclomatic_complexity", "cognitive_complexity"],
        "evaluation": {"accuracy": 0.92, "precision": 0.90, "recall": 0.91, "f1_score": 0.905, "roc_auc": 0.95, "cv_mean_accuracy": 0.88, "cv_std": 0.04},
        "feature_importances": [{"feature_name": "cyclomatic_complexity", "importance": 0.55}]
    }

    rep = gen.generate_ai_report(data_profile, ml_results)
    content = rep["markdown_content"]

    assert "AI Intelligence Report" in content
    assert "SoftwareMetrics.csv" in content
    assert "RANDOM_FOREST" in content
    assert "92.00%" in content

def test_visual_report_generation():
    gen = IntegratedReportGenerator()
    rep = gen.generate_visual_report()
    content = rep["markdown_content"]

    assert "Visual Intelligence & Risk Report" in content
    assert "Risk Profile Distribution" in content
