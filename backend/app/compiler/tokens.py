from enum import Enum
from typing import Optional
from pydantic import BaseModel

class TokenType(str, Enum):
    # Keywords
    KEYWORD = "KEYWORD"
    
    # Identifiers & Literals
    IDENTIFIER = "IDENTIFIER"
    INT_LITERAL = "INT_LITERAL"
    FLOAT_LITERAL = "FLOAT_LITERAL"
    STRING_LITERAL = "STRING_LITERAL"
    BOOL_LITERAL = "BOOL_LITERAL"
    
    # Operators
    OPERATOR = "OPERATOR"
    
    # Delimiters / Punctuation
    DELIMITER = "DELIMITER"
    
    # Special
    COMMENT = "COMMENT"
    EOF = "EOF"
    UNKNOWN = "UNKNOWN"

class Token(BaseModel):
    type: TokenType
    value: str
    line: int
    column: int
    length: int = 1

    def to_dict(self):
        return {
            "type": self.type.value,
            "value": self.value,
            "line": self.line,
            "column": self.column
        }

JAVA_KEYWORDS = {
    "class", "public", "private", "protected", "static", "final",
    "void", "int", "float", "double", "boolean", "String",
    "if", "else", "while", "for", "return", "true", "false",
    "new", "this"
}
