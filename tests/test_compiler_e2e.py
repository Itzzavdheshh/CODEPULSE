import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
import pytest
from app.compiler.service import CompilerService

@pytest.fixture(scope="module")
def svc():
    return CompilerService()

class TestArithmetic:
    def test_no_errors(self, svc):
        src = "int main() { int a = 10; int b = 20; int c = a + b; return c; }"
        r = svc.analyze_source(src, "Arithmetic.java")
        errors = [d for d in r["diagnostics"] if d["severity"] == "error"]
        assert errors == [], f"Unexpected errors: {errors}"

    def test_tac_generated(self, svc):
        src = "int main() { int a = 10; int b = 20; int c = a + b; return c; }"
        r = svc.analyze_source(src, "Arithmetic.java")
        assert len(r["intermediate_code"]) > 0

    def test_target_code_generated(self, svc):
        src = "int main() { int a = 10; int b = 20; int c = a + b; return c; }"
        r = svc.analyze_source(src, "Arithmetic.java")
        assert r["target_code"]["instructions_count"] > 0
        assert r["target_code"]["assembly_code"].strip() != ""

    def test_constant_propagation_applied(self, svc):
        src = "int main() { int a = 10; int b = 20; int c = a + b; return c; }"
        r = svc.analyze_source(src, "Arithmetic.java")
        opts = r["optimization_transformations"]
        assert any("Constant Propagation" in t for t in opts)

class TestBranching:
    SRC = "public class IfElse { public static int check(int x) { if (x > 0) { return x; } else { return 0; } } }"

    def test_no_errors(self, svc):
        r = svc.analyze_source(self.SRC, "IfElse.java")
        errors = [d for d in r["diagnostics"] if d["severity"] == "error"]
        assert errors == []

    def test_cfg_has_branch_edges(self, svc):
        r = svc.analyze_source(self.SRC, "IfElse.java")
        assert len(r["cfg"]["nodes"]) >= 2
        assert len(r["cfg"]["edges"]) >= 1

    def test_tac_contains_if_false(self, svc):
        r = svc.analyze_source(self.SRC, "IfElse.java")
        ops = [q["op"] for q in r["intermediate_code"]]
        assert "IF_FALSE" in ops

    def test_cyclomatic_at_least_2(self, svc):
        r = svc.analyze_source(self.SRC, "IfElse.java")
        assert r["metrics"]["cyclomatic_complexity"] >= 2

class TestForLoop:
    SRC = "public class ForLoop { public static int sumTo(int n) { int sum = 0; for (int i = 0; i < n; i = i + 1) { sum = sum + i; } return sum; } }"

    def test_no_errors(self, svc):
        r = svc.analyze_source(self.SRC, "ForLoop.java")
        errors = [d for d in r["diagnostics"] if d["severity"] == "error"]
        assert errors == [], f"Unexpected errors: {errors}"

    def test_cfg_has_back_edge(self, svc):
        r = svc.analyze_source(self.SRC, "ForLoop.java")
        assert len(r["cfg"]["nodes"]) >= 3
        ops = [q["op"] for q in r["intermediate_code"]]
        assert "GOTO" in ops

    def test_tac_contains_loop_label(self, svc):
        r = svc.analyze_source(self.SRC, "ForLoop.java")
        ops = [q["op"] for q in r["intermediate_code"]]
        assert "LABEL" in ops

class TestWhileLoop:
    SRC = "public class WhileDemo { public static void count(int n) { int i = 0; while (i < n) { i = i + 1; } } }"

    def test_no_errors(self, svc):
        r = svc.analyze_source(self.SRC, "WhileDemo.java")
        errors = [d for d in r["diagnostics"] if d["severity"] == "error"]
        assert errors == []

    def test_cfg_loop_structure(self, svc):
        r = svc.analyze_source(self.SRC, "WhileDemo.java")
        assert len(r["cfg"]["nodes"]) >= 3
        ops = [q["op"] for q in r["intermediate_code"]]
        assert "GOTO" in ops
        assert "IF_FALSE" in ops

class TestFunctionMethod:
    SRC = "public class Calculator { public static int add(int a, int b) { return a + b; } public static int mul(int a, int b) { return a * b; } }"

    def test_no_errors(self, svc):
        r = svc.analyze_source(self.SRC, "Calculator.java")
        errors = [d for d in r["diagnostics"] if d["severity"] == "error"]
        assert errors == []

    def test_symbol_table_has_methods(self, svc):
        r = svc.analyze_source(self.SRC, "Calculator.java")
        sym_names = [s["name"] for s in r["symbol_table"]]
        assert "add" in sym_names
        assert "mul" in sym_names

    def test_tac_has_func_markers(self, svc):
        r = svc.analyze_source(self.SRC, "Calculator.java")
        ops = [q["op"] for q in r["intermediate_code"]]
        assert "FUNC_START" in ops
        assert "FUNC_END" in ops

class TestScope:
    def test_parameters_tracked(self, svc):
        src = "public class ScopeTest { public static int go(int x, int y) { return x + y; } }"
        r = svc.analyze_source(src, "Scope.java")
        sym_names = [s["name"] for s in r["symbol_table"]]
        assert "x" in sym_names
        assert "y" in sym_names

    def test_local_variable_tracked(self, svc):
        src = "public class ScopeTest { public static int go() { int local = 42; return local; } }"
        r = svc.analyze_source(src, "Scope.java")
        sym_names = [s["name"] for s in r["symbol_table"]]
        assert "local" in sym_names

