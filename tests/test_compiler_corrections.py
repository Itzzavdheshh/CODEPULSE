import pytest
from app.compiler.service import CompilerService
from app.compiler.target_codegen import TargetCodeGenerator
from app.compiler.optimizer import TACOptimizer
from app.compiler.grammar import GrammarAnalyzer
from app.compiler.cfg import CFGBuilder

def test_target_code_constants_and_types():
    code = """
    public class SoftwareRiskAnalyzer {
        public static void main(int maxComplexity) {
            int loc = 120;
            int errorCount = 2;

            float riskScore = 0.0;

            if (maxComplexity > 10) {
                riskScore = 0.85;
                System.out.println("Warning: High complexity module detected!");
            } else {
                riskScore = 0.20;
            }

            int iterations = 0;

            while (iterations < 5) {
                riskScore = riskScore + 0.02;
                iterations = iterations + 1;
            }

            System.out.println(riskScore);
        }
    }
    """
    service = CompilerService()
    res = service.analyze_source(code, "SoftwareRiskAnalyzer.java")
    target = res["target_code"]
    assembly = target["assembly_code"]

    # Verify 0.0, 0.85, 0.2, 0.02 are emitted as constants, NOT local variable loads
    assert "fconst_0" in assembly
    assert "ldc 0.85" in assembly
    assert "ldc 0.2" in assembly or "ldc 0.22" in assembly

    # Ensure no illegal iload for constants
    assert "iload_" not in assembly or "iload_4 /* 0.0 */" not in assembly
    assert "iload_6 /* 0.85 */" not in assembly

    # Verify String loading and correct println descriptor
    assert 'ldc "Warning: High complexity module detected!"' in assembly
    assert "invokevirtual java/io/PrintStream.println(Ljava/lang/String;)V" in assembly
    assert "invokevirtual java/io/PrintStream.println(F)V" in assembly

    # Verify comparison and branch semantics
    assert "if_icmpgt" in assembly
    assert "ifeq" in assembly

    # Verify local slots are allocated only for actual variables (not literals)
    for inst in target["instructions"]:
        mnem = inst["mnemonic"]
        if "load_" in mnem or "store_" in mnem:
            var_comment = mnem.split("/*")[-1].split("*/")[0].strip() if "/*" in mnem else ""
            if var_comment:
                assert not var_comment.isdigit()
                assert not var_comment.startswith('"')
                assert "." not in var_comment or var_comment.startswith("t")

def test_tac_explicit_comparisons_and_semantics():
    code = """
    public class Demo {
        public static void main() {
            int maxComplexity = 12;
            if (maxComplexity > 10) {
                float riskScore = 0.85;
                riskScore = riskScore + 0.02;
            }
        }
    }
    """
    service = CompilerService()
    res = service.analyze_source(code, "Demo.java")
    tac_quads = res["intermediate_code"]

    # Verify explicit comparison >
    has_cmp = any(q["op"] == ">" and q["arg1"] == "maxComplexity" and q["arg2"] == "10" for q in tac_quads)
    assert has_cmp, "TAC must produce an explicit '>' comparison quad"

    # Verify riskScore + 0.02 TAC
    has_add = any(q["op"] == "+" and q["arg2"] == "0.02" for q in tac_quads)
    assert has_add, "TAC must produce a valid addition quad for riskScore + 0.02"

def test_cfg_structure_and_back_edges():
    code = """
    public class LoopDemo {
        public static void main() {
            int iterations = 0;
            while (iterations < 5) {
                iterations = iterations + 1;
            }
        }
    }
    """
    service = CompilerService()
    res = service.analyze_source(code, "LoopDemo.java")
    cfg = res["cfg"]

    assert len(cfg["nodes"]) >= 3
    assert len(cfg["edges"]) >= 3

    # Verify presence of loop back-edge
    has_back_edge = False
    for edge in cfg["edges"]:
        from_id = int(edge["from"].replace("B", ""))
        to_id = int(edge["to"].replace("B", ""))
        if to_id <= from_id:
            has_back_edge = True
            break
    assert has_back_edge, "CFG must contain a loop back edge"

