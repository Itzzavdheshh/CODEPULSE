"""
Growth Engine (Growth Lab) for CODEPULSE.

Empirical algorithmic growth classifier and complexity laboratory.
Compiles Java-like source once, runs TACInterpreter across an input ladder,
measures abstract instruction steps, fits polynomial/log/exponential candidate bases
using NumPy least squares, and estimates static loop-nesting hints.
"""

import math
import time
from typing import List, Dict, Any, Union, Optional, Tuple
import numpy as np

from app.compiler.service import CompilerService
from app.compiler.interpreter import TACInterpreter, extract_param_map


CANDIDATE_BASES: List[Tuple[str, Any]] = [
    ("O(1)", lambda n: np.zeros_like(n, dtype=float)),
    ("O(log n)", lambda n: np.log2(np.maximum(n, 1.0))),
    ("O(sqrt n)", lambda n: np.sqrt(np.maximum(n, 0.0))),
    ("O(n)", lambda n: n.astype(float)),
    ("O(n log n)", lambda n: n * np.log2(np.maximum(n, 1.0))),
    ("O(n^2)", lambda n: (n.astype(float)) ** 2),
    ("O(n^3)", lambda n: (n.astype(float)) ** 3),
    ("O(2^n)", lambda n: 2.0 ** np.minimum(n.astype(float), 30.0)),
]


def inspect_source(source_code: str) -> Dict[str, Any]:
    """
    Inspects source code for available classes, methods, and parameter signatures.
    Returns compiler error diagnostics instead of methods if the source has syntax/semantic errors.
    """
    if not source_code or not source_code.strip():
        return {
            "ok": False,
            "diagnostics": [
                {
                    "stage": "Syntax",
                    "severity": "error",
                    "message": "Source code cannot be empty.",
                    "line": 1,
                    "column": 1,
                }
            ],
            "methods": [],
        }

    compiler_service = CompilerService()
    analysis = compiler_service.analyze_source(source_code)
    all_diagnostics = analysis.get("diagnostics", [])
    errors = [d for d in all_diagnostics if d.get("severity") == "error"]

    if errors:
        return {
            "ok": False,
            "diagnostics": errors,
            "methods": [],
        }

    methods: List[Dict[str, Any]] = []
    classes = analysis.get("ast", {}).get("classes", [])
    for cls in classes:
        for m in cls.get("methods", []):
            methods.append({
                "name": m.get("name", ""),
                "return_type": m.get("return_type", "void"),
                "params": [
                    {
                        "name": p.get("name", "") if isinstance(p, dict) else str(p),
                        "type": p.get("type", "int") if isinstance(p, dict) else "int",
                    }
                    for p in m.get("params", [])
                ],
            })

    return {
        "ok": True,
        "diagnostics": all_diagnostics,
        "methods": methods,
    }


def _validate_and_resolve_params(
    methods: List[Dict[str, Any]],
    target_method: str,
    size_param: Union[str, int],
    fixed_args: Optional[Dict[str, Any]] = None,
) -> Tuple[Dict[str, Any], str, Dict[str, Any]]:
    """Resolves method declaration, size parameter name, and builds default fixed arguments."""
    target_m_info = None
    for m in methods:
        if m["name"].lower() == target_method.lower():
            target_m_info = m
            break

    if not target_m_info:
        available = [m["name"] for m in methods]
        raise ValueError(f"Method '{target_method}' not found. Available methods: {available}")

    params = target_m_info.get("params", [])
    if not params:
        raise ValueError(f"Method '{target_method}' has 0 parameters; growth analysis requires at least one parameter.")

    # Resolve size parameter
    size_param_name = ""
    if isinstance(size_param, int):
        if 0 <= size_param < len(params):
            size_param_name = params[size_param]["name"]
        else:
            raise ValueError(
                f"Size parameter index {size_param} out of range for method '{target_method}' (0..{len(params)-1})."
            )
    elif isinstance(size_param, str):
        matched = False
        for p in params:
            if p["name"].lower() == size_param.lower():
                size_param_name = p["name"]
                matched = True
                break
        if not matched:
            valid_names = [p["name"] for p in params]
            raise ValueError(f"Size parameter '{size_param}' not found in method '{target_method}'. Available: {valid_names}")
    else:
        raise ValueError("size_param must be a parameter name (str) or index (int).")

    # Build fixed arguments for remaining parameters
    fixed_args = fixed_args or {}
    resolved_fixed: Dict[str, Any] = {}
    for p in params:
        p_name = p["name"]
        if p_name == size_param_name:
            continue
        p_type = p.get("type", "int").lower()
        if p_name in fixed_args:
            val = fixed_args[p_name]
            if not isinstance(val, (int, float)) or math.isnan(val) or math.isinf(val):
                raise ValueError(f"Fixed argument '{p_name}' must be a finite numeric value.")
            resolved_fixed[p_name] = int(val) if "int" in p_type else float(val)
        else:
            # Default fallback 0 for int/boolean, 0.0 for double/float
            resolved_fixed[p_name] = 0.0 if ("double" in p_type or "float" in p_type) else 0

    return target_m_info, size_param_name, resolved_fixed


