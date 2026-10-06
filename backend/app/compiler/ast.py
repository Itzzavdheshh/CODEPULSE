from typing import List, Optional, Any, Dict

class ASTNode:
    def __init__(self, node_type: str, line: int = 1, column: int = 1):
        self.node_type = node_type
        self.line = line
        self.column = column

    def to_dict(self) -> Dict[str, Any]:
        res = {
            "node_type": self.node_type,
            "line": self.line,
            "column": self.column
        }
        for k, v in self.__dict__.items():
            if k in ("node_type", "line", "column"):
                continue
            if isinstance(v, ASTNode):
                res[k] = v.to_dict()
            elif isinstance(v, list):
                res[k] = [item.to_dict() if isinstance(item, ASTNode) else item for item in v]
            else:
                res[k] = v
        return res

class ProgramNode(ASTNode):
    def __init__(self, name: str, classes: List[ASTNode], line: int = 1, column: int = 1):
        super().__init__("Program", line, column)
        self.name = name
        self.classes = classes

class ClassNode(ASTNode):
    def __init__(self, name: str, methods: List[ASTNode], fields: List[ASTNode], line: int = 1, column: int = 1):
        super().__init__("ClassDeclaration", line, column)
        self.name = name
        self.methods = methods
        self.fields = fields

class MethodNode(ASTNode):
    def __init__(self, return_type: str, name: str, params: List[Dict[str, str]], body: ASTNode, is_static: bool = False, line: int = 1, column: int = 1):
        super().__init__("MethodDeclaration", line, column)
        self.return_type = return_type
        self.name = name
        self.params = params
        self.body = body
        self.is_static = is_static

class BlockNode(ASTNode):
    def __init__(self, statements: List[ASTNode], line: int = 1, column: int = 1):
        super().__init__("Block", line, column)
        self.statements = statements

class VarDeclNode(ASTNode):
    def __init__(self, data_type: str, name: str, initializer: Optional[ASTNode] = None, line: int = 1, column: int = 1):
        super().__init__("VariableDeclaration", line, column)
        self.data_type = data_type
        self.name = name
        self.initializer = initializer

class AssignNode(ASTNode):
    def __init__(self, name: str, value: ASTNode, line: int = 1, column: int = 1):
        super().__init__("Assignment", line, column)
        self.name = name
        self.value = value

class IfNode(ASTNode):
    def __init__(self, condition: ASTNode, then_branch: ASTNode, else_branch: Optional[ASTNode] = None, line: int = 1, column: int = 1):
        super().__init__("IfStatement", line, column)
        self.condition = condition
        self.then_branch = then_branch
        self.else_branch = else_branch

class WhileNode(ASTNode):
    def __init__(self, condition: ASTNode, body: ASTNode, line: int = 1, column: int = 1):
        super().__init__("WhileLoop", line, column)
        self.condition = condition
        self.body = body

class ForNode(ASTNode):
    def __init__(self, init: Optional[ASTNode], condition: Optional[ASTNode], update: Optional[ASTNode], body: ASTNode, line: int = 1, column: int = 1):
        super().__init__("ForLoop", line, column)
        self.init = init
        self.condition = condition
        self.update = update
        self.body = body

class ReturnNode(ASTNode):
    def __init__(self, value: Optional[ASTNode] = None, line: int = 1, column: int = 1):
        super().__init__("ReturnStatement", line, column)
        self.value = value

class PrintNode(ASTNode):
    def __init__(self, expression: ASTNode, line: int = 1, column: int = 1):
        super().__init__("PrintStatement", line, column)
        self.expression = expression

class BinaryOpNode(ASTNode):
    def __init__(self, operator: str, left: ASTNode, right: ASTNode, line: int = 1, column: int = 1):
        super().__init__("BinaryExpression", line, column)
        self.operator = operator
        self.left = left
        self.right = right

class UnaryOpNode(ASTNode):
    def __init__(self, operator: str, operand: ASTNode, line: int = 1, column: int = 1):
        super().__init__("UnaryExpression", line, column)
        self.operator = operator
        self.operand = operand

class LiteralNode(ASTNode):
    def __init__(self, value: Any, data_type: str, line: int = 1, column: int = 1):
        super().__init__("Literal", line, column)
        self.value = value
        self.data_type = data_type

class IdentifierNode(ASTNode):
    def __init__(self, name: str, line: int = 1, column: int = 1):
        super().__init__("Identifier", line, column)
        self.name = name

class MethodCallNode(ASTNode):
    def __init__(self, name: str, arguments: List[ASTNode], line: int = 1, column: int = 1):
        super().__init__("MethodCall", line, column)
        self.name = name
        self.arguments = arguments
