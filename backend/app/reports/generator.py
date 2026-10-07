import datetime
from typing import Dict, Any, List, Optional

class IntegratedReportGenerator:
    """
    Generates cohesive Markdown/HTML Executive and Academic Reports
    combining Compiler AST/metrics, Data Profiling, and ML Model predictions.
    """
    def generate_report(
        self,
        compiler_data: Optional[Dict[str, Any]] = None,
        data_profile: Optional[Dict[str, Any]] = None,
        ml_results: Optional[Dict[str, Any]] = None,
        title: str = "CodePulse Integrated Intelligence Report"
    ) -> Dict[str, Any]:
        timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        md_lines = [
            f"# {title}",
            f"**Generated Date:** {timestamp}  ",
            f"**Platform:** CodePulse — Intelligent Software Analysis & Engineering Intelligence Platform  ",
            "---",
            "## Executive Summary\n",
            "This report consolidates multi-engine analysis across source code compiler diagnostics, statistical dataset profiling, and predictive machine learning models."
        ]

        # 1. Compiler Section
        if compiler_data:
            stats = compiler_data.get("stats", {})
            metrics = compiler_data.get("metrics", {})
            diagnostics = compiler_data.get("diagnostics", [])

            md_lines.extend([
                "\n### 1. Compiler Intelligence Analysis",
                f"- **Source File:** `{compiler_data.get('file_name', 'Source.java')}`",
                f"- **Lines of Code (LOC):** {stats.get('lines', 0)}",
                f"- **Token Density:** {stats.get('tokens_count', 0)} tokens",
                f"- **Cyclomatic Complexity V(G):** {metrics.get('cyclomatic_complexity', 1)}",
                f"- **Risk Classification:** `{metrics.get('risk_level', 'LOW')}`",
                f"- **Maintainability Index:** `{metrics.get('maintainability_index', 'HIGH')}`",
                f"- **Diagnostics Count:** {len(diagnostics)} (Errors: {stats.get('errors_count', 0)}, Warnings: {stats.get('warnings_count', 0)})"
            ])

            if diagnostics:
                md_lines.append("\n#### Diagnostic Findings:")
                for d in diagnostics[:5]:
                    md_lines.append(f"- `[{d.get('severity', 'error').upper()}]` Line {d.get('line', 1)}: {d.get('message')}")

        # 2. Data Section
        if data_profile:
            shape = data_profile.get("shape", {})
            md_lines.extend([
                "\n### 2. Data Intelligence & Statistical Profiling",
                f"- **Dataset:** `{data_profile.get('dataset_name', 'Dataset')}`",
                f"- **Dimensions:** {shape.get('rows', 0)} rows × {shape.get('columns', 0)} columns",
                f"- **Completeness Score:** {data_profile.get('completeness_percentage', 100)}%",
                f"- **Numeric Attributes:** {data_profile.get('numeric_columns_count', 0)}",
                f"- **Categorical Attributes:** {data_profile.get('categorical_columns_count', 0)}"
            ])

        # 3. ML Section
        if ml_results:
            eval_res = ml_results.get("evaluation", {})
            md_lines.extend([
                "\n### 3. Machine Learning Intelligence Assessment",
                f"- **Model Architecture:** `{ml_results.get('model_name', 'Model').upper()}`",
                f"- **Task Type:** `{ml_results.get('task_type', 'classification').upper()}`",
                f"- **Accuracy / Score:** {eval_res.get('accuracy', eval_res.get('r2_score', 0.0)) * 100:.2f}%",
                f"- **Precision:** {eval_res.get('precision', 0.0):.4f} | **Recall:** {eval_res.get('recall', 0.0):.4f} | **F1 Score:** {eval_res.get('f1_score', 0.0):.4f}"
            ])

            imps = ml_results.get("feature_importances", [])
            if imps:
                md_lines.append("\n#### Top Predictive Drivers:")
                for item in imps[:3]:
                    md_lines.append(f"- **{item['feature_name']}**: {item['importance']*100:.1f}% relative weight")

        md_lines.extend([
            "\n---",
            "## Recommended Next Actions",
            "1. Review any compiler diagnostics and refactor high-complexity basic blocks.",
            "2. Verify data quality metrics before deploying predictive models to production.",
            "3. Export structured JSON artifacts for full provenance reproducibility."
        ])

        report_markdown = "\n".join(md_lines)

        return {
            "title": title,
            "timestamp": timestamp,
            "markdown_content": report_markdown
        }