def measure(
    source_code: str,
    method: str,
    size_param: Union[str, int],
    fixed_args: Optional[Dict[str, Any]] = None,
    sizes: Optional[List[int]] = None,
    variant: str = "optimized",
    max_steps_per_run: int = 300_000,
    time_budget_s: float = 5.0,
) -> Dict[str, Any]:
    """
    Measures abstract instruction steps for a given method across a sequence of sizes.
    Compiles source ONCE, then runs TACInterpreter in a loop.
    Stops the ladder cleanly on error, step limit, recursion depth, or time budget.
    """
    inspection = inspect_source(source_code)
    if not inspection["ok"]:
        err_msg = "; ".join([d.get("message", "Compiler error") for d in inspection.get("diagnostics", [])])
        raise ValueError(f"Cannot measure source with compiler errors: {err_msg}")

    target_m_info, size_param_name, fixed_values = _validate_and_resolve_params(
        inspection["methods"], method, size_param, fixed_args
    )
    actual_method_name = target_m_info["name"]

    # Validate ladder sizes
    if sizes is None:
        ladder = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]
    else:
        if not isinstance(sizes, list):
            raise ValueError("sizes must be a list of positive integers.")
        if len(sizes) == 0:
            raise ValueError("sizes list cannot be empty.")
        if len(sizes) > 40:
            raise ValueError(f"sizes list exceeds maximum limit of 40 values (got {len(sizes)}).")
        cleaned_sizes = []
        for s in sizes:
            if not isinstance(s, int) or isinstance(s, bool) or s <= 0 or s > 100_000:
                raise ValueError(f"Each size must be a positive integer <= 100000 (got {s}).")
            cleaned_sizes.append(s)
        ladder = sorted(list(set(cleaned_sizes)))

    # Compile source once
    compiler_service = CompilerService()
    analysis = compiler_service.analyze_source(source_code)
    quads = analysis.get("intermediate_code" if variant == "raw" else "optimized_code", [])
    param_map = extract_param_map(analysis.get("ast", {}))

    samples: List[Dict[str, Any]] = []
    truncated_reason: Optional[str] = None
    start_time = time.perf_counter()

    for n in ladder:
        # Check overall time budget
        elapsed = time.perf_counter() - start_time
        if elapsed >= time_budget_s:
            truncated_reason = f"Execution stopped: time budget of {time_budget_s:.1f}s exceeded after {len(samples)} runs."
            break

        current_args = dict(fixed_values)
        current_args[size_param_name] = n

        interp = TACInterpreter(
            quads=quads,
            param_map=param_map,
            max_steps=max_steps_per_run,
            max_call_depth=200,
        )
        res = interp.run(actual_method_name, current_args, variant=variant, trace=False)

        status_raw = res.get("status", "error")
        status = "ok" if status_raw == "success" else status_raw
        steps = res.get("step_count", 0)
        ret_val = res.get("return_value")

        samples.append({
            "n": n,
            "steps": steps,
            "status": status,
            "return_value": ret_val,
        })

        if status != "ok":
            if status == "step_limit_exceeded":
                truncated_reason = f"Execution stopped at n={n}: max step limit of {max_steps_per_run:,} exceeded."
            elif status == "call_depth_exceeded":
                truncated_reason = f"Execution stopped at n={n}: maximum call stack depth (200) exceeded."
            else:
                msg = res.get("message", "runtime error")
                truncated_reason = f"Execution stopped at n={n}: {msg}"
            break

    return {
        "samples": samples,
        "truncated_reason": truncated_reason,
        "method": actual_method_name,
        "size_param": size_param_name,
    }


