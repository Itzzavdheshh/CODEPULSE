from typing import List, Dict, Any

class TargetCodeGenerator:
    """
    Educational JVM-like Bytecode Target Emitter for CodePulse Compiler.
    Translates Three-Address Code (TAC) Quadruples into JVM stack-machine assembly instructions.
    """
    def generate_target_code(self, quads: List[dict]) -> Dict[str, Any]:
        instructions = []
        pc = 0  # Program Counter offset
        stack_depth = 0
        max_stack = 0

        var_slot_map: Dict[str, int] = {}
        var_type_map: Dict[str, str] = {}
        slot_counter = 1
        cmp_counter = 0

        def is_int_literal(val: str) -> bool:
            if not val:
                return False
            if val in ("true", "false"):
                return True
            return val.isdigit() or (val.startswith('-') and val[1:].isdigit())

        def is_float_literal(val: str) -> bool:
            if not val or is_int_literal(val):
                return False
            try:
                float(val)
                return True
            except ValueError:
                return False

        def is_string_literal(val: str) -> bool:
            if not val:
                return False
            return (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")) or " " in val

        def get_var_slot(var_name: str, detected_type: str = "int") -> int:
            nonlocal slot_counter
            if var_name not in var_slot_map:
                var_slot_map[var_name] = slot_counter
                var_type_map[var_name] = detected_type
                slot_counter += 1
            return var_slot_map[var_name]

        def emit_load_operand(arg: str) -> str:
            """Emits bytecode to push an operand (literal constant or local variable) onto stack."""
            nonlocal pc, stack_depth
            if is_int_literal(arg):
                val = 1 if arg == "true" else (0 if arg == "false" else int(arg))
                if 0 <= val <= 5:
                    mnem = f"iconst_{val}"
                elif val == -1:
                    mnem = "iconst_m1"
                elif -128 <= val <= 127:
                    mnem = f"bipush {val}"
                else:
                    mnem = f"ldc {val}"
                instructions.append({
                    "pc": pc,
                    "mnemonic": mnem,
                    "description": f"Push integer constant {arg} onto operand stack",
                    "stack_depth": stack_depth + 1
                })
                pc += (2 if "bipush" in mnem or "ldc" in mnem else 1)
                stack_depth += 1
                return "int"
            elif is_float_literal(arg):
                fval = float(arg)
                if fval == 0.0:
                    mnem = "fconst_0"
                elif fval == 1.0:
                    mnem = "fconst_1"
                elif fval == 2.0:
                    mnem = "fconst_2"
                else:
                    mnem = f"ldc {arg}"
                instructions.append({
                    "pc": pc,
                    "mnemonic": mnem,
                    "description": f"Push float constant {arg} onto operand stack",
                    "stack_depth": stack_depth + 1
                })
                pc += (2 if "ldc" in mnem else 1)
                stack_depth += 1
                return "float"
            elif is_string_literal(arg):
                clean_str = arg.strip("\"'")
                instructions.append({
                    "pc": pc,
                    "mnemonic": f'ldc "{clean_str}"',
                    "description": f'Push String constant "{clean_str}" onto operand stack',
                    "stack_depth": stack_depth + 1
                })
                pc += 2
                stack_depth += 1
                return "String"
            else:
                slot = get_var_slot(arg)
                vtype = var_type_map.get(arg, "int")
                prefix = "f" if vtype == "float" else ("a" if vtype == "String" else "i")
                instructions.append({
                    "pc": pc,
                    "mnemonic": f"{prefix}load_{slot} /* {arg} */",
                    "description": f"Load local variable '{arg}' from slot {slot}",
                    "stack_depth": stack_depth + 1
                })
                pc += 1
                stack_depth += 1
                return vtype

        for q in quads:
            op = q.get("op", "")
            arg1 = str(q.get("arg1", ""))
            arg2 = str(q.get("arg2", ""))
            res = str(q.get("result", ""))

            if op == "=":
                t1 = emit_load_operand(arg1)
                max_stack = max(max_stack, stack_depth)

                slot_res = get_var_slot(res, detected_type=t1)
                prefix = "f" if t1 == "float" else ("a" if t1 == "String" else "i")
                instructions.append({
                    "pc": pc,
                    "mnemonic": f"{prefix}store_{slot_res} /* {res} */",
                    "description": f"Store stack top into local variable '{res}' slot {slot_res}",
                    "stack_depth": stack_depth - 1
                })
                pc += 1
                stack_depth -= 1

            elif op in ("+", "-", "*", "/", "%"):
                t1 = emit_load_operand(arg1)
                t2 = emit_load_operand(arg2)
                max_stack = max(max_stack, stack_depth)

                is_float = (t1 == "float" or t2 == "float")
                prefix = "f" if is_float else "i"
                op_map = {"+": "add", "-": "sub", "*": "mul", "/": "div", "%": "rem"}
                op_mnemonic = f"{prefix}{op_map[op]}"

                instructions.append({
                    "pc": pc,
                    "mnemonic": op_mnemonic,
                    "description": f"Perform {'floating-point' if is_float else 'integer'} operation '{op}'",
                    "stack_depth": stack_depth - 1
                })
                pc += 1
                stack_depth -= 1

                res_type = "float" if is_float else "int"
                s_res = get_var_slot(res, detected_type=res_type)
                store_prefix = "f" if is_float else "i"
                instructions.append({
                    "pc": pc,
                    "mnemonic": f"{store_prefix}store_{s_res} /* {res} */",
                    "description": f"Store result to '{res}'",
                    "stack_depth": stack_depth - 1
                })
                pc += 1
                stack_depth -= 1

            elif op in (">", "<", ">=", "<=", "==", "!="):
                t1 = emit_load_operand(arg1)
                t2 = emit_load_operand(arg2)
                max_stack = max(max_stack, stack_depth)

                cmp_counter += 1
                lbl_true = f"L_cmp_true_{cmp_counter}"
                lbl_end = f"L_cmp_end_{cmp_counter}"

                branch_map = {
                    ">": "if_icmpgt",
                    "<": "if_icmplt",
                    ">=": "if_icmpge",
                    "<=": "if_icmple",
                    "==": "if_icmpeq",
                    "!=": "if_icmpne"
                }
                branch_mnem = branch_map[op]

                instructions.append({
                    "pc": pc,
                    "mnemonic": f"{branch_mnem} {lbl_true}",
                    "description": f"Jump to {lbl_true} if comparison '{arg1} {op} {arg2}' holds true",
                    "stack_depth": stack_depth - 2
                })
                pc += 3
                stack_depth -= 2

                instructions.append({
                    "pc": pc,
                    "mnemonic": "iconst_0",
                    "description": "Push boolean false (0)",
                    "stack_depth": stack_depth + 1
                })
                pc += 1; stack_depth += 1

                instructions.append({
                    "pc": pc,
                    "mnemonic": f"goto {lbl_end}",
                    "description": "Jump past true block",
                    "stack_depth": stack_depth
                })
                pc += 3

                instructions.append({
                    "pc": pc,
                    "mnemonic": f"{lbl_true}:",
                    "description": "True branch label",
                    "stack_depth": stack_depth - 1
                })

                instructions.append({
                    "pc": pc,
                    "mnemonic": "iconst_1",
                    "description": "Push boolean true (1)",
                    "stack_depth": stack_depth
                })
                pc += 1

                instructions.append({
                    "pc": pc,
                    "mnemonic": f"{lbl_end}:",
                    "description": "End comparison label",
                    "stack_depth": stack_depth
                })

                s_res = get_var_slot(res, detected_type="int")
                instructions.append({
                    "pc": pc,
                    "mnemonic": f"istore_{s_res} /* {res} */",
                    "description": f"Store boolean result to '{res}'",
                    "stack_depth": stack_depth - 1
                })
                pc += 1
                stack_depth -= 1

            elif op == "LABEL":
                instructions.append({"pc": pc, "mnemonic": f"{res}:", "description": f"Label marker {res}", "stack_depth": stack_depth})

            elif op == "GOTO":
                instructions.append({"pc": pc, "mnemonic": f"goto {res}", "description": f"Unconditional jump to label {res}", "stack_depth": stack_depth})
                pc += 3

            elif op == "IF_FALSE":
                t_cond = emit_load_operand(arg1)
                instructions.append({"pc": pc, "mnemonic": f"ifeq {res}", "description": f"Jump to {res} if condition '{arg1}' is false (0)", "stack_depth": stack_depth - 1})
                pc += 3
                stack_depth -= 1

            elif op == "PRINT":
                instructions.append({"pc": pc, "mnemonic": "getstatic java/lang/System.out Ljava/io/PrintStream;", "description": "Get System.out stream", "stack_depth": stack_depth + 1})
                pc += 3
                stack_depth += 1

                val_type = emit_load_operand(arg1)
                descriptor = "(Ljava/lang/String;)V" if val_type == "String" else ("(F)V" if val_type == "float" else "(I)V")

                instructions.append({
                    "pc": pc,
                    "mnemonic": f"invokevirtual java/io/PrintStream.println{descriptor}",
                    "description": f"Invoke PrintStream.println for {val_type}",
                    "stack_depth": stack_depth - 2
                })
                pc += 3
                stack_depth -= 2

            elif op == "FUNC_START":
                instructions.append({"pc": pc, "mnemonic": f"; --- Method: {arg1} ---", "description": f"Function entry point '{arg1}'", "stack_depth": stack_depth})

            elif op == "FUNC_END":
                instructions.append({"pc": pc, "mnemonic": f"; --- End Method: {arg1} ---", "description": f"Function exit point '{arg1}'", "stack_depth": stack_depth})

            elif op == "PARAM":
                emit_load_operand(arg1)
                max_stack = max(max_stack, stack_depth)

            elif op == "CALL":
                arg_cnt = int(arg2) if arg2.isdigit() else 0
                instructions.append({
                    "pc": pc,
                    "mnemonic": f"invokestatic MethodClass.{arg1}({('I' * arg_cnt)})I",
                    "description": f"Invoke method '{arg1}' with {arg_cnt} argument(s)",
                    "stack_depth": max(0, stack_depth - arg_cnt + (1 if res else 0))
                })
                pc += 3
                stack_depth = max(0, stack_depth - arg_cnt + (1 if res else 0))
                max_stack = max(max_stack, stack_depth)
                if res:
                    s_res = get_var_slot(res, detected_type="int")
                    instructions.append({
                        "pc": pc,
                        "mnemonic": f"istore_{s_res} /* {res} */",
                        "description": f"Store return value to '{res}'",
                        "stack_depth": stack_depth - 1
                    })
                    pc += 1
                    stack_depth -= 1

            elif op == "RETURN":
                if arg1:
                    emit_load_operand(arg1)
                    instructions.append({"pc": pc, "mnemonic": "ireturn", "description": "Return value from method", "stack_depth": 0})
                else:
                    instructions.append({"pc": pc, "mnemonic": "return", "description": "Return void from method", "stack_depth": 0})
                pc += 1

        assembly_text = "\n".join([
            f"{inst['mnemonic']}" if str(inst.get('mnemonic', '')).startswith(';') else f"{inst['pc']:04d}: {inst['mnemonic']} \t; {inst['description']}"
            for inst in instructions
        ])

        return {
            "target_architecture": "Educational JVM-like Bytecode Target Representation",
            "instructions_count": len(instructions),
            "max_stack_depth": max_stack,
            "local_slots_count": len(var_slot_map),
            "assembly_code": assembly_text,
            "instructions": instructions
        }

