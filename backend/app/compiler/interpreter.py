"""
TAC (Three-Address Code) Interpreter Engine for CODEPULSE.

Execution and Cost Model Specification:
------------------------------------------
1. Step Counting Rule:
   Every executed quadruple counts as 1 abstract instruction ("step") EXCEPT:
   - LABEL: Jump target metadata, zero computational work.
   - FUNC_START: Procedural boundary marker, zero computational work.
   - FUNC_END: Procedural boundary marker, zero computational work.
   Cost Model: Abstract execution cost (quads executed), NOT physical wall-clock time.

2. Numeric Typing & Arithmetic Semantics:
   - Literals: "5" -> int, "5.0" / "1.5" -> float, "true" / "True" -> 1 (int), "false" / "False" -> 0 (int).
   - Int Arithmetic: 32-bit signed integers wrapping to [-2147483648, 2147483647] (Java semantics).
   - Int Division (/): Truncates toward zero like Java (int(a / b)). Division by zero returns structured error.
   - Modulo (%): Follows Java sign convention: a % b = a - (a / b) * b. Result sign matches dividend.
   - Mixed Int/Float: Automatically widens to float.
   - Relational (<, >, <=, >=, ==, !=) & Logical (&&, ||, !): Evaluate strictly to 1 or 0 (int),
     matching the condition semantics expected by the compiler's IF_FALSE instruction.
   - DECLARE: Initializes variables to 0 (int/boolean) or 0.0 (float/double) by declared type.

3. Method & Parameter Ordering:
   - Parameter names and their exact declaration order are extracted directly from
     the AST MethodDeclaration nodes (MethodNode.params).
   - Method streams are partitioned by FUNC_START and FUNC_END markers.
   - Target labels are mapped to intra-method instruction indices during initialization.

4. Safety & Stack Architecture:
   - Explicit call frame stack (max_call_depth=200). Zero Python recursion during interpretation.
   - Maximum execution step limit (max_steps=1_000_000) returns status "step_limit_exceeded".
   - Structured error return on runtime faults (division by zero, undefined variable, unknown label,
     unknown method, call depth exceeded). Never crashes the host server.

5. CFG Basic Block Alignment:
   - Reuses CFGBuilder._build_single_method_cfg (read-only import from app.compiler.cfg)
     to partition method quads into basic blocks identical to cfg.json.
   - Maps every executed quad index directly to its CFG basic block ID (e.g. "B0", "B1").
"""

import math
from typing import List, Dict, Any, Union, Optional
from app.compiler.cfg import CFGBuilder


class TACInterpreterError(Exception):
    def __init__(self, error_type: str, message: str, ip: int = 0, line: int = 0):
        super().__init__(message)
        self.error_type = error_type
        self.message = message
        self.ip = ip
        self.line = line


def to_int32(val: Union[int, float]) -> int:
    """Wraps an integer to 32-bit signed two's complement [-2147483648, 2147483647] like Java."""
    val = int(val) & 0xFFFFFFFF
    if val >= 0x80000000:
        val -= 0x100000000
    return val


def java_div(a: Any, b: Any, ip: int, line: int) -> Any:
    """Java-compliant division truncating toward zero for ints; standard division for floats."""
    if isinstance(a, float) or isinstance(b, float):
        if float(b) == 0.0:
            raise TACInterpreterError("DivisionByZero", "Division by zero", ip=ip, line=line)
        return float(a) / float(b)

    if int(b) == 0:
        raise TACInterpreterError("DivisionByZero", "Division by zero", ip=ip, line=line)

    # In Java, int division truncates toward zero
    return to_int32(int(int(a) / int(b)))


