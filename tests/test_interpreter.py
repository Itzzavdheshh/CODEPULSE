import sys
import os
import math
import json
import pytest
from jsonschema import validate
from fastapi.testclient import TestClient

# Ensure backend is on PYTHONPATH
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
from app.compiler.service import CompilerService
from app.compiler.interpreter import TACInterpreter, run_source, run_both, extract_param_map
from app.ml.service import MLService

client = TestClient(app)

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "..", "shared", "schemas", "artifact.schema.json")
with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
    ARTIFACT_SCHEMA = json.load(f)


# ---------------------------------------------------------------------------
# Section A Snippet Definitions
# ---------------------------------------------------------------------------

A1_SRC = """
class MathUtil {
    public int sumLoop(int n) {
        int sum = 0;
        for (int i = 0; i < n; i = i + 1) {
            sum = sum + i;
        }
        return sum;
    }
}
"""

A2_SRC = """
class MathUtil {
    public int sumWhile(int n) {
        int sum = 0;
        int i = 0;
        while (i < n) {
            sum = sum + i;
            i = i + 1;
        }
        return sum;
    }
}
"""

A3_SRC = """
class LoopNest {
    public int countNested(int n) {
        int count = 0;
        for (int i = 0; i < n; i = i + 1) {
            for (int j = 0; j < n; j = j + 1) {
                count = count + 1;
            }
        }
        return count;
    }
}
"""

A4_SRC = """
class DoubleArith {
    public double f(double a, double b) {
        return 3.2 * a + 1.1 * b + 0.7;
    }
}
"""

A6_SRC = """
class BranchChain {
    public int classify(int score) {
        if (score > 90) return 1;
        else if (score > 75) return 2;
        else if (score > 50) return 3;
        else return 4;
    }
}
"""

A7_SRC = """
class DecisionTree {
    public int predict(int f0, int f1, int f2, int f3, int f4, int f5) {
        if (f0 <= 5) {
            if (f1 <= 10) {
                if (f2 <= 15) {
                    if (f3 <= 20) {
                        if (f4 <= 25) {
                            if (f5 <= 30) {
                                return 0;
                            } else {
                                return 1;
                            }
                        } else {
                            return 2;
                        }
                    } else {
                        return 3;
                    }
                } else {
                    return 4;
                }
            } else {
                return 5;
            }
        } else {
            return 6;
        }
    }
}
"""

A13_SRC = """
class HelperCall {
    public static int helper(int x) {
        return x * 2;
    }
    public int compute(int a) {
        return helper(a);
    }
}
"""

A14_SRC = """
class Recursion {
    public int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }
    public int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}
"""

A15_SRC = """
class BoolOps {
    public boolean testBool(int a, int b) {
        boolean c = (a <= b) && (a != 0) || !(b >= 10);
        boolean d = (a == b);
        return c && d;
    }
}
"""

A18_SRC = """
class MultiMethod {
    public int add(int a, int b) {
        return a + b;
    }
    public int multiply(int a, int b) {
        return a * b;
    }
    public static void main() {
        int x = 10;
    }
}
"""


# ---------------------------------------------------------------------------
# Tests: Snippet Parity and Mathematics
# ---------------------------------------------------------------------------

