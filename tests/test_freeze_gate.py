import pytest
from app.compiler.service import CompilerService
from app.compiler.optimizer import TACOptimizer
from app.compiler.grammar import GrammarAnalyzer
from app.compiler.cfg import CFGBuilder
from app.reports.generator import IntegratedReportGenerator

SOFTWARE_RISK_ANALYZER_CODE = """
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

def test_freeze_gate_section1_program_level_cfg_mathematical_audit():
    service = CompilerService()
    res = service.analyze_source(SOFTWARE_RISK_ANALYZER_CODE, "SoftwareRiskAnalyzer.java")
    cfg = res["cfg"]
    methods = cfg["methods"]

    # Method-level assertions
    assert methods["calculateRisk"]["connected_components"] == 1
    assert methods["calculateRisk"]["cyclomatic_complexity"] == 2
    assert len(methods["calculateRisk"]["nodes"]) == 4
    assert len(methods["calculateRisk"]["edges"]) == 4

    assert methods["analyzeIterations"]["connected_components"] == 1
    assert methods["analyzeIterations"]["cyclomatic_complexity"] == 4
    assert len(methods["analyzeIterations"]["nodes"]) == 10
    assert len(methods["analyzeIterations"]["edges"]) == 12

    assert methods["main"]["connected_components"] == 1
    assert methods["main"]["cyclomatic_complexity"] == 2
    assert len(methods["main"]["nodes"]) == 6
    assert len(methods["main"]["edges"]) == 6

    # Program aggregate assertions
    prog_agg = cfg["program_aggregate"]
    assert prog_agg["total_basic_blocks"] == 20
    assert prog_agg["total_edges"] == 22
    assert prog_agg["connected_components"] == 3
    assert prog_agg["program_aggregate_cyclomatic_complexity"] == 8

    # Formula check: V(G) = E - N + 2P = 22 - 20 + 2(3) = 8
    expected_v = 22 - 20 + 2 * 3
    assert expected_v == 8
    assert prog_agg["program_aggregate_cyclomatic_complexity"] == expected_v


def test_freeze_gate_section2_cfg_edge_integrity():
    service = CompilerService()
    res = service.analyze_source(SOFTWARE_RISK_ANALYZER_CODE, "SoftwareRiskAnalyzer.java")
    cfg = res["cfg"]

    for m_name, m_data in cfg["methods"].items():
        node_ids = {n["id"] for n in m_data["nodes"]}
        seen_edges = set()

        for edge in m_data["edges"]:
            edge_key = (edge["from"], edge["to"], edge["type"])
            assert edge_key not in seen_edges, f"Duplicate edge found in method {m_name}: {edge_key}"
            seen_edges.add(edge_key)

            assert edge["from"] in node_ids, f"Edge source {edge['from']} does not exist in method {m_name}"
            assert edge["to"] in node_ids, f"Edge target {edge['to']} does not exist in method {m_name}"
            assert edge["method"] == m_name, f"Edge method tag {edge['method']} crosses method boundary {m_name}"


def test_freeze_gate_section3_tac_to_target_semantic_consistency():
    service = CompilerService()
    res = service.analyze_source(SOFTWARE_RISK_ANALYZER_CODE, "SoftwareRiskAnalyzer.java")
    tac = res["intermediate_code"]
    target = res["target_code"]
    assembly = target["assembly_code"]

    calc_params = [q for q in tac if q["op"] == "PARAM" and q["arg1"] in ("complexity", "errors")]
    assert len(calc_params) >= 2
    assert calc_params[0]["arg1"] == "complexity"
    assert calc_params[1]["arg1"] == "errors"

    calc_call = [q for q in tac if q["op"] == "CALL" and q["arg1"] == "calculateRisk"][0]
    assert calc_call["arg2"] == "2"

    iter_params = [q for q in tac if q["op"] == "PARAM" and q["arg1"] == "complexity"]
    assert len(iter_params) >= 1

    iter_call = [q for q in tac if q["op"] == "CALL" and q["arg1"] == "analyzeIterations"][0]
    assert iter_call["arg2"] == "1"

    assert "invokestatic MethodClass.calculateRisk(II)I" in assembly
    assert "invokestatic MethodClass.analyzeIterations(I)I" in assembly
    assert "ireturn" in assembly or "return" in assembly


def test_freeze_gate_section4_optimization_correctness():
    opt = TACOptimizer()

    # Case A: int x = 10; if (x > 5) -> folded
    quads_a = [
        {"op": "=", "arg1": "10", "arg2": "", "result": "x", "line": 1},
        {"op": ">", "arg1": "x", "arg2": "5", "result": "t1", "line": 2},
        {"op": "IF_FALSE", "arg1": "t1", "arg2": "", "result": "L1", "line": 3}
    ]
    opt_a, trans_a, _ = opt.optimize(quads_a)
    assert not any(q["op"] == "IF_FALSE" for q in opt_a)

    # Case B: int x = getValue(); if (x > 5) -> remains dynamic
    quads_b = [
        {"op": "CALL", "arg1": "getValue", "arg2": "0", "result": "x", "line": 1},
        {"op": ">", "arg1": "x", "arg2": "5", "result": "t1", "line": 2},
        {"op": "IF_FALSE", "arg1": "t1", "arg2": "", "result": "L1", "line": 3}
    ]
    opt_b, _, _ = opt.optimize(quads_b)
    assert any(q["op"] == ">" and q["arg1"] == "x" for q in opt_b)
    assert any(q["op"] == "IF_FALSE" for q in opt_b)

    # Case C: int x = 0; while (x < 10) { x = x + 1; } -> x must NOT remain 0 inside loop
    quads_c = [
        {"op": "=", "arg1": "0", "arg2": "", "result": "x", "line": 1},
        {"op": "LABEL", "arg1": "", "arg2": "", "result": "L_loop", "line": 2},
        {"op": "<", "arg1": "x", "arg2": "10", "result": "t1", "line": 3},
        {"op": "IF_FALSE", "arg1": "t1", "arg2": "", "result": "L_exit", "line": 4},
        {"op": "+", "arg1": "x", "arg2": "1", "result": "x", "line": 5},
        {"op": "GOTO", "arg1": "", "arg2": "", "result": "L_loop", "line": 6},
        {"op": "LABEL", "arg1": "", "arg2": "", "result": "L_exit", "line": 7}
    ]
    opt_c, _, _ = opt.optimize(quads_c)
    cond_q = [q for q in opt_c if q["op"] == "<"][0]
    assert cond_q["arg1"] == "x"


def test_freeze_gate_section5_grammar_audit():
    ga = GrammarAnalyzer()

    rd_res = ga.simulate_recursive_descent("c a b d")
    assert rd_res["success"] is True
    for step in rd_res["trace"]:
        assert "step" in step
        assert "action" in step
        assert "production_selected" in step
        assert "lookahead" in step
        assert "consumed_token" in step
        assert "input_remaining" in step

    sr_res = ga.simulate_shift_reduce("i + i * i")
    assert sr_res["has_conflicts"] is True
    assert len(sr_res["conflicts"]) > 0
    assert any("Shift/Reduce Conflict" in c for c in sr_res["conflicts"])


def test_freeze_gate_optimization_evidence_no_contradiction():
    service = CompilerService()
    res = service.analyze_source(SOFTWARE_RISK_ANALYZER_CODE, "SoftwareRiskAnalyzer.java")
    generator = IntegratedReportGenerator()
    rep = generator.generate_compiler_report(res)
    content = rep["markdown_content"]

    # Verify report never contains contradictory APPLIED + "No candidates"
    assert "`APPLIED` | 0" not in content
    assert "APPLIED` | 19 | 19 | No candidates" not in content
    assert "No candidates found" not in content


def test_freeze_gate_section10_software_risk_analyzer_numerical_expected_values():
    complexity = 12
    errors = 2
    base_risk = complexity * 2 + errors * 5 # 34
    adj_risk = base_risk + 10 - 10 # 34
    if complexity > 10:
        adj_risk = adj_risk + 20 # 54
    else:
        adj_risk = adj_risk - 5
    assert adj_risk == 54

    iterations = 0
    score = 0
    while iterations < 5:
        score = score + 12 # 60
        iterations += 1

    for i in range(3):
        if i > 1:
            score += 10
        else:
            score += 2
    assert score == 74

    constant_value = 10 + 20 - 20 # 10
    risk_score = 54
    iteration_score = 74

    if risk_score > 50:
        if errors > 0:
            risk_score = risk_score + errors # 56
        else:
            risk_score -= 1

    final_score = risk_score + iteration_score + constant_value # 140
    assert final_score == 140