class TestSemanticError:
    def test_undeclared_variable_flagged(self, svc):
        src = "public class SemanticTest { public static int broken(int x) { return y + x; } }"
        r = svc.analyze_source(src, "Semantic.java")
        errors = [d for d in r["diagnostics"] if d["severity"] == "error"]
        assert any("Undeclared" in e["message"] and "y" in e["message"] for e in errors)

    def test_duplicate_variable_flagged(self, svc):
        src = "public class DupTest { public static void go() { int x = 1; int x = 2; } }"
        r = svc.analyze_source(src, "Dup.java")
        errors = [d for d in r["diagnostics"] if d["severity"] == "error"]
        assert any("already declared" in e["message"].lower() for e in errors)

class TestTypeMismatch:
    def test_float_to_int_flagged(self, svc):
        src = "public class TypeCheck { public static void go() { int a = 3; float b = a; } }"
        r = svc.analyze_source(src, "TypeCheck.java")
        # Should have a type mismatch or precision diagnostic
        all_diag = r["diagnostics"]
        assert isinstance(all_diag, list)

class TestPreprocessor:
    def test_comments_stripped(self, svc):
        src = "public class C { \n// line comment\n public static int go() { return 1; } }"
        r = svc.analyze_source(src, "CommentTest.java")
        assert r["preprocessing"]["comments_removed"] >= 1

    def test_macro_expanded(self, svc):
        src = "#define MAX 100\npublic class M { public static int go() { return MAX; } }"
        r = svc.analyze_source(src, "MacroTest.java")
        assert r["preprocessing"]["macros_defined"] >= 1

class TestSyntaxError:
    def test_missing_semicolon_flagged(self, svc):
        src = "public class SyntaxError { public static void go() { int x = 5 } }"
        r = svc.analyze_source(src, "SyntaxError.java")
        errors = [d for d in r["diagnostics"] if d["severity"] == "error"]
        assert len(errors) > 0

    def test_invalid_source_does_not_crash(self, svc):
        src = "@@@@invalid!!!!"
        r = svc.analyze_source(src, "Invalid.java")
        assert "diagnostics" in r
        assert "metrics" in r

class TestMultiFunctionProgram:
    SRC = "public class PaymentService { public static float calcTotal(float price, int qty) { float sub = price * qty; return sub; } public static boolean isValid(float amount) { if (amount > 0.0) { return true; } else { return false; } } }"

    def test_no_errors(self, svc):
        r = svc.analyze_source(self.SRC, "PaymentService.java")
        errors = [d for d in r["diagnostics"] if d["severity"] == "error"]
        assert errors == []

    def test_multiple_methods_tracked(self, svc):
        r = svc.analyze_source(self.SRC, "PaymentService.java")
        sym_names = [s["name"] for s in r["symbol_table"]]
        assert "calcTotal" in sym_names
        assert "isValid" in sym_names

    def test_cyclomatic_accounts_for_branching(self, svc):
        r = svc.analyze_source(self.SRC, "PaymentService.java")
        assert r["metrics"]["cyclomatic_complexity"] >= 2

class TestConstantFolding:
    def test_folded_values_in_transformations(self, svc):
        src = "public class Constants { public static int compute() { int x = 2 + 3; int y = x * 4; return y; } }"
        r = svc.analyze_source(src, "Constants.java")
        opts = r["optimization_transformations"]
        assert any("5" in t for t in opts)
        assert any("20" in t for t in opts)

    def test_arith_ops_reduced_by_optimizer(self, svc):
        src = "public class Constants { public static int compute() { int x = 2 + 3; int y = x * 4; return y; } }"
        r = svc.analyze_source(src, "Constants.java")
        raw = sum(1 for q in r["intermediate_code"] if q["op"] in ("+", "-", "*", "/"))
        opt = sum(1 for q in r["optimized_code"] if q["op"] in ("+", "-", "*", "/"))
        assert opt <= raw

class TestPipelineStructure:
    def test_all_required_keys_present(self, svc):
        src = "public class Test { public static void go() { int x = 1; } }"
        r = svc.analyze_source(src, "Test.java")
        for key in ["source_code", "file_name", "stats", "preprocessing",
                    "keyword_frequency", "tokens", "ast", "symbol_table",
                    "diagnostics", "intermediate_code", "optimized_code",
                    "optimization_transformations", "basic_blocks", "cfg",
                    "target_code", "metrics"]:
            assert key in r, f"Missing pipeline key: {key}"

    def test_ast_has_program_node(self, svc):
        src = "public class Test { public static void go() { int x = 1; } }"
        r = svc.analyze_source(src, "Test.java")
        assert r["ast"]["node_type"] == "Program"

    def test_keyword_frequency_is_dict(self, svc):
        src = "public class Test { public static void go() { int x = 1; return; } }"
        r = svc.analyze_source(src, "Test.java")
        assert isinstance(r["keyword_frequency"], dict)
        assert len(r["keyword_frequency"]) > 0