def java_mod(a: Any, b: Any, ip: int, line: int) -> Any:
    """Java-compliant modulo: a % b = a - (a / b) * b. Result sign matches dividend a."""
    if isinstance(a, float) or isinstance(b, float):
        if float(b) == 0.0:
            raise TACInterpreterError("DivisionByZero", "Modulo by zero", ip=ip, line=line)
        return math.fmod(float(a), float(b))

    if int(b) == 0:
        raise TACInterpreterError("DivisionByZero", "Modulo by zero", ip=ip, line=line)

    q = int(int(a) / int(b))
    return to_int32(int(a) - q * int(b))


def is_truthy(val: Any) -> bool:
    """Evaluates whether an operand is truthy (1/non-zero) or falsey (0/False)."""
    if val is None or val is False:
        return False
    if isinstance(val, (int, float)):
        return val != 0
    return bool(val)


def eval_operand(token: Any, env: Dict[str, Any], line: int = 0, ip: int = 0) -> Any:
    """
    Parses or resolves a TAC operand token:
    - Checks current frame environment for variables and temporaries.
    - Parses boolean and numeric literals (int, float, scientific notation).
    - Raises TACInterpreterError if an identifier is undefined.
    """
    if token is None or token == "":
        return None

    s = str(token).strip()

    if s in env:
        return env[s]

    # Boolean literals
    if s in ("true", "True"):
        return 1
    if s in ("false", "False"):
        return 0

    # Integer literal
    try:
        return int(s)
    except ValueError:
        pass

    # Float literal
    try:
        v = float(s)
        if math.isnan(v) or math.isinf(v):
            raise TACInterpreterError("InvalidNumber", f"Non-finite float value: '{s}'", ip=ip, line=line)
        return v
    except ValueError:
        pass

    # Unresolved identifier -> undefined variable
    raise TACInterpreterError("UndefinedVariable", f"Undefined variable or temporary: '{s}'", ip=ip, line=line)


def format_quad(q: dict) -> str:
    """Formats a quad dictionary into human-readable TAC string."""
    op_q = q.get("op", "")
    arg1 = q.get("arg1", "")
    arg2 = q.get("arg2", "")
    result = q.get("result", "")
    if op_q == "LABEL":
        return f"{result}:"
    if op_q == "GOTO":
        return f"GOTO {result}"
    if op_q == "IF_FALSE":
        return f"IF_FALSE {arg1} GOTO {result}"
    if op_q == "=":
        return f"{result} = {arg1}"
    if op_q in ("+", "-", "*", "/", "%", "==", "!=", "<", ">", "<=", ">=", "&&", "||"):
        if not arg2:
            return f"{result} = {op_q} {arg1}"
        return f"{result} = {arg1} {op_q} {arg2}"
    if op_q == "!":
        return f"{result} = ! {arg1}"
    if op_q == "PARAM":
        return f"PARAM {arg1}"
    if op_q == "CALL":
        return f"{result} = CALL {arg1}, {arg2}" if result else f"CALL {arg1}, {arg2}"
    if op_q == "PRINT":
        return f"PRINT {arg1}"
    if op_q == "RETURN":
        return f"RETURN {arg1}".strip()
    if op_q == "DECLARE":
        return f"DECLARE {arg1} {result}".strip()
    if op_q in ("FUNC_START", "FUNC_END"):
        return f"{op_q} {arg1}".strip()
    return " ".join(str(part) for part in [op_q, arg1, arg2, result] if part)


def extract_param_map(ast_data: Any) -> Dict[str, List[str]]:
    """
    Extracts parameter names and their exact declaration order for each method
    from AST MethodDeclaration nodes.
    """
    param_map: Dict[str, List[str]] = {}
    if not isinstance(ast_data, dict):
        return param_map

    classes = ast_data.get("classes", [])
    for cls in classes:
        methods = cls.get("methods", [])
        for m in methods:
            m_name = m.get("name")
            if m_name:
                params = m.get("params", [])
                names = []
                for p in params:
                    if isinstance(p, dict):
                        names.append(p.get("name", ""))
                    elif isinstance(p, str):
                        names.append(p)
                param_map[m_name] = names
    return param_map


