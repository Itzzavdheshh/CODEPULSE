from typing import List, Dict, Any, Optional
from .ast import (
    ASTNode, ProgramNode, ClassNode, MethodNode, BlockNode,
    VarDeclNode, AssignNode, IfNode, WhileNode, ForNode,
    ReturnNode, PrintNode, BinaryOpNode, UnaryOpNode,
    LiteralNode, IdentifierNode, MethodCallNode
)

class Quadruple:
    def __init__(self, op: str, arg1: str = "", arg2: str = "", result: str = "", line: int = 1):
        self.op = op
        self.arg1 = str(arg1)
        self.arg2 = str(arg2)
        self.result = str(result)
        self.line = line

    def to_dict(self) -> Dict[str, Any]:
        return {
            "op": self.op,
            "arg1": self.arg1,
            "arg2": self.arg2,
            "result": self.result,
            "line": self.line
        }

    def __repr__(self):
        if self.op == "=":
            return f"{self.result} = {self.arg1}"
        elif self.op in ("+", "-", "*", "/", "%", "==", "!=", "<", ">", "<=", ">=", "&&", "||"):
            return f"{self.result} = {self.arg1} {self.op} {self.arg2}"
        elif self.op == "LABEL":
            return f"{self.result}:"
        elif self.op == "GOTO":
            return f"goto {self.result}"
        elif self.op == "IF_FALSE":
            return f"ifFalse {self.arg1} goto {self.result}"
        elif self.op == "PRINT":
            return f"print {self.arg1}"
        elif self.op == "RETURN":
            return f"return {self.arg1}"
        return f"{self.op} {self.arg1} {self.arg2} {self.result}".strip()

class IRGenerator:
    """
    Generates Intermediate Representation (Three-Address Code) from AST.
    """
    def __init__(self):
        self.quads: List[Quadruple] = []
        self.temp_counter = 0
        self.label_counter = 0

    def new_temp(self) -> str:
        self.temp_counter += 1
        return f"t{self.temp_counter}"

    def new_label(self) -> str:
        self.label_counter += 1
        return f"L{self.label_counter}"

    def generate(self, program: ProgramNode) -> List[dict]:
        self.quads = []
        self.temp_counter = 0
        self.label_counter = 0
        self.visit(program)
        return [q.to_dict() for q in self.quads]

    def visit(self, node: ASTNode) -> str:
        if node is None:
            return ""

        method_name = f"visit_{node.node_type}"
        visitor = getattr(self, method_name, self.generic_visit)
        return visitor(node)

    def generic_visit(self, node: ASTNode) -> str:
        for k, v in node.__dict__.items():
            if isinstance(v, ASTNode):
                self.visit(v)
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, ASTNode):
                        self.visit(item)
        return ""

    def visit_Program(self, node: ProgramNode):
        for cl in node.classes:
            self.visit(cl)

    def visit_ClassDeclaration(self, node: ClassNode):
        for method in node.methods:
            self.visit(method)

    def visit_MethodDeclaration(self, node: MethodNode):
        self.quads.append(Quadruple("FUNC_START", node.name, line=node.line))
        self.visit(node.body)
        self.quads.append(Quadruple("FUNC_END", node.name, line=node.line))

    def visit_Block(self, node: BlockNode):
        for stmt in node.statements:
            self.visit(stmt)

    def visit_VariableDeclaration(self, node: VarDeclNode):
        if node.initializer:
            val_temp = self.visit(node.initializer)
            self.quads.append(Quadruple("=", val_temp, "", node.name, line=node.line))
        else:
            self.quads.append(Quadruple("DECLARE", node.data_type, "", node.name, line=node.line))
        return node.name

    def visit_Assignment(self, node: AssignNode):
        val_temp = self.visit(node.value)
        self.quads.append(Quadruple("=", val_temp, "", node.name, line=node.line))
        return node.name

    def visit_IfStatement(self, node: IfNode):
        cond_temp = self.visit(node.condition)
        else_label = self.new_label()
        end_label = self.new_label()

        self.quads.append(Quadruple("IF_FALSE", cond_temp, "", else_label if node.else_branch else end_label, line=node.line))
        self.visit(node.then_branch)
        
        if node.else_branch:
            self.quads.append(Quadruple("GOTO", "", "", end_label, line=node.line))
            self.quads.append(Quadruple("LABEL", "", "", else_label, line=node.line))
            self.visit(node.else_branch)
            self.quads.append(Quadruple("LABEL", "", "", end_label, line=node.line))
        else:
            self.quads.append(Quadruple("LABEL", "", "", end_label, line=node.line))

    def visit_WhileLoop(self, node: WhileNode):
        start_label = self.new_label()
        end_label = self.new_label()

        self.quads.append(Quadruple("LABEL", "", "", start_label, line=node.line))
        cond_temp = self.visit(node.condition)
        self.quads.append(Quadruple("IF_FALSE", cond_temp, "", end_label, line=node.line))
        self.visit(node.body)
        self.quads.append(Quadruple("GOTO", "", "", start_label, line=node.line))
        self.quads.append(Quadruple("LABEL", "", "", end_label, line=node.line))

    def visit_ForLoop(self, node) -> None:
        """Emit TAC for: init; loop_start: if !cond goto end; body; update; goto loop_start; end:"""
        # Emit initializer (e.g., int i = 0)
        if node.init:
            self.visit(node.init)

        start_label = self.new_label()
        end_label = self.new_label()

        self.quads.append(Quadruple("LABEL", "", "", start_label, line=node.line))

        if node.condition:
            cond_temp = self.visit(node.condition)
            self.quads.append(Quadruple("IF_FALSE", cond_temp, "", end_label, line=node.line))

        self.visit(node.body)

        # Emit update expression (e.g., i++)
        if node.update:
            self.visit(node.update)

        self.quads.append(Quadruple("GOTO", "", "", start_label, line=node.line))
        self.quads.append(Quadruple("LABEL", "", "", end_label, line=node.line))

    def visit_ReturnStatement(self, node: ReturnNode):
        val = ""
        if node.value:
            val = self.visit(node.value)
        self.quads.append(Quadruple("RETURN", val, line=node.line))

    def visit_PrintStatement(self, node: PrintNode):
        val = self.visit(node.expression)
        self.quads.append(Quadruple("PRINT", val, line=node.line))

    def visit_BinaryExpression(self, node: BinaryOpNode) -> str:
        t1 = self.visit(node.left)
        t2 = self.visit(node.right)
        res_t = self.new_temp()
        self.quads.append(Quadruple(node.operator, t1, t2, res_t, line=node.line))
        return res_t

    def visit_UnaryExpression(self, node: UnaryOpNode) -> str:
        t1 = self.visit(node.operand)
        res_t = self.new_temp()
        self.quads.append(Quadruple(node.operator, t1, "", res_t, line=node.line))
        return res_t

    def visit_Literal(self, node: LiteralNode) -> str:
        return str(node.value)

    def visit_Identifier(self, node: IdentifierNode) -> str:
        return node.name