def _format_formula(winning_basis: str, a: float, b: float) -> str:
    """Formats closed-form formula string such as 'T(n) ~ 7*n + 5'."""
    b_val = round(b) if abs(b - round(b)) < 0.05 else round(b, 2)
    b_str = f" + {b_val}" if b_val > 0 else (f" - {abs(b_val)}" if b_val < 0 else "")

    if winning_basis == "O(1)":
        return f"T(n) ~ {b_val}"

    a_val = round(a) if abs(a - round(a)) < 0.05 else round(a, 2)
    a_prefix = f"{a_val}*" if a_val != 1 else ""

    if winning_basis == "O(log n)":
        return f"T(n) ~ {a_prefix}log(n){b_str}"
    elif winning_basis == "O(sqrt n)":
        return f"T(n) ~ {a_prefix}sqrt(n){b_str}"
    elif winning_basis == "O(n)":
        return f"T(n) ~ {a_prefix}n{b_str}"
    elif winning_basis == "O(n log n)":
        return f"T(n) ~ {a_prefix}n*log(n){b_str}"
    elif winning_basis == "O(n^2)":
        return f"T(n) ~ {a_prefix}n^2{b_str}"
    elif winning_basis == "O(n^3)":
        return f"T(n) ~ {a_prefix}n^3{b_str}"
    elif winning_basis == "O(2^n)":
        a_exp = round(a, 3) if a < 0.1 else round(a, 2)
        return f"T(n) ~ {a_exp}*2^n{b_str}"

    return f"T(n) ~ {a_val}*g(n){b_str}"


def fit_growth(samples: List[Dict[str, Any]], truncated_reason: Optional[str] = None) -> Dict[str, Any]:
    """
    Fits empirical growth candidates against measured points using NumPy least-squares regression.
    Evaluates O(1), O(log n), O(sqrt n), O(n), O(n log n), O(n^2), O(n^3), O(2^n).
    Selects the simplest candidate with max relative error <= 5%, or lowest error with low confidence.
    """
    valid = [s for s in samples if s.get("status") == "ok"]
    notes: List[str] = [
        "Estimate from measured TAC steps, not a formal mathematical proof.",
        "Data-dependent paths and branching conditions can alter complexity classes.",
    ]
    if truncated_reason:
        notes.append(truncated_reason)

    if len(valid) < 5:
        notes.append("Fewer than 5 valid execution points collected: insufficient data to classify.")
        return {
            "classification": "INSUFFICIENT DATA",
            "confidence": "low",
            "formula": "N/A",
            "r2": 0.0,
            "max_relative_error": 1.0,
            "log_log_slope": 0.0,
            "doubling_ratios": [],
            "candidates": [],
            "notes": notes,
            "valid_points_count": len(valid),
        }

    ns = np.array([s["n"] for s in valid], dtype=float)
    ts = np.array([s["steps"] for s in valid], dtype=float)

    # 1. Doubling ratios between consecutive doubling points
    doubling_ratios: List[Dict[str, Any]] = []
    for i in range(len(valid) - 1):
        n1, t1 = valid[i]["n"], valid[i]["steps"]
        n2, t2 = valid[i+1]["n"], valid[i+1]["steps"]
        if n2 == 2 * n1:
            ratio = round(float(t2 / max(1, t1)), 3)
            doubling_ratios.append({
                "from_n": n1,
                "to_n": n2,
                "ratio": ratio,
            })

    # 2. Log-log slope on largest half of points
    half_idx = len(valid) // 2
    ns_half = ns[half_idx:]
    ts_half = ts[half_idx:]
    if len(ns_half) >= 2 and not np.all(ts_half == ts_half[0]):
        log_n = np.log(np.maximum(ns_half, 1.0))
        log_t = np.log(np.maximum(ts_half, 1.0))
        A_log = np.vstack([log_n, np.ones_like(log_n)]).T
        slope, _ = np.linalg.lstsq(A_log, log_t, rcond=None)[0]
        log_log_slope = round(float(slope), 3)
    else:
        log_log_slope = 0.0

    # 3. Constant detection: identical steps across all n
    if np.all(ts == ts[0]):
        const_val = int(ts[0])
        return {
            "classification": "O(1)",
            "confidence": "high",
            "formula": f"T(n) ~ {const_val}",
            "r2": 1.0,
            "max_relative_error": 0.0,
            "log_log_slope": 0.0,
            "doubling_ratios": doubling_ratios,
            "candidates": [
                {
                    "basis": "O(1)",
                    "a": 0.0,
                    "b": float(const_val),
                    "r2": 1.0,
                    "max_relative_error": 0.0,
                }
            ],
            "notes": notes,
            "valid_points_count": len(valid),
        }

    # 4. Fit all candidate bases
    candidates: List[Dict[str, Any]] = []
    ss_tot = float(np.sum((ts - np.mean(ts)) ** 2))

    for basis_name, basis_fn in CANDIDATE_BASES:
        g = basis_fn(ns)
        if basis_name == "O(1)":
            a = 0.0
            b = float(np.mean(ts))
            pred = np.full_like(ts, b)
        else:
            X = np.vstack([g, np.ones_like(g)]).T
            # Constrained linear regression a >= 0
            (sol_a, sol_b), _, _, _ = np.linalg.lstsq(X, ts, rcond=None)
            if sol_a <= 1e-9:
                # Non-positive growth coefficient: does not represent growth in this basis
                candidates.append({
                    "basis": basis_name,
                    "a": 0.0,
                    "b": float(sol_b),
                    "r2": -1.0,
                    "max_relative_error": 999.0,
                })
                continue
            a = float(sol_a)
            b = float(sol_b)
            pred = a * g + b

        rel_errors = np.abs(pred - ts) / np.maximum(1.0, ts)
        max_rel_error = float(np.max(rel_errors))
        ss_res = float(np.sum((ts - pred) ** 2))
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 1e-12 else 1.0
        r2 = max(-1.0, min(1.0, r2))

        candidates.append({
            "basis": basis_name,
            "a": round(a, 6),
            "b": round(b, 4),
            "r2": round(r2, 4),
            "max_relative_error": round(max_rel_error, 4),
        })

    # Sort candidates by relative error for ranking
    ranked_candidates = sorted(candidates, key=lambda c: c["max_relative_error"])

    # Selection rule:
    # Choose the SIMPLEST candidate (earliest in CANDIDATE_BASES hierarchy)
    # whose max relative error is <= 5% (0.05).
    # If none qualifies, choose the lowest relative error and set confidence "low".
    basis_order = [b[0] for b in CANDIDATE_BASES]
    qualifying = [c for c in candidates if c["max_relative_error"] <= 0.05]

    if qualifying:
        # Sort qualifying by simplest basis in hierarchy
        qualifying.sort(key=lambda c: basis_order.index(c["basis"]))
        winner = qualifying[0]
        # Confidence calculation
        if len(valid) >= 8 and winner["max_relative_error"] <= 0.03:
            confidence = "high"
        else:
            confidence = "medium"
    else:
        winner = ranked_candidates[0]
        confidence = "low"
        notes.append("No basis function achieved <= 5% max relative error across all measured sizes; selected best empirical fit with low confidence.")

    formula_str = _format_formula(winner["basis"], winner["a"], winner["b"])

    return {
        "classification": winner["basis"],
        "confidence": confidence,
        "formula": formula_str,
        "r2": winner["r2"],
        "max_relative_error": winner["max_relative_error"],
        "log_log_slope": log_log_slope,
        "doubling_ratios": doubling_ratios,
        "candidates": ranked_candidates,
        "notes": notes,
        "valid_points_count": len(valid),
    }


