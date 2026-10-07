from typing import Dict, Any, List, Set, Tuple

class GrammarAnalyzer:
    """
    Compiler Design Grammar Analysis & Parsing Toolkit.
    Provides FIRST/FOLLOW sets calculation, Direct Left-Recursion detection & elimination,
    Recursive Descent trace simulation, and Shift-Reduce parsing step simulation.
    """
    
    def analyze_grammar(self, productions_input: Dict[str, List[str]] = None) -> Dict[str, Any]:
        if not productions_input:
            # Default academic demonstration grammar: S -> c A d, A -> a b | a
            productions_input = {
                "S": ["c A d"],
                "A": ["a b", "a"]
            }

        non_terminals = list(productions_input.keys())
        terminals = set()
        
        # Identify terminals
        for head, prods in productions_input.items():
            for p in prods:
                tokens = p.split()
                for tok in tokens:
                    if tok not in non_terminals and tok != "ε":
                        terminals.add(tok)
        
        terminals_list = sorted(list(terminals))

        # 1. Nullable symbols
        nullable = self.find_nullable(productions_input)

        # 2. FIRST sets
        first_sets = self.compute_first_sets(productions_input, non_terminals, terminals)

        # 3. FOLLOW sets
        follow_sets = self.compute_follow_sets(productions_input, non_terminals, first_sets, start_symbol=non_terminals[0])

        # 4. Left Recursion Analysis
        left_rec_result = self.eliminate_left_recursion(productions_input)

        return {
            "non_terminals": non_terminals,
            "terminals": terminals_list,
            "nullable": list(nullable),
            "first_sets": {k: sorted(list(v)) for k, v in first_sets.items()},
            "follow_sets": {k: sorted(list(v)) for k, v in follow_sets.items()},
            "left_recursion": left_rec_result
        }

    def find_nullable(self, productions: Dict[str, List[str]]) -> Set[str]:
        nullable = set()
        changed = True
        while changed:
            changed = False
            for head, prods in productions.items():
                if head in nullable:
                    continue
                for p in prods:
                    symbols = p.split()
                    if symbols == ["ε"] or (symbols and all(s in nullable for s in symbols)):
                        nullable.add(head)
                        changed = True
                        break
        return nullable

    def compute_first_sets(self, productions: Dict[str, List[str]], non_terminals: List[str], terminals: Set[str]) -> Dict[str, Set[str]]:
        first: Dict[str, Set[str]] = {nt: set() for nt in non_terminals}
        for t in terminals:
            first[t] = {t}
        first["ε"] = {"ε"}

        changed = True
        while changed:
            changed = False
            for head, prods in productions.items():
                for p in prods:
                    symbols = p.split()
                    if symbols == ["ε"]:
                        if "ε" not in first[head]:
                            first[head].add("ε")
                            changed = True
                        continue

                    all_nullable = True
                    for sym in symbols:
                        sym_first = first.get(sym, {sym})
                        for f in sym_first:
                            if f != "ε" and f not in first[head]:
                                first[head].add(f)
                                changed = True
                        if "ε" not in sym_first:
                            all_nullable = False
                            break
                    if all_nullable and "ε" not in first[head]:
                        first[head].add("ε")
                        changed = True
        return first

    def compute_follow_sets(self, productions: Dict[str, List[str]], non_terminals: List[str], first_sets: Dict[str, Set[str]], start_symbol: str) -> Dict[str, Set[str]]:
        follow: Dict[str, Set[str]] = {nt: set() for nt in non_terminals}
        follow[start_symbol].add("$") # End marker

        changed = True
        while changed:
            changed = False
            for head, prods in productions.items():
                for p in prods:
                    symbols = p.split()
                    for i, B in enumerate(symbols):
                        if B not in non_terminals:
                            continue
                        
                        # Look at beta (symbols after B)
                        beta = symbols[i+1:]
                        if beta:
                            # Compute FIRST(beta)
                            beta_first = set()
                            beta_all_nullable = True
                            for sym in beta:
                                sym_first = first_sets.get(sym, {sym})
                                beta_first.update(sym_first - {"ε"})
                                if "ε" not in sym_first:
                                    beta_all_nullable = False
                                    break
                            
                            for f in beta_first:
                                if f not in follow[B]:
                                    follow[B].add(f)
                                    changed = True

                            if beta_all_nullable:
                                for f in follow[head]:
                                    if f not in follow[B]:
                                        follow[B].add(f)
                                        changed = True
                        else:
                            for f in follow[head]:
                                if f not in follow[B]:
                                    follow[B].add(f)
                                    changed = True
        return follow

    def eliminate_left_recursion(self, productions: Dict[str, List[str]]) -> Dict[str, Any]:
        detected_recursive = []
        transformed_prods = {}

        for head, prods in productions.items():
            alpha_list = [] # Left-recursive alternatives (A -> A alpha)
            beta_list = []  # Non-left-recursive alternatives (A -> beta)

            for p in prods:
                symbols = p.split()
                if symbols and symbols[0] == head:
                    alpha_list.append(" ".join(symbols[1:]))
                else:
                    beta_list.append(p)

            if alpha_list:
                detected_recursive.append(head)
                new_head = f"{head}'"
                
                # A -> beta A'
                transformed_prods[head] = [f"{b} {new_head}".strip() for b in beta_list]
                # A' -> alpha A' | ε
                transformed_prods[new_head] = [f"{a} {new_head}".strip() for a in alpha_list] + ["ε"]
            else:
                transformed_prods[head] = prods

        return {
            "has_left_recursion": len(detected_recursive) > 0,
            "detected_non_terminals": detected_recursive,
            "original_productions": productions,
            "transformed_productions": transformed_prods,
            "explanation": "Direct left recursion (A -> A α) eliminated by introducing auxiliary non-terminal A' (A -> β A', A' -> α A' | ε)." if detected_recursive else "No direct left recursion detected in grammar."
        }

    def simulate_recursive_descent(self, input_string: str = "c a b d") -> Dict[str, Any]:
        """
        Simulates recursive descent parsing for grammar: S -> c A d, A -> a b | a
        """
        tokens = input_string.split()
        pos = 0
        trace = []

        def match(tok: str) -> bool:
            nonlocal pos
            if pos < len(tokens) and tokens[pos] == tok:
                trace.append({"step": len(trace) + 1, "action": f"MATCH '{tok}'", "input_remaining": " ".join(tokens[pos:])})
                pos += 1
                return True
            trace.append({"step": len(trace) + 1, "action": f"FAIL MATCH '{tok}' (found '{tokens[pos] if pos < len(tokens) else '<EOF>'}')", "input_remaining": " ".join(tokens[pos:])})
            return False

        def parse_A() -> bool:
            trace.append({"step": len(trace) + 1, "action": "EXPAND A -> a b | a", "input_remaining": " ".join(tokens[pos:])})
            saved_pos = pos
            if match("a"):
                if pos < len(tokens) and tokens[pos] == "b":
                    if match("b"):
                        return True
                # Fallback to A -> a
                return True
            pos = saved_pos
            return False

        def parse_S() -> bool:
            trace.append({"step": len(trace) + 1, "action": "EXPAND S -> c A d", "input_remaining": " ".join(tokens[pos:])})
            if match("c"):
                if parse_A():
                    if match("d"):
                        return True
            return False

        success = parse_S() and pos == len(tokens)
        return {
            "grammar": "S -> c A d, A -> a b | a",
            "input_tokens": tokens,
            "success": success,
            "trace": trace
        }

    def simulate_shift_reduce(self, input_string: str = "i + i * i") -> Dict[str, Any]:
        """
        Simulates Shift-Reduce parsing for expression grammar: E -> E + E | E * E | i
        """
        tokens = input_string.split() + ["$"]
        stack = ["$"]
        pos = 0
        steps = []
        step_num = 1

        while True:
            stack_str = " ".join(stack)
            input_str = " ".join(tokens[pos:])

            # Check Reduce: TOS is 'i' -> E -> i
            if stack[-1] == "i":
                stack.pop()
                stack.append("E")
                steps.append({"step": step_num, "stack": stack_str, "input": input_str, "action": "REDUCE E -> i"})
                step_num += 1
                continue

            # Check Reduce: E + E -> E or E * E -> E
            if len(stack) >= 3 and stack[-3] == "E" and stack[-1] == "E":
                op = stack[-2]
                next_tok = tokens[pos] if pos < len(tokens) else "$"
                
                # Precedence check for * vs +
                if op == "*" or (op == "+" and next_tok != "*"):
                    stack.pop() # E
                    stack.pop() # op
                    stack.pop() # E
                    stack.append("E")
                    steps.append({"step": step_num, "stack": stack_str, "input": input_str, "action": f"REDUCE E -> E {op} E"})
                    step_num += 1
                    continue

            # Check Accept
            if stack == ["$", "E"] and tokens[pos] == "$":
                steps.append({"step": step_num, "stack": stack_str, "input": input_str, "action": "ACCEPT"})
                return {
                    "input": input_string,
                    "success": True,
                    "steps": steps,
                    "conflicts": []
                }

            # Shift next token
            if pos < len(tokens) and tokens[pos] != "$":
                curr_tok = tokens[pos]
                stack.append(curr_tok)
                pos += 1
                steps.append({"step": step_num, "stack": stack_str, "input": input_str, "action": f"SHIFT {curr_tok}"})
                step_num += 1
            else:
                steps.append({"step": step_num, "stack": stack_str, "input": input_str, "action": "ERROR: Unable to shift or reduce"})
                return {
                    "input": input_string,
                    "success": False,
                    "steps": steps,
                    "conflicts": ["Syntax Error: Unmatched input token buffer or reduction impasse"]
                }
