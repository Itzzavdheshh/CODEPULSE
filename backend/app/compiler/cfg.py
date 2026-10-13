from typing import List, Dict, Any, Set, Tuple
from collections import deque

class BasicBlock:
    def __init__(self, block_id: str, method_name: str = "global"):
        self.block_id = block_id
        self.method_name = method_name
        self.instructions: List[dict] = []
        self.successors: List[str] = []
        self.predecessors: List[str] = []

    def to_dict(self) -> dict:
        return {
            "block_id": self.block_id,
            "method_name": self.method_name,
            "instructions": self.instructions,
            "successors": list(dict.fromkeys(self.successors)),
            "predecessors": list(dict.fromkeys(self.predecessors))
        }

class CFGBuilder:
    """
    Partitions TAC instructions into Method-Scoped Basic Blocks and generates isolated per-method Control-Flow Graphs (CFG).
    Guarantees no invalid control-flow edges cross method boundaries (e.g. FUNC_END -> FUNC_START).
    Computes exact Cyclomatic Complexity V(G) = E - N + 2P with connected components P via BFS/DFS.
    """

    def build_cfg(self, quads: List[dict]) -> dict:
        if not quads:
            empty_method = {
                "method_name": "main",
                "nodes": [{"id": "B0", "label": "Block B0 (Entry / Exit)", "instructions_count": 0, "instructions": []}],
                "edges": [],
                "blocks": [],
                "cyclomatic_complexity": 1,
                "connected_components": 1,
                "instruction_count": 0,
                "decision_points": 0,
                "loop_count": 0
            }
            return {
                "methods": {"main": empty_method},
                "program_aggregate": {
                    "total_methods": 1,
                    "total_basic_blocks": 1,
                    "total_edges": 0,
                    "program_aggregate_cyclomatic_complexity": 1,
                    "max_method_complexity": 1
                },
                "nodes": empty_method["nodes"],
                "edges": [],
                "blocks": []
            }

        # Step 1: Group quads by method using FUNC_START / FUNC_END markers
        method_quads: Dict[str, List[dict]] = {}
        current_method = "main"

        for q in quads:
            op = q.get("op", "")
            if op == "FUNC_START":
                current_method = q.get("arg1") or "main"
                if current_method not in method_quads:
                    method_quads[current_method] = []
                method_quads[current_method].append(q)
            elif op == "FUNC_END":
                if current_method not in method_quads:
                    method_quads[current_method] = []
                method_quads[current_method].append(q)
                current_method = "main"
            else:
                if current_method not in method_quads:
                    method_quads[current_method] = []
                method_quads[current_method].append(q)

        # Step 2: Build isolated CFG for each method
        methods_cfg: Dict[str, dict] = {}
        all_flattened_nodes: List[dict] = []
        all_flattened_edges: List[dict] = []
        all_flattened_blocks: List[dict] = []

        total_blocks_count = 0
        total_edges_count = 0
        aggregate_cc_sum = 0
        max_cc = 1

        for m_name, m_quads in method_quads.items():
            m_cfg = self._build_single_method_cfg(m_name, m_quads)
            methods_cfg[m_name] = m_cfg

            all_flattened_nodes.extend(m_cfg["nodes"])
            all_flattened_edges.extend(m_cfg["edges"])
            all_flattened_blocks.extend(m_cfg["blocks"])

            total_blocks_count += len(m_cfg["nodes"])
            total_edges_count += len(m_cfg["edges"])
            aggregate_cc_sum += m_cfg["cyclomatic_complexity"]
            max_cc = max(max_cc, m_cfg["cyclomatic_complexity"])

        total_p = sum(m_cfg.get("connected_components", 1) for m_cfg in methods_cfg.values())
        program_v_formula = max(aggregate_cc_sum, total_edges_count - total_blocks_count + (2 * total_p))

        program_aggregate = {
            "total_methods": len(methods_cfg),
            "total_basic_blocks": total_blocks_count,
            "total_edges": total_edges_count,
            "connected_components": total_p,
            "program_aggregate_cyclomatic_complexity": program_v_formula,
            "max_method_complexity": max_cc
        }

        return {
            "methods": methods_cfg,
            "program_aggregate": program_aggregate,
            "nodes": all_flattened_nodes,
            "edges": all_flattened_edges,
            "blocks": all_flattened_blocks
        }

    def _build_single_method_cfg(self, method_name: str, quads: List[dict]) -> dict:
        if not quads:
            return {
                "method_name": method_name,
                "nodes": [{"id": f"{method_name}_B0", "label": f"{method_name}: B0", "instructions_count": 0, "instructions": []}],
                "edges": [],
                "blocks": [],
                "cyclomatic_complexity": 1,
                "connected_components": 1,
                "instruction_count": 0,
                "decision_points": 0,
                "loop_count": 0
            }

        # Step A: Identify leader instruction indices within this method
        leaders = set()
        leaders.add(0)

        label_map: Dict[str, int] = {}
        for idx, q in enumerate(quads):
            if q.get("op") == "LABEL":
                label_map[q.get("result", "")] = idx
                leaders.add(idx)

        for idx, q in enumerate(quads):
            op = q.get("op", "")
            if op in ("GOTO", "IF_FALSE"):
                target_label = q.get("result", "")
                if target_label in label_map:
                    leaders.add(label_map[target_label])
                if idx + 1 < len(quads):
                    leaders.add(idx + 1)

        sorted_leaders = sorted(list(leaders))
        blocks: List[BasicBlock] = []

        # Step B: Form Basic Blocks
        for i in range(len(sorted_leaders)):
            start_idx = sorted_leaders[i]
            end_idx = sorted_leaders[i+1] if i + 1 < len(sorted_leaders) else len(quads)
            b_id = f"B{i}"
            block = BasicBlock(b_id, method_name)
            block.instructions = quads[start_idx:end_idx]
            blocks.append(block)

        # Step C: Build Intraprocedural Edges (No cross-method edges!)
        block_by_start: Dict[int, BasicBlock] = {sorted_leaders[i]: blocks[i] for i in range(len(sorted_leaders))}
        raw_edges: List[dict] = []
        loop_count = 0
        decision_points = 0

        for i, block in enumerate(blocks):
            if not block.instructions:
                continue
            last_q = block.instructions[-1]
            op = last_q.get("op", "")

            if op == "IF_FALSE":
                decision_points += 1

            if op == "GOTO":
                target_label = last_q.get("result", "")
                if target_label in label_map:
                    target_start = label_map[target_label]
                    if target_start in block_by_start:
                        target_b = block_by_start[target_start]
                        block.successors.append(target_b.block_id)
                        target_b.predecessors.append(block.block_id)
                        raw_edges.append({
                            "from": block.block_id, "to": target_b.block_id,
                            "type": "unconditional", "method": method_name
                        })
                        if target_start <= sorted_leaders[i]:
                            loop_count += 1
            elif op == "IF_FALSE":
                target_label = last_q.get("result", "")
                # Branch edge
                if target_label in label_map:
                    target_start = label_map[target_label]
                    if target_start in block_by_start:
                        target_b = block_by_start[target_start]
                        block.successors.append(target_b.block_id)
                        target_b.predecessors.append(block.block_id)
                        raw_edges.append({
                            "from": block.block_id, "to": target_b.block_id,
                            "type": "false_branch", "method": method_name
                        })
                        if target_start <= sorted_leaders[i]:
                            loop_count += 1
                # Fallthrough edge within method
                if i + 1 < len(blocks):
                    next_b = blocks[i+1]
                    block.successors.append(next_b.block_id)
                    next_b.predecessors.append(block.block_id)
                    raw_edges.append({
                        "from": block.block_id, "to": next_b.block_id,
                        "type": "true_branch", "method": method_name
                    })
            elif op in ("RETURN", "FUNC_END"):
                # Method Exit — Terminal node
                pass
            else:
                if i + 1 < len(blocks):
                    next_b = blocks[i+1]
                    block.successors.append(next_b.block_id)
                    next_b.predecessors.append(block.block_id)
                    raw_edges.append({
                        "from": block.block_id, "to": next_b.block_id,
                        "type": "fallthrough", "method": method_name
                    })

        # Deduplicate edges to guarantee exact E count
        seen_edges: Set[Tuple[str, str, str]] = set()
        dedup_edges: List[dict] = []
        for e in raw_edges:
            key = (e["from"], e["to"], e["type"])
            if key not in seen_edges:
                seen_edges.add(key)
                dedup_edges.append(e)

        # Compute connected components (P) using BFS on undirected representation
        adj: Dict[str, Set[str]] = {b.block_id: set() for b in blocks}
        for e in dedup_edges:
            adj[e["from"]].add(e["to"])
            adj[e["to"]].add(e["from"])

        visited: Set[str] = set()
        P = 0
        for b in blocks:
            if b.block_id not in visited:
                P += 1
                q = deque([b.block_id])
                visited.add(b.block_id)
                while q:
                    curr = q.popleft()
                    for nbr in adj[curr]:
                        if nbr not in visited:
                            visited.add(nbr)
                            q.append(nbr)

        if P == 0:
            P = 1

        # V(G) = E - N + 2P formula
        # For single connected method graphs (P=1), V(G) = E - N + 2.
        # Also bounded below by decision_points + 1 for structured constructs.
        N = len(blocks)
        E = len(dedup_edges)
        v_formula = E - N + (2 * P)
        cyclomatic = max(1, decision_points + 1, v_formula)

        def format_quad(q: dict) -> str:
            op_q = q.get("op", "")
            arg1 = q.get("arg1", "")
            arg2 = q.get("arg2", "")
            result = q.get("result", "")
            if op_q == "LABEL": return f"{result}:"
            if op_q == "GOTO": return f"GOTO {result}"
            if op_q == "IF_FALSE": return f"IF_FALSE {arg1} GOTO {result}"
            if op_q == "=": return f"{result} = {arg1}"
            if op_q in ("+", "-", "*", "/", "%", "==", "!=", "<", ">", "<=", ">=", "&&", "||"): return f"{result} = {arg1} {op_q} {arg2}"
            if op_q == "PARAM": return f"PARAM {arg1}"
            if op_q == "CALL": return f"{result} = CALL {arg1}, {arg2}" if result else f"CALL {arg1}, {arg2}"
            if op_q == "PRINT": return f"PRINT {arg1}"
            if op_q == "RETURN": return f"RETURN {arg1}".strip()
            if op_q in ("FUNC_START", "FUNC_END"): return f"{op_q} {arg1}".strip()
            return " ".join(str(part) for part in [op_q, arg1, arg2, result] if part)

        nodes = [
            {
                "id": b.block_id,
                "global_id": f"{method_name}_{b.block_id}",
                "method_name": method_name,
                "label": f"{method_name}: Block {b.block_id}",
                "instructions_count": len(b.instructions),
                "instructions": [format_quad(q) for q in b.instructions]
            }
            for b in blocks
        ]

        entry_block = blocks[0].block_id if blocks else "B0"
        exit_block = blocks[-1].block_id if blocks else "B0"

        return {
            "method_name": method_name,
            "nodes": nodes,
            "edges": dedup_edges,
            "blocks": [b.to_dict() for b in blocks],
            "cyclomatic_complexity": cyclomatic,
            "connected_components": P,
            "instruction_count": len(quads),
            "instructions_count": len(quads),
            "decision_points": decision_points,
            "loop_count": loop_count,
            "entry_block": entry_block,
            "exit_block": exit_block
        }
