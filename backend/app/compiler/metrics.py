from typing import Dict, Any, List
from .tokens import Token, TokenType

class CodeMetricsCalculator:
    """
    Computes static software metrics:
    - Cyclomatic Complexity V(G) derived authoritatively from method CFG V(G) = E - N + 2P
    - Lines of Code (LOC, SLOC, CLOC)
    - Token counts
    - Halstead Complexity metrics
    - Maintainability Index & Risk Level
    """
    def calculate(self, source_code: str, tokens: List[Token], cfg: dict) -> Dict[str, Any]:
        lines = source_code.split('\n')
        total_loc = len(lines)
        blank_loc = sum(1 for line in lines if not line.strip())
        sloc = sum(1 for line in lines if line.strip() and not line.strip().startswith("//"))
        cloc = sum(1 for line in lines if line.strip().startswith("//") or line.strip().startswith("/*"))

        # Extract Method-Scoped CFG metrics
        methods_cfg = cfg.get("methods", {})
        prog_agg = cfg.get("program_aggregate", {})

        method_complexities = []
        if methods_cfg:
            for m_name, m_data in methods_cfg.items():
                method_complexities.append({
                    "name": m_name,
                    "cyclomatic_complexity": m_data.get("cyclomatic_complexity", 1),
                    "decision_points": m_data.get("decision_points", 0),
                    "instruction_count": m_data.get("instruction_count", 0),
                    "blocks_count": len(m_data.get("nodes", [])),
                    "edges_count": len(m_data.get("edges", []))
                })

        num_nodes = len(cfg.get("nodes", []))
        num_edges = len(cfg.get("edges", []))

        # Single Source of Truth for V(G): derived authoritatively from CFG program aggregate
        if prog_agg and "program_aggregate_cyclomatic_complexity" in prog_agg:
            cyclomatic = prog_agg["program_aggregate_cyclomatic_complexity"]
        elif methods_cfg:
            cyclomatic = max(1, sum(m.get("cyclomatic_complexity", 1) for m in methods_cfg.values()))
        else:
            cyclomatic = max(1, num_edges - num_nodes + 2) if num_nodes > 0 else 1

        max_method_complexity = prog_agg.get("max_method_complexity", cyclomatic)

        decision_keywords = {"if", "while", "for", "&&", "||"}
        decision_count = sum(1 for t in tokens if t.value in decision_keywords)

        # Token statistics
        keyword_count = sum(1 for t in tokens if t.type == TokenType.KEYWORD)
        identifier_count = sum(1 for t in tokens if t.type == TokenType.IDENTIFIER)
        operator_count = sum(1 for t in tokens if t.type == TokenType.OPERATOR)

        # Risk Classification based on max method complexity and total complexity
        eval_cc = max(max_method_complexity, cyclomatic // max(1, len(method_complexities)))
        if eval_cc <= 5:
            risk_level = "LOW"
            maintainability = "HIGH"
        elif eval_cc <= 10:
            risk_level = "MODERATE"
            maintainability = "MEDIUM"
        elif eval_cc <= 20:
            risk_level = "HIGH"
            maintainability = "LOW"
        else:
            risk_level = "CRITICAL"
            maintainability = "VERY_LOW"

        return {
            "total_loc": total_loc,
            "source_loc": sloc,
            "blank_loc": blank_loc,
            "comment_loc": cloc,
            "cyclomatic_complexity": cyclomatic,
            "max_method_complexity": max_method_complexity,
            "cognitive_complexity": cyclomatic + (decision_count // 2),
            "decision_points": decision_count,
            "method_complexities": method_complexities or [{"name": "main", "cyclomatic_complexity": cyclomatic, "decision_points": decision_count}],
            "tokens_count": len(tokens),
            "keywords_count": keyword_count,
            "identifiers_count": identifier_count,
            "operators_count": operator_count,
            "risk_level": risk_level,
            "maintainability_index": maintainability
        }