def static_hint(analysis: Dict[str, Any], method: str) -> Dict[str, Any]:
    """
    Estimates loop-nesting depth and recursion status from method TAC quads.
    A backward GOTO/jump to an earlier LABEL denotes a loop; nesting is derived
    from overlapping backward-jump label ranges.
    Returns {loop_depth, has_recursion, hint_class} labeled as a rough HINT.
    """
    quads = analysis.get("intermediate_code", [])
    m_quads: List[dict] = []
    in_method = False

    for q in quads:
        op = q.get("op", "")
        arg1 = q.get("arg1", "")
        if op == "FUNC_START":
            if arg1.lower() == method.lower():
                in_method = True
        if in_method:
            m_quads.append(q)
        if op == "FUNC_END" and in_method:
            break

    if not m_quads:
        m_quads = quads

    # Detect direct recursion
    has_recursion = any(
        q.get("op") == "CALL" and str(q.get("arg1", "")).lower() == method.lower()
        for q in m_quads
    )

    # Collect label positions
    labels: Dict[str, int] = {}
    for idx, q in enumerate(m_quads):
        if q.get("op") == "LABEL":
            lbl = q.get("result", "")
            if lbl:
                labels[lbl] = idx

    # Detect backward jump intervals
    intervals: List[Tuple[int, int]] = []
    for idx, q in enumerate(m_quads):
        op = q.get("op", "")
        if op in ("GOTO", "IF_FALSE", "IF_TRUE"):
            target_lbl = q.get("result", "")
            if target_lbl in labels:
                target_idx = labels[target_lbl]
                if target_idx < idx:
                    intervals.append((target_idx, idx))

    # Calculate maximum loop nesting depth across all instructions
    loop_depth = 0
    if intervals:
        for idx in range(len(m_quads)):
            depth = sum(1 for (s, e) in intervals if s <= idx <= e)
            if depth > loop_depth:
                loop_depth = depth

    if has_recursion:
        hint_class = "recursion: see measured"
    elif loop_depth == 0:
        hint_class = "O(1)"
    elif loop_depth == 1:
        hint_class = "O(n)"
    elif loop_depth == 2:
        hint_class = "O(n^2)"
    elif loop_depth == 3:
        hint_class = "O(n^3)"
    else:
        hint_class = f"O(n^{loop_depth})"

    return {
        "loop_depth": loop_depth,
        "has_recursion": has_recursion,
        "hint_class": hint_class,
    }


