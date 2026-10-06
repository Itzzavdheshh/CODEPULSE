from typing import Dict, Any, List
from .lexer import Lexer
from .parser import Parser
from .semantic import SemanticAnalyzer
from .ir import IRGenerator
from .optimizer import TACOptimizer
from .cfg import CFGBuilder
from .metrics import CodeMetricsCalculator

class CompilerService:
    """
    Main Compiler Orchestrator Engine.
    Runs Lexical, Syntax, Semantic, IR, Optimization, CFG, and Metrics analysis.
    Returns complete compiler_analysis structured payload.
    """
    def analyze_source(self, source_code: str, file_name: str = "Source.java") -> Dict[str, Any]:
        # 1. Lexical Analysis
        lexer = Lexer(source_code)
        tokens, lex_diagnostics = lexer.tokenize()

        # 2. Syntax Analysis & AST Construction
        parser = Parser(tokens)
        ast, parse_diagnostics = parser.parse()

        # 3. Semantic Analysis & Symbol Table
        semantic_analyzer = SemanticAnalyzer()
        symbols, sem_diagnostics = semantic_analyzer.analyze(ast)

        # 4. IR Generation (Three-Address Code)
        ir_generator = IRGenerator()
        tac_quads = ir_generator.generate(ast)

        # 5. Optimization
        optimizer = TACOptimizer()
        opt_quads, opt_transformations = optimizer.optimize(tac_quads)

        # 6. Basic Blocks & CFG Generation
        cfg_builder = CFGBuilder()
        cfg_data = cfg_builder.build_cfg(opt_quads)

        # 7. Code Metrics & Risk Analysis
        metrics_calculator = CodeMetricsCalculator()
        metrics = metrics_calculator.calculate(source_code, tokens, cfg_data)

        # Combine diagnostics
        all_diagnostics = lex_diagnostics + parse_diagnostics + sem_diagnostics

        stats = {
            "lines": len(source_code.split('\n')),
            "characters": len(source_code),
            "tokens_count": len(tokens),
            "keywords_count": metrics["keywords_count"],
            "identifiers_count": metrics["identifiers_count"],
            "diagnostics_count": len(all_diagnostics),
            "errors_count": sum(1 for d in all_diagnostics if d.get("severity") == "error"),
            "warnings_count": sum(1 for d in all_diagnostics if d.get("severity") == "warning")
        }

        return {
            "source_code": source_code,
            "file_name": file_name,
            "stats": stats,
            "tokens": [t.to_dict() for t in tokens if t.type != "EOF"],
            "ast": ast.to_dict(),
            "symbol_table": symbols,
            "diagnostics": all_diagnostics,
            "intermediate_code": tac_quads,
            "optimized_code": opt_quads,
            "optimization_transformations": opt_transformations,
            "basic_blocks": cfg_data.get("blocks", []),
            "cfg": {
                "nodes": cfg_data.get("nodes", []),
                "edges": cfg_data.get("edges", [])
            },
            "metrics": metrics
        }
