import re
from typing import List, Tuple
from .tokens import Token, TokenType, JAVA_KEYWORDS

class LexerDiagnostic(Exception):
    def __init__(self, message: str, line: int, column: int):
        self.message = message
        self.line = line
        self.column = column
        super().__init__(f"[{line}:{column}] {message}")

class Lexer:
    """
    Lexical Analyzer for Java-like language subset.
    Tokenizes input string into strongly-typed tokens with line/column tracking.
    """
    
    OPERATORS = {"==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=",
                 "+", "-", "*", "/", "%", "=", "<", ">", "!"}
    DELIMITERS = {";", ",", ".", "(", ")", "{", "}", "[", "]"}

    def __init__(self, source_code: str):
        self.source = source_code
        self.length = len(source_code)
        self.pos = 0
        self.line = 1
        self.column = 1
        self.tokens: List[Token] = []
        self.diagnostics: List[dict] = []

    def tokenize(self) -> Tuple[List[Token], List[dict]]:
        self.tokens = []
        self.diagnostics = []
        
        while self.pos < self.length:
            ch = self.source[self.pos]
            
            # Newlines
            if ch == '\n':
                self.line += 1
                self.column = 1
                self.pos += 1
                continue
            
            # Whitespace
            if ch.isspace():
                self.column += 1
                self.pos += 1
                continue
            
            # Line / Block Comments
            if ch == '/' and self.peek() == '/':
                self.skip_line_comment()
                continue
            if ch == '/' and self.peek() == '*':
                self.skip_block_comment()
                continue

            start_line = self.line
            start_col = self.column

            # String Literals
            if ch == '"':
                string_val = self.scan_string()
                self.tokens.append(Token(
                    type=TokenType.STRING_LITERAL,
                    value=string_val,
                    line=start_line,
                    column=start_col,
                    length=len(string_val) + 2
                ))
                continue

            # Numbers (Integer & Float)
            if ch.isdigit():
                num_str, is_float = self.scan_number()
                t_type = TokenType.FLOAT_LITERAL if is_float else TokenType.INT_LITERAL
                self.tokens.append(Token(
                    type=t_type,
                    value=num_str,
                    line=start_line,
                    column=start_col,
                    length=len(num_str)
                ))
                continue

            # Identifiers and Keywords
            if ch.isalpha() or ch == '_':
                ident = self.scan_identifier()
                if ident in ("true", "false"):
                    t_type = TokenType.BOOL_LITERAL
                elif ident in JAVA_KEYWORDS:
                    t_type = TokenType.KEYWORD
                else:
                    t_type = TokenType.IDENTIFIER
                
                self.tokens.append(Token(
                    type=t_type,
                    value=ident,
                    line=start_line,
                    column=start_col,
                    length=len(ident)
                ))
                continue

            # Two-character Operators
            two_ch = ch + (self.peek() or "")
            if two_ch in self.OPERATORS:
                self.tokens.append(Token(
                    type=TokenType.OPERATOR,
                    value=two_ch,
                    line=start_line,
                    column=start_col,
                    length=2
                ))
                self.pos += 2
                self.column += 2
                continue

            # Single-character Operators
            if ch in self.OPERATORS:
                self.tokens.append(Token(
                    type=TokenType.OPERATOR,
                    value=ch,
                    line=start_line,
                    column=start_col,
                    length=1
                ))
                self.pos += 1
                self.column += 1
                continue

            # Delimiters
            if ch in self.DELIMITERS:
                self.tokens.append(Token(
                    type=TokenType.DELIMITER,
                    value=ch,
                    line=start_line,
                    column=start_col,
                    length=1
                ))
                self.pos += 1
                self.column += 1
                continue

            # Unknown / Invalid Character Diagnostic
            self.diagnostics.append({
                "severity": "error",
                "phase": "Lexical Analysis",
                "message": f"Unexpected character '{ch}'",
                "line": self.line,
                "column": self.column
            })
            self.pos += 1
            self.column += 1

        self.tokens.append(Token(
            type=TokenType.EOF,
            value="<EOF>",
            line=self.line,
            column=self.column,
            length=0
        ))
        return self.tokens, self.diagnostics

    def peek(self, offset: int = 1) -> str:
        idx = self.pos + offset
        return self.source[idx] if idx < self.length else ""

    def skip_line_comment(self):
        while self.pos < self.length and self.source[self.pos] != '\n':
            self.pos += 1
            self.column += 1

    def skip_block_comment(self):
        start_line = self.line
        start_col = self.column
        self.pos += 2
        self.column += 2
        while self.pos < self.length:
            if self.source[self.pos] == '*' and self.peek() == '/':
                self.pos += 2
                self.column += 2
                return
            if self.source[self.pos] == '\n':
                self.line += 1
                self.column = 1
            else:
                self.column += 1
            self.pos += 1
        
        self.diagnostics.append({
            "severity": "error",
            "phase": "Lexical Analysis",
            "message": "Unterminated block comment",
            "line": start_line,
            "column": start_col
        })

    def scan_string(self) -> str:
        start_line = self.line
        start_col = self.column
        self.pos += 1 # skip opening quote
        self.column += 1
        chars = []
        while self.pos < self.length and self.source[self.pos] != '"':
            if self.source[self.pos] == '\n':
                self.line += 1
                self.column = 1
            else:
                chars.append(self.source[self.pos])
                self.column += 1
            self.pos += 1

        if self.pos >= self.length:
            self.diagnostics.append({
                "severity": "error",
                "phase": "Lexical Analysis",
                "message": "Unterminated string literal",
                "line": start_line,
                "column": start_col
            })
        else:
            self.pos += 1 # skip closing quote
            self.column += 1
        return "".join(chars)

    def scan_number(self) -> Tuple[str, bool]:
        chars = []
        is_float = False
        while self.pos < self.length:
            ch = self.source[self.pos]
            if ch.isdigit():
                chars.append(ch)
            elif ch == '.' and not is_float and self.peek().isdigit():
                is_float = True
                chars.append(ch)
            else:
                break
            self.pos += 1
            self.column += 1
        return "".join(chars), is_float

    def scan_identifier(self) -> str:
        chars = []
        while self.pos < self.length:
            ch = self.source[self.pos]
            if ch.isalnum() or ch == '_':
                chars.append(ch)
                self.pos += 1
                self.column += 1
            else:
                break
        return "".join(chars)
