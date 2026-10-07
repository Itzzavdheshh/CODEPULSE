from typing import Dict, Any, List
from .preprocessor import Preprocessor
from .lexer import Lexer
from .parser import Parser
from .semantic import SemanticAnalyzer
from .ir import IRGenerator
from .optimizer import TACOptimizer
from .cfg import CFGBuilder
from .metrics import CodeMetricsCalculator
from .target_codegen import TargetCodeGenerator

class CompilerService:
    """
    Main Compiler Intelligence Engine Orchestrator.
    Runs Preprocessing, Lexical Analysis, Keyword Frequency Analysis, Syntax Parsing, AST Construction,
    Hierarchical Symbol Table & Semantic Diagnostics, Three-Address Code (TAC), Constant Folding Optimization,
    Basic Block Partitioning, Control-Flow Graph (CFG), Code Metrics, and Educational JVM Target Assembly Generation.
    """
    def __init__(self):
        self.preprocessor = Preprocessor()
        self.target_codegen = TargetCodeGenerator()

    def analyze_source(self, source_code: str, file_name: str = "Source.java") -> Dict[str, Any]:
        # 1. Preprocessing Stage (Macros & Comments)
        prep_data = self.preprocessor.preprocess(source_code)
        clean_code = prep_data["cleaned_source"]

        # 2. Lexical Analysis
        lexer = Lexer(clean_code)
        tokens, lex_diagnostics = lexer.tokenize()

        # Keyword Frequency Analysis
        keyword_freq: Dict[str, int] = {}
        for t in tokens:
            if t.type == "KEYWORD":
                keyword_freq[t.value] = keyword_freq.get(t.value, 0) + 1

        # 3. Syntax Analysis & AST Construction
        parser = Parser(tokens)
        ast, parse_diagnostics = parser.parse()

        # 4. Semantic Analysis & Hierarchical Symbol Table
        semantic_analyzer = SemanticAnalyzer()
        symbols, sem_diagnostics = semantic_analyzer.analyze(ast)

        # 5. IR Generation (Three-Address Code)
        ir_generator = IRGenerator()
        tac_quads = ir_generator.generate(ast)

        # 6. Optimization (Constant Folding & Dead Code Elimination)
        optimizer = TACOptimizer()
        opt_quads, opt_transformations = optimizer.optimize(tac_quads)

        # 7. Basic Blocks & CFG Generation
        cfg_builder = CFGBuilder()
        cfg_data = cfg_builder.build_cfg(opt_quads)

        # 8. Target JVM-like Assembly Code Generation
        target_code = self.target_codegen.generate_target_code(opt_quads)

        # 9. Code Metrics & Risk Analysis
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
            "preprocessing": prep_data,
            "keyword_frequency": keyword_freq,
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
            "target_code": target_code,
            "metrics": metrics
        }