class TestTACInterpreterSnippets:

    def test_a1_sum_loop_values(self):
        """A1 sumLoop for n in [0, 1, 5, 10, 100] == n*(n-1)//2."""
        for n in [0, 1, 5, 10, 100]:
            r = run_source(A1_SRC, "sumLoop", [n])
            assert r["status"] == "success"
            expected = n * (n - 1) // 2
            assert r["return_value"] == expected

    def test_a2_while_equals_a1(self):
        """A2 while loop version equals A1 for all test inputs."""
        for n in [0, 1, 5, 10, 50]:
            r_for = run_source(A1_SRC, "sumLoop", [n])
            r_while = run_source(A2_SRC, "sumWhile", [n])
            assert r_while["status"] == "success"
            assert r_while["return_value"] == r_for["return_value"]

    def test_a3_nested_loop_quadratic_growth(self):
        """A3 countNested == n*n, and steps for n=10 vs n=20 grow approximately 4x."""
        for n in [0, 2, 5, 10, 20]:
            r = run_source(A3_SRC, "countNested", [n])
            assert r["status"] == "success"
            assert r["return_value"] == n * n

        steps_10 = run_source(A3_SRC, "countNested", [10])["step_count"]
        steps_20 = run_source(A3_SRC, "countNested", [20])["step_count"]
        ratio = steps_20 / steps_10
        assert 3.5 <= ratio <= 4.5, f"Expected ~4x quadratic step growth, got ratio {ratio:.2f}"

    def test_a4_double_arithmetic(self):
        """A4 double arithmetic matches Python float reference within 1e-9."""
        test_pairs = [(0.0, 0.0), (1.5, 2.5), (-2.0, 3.5), (10.0, -5.0)]
        for a, b in test_pairs:
            r = run_source(A4_SRC, "f", [a, b])
            assert r["status"] == "success"
            expected = 3.2 * a + 1.1 * b + 0.7
            assert math.isclose(r["return_value"], expected, rel_tol=1e-9, abs_tol=1e-9)

    def test_a6_if_else_chain(self):
        """A6 if/else chain evaluates correct branch for varying scores."""
        scores = [(95, 1), (85, 2), (65, 3), (40, 4)]
        for score, expected_class in scores:
            r = run_source(A6_SRC, "classify", [score])
            assert r["status"] == "success"
            assert r["return_value"] == expected_class

    def test_a7_decision_tree_all_leaves(self):
        """A7 depth-6 decision tree exercises every leaf (0..6) and returns matching values."""
        # Vectors engineered to reach leaves 0 to 6
        leaf_vectors = [
            ([0, 0, 0, 0, 0, 0], 0),
            ([0, 0, 0, 0, 0, 35], 1),
            ([0, 0, 0, 0, 30, 0], 2),
            ([0, 0, 0, 25, 0, 0], 3),
            ([0, 0, 20, 0, 0, 0], 4),
            ([0, 15, 0, 0, 0, 0], 5),
            ([10, 0, 0, 0, 0, 0], 6),
        ]
        for vec, expected_leaf in leaf_vectors:
            r = run_source(A7_SRC, "predict", vec)
            assert r["status"] == "success"
            assert r["return_value"] == expected_leaf
            # Check executed blocks form a root-to-leaf path starting at B0
            assert r["executed_blocks"][0] == "B0"
            assert len(r["executed_blocks"]) >= 2

    def test_a13_helper_call(self):
        """A13 helper method call correctly passes parameters and returns result."""
        for val in [-5, 0, 3, 10]:
            r = run_source(A13_SRC, "compute", [val])
            assert r["status"] == "success"
            assert r["return_value"] == val * 2

    def test_a14_recursion_factorial_and_fibonacci(self):
        """A14 factorial(0..10) and fibonacci(0..15) match Python recursion references."""
        for n in range(11):
            r = run_source(A14_SRC, "factorial", [n])
            assert r["status"] == "success"
            assert r["return_value"] == math.factorial(n)

        def py_fib(k):
            if k <= 1:
                return k
            a, b = 0, 1
            for _ in range(k):
                a, b = b, a + b
            return a

        for n in range(16):
            r = run_source(A14_SRC, "fibonacci", [n])
            assert r["status"] == "success"
            assert r["return_value"] == py_fib(n)

    def test_a15_boolean_operations(self):
        """A15 boolean expressions with &&, ||, ! evaluate correctly."""
        for a, b in [(5, 5), (10, 10), (0, 0), (2, 8), (10, 5)]:
            r = run_source(A15_SRC, "testBool", [a, b])
            assert r["status"] == "success"
            py_c = (a <= b) and (a != 0) or not (b >= 10)
            py_d = (a == b)
            expected = 1 if (py_c and py_d) else 0
            assert r["return_value"] == expected

    def test_a18_multi_method_dispatch(self):
        """A18 multiple methods in one class can be individually targeted."""
        r_add = run_source(A18_SRC, "add", [14, 28])
        assert r_add["status"] == "success"
        assert r_add["return_value"] == 42

        r_mul = run_source(A18_SRC, "multiply", [6, 7])
        assert r_mul["status"] == "success"
        assert r_mul["return_value"] == 42


# ---------------------------------------------------------------------------
# Tests: Safety, Limits & Java Semantics
# ---------------------------------------------------------------------------

