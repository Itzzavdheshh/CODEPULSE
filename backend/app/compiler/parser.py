from typing import List, Optional, Tuple
from .tokens import Token, TokenType
from .ast import (
    ASTNode, ProgramNode, ClassNode, MethodNode, BlockNode,
    VarDeclNode, AssignNode, IfNode, WhileNode, ForNode,
    ReturnNode, PrintNode, BinaryOpNode, UnaryOpNode,
    LiteralNode, IdentifierNode, MethodCallNode
)

class Parser:
    """
    Recursive Descent Parser for Java-like subset.
    Builds AST and captures syntax diagnostics.
    """
    TYPES = {"int", "float", "double", "boolean", "String", "void"}

    def __init__(self, tokens: List[Token]):
        self.tokens = tokens
        self.pos = 0
        self.diagnostics: List[dict] = []

    def current_token(self) -> Token:
        if self.pos < len(self.tokens):
            return self.tokens[self.pos]
        return self.tokens[-1]

    def peek_token(self, offset: int = 1) -> Token:
        idx = self.pos + offset
        if idx < len(self.tokens):
            return self.tokens[idx]
        return self.tokens[-1]

    def advance(self) -> Token:
        tok = self.current_token()
        if self.pos < len(self.tokens) - 1:
            self.pos += 1
        return tok

    def match(self, t_type: TokenType, val: Optional[str] = None) -> bool:
        tok = self.current_token()
        if tok.type == t_type:
            if val is None or tok.value == val:
                self.advance()
                return True
        return False

    def expect(self, t_type: TokenType, val: Optional[str] = None, msg: Optional[str] = None) -> Token:
        tok = self.current_token()
        if tok.type == t_type and (val is None or tok.value == val):
            return self.advance()
        
        err_msg = msg or f"Expected {val or t_type.value}, but found '{tok.value}'"
        self.diagnostics.append({
            "severity": "error",
            "phase": "Syntax Analysis",
            "message": err_msg,
            "line": tok.line,
            "column": tok.column
        })
        # Synchronize token stream
        return tok

    def parse(self) -> Tuple[ProgramNode, List[dict]]:
        self.diagnostics = []
        classes = []
        
        while self.current_token().type != TokenType.EOF:
            if self.current_token().value in ("public", "class"):
                cl_node = self.parse_class()
                if cl_node:
                    classes.append(cl_node)
            else:
                # Top-level statements / script style mode wrapper
                top_stmt = self.parse_statement()
                if top_stmt:
                    # Wrap top level statement into Main class/method for unified execution
                    main_method = MethodNode("void", "main", [], BlockNode([top_stmt]), is_static=True)
                    classes.append(ClassNode("Main", [main_method], []))
                else:
                    self.advance()

        prog_name = classes[0].name if classes else "MainProgram"
        return ProgramNode(prog_name, classes), self.diagnostics

    def parse_class(self) -> Optional[ClassNode]:
        line = self.current_token().line
        col = self.current_token().column

        if self.current_token().value == "public":
            self.advance()
        
        self.expect(TokenType.KEYWORD, "class", "Expected keyword 'class'")
        name_tok = self.expect(TokenType.IDENTIFIER, msg="Expected class name identifier")
        class_name = name_tok.value
        
        self.expect(TokenType.DELIMITER, "{", "Expected '{' to start class body")
        
        methods = []
        fields = []
        
        while self.current_token().type != TokenType.EOF and self.current_token().value != "}":
            member = self.parse_class_member()
            if isinstance(member, MethodNode):
                methods.append(member)
            elif isinstance(member, VarDeclNode):
                fields.append(member)
            else:
                self.advance()
                
        self.expect(TokenType.DELIMITER, "}", "Expected '}' to close class body")
        return ClassNode(class_name, methods, fields, line, col)

    def parse_class_member(self) -> Optional[ASTNode]:
        is_static = False
        if self.current_token().value == "public" or self.current_token().value == "private":
            self.advance()
        if self.current_token().value == "static":
            is_static = True
            self.advance()

        # Check type
        t_tok = self.current_token()
        if t_tok.value in self.TYPES or t_tok.type == TokenType.IDENTIFIER:
            data_type = t_tok.value
            self.advance()
            
            name_tok = self.expect(TokenType.IDENTIFIER, msg="Expected member name")
            name = name_tok.value

            # Check method vs field
            if self.current_token().value == "(":
                # Method declaration
                self.advance()
                params = self.parse_parameters()
                self.expect(TokenType.DELIMITER, ")", "Expected ')' after parameter list")
                body = self.parse_block()
                return MethodNode(data_type, name, params, body, is_static, t_tok.line, t_tok.column)
            else:
                # Field declaration
                init = None
                if self.match(TokenType.OPERATOR, "="):
                    init = self.parse_expression()
                self.expect(TokenType.DELIMITER, ";", "Expected ';' after variable declaration")
                return VarDeclNode(data_type, name, init, t_tok.line, t_tok.column)

        return None

    def parse_parameters(self) -> List[dict]:
        params = []
        if self.current_token().value != ")":
            while True:
                p_type = self.current_token().value
                self.advance()
                p_name = self.expect(TokenType.IDENTIFIER, msg="Expected parameter name").value
                params.append({"type": p_type, "name": p_name})
                if not self.match(TokenType.DELIMITER, ","):
                    break
        return params

    def parse_block(self) -> BlockNode:
        line = self.current_token().line
        col = self.current_token().column
        self.expect(TokenType.DELIMITER, "{", "Expected '{' to start block")
        
        stmts = []
        while self.current_token().type != TokenType.EOF and self.current_token().value != "}":
            s = self.parse_statement()
            if s:
                stmts.append(s)
            else:
                self.advance()

        self.expect(TokenType.DELIMITER, "}", "Expected '}' to end block")
        return BlockNode(stmts, line, col)

    def parse_statement(self) -> Optional[ASTNode]:
        tok = self.current_token()
        
        # System.out.println(...)
        if tok.value == "System":
            return self.parse_print_statement()

        # Variable Declaration: int x = 10;
        if tok.value in self.TYPES:
            return self.parse_var_decl()

        # If Statement
        if tok.value == "if":
            return self.parse_if_statement()

        # While Loop
        if tok.value == "while":
            return self.parse_while_loop()

        # For Loop
        if tok.value == "for":
            return self.parse_for_loop()

        # Return Statement
        if tok.value == "return":
            return self.parse_return_statement()

        # Block
        if tok.value == "{":
            return self.parse_block()

        # Assignment or Method Call
        if tok.type == TokenType.IDENTIFIER:
            if self.peek_token().value == "=":
                return self.parse_assignment()
            elif self.peek_token().value == "(":
                call = self.parse_method_call()
                self.expect(TokenType.DELIMITER, ";")
                return call

        # Fallback expression statement
        expr = self.parse_expression()
        self.match(TokenType.DELIMITER, ";")
        return expr

    def parse_print_statement(self) -> PrintNode:
        line = self.current_token().line
        col = self.current_token().column
        self.advance() # System
        self.expect(TokenType.DELIMITER, ".")
        self.expect(TokenType.IDENTIFIER, "out")
        self.expect(TokenType.DELIMITER, ".")
        self.expect(TokenType.IDENTIFIER, "println")
        self.expect(TokenType.DELIMITER, "(")
        expr = self.parse_expression()
        self.expect(TokenType.DELIMITER, ")")
        self.expect(TokenType.DELIMITER, ";")
        return PrintNode(expr, line, col)

    def parse_var_decl(self) -> VarDeclNode:
        line = self.current_token().line
        col = self.current_token().column
        d_type = self.advance().value
        name = self.expect(TokenType.IDENTIFIER, msg="Expected variable name").value
        
        init = None
        if self.match(TokenType.OPERATOR, "="):
            init = self.parse_expression()
        self.expect(TokenType.DELIMITER, ";", "Expected ';' after variable declaration")
        return VarDeclNode(d_type, name, init, line, col)

    def parse_assignment(self) -> AssignNode:
        line = self.current_token().line
        col = self.current_token().column
        name = self.advance().value
        self.expect(TokenType.OPERATOR, "=")
        val = self.parse_expression()
        self.expect(TokenType.DELIMITER, ";")
        return AssignNode(name, val, line, col)

    def parse_if_statement(self) -> IfNode:
        line = self.current_token().line
        col = self.current_token().column
        self.advance() # if
        self.expect(TokenType.DELIMITER, "(")
        cond = self.parse_expression()
        self.expect(TokenType.DELIMITER, ")")
        
        then_b = self.parse_statement() or BlockNode([])
        else_b = None
        if self.current_token().value == "else":
            self.advance()
            else_b = self.parse_statement()

        return IfNode(cond, then_b, else_b, line, col)

    def parse_while_loop(self) -> WhileNode:
        line = self.current_token().line
        col = self.current_token().column
        self.advance() # while
        self.expect(TokenType.DELIMITER, "(")
        cond = self.parse_expression()
        self.expect(TokenType.DELIMITER, ")")
        body = self.parse_statement() or BlockNode([])
        return WhileNode(cond, body, line, col)

    def parse_for_loop(self) -> ForNode:
        line = self.current_token().line
        col = self.current_token().column
        self.advance() # for
        self.expect(TokenType.DELIMITER, "(")
        
        init = self.parse_statement() if self.current_token().value != ";" else None
        if not init and self.current_token().value == ";":
            self.advance()
            
        cond = self.parse_expression() if self.current_token().value != ";" else None
        if self.current_token().value == ";":
            self.advance()
            
        update = self.parse_expression() if self.current_token().value != ")" else None
        self.expect(TokenType.DELIMITER, ")")
        
        body = self.parse_statement() or BlockNode([])
        return ForNode(init, cond, update, body, line, col)

    def parse_return_statement(self) -> ReturnNode:
        line = self.current_token().line
        col = self.current_token().column
        self.advance() # return
        val = None
        if self.current_token().value != ";":
            val = self.parse_expression()
        self.expect(TokenType.DELIMITER, ";")
        return ReturnNode(val, line, col)

    # Expression parsing precedence ladder
    def parse_expression(self) -> ASTNode:
        return self.parse_logical_or()

    def parse_logical_or(self) -> ASTNode:
        left = self.parse_logical_and()
        while self.current_token().value == "||":
            op = self.advance().value
            right = self.parse_logical_and()
            left = BinaryOpNode(op, left, right, left.line, left.column)
        return left

    def parse_logical_and(self) -> ASTNode:
        left = self.parse_equality()
        while self.current_token().value == "&&":
            op = self.advance().value
            right = self.parse_equality()
            left = BinaryOpNode(op, left, right, left.line, left.column)
        return left

    def parse_equality(self) -> ASTNode:
        left = self.parse_relational()
        while self.current_token().value in ("==", "!="):
            op = self.advance().value
            right = self.parse_relational()
            left = BinaryOpNode(op, left, right, left.line, left.column)
        return left

    def parse_relational(self) -> ASTNode:
        left = self.parse_additive()
        while self.current_token().value in ("<", ">", "<=", ">="):
            op = self.advance().value
            right = self.parse_additive()
            left = BinaryOpNode(op, left, right, left.line, left.column)
        return left

    def parse_additive(self) -> ASTNode:
        left = self.parse_multiplicative()
        while self.current_token().value in ("+", "-"):
            op = self.advance().value
            right = self.parse_multiplicative()
            left = BinaryOpNode(op, left, right, left.line, left.column)
        return left

    def parse_multiplicative(self) -> ASTNode:
        left = self.parse_unary()
        while self.current_token().value in ("*", "/", "%"):
            op = self.advance().value
            right = self.parse_unary()
            left = BinaryOpNode(op, left, right, left.line, left.column)
        return left

    def parse_unary(self) -> ASTNode:
        tok = self.current_token()
        if tok.value in ("-", "!"):
            op = self.advance().value
            operand = self.parse_unary()
            return UnaryOpNode(op, operand, tok.line, tok.column)
        return self.parse_primary()

    def parse_primary(self) -> ASTNode:
        tok = self.current_token()
        
        if tok.type == TokenType.INT_LITERAL:
            self.advance()
            return LiteralNode(int(tok.value), "int", tok.line, tok.column)
        elif tok.type == TokenType.FLOAT_LITERAL:
            self.advance()
            return LiteralNode(float(tok.value), "float", tok.line, tok.column)
        elif tok.type == TokenType.STRING_LITERAL:
            self.advance()
            return LiteralNode(tok.value, "String", tok.line, tok.column)
        elif tok.type == TokenType.BOOL_LITERAL:
            self.advance()
            return LiteralNode(tok.value == "true", "boolean", tok.line, tok.column)
        elif tok.type == TokenType.IDENTIFIER:
            if self.peek_token().value == "(":
                return self.parse_method_call()
            self.advance()
            return IdentifierNode(tok.value, tok.line, tok.column)
        elif tok.value == "(":
            self.advance()
            expr = self.parse_expression()
            self.expect(TokenType.DELIMITER, ")")
            return expr

        self.diagnostics.append({
            "severity": "error",
            "phase": "Syntax Analysis",
            "message": f"Unexpected expression primary token '{tok.value}'",
            "line": tok.line,
            "column": tok.column
        })
        self.advance()
        return LiteralNode(0, "int", tok.line, tok.column)

    def parse_method_call(self) -> MethodCallNode:
        line = self.current_token().line
        col = self.current_token().column
        name = self.advance().value
        self.expect(TokenType.DELIMITER, "(")
        args = []
        if self.current_token().value != ")":
            while True:
                args.append(self.parse_expression())
                if not self.match(TokenType.DELIMITER, ","):
                    break
        self.expect(TokenType.DELIMITER, ")")
        return MethodCallNode(name, args, line, col)