def test_recursive_ast_node_counting():
    code = """
    public class AstCountDemo {
        public static void main(String[] args) {
            int a = 1;
            int b = 2;
            int c = a + b;
        }
    }
    """
    service = CompilerService()
    res = service.analyze_source(code, "AstCountDemo.java")
    ast_node_count = res["stats"]["ast_nodes_count"]
    
    # Must count all nested nodes (Program, Class, Method, Block, VarDecls, BinaryOp, Literals, Identifiers)
    assert ast_node_count >= 8, f"AST node count must count recursively across tree, got {ast_node_count}"


def test_primary_software_risk_analyzer_regression():
    code = """
    public class SoftwareRiskAnalyzer {

        public static int calculateRisk(int complexity, int errors) {
            int baseRisk = complexity * 2 + errors * 5;
            int adjustedRisk = baseRisk + 10 - 10;

            if (complexity > 10) {
                adjustedRisk = adjustedRisk + 20;
            } else {
                adjustedRisk = adjustedRisk - 5;
            }

            return adjustedRisk;
        }

        public static int analyzeIterations(int complexity) {
            int iterations = 0;
            int score = 0;

            while (iterations < 5) {
                score = score + complexity;
                iterations = iterations + 1;
            }

            for (int i = 0; i < 3; i = i + 1) {
                if (i > 1) {
                    score = score + 10;
                } else {
                    score = score + 2;
                }
            }

            return score;
        }

        public static void main(String[] args) {

            int loc = 120;
            int complexity = 12;
            int errors = 2;

            int constantValue = 10 + 20 - 20;
            int riskScore = calculateRisk(complexity, errors);
            int iterationScore = analyzeIterations(complexity);

            if (riskScore > 50) {
                System.out.println("High software risk detected!");

                if (errors > 0) {
                    riskScore = riskScore + errors;
                } else {
                    riskScore = riskScore - 1;
                }

            } else {
                System.out.println("Software risk is acceptable.");
            }

            int finalScore = riskScore + iterationScore + constantValue;

            System.out.println(finalScore);
        }
    }
    """
    service = CompilerService()
    res = service.analyze_source(code, "SoftwareRiskAnalyzer.java")

    # 1. AST count invariant check
    ast_count = res["stats"]["ast_nodes_count"]
    assert ast_count > 100, f"Expected AST node count > 100, got {ast_count}"

    # 2. TAC Function Calls explicit representation check
    tac_quads = res["intermediate_code"]
    has_calc_call = any(q["op"] == "CALL" and q["arg1"] == "calculateRisk" and q["arg2"] == "2" for q in tac_quads)
    has_iter_call = any(q["op"] == "CALL" and q["arg1"] == "analyzeIterations" and q["arg2"] == "1" for q in tac_quads)
    has_calc_param = any(q["op"] == "PARAM" for q in tac_quads)

    assert has_calc_call, "TAC must explicitly represent calculateRisk function call with argument count"
    assert has_iter_call, "TAC must explicitly represent analyzeIterations function call with argument count"
    assert has_calc_param, "TAC must emit PARAM quads for function call arguments"

    # 3. Optimization Loop Safety check
    opt_quads = res["optimized_code"]
    # Ensure iterations is NOT frozen to 0 in loop condition
    loop_cond_frozen = any(q["op"] == "<" and q["arg1"] == "0" and q["arg2"] == "5" for q in opt_quads)
    assert not loop_cond_frozen, "Optimizer must NOT freeze loop variable 'iterations' to constant 0"

    # Ensure i is NOT frozen to 0 in for loop condition
    for_cond_frozen = any(q["op"] == "<" and q["arg1"] == "0" and q["arg2"] == "3" for q in opt_quads)
    assert not for_cond_frozen, "Optimizer must NOT freeze loop variable 'i' to constant 0"

    # 4. CFG & Complexity calculation check
    cfg = res["cfg"]
    methods_cfg = cfg.get("methods", {})
    if methods_cfg:
        expected_complexity = max(1, sum(m.get("cyclomatic_complexity", 1) for m in methods_cfg.values()))
    else:
        num_nodes = len(cfg["nodes"])
        num_edges = len(cfg["edges"])
        expected_complexity = max(1, num_edges - num_nodes + 2) if num_nodes > 0 else 1
    assert res["metrics"]["cyclomatic_complexity"] == expected_complexity, (
        f"Expected V(G)={expected_complexity}, got {res['metrics']['cyclomatic_complexity']}"
    )

    # 5. Report Invariant check
    from app.reports.generator import IntegratedReportGenerator
    report = IntegratedReportGenerator().generate_compiler_report(res)
    content = report["markdown_content"]

    assert f"**AST Node Count:** {ast_count} structural nodes" in content
    assert "SoftwareRiskAnalyzer.java" in content
    assert "PaymentGateway.java" not in content