class TestTACInterpreterSafetyAndSemantics:

    def test_call_depth_limit_safely_caught(self):
        """Infinite recursion triggers CallDepthExceeded error without server crash."""
        src = """
        class InfiniteRec {
            public int rec(int x) {
                return rec(x + 1);
            }
        }
        """
        r = run_source(src, "rec", [1])
        assert r["status"] == "error"
        assert r["error_type"] == "CallDepthExceeded"

    def test_infinite_loop_step_limit_exceeded(self):
        """Infinite loop returns step_limit_exceeded status."""
        src = """
        class InfiniteLoop {
            public int runLoop() {
                int x = 0;
                while (x < 10) {
                    x = x;
                }
                return x;
            }
        }
        """
        r = run_source(src, "runLoop", [], max_steps=5000)
        assert r["status"] == "step_limit_exceeded"
        assert r["step_count"] > 5000

    def test_division_by_zero_structured_error(self):
        """Division by zero returns structured error."""
        src = """
        class DivZero {
            public int divide(int a, int b) {
                return a / b;
            }
        }
        """
        r = run_source(src, "divide", [10, 0])
        assert r["status"] == "error"
        assert r["error_type"] == "DivisionByZero"

    def test_java_integer_truncation_and_modulo_semantics(self):
        """Integer division truncates toward zero and modulo matches Java sign rules."""
        src = """
        class JavaSemantics {
            public int div(int a, int b) { return a / b; }
            public int mod(int a, int b) { return a % b; }
        }
        """
        # Division truncation
        assert run_source(src, "div", [-7, 2])["return_value"] == -3
        assert run_source(src, "div", [7, 2])["return_value"] == 3

        # Modulo sign matches dividend a
        assert run_source(src, "mod", [-7, 3])["return_value"] == -1
        assert run_source(src, "mod", [7, -3])["return_value"] == 1
        assert run_source(src, "mod", [-7, -3])["return_value"] == -1

    def test_raw_vs_optimized_parity(self):
        """Semantics match on raw vs optimized TAC for A1, A3, A7, and A14."""
        for src, m, args in [
            (A1_SRC, "sumLoop", [10]),
            (A3_SRC, "countNested", [5]),
            (A7_SRC, "predict", [0, 0, 0, 0, 0, 0]),
            (A14_SRC, "factorial", [6])
        ]:
            r = run_source(src, m, args, variant="both")
            assert r["comparison"]["semantics_match"] is True
            assert r["optimized"]["step_count"] <= r["raw"]["step_count"]

    def test_block_ids_match_cfg_json(self):
        """All executed block IDs from the interpreter exist in cfg.json for the same source."""
        svc = CompilerService()
        for src, m, args in [
            (A1_SRC, "sumLoop", [10]),
            (A3_SRC, "countNested", [5]),
            (A7_SRC, "predict", [0, 0, 0, 0, 0, 0])
        ]:
            an = svc.analyze_source(src)
            r = run_source(src, m, args)
            cfg_node_ids = {n["id"] for n in an["cfg"]["methods"][m]["nodes"]}
            for b in r["executed_blocks"]:
                assert b in cfg_node_ids, f"Interpreter block '{b}' not found in cfg.json nodes: {cfg_node_ids}"


# ---------------------------------------------------------------------------
# Tests: API & Schema Validation
# ---------------------------------------------------------------------------

