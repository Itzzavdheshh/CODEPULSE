from typing import List, Dict, Any
from .service import CompilerService

class MultiFileProjectAnalyzer:
    """
    Analyzes multi-file Java projects, computing per-file static diagnostic pipelines
    and aggregating project-level software metrics and class dependency maps.
    """
    def __init__(self):
        self.compiler_service = CompilerService()

    def analyze_project(self, files: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Input: list of {"file_name": "Main.java", "source_code": "..."}
        """
        file_analyses = []
        total_loc = 0
        total_tokens = 0
        total_diagnostics = 0
        total_errors = 0
        max_complexity = 0
        class_registry = set()
        dependencies = []

        for item in files:
            fname = item.get("relative_path") or item.get("file_name", "Source.java")
            code = item.get("source_code", "")
            
            analysis = self.compiler_service.analyze_source(code, fname)
            analysis["relative_path"] = item.get("relative_path", fname)
            file_analyses.append(analysis)

            # Aggregate stats
            total_loc += analysis["stats"]["lines"]
            total_tokens += analysis["stats"]["tokens_count"]
            total_diagnostics += len(analysis["diagnostics"])
            total_errors += analysis["stats"]["errors_count"]
            comp = analysis["metrics"]["cyclomatic_complexity"]
            max_complexity = max(max_complexity, comp)

            # Collect declared classes
            for sym in analysis.get("symbol_table", []):
                if sym.get("category") == "class":
                    class_registry.add(sym["name"])

        # Detect cross-file dependencies
        for analysis in file_analyses:
            src_file = analysis.get("relative_path") or analysis["file_name"]
            # classes declared inside this file
            own_classes = {sym["name"] for sym in analysis.get("symbol_table", []) if sym.get("category") == "class"}
            for token in analysis.get("tokens", []):
                val = token.get("value")
                if token.get("type") == "IDENTIFIER" and val in class_registry and val not in own_classes:
                    dep_item = {"from_file": src_file, "uses_class": val}
                    if dep_item not in dependencies:
                        dependencies.append(dep_item)

        project_risk = "LOW"
        if max_complexity > 20 or total_errors > 0:
            project_risk = "CRITICAL"
        elif max_complexity > 10:
            project_risk = "HIGH"
        elif max_complexity > 5:
            project_risk = "MODERATE"

        return {
            "project_name": "MultiFileJavaProject",
            "files_count": len(files),
            "files_analyzed": len(files),
            "total_loc": total_loc,
            "total_tokens": total_tokens,
            "total_diagnostics": total_diagnostics,
            "total_errors": total_errors,
            "max_cyclomatic_complexity": max_complexity,
            "project_risk_level": project_risk,
            "declared_classes": sorted(list(class_registry)),
            "dependencies": dependencies,
            "file_analyses": file_analyses
        }