class TACInterpreter:
    """
    Deterministic TAC (Three-Address Code) Virtual Machine.

    Executes quadruples with an explicit call stack, Java-accurate 32-bit signed
    integer wrapping and division/modulo semantics, CFG basic block tracking,
    and granular step and opcode accounting.
    """

    def __init__(
        self,
        quads: List[dict],
        param_map: Optional[Dict[str, List[str]]] = None,
        max_steps: int = 1_000_000,
        max_call_depth: int = 200
    ):
        self.raw_quads = quads or []
        self.param_map = param_map or {}
        self.max_steps = max_steps
        self.max_call_depth = max_call_depth

        # Partition quads by method
        self.method_quads: Dict[str, List[dict]] = {}
        self._partition_methods()

        # Build label maps and CFG basic block maps per method
        self.method_labels: Dict[str, Dict[str, int]] = {}
        self.method_blocks: Dict[str, Dict[int, str]] = {}
        self._build_method_metadata()

    def _partition_methods(self) -> None:
        """Splits concatenated quad stream into per-method quad sequences."""
        current_method = "main"
        for q in self.raw_quads:
            op = q.get("op", "")
            if op == "FUNC_START":
                current_method = q.get("arg1") or "main"
                if current_method not in self.method_quads:
                    self.method_quads[current_method] = []
                self.method_quads[current_method].append(q)
            elif op == "FUNC_END":
                if current_method not in self.method_quads:
                    self.method_quads[current_method] = []
                self.method_quads[current_method].append(q)
                current_method = "main"
            else:
                if current_method not in self.method_quads:
                    self.method_quads[current_method] = []
                self.method_quads[current_method].append(q)

        # Fallback if no FUNC_START was emitted
        if not self.method_quads and self.raw_quads:
            self.method_quads["main"] = list(self.raw_quads)

    def _build_method_metadata(self) -> None:
        """Builds label maps and maps every instruction index to its CFG basic block ID."""
        cfg_builder = CFGBuilder()

        for m_name, m_quads in self.method_quads.items():
            # Label map
            l_map: Dict[str, int] = {}
            for idx, q in enumerate(m_quads):
                if q.get("op") == "LABEL":
                    lbl = q.get("result", "")
                    if lbl:
                        l_map[lbl] = idx
            self.method_labels[m_name] = l_map

            # CFG basic block partition alignment
            ip_to_block: Dict[int, str] = {}
            try:
                m_cfg = cfg_builder._build_single_method_cfg(m_name, m_quads)
                blocks = m_cfg.get("blocks", [])
                curr_idx = 0
                for b in blocks:
                    inst_len = len(b.get("instructions", []))
                    for offset in range(inst_len):
                        ip_to_block[curr_idx + offset] = b.get("block_id", "B0")
                    curr_idx += inst_len
            except Exception:
                for idx in range(len(m_quads)):
                    ip_to_block[idx] = "B0"

            self.method_blocks[m_name] = ip_to_block

    def run(
        self,
        method: str,
        args: Union[list, dict],
        variant: str = "optimized",
        trace: bool = False,
        max_trace: int = 5000
    ) -> Dict[str, Any]:
        """
        Executes the specified method with the given arguments.
        Returns execution result dictionary conforming to Part 2g.
        """
        if method not in self.method_quads:
            # Check if case-insensitive match or single method available
            matched = None
            for m in self.method_quads:
                if m.lower() == method.lower():
                    matched = m
                    break
            if matched:
                method = matched
            elif len(self.method_quads) == 1 and method in ("main", ""):
                method = list(self.method_quads.keys())[0]
            else:
                return {
                    "status": "error",
                    "error_type": "UnknownMethod",
                    "message": f"Method '{method}' not found. Available methods: {list(self.method_quads.keys())}",
                    "ip": 0,
                    "line": 0,
                    "method": method,
                    "args": args,
                    "step_count": 0,
                    "op_counts": {},
                    "executed_blocks": [],
                    "block_visit_counts": {}
                }

        param_names = self.param_map.get(method, [])
        initial_env: Dict[str, Any] = {}

        # Validate and bind arguments
        if isinstance(args, list):
            if len(args) != len(param_names):
                return {
                    "status": "error",
                    "error_type": "ArgumentCountMismatch",
                    "message": f"Method '{method}' requires {len(param_names)} argument(s), got {len(args)}.",
                    "ip": 0,
                    "line": 0,
                    "method": method,
                    "args": args,
                    "step_count": 0,
                    "op_counts": {},
                    "executed_blocks": [],
                    "block_visit_counts": {}
                }
            for p_name, val in zip(param_names, args):
                if isinstance(val, (int, float)):
                    if math.isnan(val) or math.isinf(val):
                        return {
                            "status": "error",
                            "error_type": "InvalidNumber",
                            "message": f"Argument '{p_name}' must be a finite number.",
                            "ip": 0,
                            "line": 0,
                            "method": method
                        }
                    initial_env[p_name] = to_int32(val) if isinstance(val, int) else float(val)
                else:
                    initial_env[p_name] = val
        elif isinstance(args, dict):
            for p_name in param_names:
                if p_name not in args:
                    return {
                        "status": "error",
                        "error_type": "ArgumentMismatch",
                        "message": f"Missing required parameter '{p_name}' for method '{method}'.",
                        "ip": 0,
                        "line": 0,
                        "method": method
                    }
                val = args[p_name]
                if isinstance(val, (int, float)):
                    if math.isnan(val) or math.isinf(val):
                        return {
                            "status": "error",
                            "error_type": "InvalidNumber",
                            "message": f"Argument '{p_name}' must be a finite number.",
                            "ip": 0,
                            "line": 0,
                            "method": method
                        }
                    initial_env[p_name] = to_int32(val) if isinstance(val, int) else float(val)
                else:
                    initial_env[p_name] = val
        else:
            return {
                "status": "error",
                "error_type": "InvalidArguments",
                "message": "Arguments must be provided as a list or dictionary.",
                "ip": 0,
                "line": 0,
                "method": method
            }

        # Setup call stack frame
        root_frame = {
            "method": method,
            "ip": 0,
            "quads": self.method_quads[method],
            "label_map": self.method_labels[method],
            "ip_to_block": self.method_blocks[method],
            "env": initial_env,
            "param_buffer": [],
            "return_dest": None
        }

        call_stack = [root_frame]

        step_count = 0
        op_counts: Dict[str, int] = {}
        executed_blocks: List[str] = []
        block_visit_counts: Dict[str, int] = {}
        executed_edges: List[Dict[str, str]] = []
        trace_log: List[Dict[str, Any]] = []

        prev_block: Optional[str] = None
        return_value: Any = None

        # Main VM execution loop
        while call_stack:
            frame = call_stack[-1]
            quads = frame["quads"]
            ip = frame["ip"]

            if ip >= len(quads):
                # Implicit exit of method
                call_stack.pop()
                if not call_stack:
                    break
                continue

            q = quads[ip]
            op = q.get("op", "")
            arg1 = q.get("arg1", "")
            arg2 = q.get("arg2", "")
            result = q.get("result", "")
            line = q.get("line", 0)

            # Map to CFG Basic Block
            block_id = frame["ip_to_block"].get(ip, "B0")
            block_visit_counts[block_id] = block_visit_counts.get(block_id, 0) + 1
            if not executed_blocks or executed_blocks[-1] != block_id:
                executed_blocks.append(block_id)

            if prev_block and prev_block != block_id:
                executed_edges.append({"from": prev_block, "to": block_id})
            prev_block = block_id

            # Step counting rule: Every quad EXCEPT LABEL, FUNC_START, FUNC_END
            if op not in ("LABEL", "FUNC_START", "FUNC_END"):
                step_count += 1
                op_counts[op] = op_counts.get(op, 0) + 1

                # Check max steps limit
                if step_count > self.max_steps:
                    return {
                        "status": "step_limit_exceeded",
                        "method": method,
                        "args": args,
                        "return_value": None,
                        "step_count": step_count,
                        "op_counts": op_counts,
                        "executed_blocks": executed_blocks,
                        "block_visit_counts": block_visit_counts,
                        "executed_edges": executed_edges,
                        "cost_model": "abstract cost, not time",
                        "trace": trace_log if trace else None,
                        "tac_variant": variant
                    }

            # Optional execution trace
            if trace and len(trace_log) < max_trace:
                trace_log.append({
                    "step": step_count,
                    "ip": ip,
                    "op": op,
                    "text": format_quad(q),
                    "line": line,
                    "block_id": block_id
                })

            # Advance instruction pointer for current frame
            frame["ip"] += 1

            # Dispatch Opcode Execution
            try:
                env = frame["env"]

                if op in ("FUNC_START", "LABEL"):
                    pass

                elif op == "FUNC_END":
                    call_stack.pop()
                    if not call_stack:
                        break

                elif op == "DECLARE":
                    d_type = str(arg1).lower()
                    if d_type in ("float", "double"):
                        env[result] = 0.0
                    else:
                        env[result] = 0

                elif op == "=":
                    val = eval_operand(arg1, env, line=line, ip=ip)
                    env[result] = val

                elif op in ("+", "-", "*", "/", "%"):
                    if not arg2 and op == "-":
                        # Unary minus
                        v1 = eval_operand(arg1, env, line=line, ip=ip)
                        env[result] = -v1 if isinstance(v1, float) else to_int32(-v1)
                    else:
                        v1 = eval_operand(arg1, env, line=line, ip=ip)
                        v2 = eval_operand(arg2, env, line=line, ip=ip)

                        if op == "+":
                            res = v1 + v2
                            env[result] = res if isinstance(res, float) else to_int32(res)
                        elif op == "-":
                            res = v1 - v2
                            env[result] = res if isinstance(res, float) else to_int32(res)
                        elif op == "*":
                            res = v1 * v2
                            env[result] = res if isinstance(res, float) else to_int32(res)
                        elif op == "/":
                            env[result] = java_div(v1, v2, ip=ip, line=line)
                        elif op == "%":
                            env[result] = java_mod(v1, v2, ip=ip, line=line)

                elif op == "!":
                    v1 = eval_operand(arg1, env, line=line, ip=ip)
                    env[result] = 0 if is_truthy(v1) else 1

                elif op in ("<", ">", "<=", ">=", "==", "!="):
                    v1 = eval_operand(arg1, env, line=line, ip=ip)
                    v2 = eval_operand(arg2, env, line=line, ip=ip)
                    if op == "<":
                        res = 1 if v1 < v2 else 0
                    elif op == ">":
                        res = 1 if v1 > v2 else 0
                    elif op == "<=":
                        res = 1 if v1 <= v2 else 0
                    elif op == ">=":
                        res = 1 if v1 >= v2 else 0
                    elif op == "==":
                        res = 1 if v1 == v2 else 0
                    elif op == "!=":
                        res = 1 if v1 != v2 else 0
                    env[result] = res

                elif op in ("&&", "||"):
                    v1 = eval_operand(arg1, env, line=line, ip=ip)
                    v2 = eval_operand(arg2, env, line=line, ip=ip)
                    if op == "&&":
                        res = 1 if (is_truthy(v1) and is_truthy(v2)) else 0
                    else:
                        res = 1 if (is_truthy(v1) or is_truthy(v2)) else 0
                    env[result] = res

                elif op == "GOTO":
                    target_lbl = str(result).strip()
                    if target_lbl not in frame["label_map"]:
                        raise TACInterpreterError("UnknownLabel", f"Jump to unknown label: '{target_lbl}'", ip=ip, line=line)
                    frame["ip"] = frame["label_map"][target_lbl]

                elif op == "IF_FALSE":
                    cond = eval_operand(arg1, env, line=line, ip=ip)
                    target_lbl = str(result).strip()
                    if target_lbl not in frame["label_map"]:
                        raise TACInterpreterError("UnknownLabel", f"Jump to unknown label: '{target_lbl}'", ip=ip, line=line)
                    if not is_truthy(cond):
                        frame["ip"] = frame["label_map"][target_lbl]

                elif op == "PARAM":
                    param_val = eval_operand(arg1, env, line=line, ip=ip)
                    frame["param_buffer"].append(param_val)

                elif op == "CALL":
                    target_method = str(arg1).strip()
                    arg_count = int(arg2) if arg2 != "" else len(frame["param_buffer"])

                    if target_method not in self.method_quads:
                        # Attempt case-insensitive lookup
                        found = None
                        for m in self.method_quads:
                            if m.lower() == target_method.lower():
                                found = m
                                break
                        if not found:
                            raise TACInterpreterError("UnknownMethod", f"Call to unknown method: '{target_method}'", ip=ip, line=line)
                        target_method = found

                    if len(call_stack) >= self.max_call_depth:
                        raise TACInterpreterError("CallDepthExceeded", f"Call depth limit exceeded ({self.max_call_depth})", ip=ip, line=line)

                    # Extract arguments from caller's param buffer
                    if arg_count > len(frame["param_buffer"]):
                        passed_args = list(frame["param_buffer"])
                        frame["param_buffer"] = []
                    else:
                        passed_args = frame["param_buffer"][-arg_count:]
                        frame["param_buffer"] = frame["param_buffer"][:-arg_count]

                    # Prepare callee frame
                    callee_params = self.param_map.get(target_method, [])
                    callee_env: Dict[str, Any] = {}
                    for idx, p_name in enumerate(callee_params):
                        callee_env[p_name] = passed_args[idx] if idx < len(passed_args) else 0

                    frame["return_dest"] = result

                    callee_frame = {
                        "method": target_method,
                        "ip": 0,
                        "quads": self.method_quads[target_method],
                        "label_map": self.method_labels[target_method],
                        "ip_to_block": self.method_blocks[target_method],
                        "env": callee_env,
                        "param_buffer": [],
                        "return_dest": None
                    }
                    call_stack.append(callee_frame)

                elif op == "RETURN":
                    ret = eval_operand(arg1, env, line=line, ip=ip) if arg1 != "" else None
                    call_stack.pop()

                    if not call_stack:
                        # Returned from entry method
                        return_value = ret
                        break
                    else:
                        caller_frame = call_stack[-1]
                        ret_dest = caller_frame.get("return_dest")
                        if ret_dest:
                            caller_frame["env"][ret_dest] = ret
                            caller_frame["return_dest"] = None

                elif op == "PRINT":
                    # Evaluated for side effect/trace
                    _ = eval_operand(arg1, env, line=line, ip=ip)

                else:
                    # Unrecognized op -> Structured error
                    raise TACInterpreterError("UnknownOpcode", f"Unrecognized TAC opcode: '{op}'", ip=ip, line=line)

            except TACInterpreterError as e:
                return {
                    "status": "error",
                    "error_type": e.error_type,
                    "message": e.message,
                    "ip": e.ip,
                    "line": e.line,
                    "method": frame["method"],
                    "step_count": step_count,
                    "op_counts": op_counts,
                    "executed_blocks": executed_blocks,
                    "block_visit_counts": block_visit_counts
                }
            except Exception as ex:
                return {
                    "status": "error",
                    "error_type": type(ex).__name__,
                    "message": str(ex),
                    "ip": ip,
                    "line": line,
                    "method": frame["method"],
                    "step_count": step_count,
                    "op_counts": op_counts,
                    "executed_blocks": executed_blocks,
                    "block_visit_counts": block_visit_counts
                }

        # Format return value
        if isinstance(return_value, float):
            return_value = round(return_value, 10)
        elif isinstance(return_value, int):
            return_value = to_int32(return_value)

        return {
            "status": "success",
            "method": method,
            "args": args,
            "return_value": return_value,
            "step_count": step_count,
            "op_counts": op_counts,
            "executed_blocks": executed_blocks,
            "block_visit_counts": block_visit_counts,
            "executed_edges": executed_edges,
            "cost_model": "abstract cost, not time",
            "trace": trace_log if trace else None,
            "tac_variant": variant
        }


