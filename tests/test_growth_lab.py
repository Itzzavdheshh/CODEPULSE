import json
import jsonschema
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.compiler.service import CompilerService
from app.compiler.growth_lab import (
    inspect_source,
    measure,
    fit_growth,
    static_hint,
    analyze_growth,
)

PRESETS = {
    "constant": (
        "public class C { public static int f(int n) { return 42; } }",
        "f",
        "O(1)",
        None,
    ),
    "log_loop": (
        "public class L { public static int logLoop(int n) { int c = 0; int i = 1; while (i < n) { c = c + 1; i = i * 2; } return c; } }",
        "logLoop",
        "O(log n)",
        None,
    ),
    "sqrt_loop": (
        "public class S { public static int sqrtLoop(int n) { int c = 0; int i = 0; while (i * i < n) { c = c + 1; i = i + 1; } return c; } }",
        "sqrtLoop",
        "O(sqrt n)",
        None,
    ),
    "A1": (
        "public class A1 { public static int sumLoop(int n) { int s = 0; for (int i = 0; i < n; i = i + 1) { s = s + i; } return s; } }",
        "sumLoop",
        "O(n)",
        None,
    ),
    "nested": (
        "public class N { public static int countNested(int n) { int c = 0; for (int i = 0; i < n; i = i + 1) { for (int j = 0; j < n; j = j + 1) { c = c + 1; } } return c; } }",
        "countNested",
        "O(n^2)",
        None,
    ),
    "n_log_n": (
        "public class NL { public static int nLogN(int n) { int c = 0; for (int i = 0; i < n; i = i + 1) { int j = 1; while (j < n) { c = c + 1; j = j * 2; } } return c; } }",
        "nLogN",
        "O(n log n)",
        None,
    ),
    "triple_nested": (
        "public class T { public static int triple(int n) { int c = 0; for (int i = 0; i < n; i = i + 1) { for (int j = 0; j < n; j = j + 1) { for (int k = 0; k < n; k = k + 1) { c = c + 1; } } } return c; } }",
        "triple",
        "O(n^3)",
        None,
    ),
    "factorial": (
        "public class F { public static int fact(int n) { if (n <= 1) return 1; return n * fact(n - 1); } }",
        "fact",
        "O(n)",
        None,
    ),
    "fibonacci": (
        "public class Fib { public static int fib(int n) { if (n <= 1) return n; return fib(n - 1) + fib(n - 2); } }",
        "fib",
        "O(2^n)",
        list(range(1, 19)),
    ),
}


class TestGrowthLabEngine:
    """Core Growth Engine classification and measurement tests."""

    @pytest.mark.parametrize("name,data", list(PRESETS.items()))
    def test_preset_classification(self, name, data):
        src, method, expected_class, custom_sizes = data
        res = analyze_growth(
            source_code=src,
            method=method,
            size_param="n",
            sizes=custom_sizes,
            variant="optimized",
        )
        assert res["fit"]["classification"] == expected_class, (
            f"Expected {expected_class} for {name}, got {res['fit']['classification']}"
        )
        assert res["fit"]["valid_points_count"] >= 5

    def test_a1_linear_coefficients(self):
        src, method, _, _ = PRESETS["A1"]
        res = analyze_growth(
            source_code=src,
            method=method,
            size_param="n",
            variant="optimized",
        )
        fit = res["fit"]
        assert fit["classification"] == "O(n)"
        # Check coefficients a ~ 7 and b ~ 5
        winner = [c for c in fit["candidates"] if c["basis"] == "O(n)"][0]
        assert abs(winner["a"] - 7.0) < 0.1
        assert abs(winner["b"] - 5.0) < 0.1
        assert "7*n + 5" in fit["formula"] or "7.0*n + 5" in fit["formula"]

    def test_truncation_on_step_limit(self):
        # High iteration loop with small step limit
        src = "public class Deep { public static int run(int n) { int c = 0; for (int i = 0; i < n; i = i + 1) for (int j = 0; j < n; j = j + 1) c = c + 1; return c; } }"
        res = measure(
            source_code=src,
            method="run",
            size_param="n",
            sizes=[10, 50, 100, 500, 1000],
            max_steps_per_run=1000,
        )
        assert res["truncated_reason"] is not None
        assert "exceeded" in res["truncated_reason"].lower()
        # Should retain collected valid points prior to truncation
        assert len(res["samples"]) >= 1
        assert res["samples"][-1]["status"] == "step_limit_exceeded"

    def test_insufficient_data(self):
        # Only 3 points -> less than 5
        samples = [
            {"n": 1, "steps": 10, "status": "ok", "return_value": 0},
            {"n": 2, "steps": 20, "status": "ok", "return_value": 0},
            {"n": 3, "steps": 30, "status": "ok", "return_value": 0},
        ]
        fit = fit_growth(samples)
        assert fit["classification"] == "INSUFFICIENT DATA"
        assert fit["confidence"] == "low"
        assert fit["valid_points_count"] == 3

    def test_break_it_test(self):
        # Live edit A1 (O(n)) into nested version (O(n^2))
        src_a1 = PRESETS["A1"][0]
        res_a1 = analyze_growth(source_code=src_a1, method="sumLoop", size_param="n")
        assert res_a1["fit"]["classification"] == "O(n)"

        src_nested = PRESETS["nested"][0]
        res_nested = analyze_growth(source_code=src_nested, method="countNested", size_param="n")
        assert res_nested["fit"]["classification"] == "O(n^2)"

    def test_raw_vs_optimized_variant_both(self):
        src = PRESETS["A1"][0]
        res = analyze_growth(
            source_code=src,
            method="sumLoop",
            size_param="n",
            variant="both",
        )
        assert "variants" in res
        variants = res["variants"]
        assert "raw" in variants
        assert "optimized" in variants
        assert "comparison" in variants
        assert variants["comparison"]["classes_match"] is True
        assert isinstance(variants["comparison"]["steps_saved_at_largest_n"], int)

    def test_static_hint_depths_and_recursion(self):
        svc = CompilerService()

        # Depth 0: Constant
        res_c = svc.analyze_source(PRESETS["constant"][0])
        hint_c = static_hint(res_c, "f")
        assert hint_c["loop_depth"] == 0
        assert hint_c["has_recursion"] is False
        assert hint_c["hint_class"] == "O(1)"

        # Depth 1: Single Loop (A1)
        res_a1 = svc.analyze_source(PRESETS["A1"][0])
        hint_a1 = static_hint(res_a1, "sumLoop")
        assert hint_a1["loop_depth"] == 1
        assert hint_a1["has_recursion"] is False
        assert hint_a1["hint_class"] == "O(n)"

        # Depth 2: Nested Loops
        res_n = svc.analyze_source(PRESETS["nested"][0])
        hint_n = static_hint(res_n, "countNested")
        assert hint_n["loop_depth"] == 2
        assert hint_n["has_recursion"] is False
        assert hint_n["hint_class"] == "O(n^2)"

        # Recursion flagged
        res_fib = svc.analyze_source(PRESETS["fibonacci"][0])
        hint_fib = static_hint(res_fib, "fib")
        assert hint_fib["has_recursion"] is True
        assert "recursion" in hint_fib["hint_class"]

    def test_determinism(self):
        src = PRESETS["A1"][0]
        res1 = analyze_growth(source_code=src, method="sumLoop", size_param="n")
        res2 = analyze_growth(source_code=src, method="sumLoop", size_param="n")
        assert res1["fit"]["classification"] == res2["fit"]["classification"]
        assert res1["fit"]["r2"] == res2["fit"]["r2"]
        assert res1["fit"]["formula"] == res2["fit"]["formula"]
        assert res1["samples"] == res2["samples"]