def analyze_growth(
    source_code: str,
    method: str,
    size_param: Union[str, int],
    fixed_args: Optional[Dict[str, Any]] = None,
    sizes: Optional[List[int]] = None,
    variant: str = "optimized",
    max_steps_per_run: int = 300_000,
    time_budget_s: float = 5.0,
) -> Dict[str, Any]:
    """
    Main Growth Lab orchestration engine.
    Wraps measurement, growth fitting, and static hint generation.
    When variant='both', executes both raw and optimized TAC and returns comparison metrics.
    """
    start_total = time.perf_counter()

    # Pre-compile for static hint extraction
    compiler_service = CompilerService()
    analysis = compiler_service.analyze_source(source_code)
    hint = static_hint(analysis, method)

    if variant == "both":
        raw_res = measure(
            source_code,
            method,
            size_param,
            fixed_args=fixed_args,
            sizes=sizes,
            variant="raw",
            max_steps_per_run=max_steps_per_run,
            time_budget_s=time_budget_s / 2.0,
        )
        opt_res = measure(
            source_code,
            method,
            size_param,
            fixed_args=fixed_args,
            sizes=sizes,
            variant="optimized",
            max_steps_per_run=max_steps_per_run,
            time_budget_s=time_budget_s / 2.0,
        )

        fit_raw = fit_growth(raw_res["samples"], raw_res["truncated_reason"])
        fit_opt = fit_growth(opt_res["samples"], opt_res["truncated_reason"])

        # Compare at largest common n
        raw_map = {s["n"]: s["steps"] for s in raw_res["samples"] if s["status"] == "ok"}
        opt_map = {s["n"]: s["steps"] for s in opt_res["samples"] if s["status"] == "ok"}
        common_ns = sorted(list(set(raw_map.keys()) & set(opt_map.keys())))

        if common_ns:
            largest_n = common_ns[-1]
            raw_s = raw_map[largest_n]
            opt_s = opt_map[largest_n]
            steps_saved = raw_s - opt_s
            saved_pct = round((steps_saved / max(1, raw_s)) * 100.0, 2)
        else:
            largest_n = 0
            steps_saved = 0
            saved_pct = 0.0

        classes_match = fit_raw["classification"] == fit_opt["classification"]
        elapsed_ms = round((time.perf_counter() - start_total) * 1000.0, 2)

        return {
            "samples": opt_res["samples"],
            "fit": fit_opt,
            "static_hint": hint,
            "variants": {
                "raw": {
                    "samples": raw_res["samples"],
                    "fit": fit_raw,
                    "truncated_reason": raw_res["truncated_reason"],
                },
                "optimized": {
                    "samples": opt_res["samples"],
                    "fit": fit_opt,
                    "truncated_reason": opt_res["truncated_reason"],
                },
                "comparison": {
                    "classes_match": classes_match,
                    "steps_saved_at_largest_n": steps_saved,
                    "steps_saved_pct": saved_pct,
                    "largest_n": largest_n,
                },
            },
            "truncated_reason": opt_res["truncated_reason"],
            "cost_model": "abstract cost (TAC steps), not physical time",
            "elapsed_ms": elapsed_ms,
        }

    else:
        var_choice = "raw" if variant == "raw" else "optimized"
        meas_res = measure(
            source_code,
            method,
            size_param,
            fixed_args=fixed_args,
            sizes=sizes,
            variant=var_choice,
            max_steps_per_run=max_steps_per_run,
            time_budget_s=time_budget_s,
        )
        fit = fit_growth(meas_res["samples"], meas_res["truncated_reason"])
        elapsed_ms = round((time.perf_counter() - start_total) * 1000.0, 2)

        return {
            "samples": meas_res["samples"],
            "fit": fit,
            "static_hint": hint,
            "truncated_reason": meas_res["truncated_reason"],
            "cost_model": "abstract cost (TAC steps), not physical time",
            "elapsed_ms": elapsed_ms,
        }
