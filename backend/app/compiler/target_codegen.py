from typing import List, Dict, Any

class TargetCodeGenerator:
    """
    Educational JVM-like Bytecode Target Emitter for CodePulse Compiler.
    Translates Three-Address Code (TAC) Quadruples into JVM stack-machine assembly instructions.
    """
    def generate_target_code(self, quads: List[dict]) -> Dict[str, Any]:
        instructions = []
        pc = 0 # Program Counter offset
        stack_depth = 0
        max_stack = 0

        var_slot_map: Dict[str, int] = {}
        slot_counter = 1

        def get_var_slot(var_name: str) -> int:
            nonlocal slot_counter
            if var_name not in var_slot_map:
                var_slot_map[var_name] = slot_counter
                slot_counter += 1
            return var_slot_map[var_name]

        for q in quads:
            op = q.get("op", "")
            arg1 = str(q.get("arg1", ""))
            arg2 = str(q.get("arg2", ""))
            res = str(q.get("result", ""))

            if op == "=":
                # Value to variable assignment
                if arg1.isdigit() or (arg1.startswith('-') and arg1[1:].isdigit()):
                    instructions.append({
                        "pc": pc,
                        "mnemonic": f"bipush {arg1}",
                        "description": f"Push integer constant {arg1} onto stack",
                        "stack_depth": stack_depth + 1
                    })
                    pc += 2
                    stack_depth += 1
                else:
                    slot = get_var_slot(arg1)
                    instructions.append({
                        "pc": pc,
                        "mnemonic": f"iload_{slot} /* {arg1} */",
                        "description": f"Load local variable '{arg1}' from slot {slot}",
                        "stack_depth": stack_depth + 1
                    })
                    pc += 1
                    stack_depth += 1

                max_stack = max(max_stack, stack_depth)

                slot_res = get_var_slot(res)
                instructions.append({
                    "pc": pc,
                    "mnemonic": f"istore_{slot_res} /* {res} */",
                    "description": f"Store stack top into local variable '{res}' slot {slot_res}",
                    "stack_depth": stack_depth - 1
                })
                pc += 1
                stack_depth -= 1

            elif op in ("+", "-", "*", "/", "%"):
                # Load arg1
                if arg1.isdigit():
                    instructions.append({"pc": pc, "mnemonic": f"bipush {arg1}", "description": f"Push {arg1}", "stack_depth": stack_depth + 1})
                    pc += 2; stack_depth += 1
                else:
                    s1 = get_var_slot(arg1)
                    instructions.append({"pc": pc, "mnemonic": f"iload_{s1} /* {arg1} */", "description": f"Load '{arg1}'", "stack_depth": stack_depth + 1})
                    pc += 1; stack_depth += 1

                # Load arg2
                if arg2.isdigit():
                    instructions.append({"pc": pc, "mnemonic": f"bipush {arg2}", "description": f"Push {arg2}", "stack_depth": stack_depth + 1})
                    pc += 2; stack_depth += 1
                else:
                    s2 = get_var_slot(arg2)
                    instructions.append({"pc": pc, "mnemonic": f"iload_{s2} /* {arg2} */", "description": f"Load '{arg2}'", "stack_depth": stack_depth + 1})
                    pc += 1; stack_depth += 1

                max_stack = max(max_stack, stack_depth)

                # Arithmetic Op
                op_mnemonic = {"+": "iadd", "-": "isub", "*": "imul", "/": "idiv", "%": "irem"}[op]
                instructions.append({"pc": pc, "mnemonic": op_mnemonic, "description": f"Perform integer operation '{op}'", "stack_depth": stack_depth - 1})
                pc += 1; stack_depth -= 1

                # Store result
                s_res = get_var_slot(res)
                instructions.append({"pc": pc, "mnemonic": f"istore_{s_res} /* {res} */", "description": f"Store result to '{res}'", "stack_depth": stack_depth - 1})
                pc += 1; stack_depth -= 1

            elif op == "LABEL":
                instructions.append({"pc": pc, "mnemonic": f"{res}:", "description": f"Label marker {res}", "stack_depth": stack_depth})

            elif op == "GOTO":
                instructions.append({"pc": pc, "mnemonic": f"goto {res}", "description": f"Unconditional jump to label {res}", "stack_depth": stack_depth})
                pc += 3

            elif op == "IF_FALSE":
                instructions.append({"pc": pc, "mnemonic": f"ifeq {res}", "description": f"Jump to {res} if stack top is 0 (false)", "stack_depth": stack_depth - 1})
                pc += 3
                stack_depth -= 1

            elif op == "PRINT":
                instructions.append({"pc": pc, "mnemonic": "getstatic java/lang/System.out Ljava/io/PrintStream;", "description": "Get System.out stream", "stack_depth": stack_depth + 1})
                pc += 3; stack_depth += 1
                if arg1.isdigit():
                    instructions.append({"pc": pc, "mnemonic": f"bipush {arg1}", "description": f"Push constant {arg1}", "stack_depth": stack_depth + 1})
                    pc += 2; stack_depth += 1
                else:
                    s_p = get_var_slot(arg1)
                    instructions.append({"pc": pc, "mnemonic": f"iload_{s_p} /* {arg1} */", "description": f"Load '{arg1}'", "stack_depth": stack_depth + 1})
                    pc += 1; stack_depth += 1

                instructions.append({"pc": pc, "mnemonic": "invokevirtual java/io/PrintStream.println(I)V", "description": "Invoke println method", "stack_depth": stack_depth - 2})
                pc += 3; stack_depth -= 2

            elif op == "RETURN":
                instructions.append({"pc": pc, "mnemonic": "return", "description": "Return void from method", "stack_depth": 0})
                pc += 1

        assembly_text = "\n".join([f"{inst['pc']:04d}: {inst['mnemonic']} \t; {inst['description']}" for inst in instructions])

        return {
            "target_architecture": "Educational JVM-like Bytecode Target Representation",
            "instructions_count": len(instructions),
            "max_stack_depth": max_stack,
            "local_slots_count": len(var_slot_map),
            "assembly_code": assembly_text,
            "instructions": instructions
        }
