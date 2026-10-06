from typing import List, Dict, Any

class BasicBlock:
    def __init__(self, block_id: str):
        self.block_id = block_id
        self.instructions: List[dict] = []
        self.successors: List[str] = []
        self.predecessors: List[str] = []

    def to_dict(self) -> dict:
        return {
            "block_id": self.block_id,
            "instructions": self.instructions,
            "successors": self.successors,
            "predecessors": self.predecessors
        }

class CFGBuilder:
    """
    Partitions TAC instructions into Basic Blocks and generates Control-Flow Graph (CFG).
    """
    def build_cfg(self, quads: List[dict]) -> dict:
        if not quads:
            return {
                "nodes": [{"id": "B0", "label": "Entry / Exit", "instructions": []}],
                "edges": [],
                "blocks": []
            }

        # Step 1: Identify leaders
        leaders = set()
        leaders.add(0) # First instruction is a leader

        label_map: Dict[str, int] = {}
        for idx, q in enumerate(quads):
            if q["op"] == "LABEL":
                label_map[q["result"]] = idx
                leaders.add(idx)

        for idx, q in enumerate(quads):
            if q["op"] in ("GOTO", "IF_FALSE"):
                target_label = q["result"]
                if target_label in label_map:
                    leaders.add(label_map[target_label])
                if idx + 1 < len(quads):
                    leaders.add(idx + 1)

        sorted_leaders = sorted(list(leaders))
        blocks: List[BasicBlock] = []

        # Step 2: Form Basic Blocks
        for i in range(len(sorted_leaders)):
            start_idx = sorted_leaders[i]
            end_idx = sorted_leaders[i+1] if i + 1 < len(sorted_leaders) else len(quads)
            b_id = f"B{i}"
            block = BasicBlock(b_id)
            block.instructions = quads[start_idx:end_idx]
            blocks.append(block)

        # Step 3: Build Edges
        block_by_start: Dict[int, BasicBlock] = {sorted_leaders[i]: blocks[i] for i in range(len(sorted_leaders))}
        edges: List[dict] = []

        for i, block in enumerate(blocks):
            if not block.instructions:
                continue
            last_q = block.instructions[-1]
            
            if last_q["op"] == "GOTO":
                target_label = last_q["result"]
                if target_label in label_map:
                    target_start = label_map[target_label]
                    if target_start in block_by_start:
                        target_b = block_by_start[target_start]
                        block.successors.append(target_b.block_id)
                        target_b.predecessors.append(block.block_id)
                        edges.append({"from": block.block_id, "to": target_b.block_id, "type": "unconditional"})
            elif last_q["op"] == "IF_FALSE":
                target_label = last_q["result"]
                # Branch edge
                if target_label in label_map:
                    target_start = label_map[target_label]
                    if target_start in block_by_start:
                        target_b = block_by_start[target_start]
                        block.successors.append(target_b.block_id)
                        target_b.predecessors.append(block.block_id)
                        edges.append({"from": block.block_id, "to": target_b.block_id, "type": "false_branch"})
                # Fallthrough edge
                if i + 1 < len(blocks):
                    next_b = blocks[i+1]
                    block.successors.append(next_b.block_id)
                    next_b.predecessors.append(block.block_id)
                    edges.append({"from": block.block_id, "to": next_b.block_id, "type": "true_branch"})
            else:
                if i + 1 < len(blocks):
                    next_b = blocks[i+1]
                    block.successors.append(next_b.block_id)
                    next_b.predecessors.append(block.block_id)
                    edges.append({"from": block.block_id, "to": next_b.block_id, "type": "fallthrough"})

        nodes = [
            {
                "id": b.block_id,
                "label": f"Block {b.block_id}",
                "instructions_count": len(b.instructions),
                "instructions": [f"{q.get('result', '')} = {q.get('arg1', '')} {q.get('op', '')} {q.get('arg2', '')}".strip() for q in b.instructions]
            }
            for b in blocks
        ]

        return {
            "nodes": nodes,
            "edges": edges,
            "blocks": [b.to_dict() for b in blocks]
        }
