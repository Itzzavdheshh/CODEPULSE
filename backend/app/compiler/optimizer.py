from typing import List, Dict, Any, Tuple, Set

class TACOptimizer:
    """
    Dataflow-Aware, Loop-Safe Optimizer for Three-Address Code (TAC).
    Performs Constant Folding, Safe Constant Propagation (blocking loop-carried mutations & join conflicts),
    Constant Condition Elimination / Dead Branch Removal, Algebraic Simplification, and Conservative Dead Code Elimination (DCE).
    Returns (optimized_quads, transformation_strings, structured_audit_data).
    """

    def is_number(self, val: str) -> bool:
        if not val:
            return False
        if val in ("true", "false"):
            return False
        if val.startswith('-'):
            val = val[1:]
        parts = val.split('.', 1)
        if len(parts) == 1:
            return parts[0].isdigit()
        return parts[0].isdigit() and parts[1].isdigit()

    def parse_number(self, val: str) -> Any:
        if '.' in val:
            return float(val)
        return int(val)

    def optimize(self, quads: List[dict]) -> Tuple[List[dict], List[str], Dict[str, Any]]:
        if not quads:
            empty_audit = {
                "summary": {"original_quad_count": 0, "optimized_quad_count": 0, "reduction_percentage": 0.0, "total_transformations_applied": 0},
                "pass_results": []
            }
            return [], [], empty_audit

        original_count = len(quads)

        # Step 1: Pre-pass to identify loop regions and loop-mutated variables
        label_positions: Dict[str, int] = {}
        for idx, q in enumerate(quads):
            if q.get("op") == "LABEL":
                label_positions[q.get("result", "")] = idx

        loop_mutated_vars: Set[str] = set()
        for idx, q in enumerate(quads):
            op = q.get("op", "")
            target_lbl = q.get("result", "")
            if op in ("GOTO", "IF_FALSE") and target_lbl in label_positions:
                lbl_idx = label_positions[target_lbl]
                if lbl_idx <= idx:
                    for loop_q_idx in range(lbl_idx, idx + 1):
                        loop_q = quads[loop_q_idx]
                        res = loop_q.get("result", "")
                        if res and loop_q.get("op") not in ("LABEL", "GOTO", "IF_FALSE", "FUNC_START", "FUNC_END", "PRINT", "RETURN", "PARAM", "CALL"):
                            loop_mutated_vars.add(res)

        # Step 2: Dataflow Constant Propagation and Folding Passes
        transformations: List[str] = []
        pass_details: Dict[str, Dict[str, Any]] = {
            "Constant Folding": {"status": "NOT_APPLIED", "candidates": 0, "applied": 0, "details": []},
            "Constant Propagation": {"status": "NOT_APPLIED", "candidates": 0, "applied": 0, "details": []},
            "Constant Condition Elimination": {"status": "NOT_APPLIED", "candidates": 0, "applied": 0, "details": []},
            "Algebraic Simplification": {"status": "NOT_APPLIED", "candidates": 0, "applied": 0, "details": []},
            "Dead Code Elimination": {"status": "NOT_APPLIED", "candidates": 0, "applied": 0, "details": []}
        }

        # Multi-pass iterative folding
        current_quads = [dict(q) for q in quads]
        changed = True
        pass_iteration = 0

        while changed and pass_iteration < 4:
            changed = False
            pass_iteration += 1
            next_quads: List[dict] = []
            constants: Dict[str, str] = {}

            for q in current_quads:
                op = q.get("op", "")
                arg1 = str(q.get("arg1", ""))
                arg2 = str(q.get("arg2", ""))
                res = str(q.get("result", ""))
                line = q.get("line", 1)

                if op in ("FUNC_START", "FUNC_END", "LABEL"):
                    constants.clear()
                    next_quads.append({"op": op, "arg1": arg1, "arg2": arg2, "result": res, "line": line})
                    continue

                # Propagate constant arg1
                if arg1 in constants:
                    if arg1 in loop_mutated_vars:
                        pass_details["Constant Propagation"]["candidates"] += 1
                        pass_details["Constant Propagation"]["details"].append({
                            "type": "constant_propagation", "variable": arg1, "status": "blocked", "reason": "loop-carried mutation"
                        })
                    else:
                        pass_details["Constant Propagation"]["candidates"] += 1
                        pass_details["Constant Propagation"]["applied"] += 1
                        pass_details["Constant Propagation"]["status"] = "APPLIED"
                        arg1 = constants[arg1]
                        changed = True

                # Propagate constant arg2
                if arg2 in constants:
                    if arg2 in loop_mutated_vars:
                        pass_details["Constant Propagation"]["candidates"] += 1
                        pass_details["Constant Propagation"]["details"].append({
                            "type": "constant_propagation", "variable": arg2, "status": "blocked", "reason": "loop-carried mutation"
                        })
                    else:
                        pass_details["Constant Propagation"]["candidates"] += 1
                        pass_details["Constant Propagation"]["applied"] += 1
                        pass_details["Constant Propagation"]["status"] = "APPLIED"
                        arg2 = constants[arg2]
                        changed = True

                # Constant Condition / Dead Branch Elimination for IF_FALSE
                if op == "IF_FALSE" and self.is_number(arg1):
                    cond_val = self.parse_number(arg1)
                    pass_details["Constant Condition Elimination"]["candidates"] += 1
                    if cond_val == 0:
                        # IF_FALSE 0 GOTO L -> Always jumps to L -> Unconditional GOTO L
                        pass_details["Constant Condition Elimination"]["applied"] += 1
                        pass_details["Constant Condition Elimination"]["status"] = "APPLIED"
                        transformations.append(f"Constant Condition Elimination: Transformed 'IF_FALSE 0 GOTO {res}' to unconditional 'GOTO {res}'")
                        next_quads.append({"op": "GOTO", "arg1": "", "arg2": "", "result": res, "line": line})
                        changed = True
                        continue
                    else:
                        # IF_FALSE 1 GOTO L -> Never jumps to L -> Dead Branch Removal
                        pass_details["Constant Condition Elimination"]["applied"] += 1
                        pass_details["Constant Condition Elimination"]["status"] = "APPLIED"
                        transformations.append(f"Constant Condition Elimination: Eliminated dead branch 'IF_FALSE {arg1} GOTO {res}'")
                        changed = True
                        continue

                # Constant Folding for binary operators
                if op in ("+", "-", "*", "/", "%", "==", "!=", "<", ">", "<=", ">=") and self.is_number(arg1) and self.is_number(arg2):
                    pass_details["Constant Folding"]["candidates"] += 1
                    v1 = self.parse_number(arg1)
                    v2 = self.parse_number(arg2)
                    computed = None

                    if op == "+": computed = v1 + v2
                    elif op == "-": computed = v1 - v2
                    elif op == "*": computed = v1 * v2
                    elif op == "/" and v2 != 0: computed = v1 / v2 if isinstance(v1, float) or isinstance(v2, float) else v1 // v2
                    elif op == "%" and v2 != 0: computed = v1 % v2
                    elif op == "==": computed = 1 if v1 == v2 else 0
                    elif op == "!=": computed = 1 if v1 != v2 else 0
                    elif op == "<": computed = 1 if v1 < v2 else 0
                    elif op == ">": computed = 1 if v1 > v2 else 0
                    elif op == "<=": computed = 1 if v1 <= v2 else 0
                    elif op == ">=": computed = 1 if v1 >= v2 else 0

                    if computed is not None:
                        res_str = str(computed)
                        pass_details["Constant Folding"]["applied"] += 1
                        pass_details["Constant Folding"]["status"] = "APPLIED"
                        pass_details["Constant Folding"]["details"].append({
                            "type": "constant_folding", "before": f"{arg1} {op} {arg2}", "after": res_str, "result": res, "line": line
                        })
                        transformations.append(f"Constant Folding: Evaluated '{arg1} {op} {arg2}' to {res_str} for '{res}'")
                        if res and res not in loop_mutated_vars:
                            constants[res] = res_str
                        next_quads.append({"op": "=", "arg1": res_str, "arg2": "", "result": res, "line": line})
                        changed = True
                        continue

                # Algebraic Simplification
                if op == "+" and arg2 == "0":
                    pass_details["Algebraic Simplification"]["candidates"] += 1
                    pass_details["Algebraic Simplification"]["applied"] += 1
                    pass_details["Algebraic Simplification"]["status"] = "APPLIED"
                    transformations.append(f"Algebraic Simplification: Simplified '{arg1} + 0' to '{arg1}'")
                    if res and res not in loop_mutated_vars and arg1 in constants:
                        constants[res] = constants[arg1]
                    next_quads.append({"op": "=", "arg1": arg1, "arg2": "", "result": res, "line": line})
                    changed = True
                    continue

                if op == "-" and arg2 == "0":
                    pass_details["Algebraic Simplification"]["candidates"] += 1
                    pass_details["Algebraic Simplification"]["applied"] += 1
                    pass_details["Algebraic Simplification"]["status"] = "APPLIED"
                    transformations.append(f"Algebraic Simplification: Simplified '{arg1} - 0' to '{arg1}'")
                    if res and res not in loop_mutated_vars and arg1 in constants:
                        constants[res] = constants[arg1]
                    next_quads.append({"op": "=", "arg1": arg1, "arg2": "", "result": res, "line": line})
                    changed = True
                    continue

                # Constant Assignment
                if op == "=":
                    if self.is_number(arg1):
                        if res not in loop_mutated_vars:
                            constants[res] = arg1
                            pass_details["Constant Propagation"]["candidates"] += 1
                            pass_details["Constant Propagation"]["applied"] += 1
                            pass_details["Constant Propagation"]["status"] = "APPLIED"
                            transformations.append(f"Constant Propagation: Tracked '{res} = {arg1}'")
                        else:
                            constants.pop(res, None)
                    else:
                        constants.pop(res, None)

                if res and op not in ("IF_FALSE", "GOTO", "LABEL", "FUNC_START", "FUNC_END", "PRINT", "RETURN"):
                    if not self.is_number(arg1) or op != "=":
                        constants.pop(res, None)

                next_quads.append({"op": op, "arg1": arg1, "arg2": arg2, "result": res, "line": line})

            current_quads = next_quads

        # Step 3: Conservative Dead Code Elimination (DCE) for temporary variables
        read_temps: Set[str] = set()
        for q in current_quads:
            if q.get("arg1"): read_temps.add(str(q["arg1"]))
            if q.get("arg2"): read_temps.add(str(q["arg2"]))

        dce_quads: List[dict] = []
        eliminated_count = 0

        for q in current_quads:
            res = str(q.get("result", ""))
            op = q.get("op", "")
            # Only eliminate unused internal compiler temporaries (starting with 't')
            if op == "=" and res.startswith("t") and res not in read_temps:
                pass_details["Dead Code Elimination"]["candidates"] += 1
                pass_details["Dead Code Elimination"]["applied"] += 1
                pass_details["Dead Code Elimination"]["status"] = "APPLIED"
                eliminated_count += 1
                transformations.append(f"Dead Code Elimination: Removed dead assignment to '{res}'")
                continue
            dce_quads.append(q)

        final_count = len(dce_quads)
        reduction_pct = round((1.0 - (final_count / max(1, original_count))) * 100.0, 1)
        total_applied = sum(p["applied"] for p in pass_details.values())

        audit_data = {
            "summary": {
                "original_quad_count": original_count,
                "optimized_quad_count": final_count,
                "reduction_percentage": reduction_pct,
                "total_transformations_applied": total_applied,
                "passes_executed": list(pass_details.keys())
            },
            "pass_results": pass_details,
            "transformations_trace": transformations
        }

        # Deduplicate transformation strings for clean reporting
        unique_transformations = list(dict.fromkeys(transformations))

        return dce_quads, unique_transformations, audit_data