def run_both(
    analysis: dict,
    method: str,
    args: Union[list, dict],
    include_trace: bool = False,
    max_steps: int = 1_000_000
) -> Dict[str, Any]:
    """
    Runs raw AND optimized TAC representations and returns comparison metrics:
    semantics parity, step count diff, and optimization reduction ratio.
    """
    param_map = extract_param_map(analysis.get("ast", {}))
    raw_quads = analysis.get("intermediate_code", [])
    opt_quads = analysis.get("optimized_code", [])

    raw_interp = TACInterpreter(raw_quads, param_map=param_map, max_steps=max_steps)
    raw_res = raw_interp.run(method, args, variant="raw", trace=include_trace)

    opt_interp = TACInterpreter(opt_quads, param_map=param_map, max_steps=max_steps)
    opt_res = opt_interp.run(method, args, variant="optimized", trace=include_trace)

    semantics_match = False
    if raw_res.get("status") == "success" and opt_res.get("status") == "success":
        v_raw = raw_res.get("return_value")
        v_opt = opt_res.get("return_value")
        if isinstance(v_raw, float) or isinstance(v_opt, float):
            semantics_match = math.isclose(float(v_raw), float(v_opt), rel_tol=1e-7, abs_tol=1e-7)
        else:
            semantics_match = (v_raw == v_opt)

    raw_steps = raw_res.get("step_count", 0)
    opt_steps = opt_res.get("step_count", 0)
    steps_saved = raw_steps - opt_steps
    steps_saved_pct = round((steps_saved / raw_steps * 100.0), 2) if raw_steps > 0 else 0.0

    return {
        "raw": raw_res,
        "optimized": opt_res,
        "comparison": {
            "semantics_match": semantics_match,
            "steps_saved": steps_saved,
            "steps_saved_pct": steps_saved_pct
        }
    }


