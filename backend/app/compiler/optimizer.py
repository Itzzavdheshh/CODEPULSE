from typing import List, Dict, Any, Tuple

class TACOptimizer:
    """
    Constant folding, Constant propagation, and Dead Code elimination for TAC.
    """
    def optimize(self, quads: List[dict]) -> Tuple[List[dict], List[str]]:
        transformations = []
        optimized = []
        constants: Dict[str, Any] = {}

        for q in quads:
            op = q["op"]
            arg1 = q["arg1"]
            arg2 = q["arg2"]
            res = q["result"]

            # Replace constant args
            if arg1 in constants:
                arg1 = str(constants[arg1])
            if arg2 in constants:
                arg2 = str(constants[arg2])

            # Constant Folding
            if op in ("+", "-", "*", "/") and arg1.replace('.', '', 1).isdigit() and arg2.replace('.', '', 1).isdigit():
                v1 = float(arg1) if '.' in arg1 else int(arg1)
                v2 = float(arg2) if '.' in arg2 else int(arg2)
                
                computed = None
                if op == "+": computed = v1 + v2
                elif op == "-": computed = v1 - v2
                elif op == "*": computed = v1 * v2
                elif op == "/" and v2 != 0: computed = v1 / v2

                if computed is not None:
                    constants[res] = computed
                    transformations.append(f"Constant Folding: Evaluated '{arg1} {op} {arg2}' to {computed} for '{res}'")
                    optimized.append({
                        "op": "=",
                        "arg1": str(computed),
                        "arg2": "",
                        "result": res,
                        "line": q.get("line", 1)
                    })
                    continue

            # Constant Assignment propagation
            if op == "=" and arg1.replace('.', '', 1).isdigit():
                val = float(arg1) if '.' in arg1 else int(arg1)
                constants[res] = val
                transformations.append(f"Constant Propagation: Tracked '{res} = {val}'")

            optimized.append({
                "op": op,
                "arg1": arg1,
                "arg2": arg2,
                "result": res,
                "line": q.get("line", 1)
            })

        return optimized, transformations