class TestGrowthLabAPI:
    """REST API endpoint tests for Growth Lab."""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_inspect_happy_path(self, client):
        payload = {"source_code": "public class Foo { public static int calc(int a, double b) { return 1; } }"}
        r = client.post("/api/v1/compiler/growth-lab/inspect", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert len(data["methods"]) == 1
        assert data["methods"][0]["name"] == "calc"
        assert len(data["methods"][0]["params"]) == 2

    def test_inspect_compile_error(self, client):
        payload = {"source_code": "public class Broken { int calc( {"}
        r = client.post("/api/v1/compiler/growth-lab/inspect", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is False
        assert len(data["diagnostics"]) > 0

    def test_growth_lab_happy_path(self, client):
        payload = {
            "source_code": PRESETS["A1"][0],
            "method": "sumLoop",
            "size_param": "n",
            "variant": "optimized",
        }
        r = client.post("/api/v1/compiler/growth-lab", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "samples" in data
        assert "fit" in data
        assert "static_hint" in data
        assert data["fit"]["classification"] == "O(n)"
        assert "abstract cost" in data["cost_model"]

    def test_growth_lab_variant_both(self, client):
        payload = {
            "source_code": PRESETS["A1"][0],
            "method": "sumLoop",
            "size_param": "n",
            "variant": "both",
        }
        r = client.post("/api/v1/compiler/growth-lab", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "variants" in data
        assert "comparison" in data["variants"]

    def test_save_artifact_schema_validation(self, client):
        payload = {
            "source_code": PRESETS["A1"][0],
            "method": "sumLoop",
            "size_param": "n",
            "save_artifact": True,
        }
        r = client.post("/api/v1/compiler/growth-lab", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "artifact" in data
        artifact = data["artifact"]
        assert artifact["artifact_type"] == "growth_analysis"

        with open("shared/schemas/artifact.schema.json", "r") as f:
            schema = json.load(f)
        jsonschema.validate(instance=artifact, schema=schema)

    def test_validation_errors_return_4xx_never_500(self, client):
        # 1. Missing method
        r1 = client.post("/api/v1/compiler/growth-lab", json={
            "source_code": PRESETS["A1"][0],
            "method": "",
            "size_param": "n"
        })
        assert r1.status_code in (400, 422)

        # 2. Bad size_param
        r2 = client.post("/api/v1/compiler/growth-lab", json={
            "source_code": PRESETS["A1"][0],
            "method": "sumLoop",
            "size_param": "nonexistent"
        })
        assert r2.status_code in (400, 422)

        # 3. Sizes > 40
        r3 = client.post("/api/v1/compiler/growth-lab", json={
            "source_code": PRESETS["A1"][0],
            "method": "sumLoop",
            "size_param": "n",
            "sizes": list(range(1, 45))
        })
        assert r3.status_code in (400, 422)

        # 4. Size <= 0
        r4 = client.post("/api/v1/compiler/growth-lab", json={
            "source_code": PRESETS["A1"][0],
            "method": "sumLoop",
            "size_param": "n",
            "sizes": [0, 5, 10]
        })
        assert r4.status_code in (400, 422)

        # 5. Non-numeric fixed arg
        multi_param_src = "public class M { public static int run(int n, int k) { return n + k; } }"
        r5 = client.post("/api/v1/compiler/growth-lab", json={
            "source_code": multi_param_src,
            "method": "run",
            "size_param": "n",
            "fixed_args": {"k": "not_a_number"}
        })
        assert r5.status_code in (400, 422)
