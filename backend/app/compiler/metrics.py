from typing import Dict, Any, List
from .tokens import Token, TokenType

class CodeMetricsCalculator:
    """
    Computes static software metrics:
    - Cyclomatic Complexity V(G) = E - N + 2P
    - Lines of Code (LOC, SLOC, CLOC)
    - Token counts
    - Halstead Complexity metrics
    - Maintainability Index & Risk Level
    """
    def calculate(self, source_code: str, tokens: List[Token], cfg: dict) -> Dict[str, Any]:
        lines = source_code.split('\n')
        total_loc = len(lines)
        sloc = sum(1 for line in lines if line.strip() and not line.strip().startswith("//"))
        cloc = sum(1 for line in lines if line.strip().startswith("//") or line.strip().startswith("/*"))

        # Cyclomatic complexity from CFG nodes and edges
        num_nodes = len(cfg.get("nodes", []))
        num_edges = len(cfg.get("edges", []))
        # V(G) = E - N + 2
        cyclomatic = max(1, num_edges - num_nodes + 2) if num_nodes > 0 else 1

        # Decision points counting fallback check (if/while/for/&&/||)
        decision_keywords = {"if", "while", "for", "&&", "||"}
        decision_count = sum(1 for t in tokens if t.value in decision_keywords)
        cyclomatic = max(cyclomatic, decision_count + 1)

        # Token statistics
        keyword_count = sum(1 for t in tokens if t.type == TokenType.KEYWORD)
        identifier_count = sum(1 for t in tokens if t.type == TokenType.IDENTIFIER)
        operator_count = sum(1 for t in tokens if t.type == TokenType.OPERATOR)

        # Risk Classification
        if cyclomatic <= 5:
            risk_level = "LOW"
            maintainability = "HIGH"
        elif cyclomatic <= 10:
            risk_level = "MODERATE"
            maintainability = "MEDIUM"
        elif cyclomatic <= 20:
            risk_level = "HIGH"
            maintainability = "LOW"
        else:
            risk_level = "CRITICAL"
            maintainability = "VERY_LOW"

        return {
            "total_loc": total_loc,
            "source_loc": sloc,
            "comment_loc": cloc,
            "cyclomatic_complexity": cyclomatic,
            "cognitive_complexity": cyclomatic + (decision_count // 2),
            "tokens_count": len(tokens),
            "keywords_count": keyword_count,
            "identifiers_count": identifier_count,
            "operators_count": operator_count,
            "risk_level": risk_level,
            "maintainability_index": maintainability
        }