def test_loop_safe_constant_propagation_regression():
    code = """
    public class LoopTest {
        public static int run() {
            int i = 0;
            int sum = 0;
            while (i < 5) {
                sum = sum + i;
                i = i + 1;
            }
            return sum;
        }
    }
    """
    service = CompilerService()
    res = service.analyze_source(code, "LoopTest.java")
    opt_quads = res["optimized_code"]

    # Verify i < 5 stays dependent on i
    while_cond = [q for q in opt_quads if q["op"] == "<" and q["result"] != ""]
    assert any(q["arg1"] == "i" and q["arg2"] == "5" for q in while_cond)
    # Verify sum = sum + i is not replaced by sum = 0 + 0
    sum_add = [q for q in opt_quads if q["op"] == "+" and q["arg1"] == "sum"]
    assert any(q["arg2"] == "i" for q in sum_add)


def test_function_call_ir_regression():
    code = """
    public class CallTest {
        public static int add(int a, int b) {
            return a + b;
        }
        public static void main() {
            int x = 10;
            int y = 20;
            int result = add(x, y);
            System.out.println(result);
        }
    }
    """
    service = CompilerService()
    res = service.analyze_source(code, "CallTest.java")
    tac_quads = res["intermediate_code"]

    params = [q for q in tac_quads if q["op"] == "PARAM"]
    calls = [q for q in tac_quads if q["op"] == "CALL"]

    assert len(params) >= 2
    assert len(calls) >= 1
    call = calls[0]
    assert call["arg1"] == "add"
    assert call["arg2"] == "2"
    assert call["result"].startswith("t")


def test_constant_condition_elimination():
    opt = TACOptimizer()
    quads = [
        {"op": "IF_FALSE", "arg1": "0", "arg2": "", "result": "L1", "line": 1},
        {"op": "IF_FALSE", "arg1": "1", "arg2": "", "result": "L2", "line": 2}
    ]
    opt_quads, transforms, audit = opt.optimize(quads)

    # IF_FALSE 0 GOTO L1 -> GOTO L1
    assert any(q["op"] == "GOTO" and q["result"] == "L1" for q in opt_quads)
    # IF_FALSE 1 GOTO L2 -> eliminated
    assert not any(q["result"] == "L2" for q in opt_quads)

    pass_results = audit["pass_results"]
    assert "Constant Condition Elimination" in pass_results
    assert pass_results["Constant Condition Elimination"]["applied"] == 2


def test_shift_reduce_conflict_detection():
    ga = GrammarAnalyzer()
    res = ga.simulate_shift_reduce("i + i * i")
    assert res["has_conflicts"] is True
    assert len(res["conflicts"]) > 0
    assert any("Shift/Reduce Conflict" in c for c in res["conflicts"])


def test_recursive_descent_trace_fields():
    ga = GrammarAnalyzer()
    res = ga.simulate_recursive_descent("c a b d")
    assert res["success"] is True
    trace = res["trace"]
    assert len(trace) > 0
    first_step = trace[0]
    assert "production_selected" in first_step
    assert "lookahead" in first_step
    assert "consumed_token" in first_step


def test_cfg_connected_components_and_formula():
    builder = CFGBuilder()
    quads = [
        {"op": "FUNC_START", "arg1": "main", "arg2": "", "result": ""},
        {"op": "=", "arg1": "10", "arg2": "", "result": "x"},
        {"op": "RETURN", "arg1": "x", "arg2": "", "result": ""},
        {"op": "FUNC_END", "arg1": "main", "arg2": "", "result": ""}
    ]
    cfg = builder.build_cfg(quads)
    m_cfg = cfg["methods"]["main"]
    assert "connected_components" in m_cfg
    assert m_cfg["connected_components"] >= 1
    assert m_cfg["cyclomatic_complexity"] >= 1