_shared_compiler_service = None

def _get_shared_compiler_service():
    global _shared_compiler_service
    if _shared_compiler_service is None:
        from app.compiler.service import CompilerService
        _shared_compiler_service = CompilerService()
    return _shared_compiler_service


def run_source(
    source_code: str,
    method: str,
    args: Union[list, dict],
    variant: str = "optimized",
    include_trace: bool = False,
    max_steps: int = 1_000_000
) -> Dict[str, Any]:
    """
    Parses and compiles Java source code in-process, then executes the TAC interpreter.
    Safely reuses a singleton CompilerService instance.
    Returns structured error if compilation diagnostics report fatal errors.
    """
    svc = _get_shared_compiler_service()
    analysis = svc.analyze_source(source_code)

    errors = [d for d in analysis.get("diagnostics", []) if d.get("severity") == "error"]
    if errors:
        return {
            "status": "error",
            "error_type": "CompilationError",
            "message": f"Source compilation failed with {len(errors)} error(s): {errors[0].get('message')}",
            "diagnostics": errors,
            "step_count": 0,
            "executed_blocks": []
        }

    if variant == "both":
        return run_both(analysis, method, args, include_trace=include_trace, max_steps=max_steps)

    param_map = extract_param_map(analysis.get("ast", {}))
    quads = analysis.get("intermediate_code" if variant == "raw" else "optimized_code", [])

    interp = TACInterpreter(quads, param_map=param_map, max_steps=max_steps)
    return interp.run(method, args, variant=variant, trace=include_trace)
