from typing import List, Tuple
from .ast import (
    ASTNode, ProgramNode, ClassNode, MethodNode, BlockNode,
    VarDeclNode, AssignNode, IfNode, WhileNode, ForNode,
    ReturnNode, PrintNode, BinaryOpNode, UnaryOpNode,
    LiteralNode, IdentifierNode, MethodCallNode
)
from .symbols import Symbol, SymbolTable

class SemanticAnalyzer:
    """
    Semantic Analyzer & Type Checker for Java-like subset.
    Populates Symbol Table and flags diagnostics for undeclared variables, type mismatches, and unreachable statements.
    """
    def __init__(self):
        self.diagnostics: List[dict] = []
        self.global_table = SymbolTable("global")
        self.all_symbols: List[dict] = []

    def analyze(self, program: ProgramNode) -> Tuple[List[dict], List[dict]]:
        self.diagnostics = []
        self.all_symbols = []
        self.global_table = SymbolTable("global")
        
        self.visit(program, self.global_table)
        return self.all_symbols, self.diagnostics

    def visit(self, node: ASTNode, table: SymbolTable) -> Optional[str]:
        if node is None:
            return None

        method_name = f"visit_{node.node_type}"
        visitor = getattr(self, method_name, self.generic_visit)
        return visitor(node, table)

    def generic_visit(self, node: ASTNode, table: SymbolTable):
        for k, v in node.__dict__.items():
            if isinstance(v, ASTNode):
                self.visit(v, table)
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, ASTNode):
                        self.visit(item, table)
        return None

    def visit_Program(self, node: ProgramNode, table: SymbolTable):
        for cl in node.classes:
            self.visit(cl, table)

    def visit_ClassDeclaration(self, node: ClassNode, table: SymbolTable):
        class_table = SymbolTable(f"class:{node.name}", table)
        sym = Symbol(node.name, "class", node.name, table.scope_name, node.line)
        if not table.define(sym):
            self.diagnostics.append({
                "severity": "error",
                "phase": "Semantic Analysis",
                "message": f"Class '{node.name}' already declared",
                "line": node.line,
                "column": node.column
            })
        else:
            self.all_symbols.append(sym.to_dict())

        for field in node.fields:
            self.visit(field, class_table)
        for method in node.methods:
            self.visit(method, class_table)

    def visit_MethodDeclaration(self, node: MethodNode, table: SymbolTable):
        method_table = SymbolTable(f"method:{node.name}", table)
        sym = Symbol(node.name, "method", node.return_type, table.scope_name, node.line)
        table.define(sym)
        self.all_symbols.append(sym.to_dict())

        for p in node.params:
            p_sym = Symbol(p["name"], "variable", p["type"], method_table.scope_name, node.line)
            method_table.define(p_sym)
            self.all_symbols.append(p_sym.to_dict())

        self.visit(node.body, method_table)

    def visit_Block(self, node: BlockNode, table: SymbolTable):
        block_table = SymbolTable(f"block", table)
        has_returned = False

        for stmt in node.statements:
            if has_returned:
                self.diagnostics.append({
                    "severity": "warning",
                    "phase": "Semantic Analysis",
                    "message": "Unreachable statement detected after return",
                    "line": stmt.line,
                    "column": stmt.column
                })
            self.visit(stmt, block_table)
            if isinstance(stmt, ReturnNode):
                has_returned = True

    def visit_VariableDeclaration(self, node: VarDeclNode, table: SymbolTable):
        sym = Symbol(node.name, "variable", node.data_type, table.scope_name, node.line)
        if not table.define(sym):
            self.diagnostics.append({
                "severity": "error",
                "phase": "Semantic Analysis",
                "message": f"Variable '{node.name}' already declared in this scope",
                "line": node.line,
                "column": node.column
            })
        else:
            self.all_symbols.append(sym.to_dict())

        if node.initializer:
            init_type = self.visit(node.initializer, table)
            if init_type and init_type != node.data_type:
                # Basic type coercion warnings
                if node.data_type == "int" and init_type == "float":
                    self.diagnostics.append({
                        "severity": "warning",
                        "phase": "Semantic Analysis",
                        "message": f"Possible loss of precision assigning float expression to int variable '{node.name}'",
                        "line": node.line,
                        "column": node.column
                    })
                elif node.data_type != init_type and not (node.data_type == "double" and init_type == "int"):
                    self.diagnostics.append({
                        "severity": "error",
                        "phase": "Semantic Analysis",
                        "message": f"Type mismatch: cannot assign '{init_type}' to '{node.data_type}' variable '{node.name}'",
                        "line": node.line,
                        "column": node.column
                    })
        return node.data_type

    def visit_Assignment(self, node: AssignNode, table: SymbolTable):
        sym = table.lookup(node.name)
        if not sym:
            self.diagnostics.append({
                "severity": "error",
                "phase": "Semantic Analysis",
                "message": f"Undeclared identifier '{node.name}'",
                "line": node.line,
                "column": node.column
            })
            return "unknown"
        
        val_type = self.visit(node.value, table)
        if val_type and val_type != sym.data_type:
            if sym.data_type != "float" or val_type != "int":
                self.diagnostics.append({
                    "severity": "error",
                    "phase": "Semantic Analysis",
                    "message": f"Cannot assign value of type '{val_type}' to variable '{node.name}' of type '{sym.data_type}'",
                    "line": node.line,
                    "column": node.column
                })
        return sym.data_type

    def visit_Identifier(self, node: IdentifierNode, table: SymbolTable) -> str:
        sym = table.lookup(node.name)
        if not sym:
            self.diagnostics.append({
                "severity": "error",
                "phase": "Semantic Analysis",
                "message": f"Undeclared identifier '{node.name}'",
                "line": node.line,
                "column": node.column
            })
            return "unknown"
        return sym.data_type

    def visit_Literal(self, node: LiteralNode, table: SymbolTable) -> str:
        return node.data_type

    def visit_BinaryExpression(self, node: BinaryOpNode, table: SymbolTable) -> str:
        left_t = self.visit(node.left, table)
        right_t = self.visit(node.right, table)

        if node.operator in ("==", "!=", "<", ">", "<=", ">="):
            return "boolean"
        if node.operator in ("&&", "||"):
            return "boolean"

        if left_t == "float" or right_t == "float":
            return "float"
        return "int"