class TestCompilerInterpretAPI:

    def test_api_interpret_happy_path(self):
        """POST /api/v1/compiler/interpret executes source code and returns 200."""
        payload = {
            "source_code": A1_SRC,
            "method": "sumLoop",
            "args": [10],
            "variant": "optimized",
            "include_trace": True,
            "save_artifact": True
        }
        res = client.post("/api/v1/compiler/interpret", json=payload)
        assert res.status_code == 200
        body = res.json()
        assert "result" in body
        assert body["result"]["status"] == "success"
        assert body["result"]["return_value"] == 45
        assert len(body["result"]["trace"]) > 0

        # Validate saved artifact against JSON schema
        assert body["artifact"] is not None
        validate(instance=body["artifact"], schema=ARTIFACT_SCHEMA)
        assert body["artifact"]["artifact_type"] == "tac_execution_trace"

    def test_api_interpret_both_variants(self):
        """POST /api/v1/compiler/interpret runs both variants and compares steps."""
        payload = {
            "source_code": A1_SRC,
            "method": "sumLoop",
            "args": [10],
            "variant": "both"
        }
        res = client.post("/api/v1/compiler/interpret", json=payload)
        assert res.status_code == 200
        body = res.json()["result"]
        assert "raw" in body
        assert "optimized" in body
        assert body["comparison"]["semantics_match"] is True

    def test_api_interpret_validation_errors_422(self):
        """POST /api/v1/compiler/interpret returns 422 on invalid bodies."""
        # 1. Neither source_code nor compiler_artifact_id
        res = client.post("/api/v1/compiler/interpret", json={"method": "sumLoop", "args": [10]})
        assert res.status_code == 422

        # 2. Both source_code and compiler_artifact_id
        res = client.post("/api/v1/compiler/interpret", json={"source_code": A1_SRC, "compiler_artifact_id": "dummy", "method": "sumLoop", "args": [10]})
        assert res.status_code == 422

        # 3. Invalid variant
        res = client.post("/api/v1/compiler/interpret", json={"source_code": A1_SRC, "method": "sumLoop", "args": [10], "variant": "invalid"})
        assert res.status_code == 422

        # 4. Non-existent method
        res = client.post("/api/v1/compiler/interpret", json={"source_code": A1_SRC, "method": "unknownMethod", "args": []})
        assert res.status_code == 422

        # 5. Argument count mismatch
        res = client.post("/api/v1/compiler/interpret", json={"source_code": A1_SRC, "method": "sumLoop", "args": [10, 20]})
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# Tests: Part 1 Bug Fix Regressions
# ---------------------------------------------------------------------------

class TestPart1BugFixRegressions:

    CSV_DATA = """loc,cyclomatic,diagnostics,risk_level
10,2,0,LOW
12,2,0,LOW
15,3,0,LOW
18,3,1,LOW
22,4,1,LOW
40,9,2,MODERATE
45,10,3,MODERATE
50,11,3,MODERATE
80,20,5,HIGH
90,25,7,HIGH
100,28,8,HIGH
110,30,9,HIGH
"""

    def test_ml_train_returns_200_and_predict_works(self):
        """Part 1.1: /ml/train returns HTTP 200 with JSON serializable response and predict works."""
        train_res = client.post("/api/v1/ml/train", json={
            "csv_text": self.CSV_DATA,
            "target_column": "risk_level",
            "model_name": "random_forest",
            "task_type": "classification",
            "save_artifact": True
        })
        assert train_res.status_code == 200
        train_data = train_res.json()
        assert "ml_result" in train_data
        assert "artifact" in train_data
        art_id = train_data["artifact"]["artifact_id"]

        # Ensure no sklearn objects leaked into HTTP JSON response
        assert "trained_model_ref" not in train_data["ml_result"]

        # Predict using stored model
        pred_res = client.post("/api/v1/ml/predict", json={
            "ml_artifact_id": art_id,
            "instance_data": {"loc": 45, "cyclomatic": 10, "diagnostics": 2}
        })
        assert pred_res.status_code == 200
        pred_data = pred_res.json()
        assert pred_data["prediction_available"] is True
        assert "predicted_class" in pred_data
        assert pred_data["predicted_class"] in ("LOW", "MODERATE", "HIGH")

    def test_mean_shift_clustering_train_and_predict(self):
        """Part 1.4: Mean-Shift trains, evaluates silhouette & cluster count, and predicts."""
        ml_svc = MLService()
        clustering_csv = """loc,cyclomatic,diagnostics
10,2,0
12,2,0
15,3,0
18,3,1
22,4,1
40,9,2
45,10,3
50,11,3
80,20,5
90,25,7
100,28,8
110,30,9
"""
        res = ml_svc.train_and_compare(
            csv_text=clustering_csv,
            target_column=None,
            primary_model_name="mean_shift",
            task_type="clustering"
        )
        assert res["task_type"] == "clustering"
        assert "silhouette_score" in res["evaluation"]
        assert "n_clusters" in res["evaluation"]
        assert res["evaluation"]["n_clusters"] >= 1

        pred = ml_svc.predict_instance(res, {"loc": 50, "cyclomatic": 10, "diagnostics": 2})
        assert pred["prediction_available"] is True
        assert "predicted_class" in pred
