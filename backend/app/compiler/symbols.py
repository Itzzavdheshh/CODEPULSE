from typing import Dict, List, Optional, Any

class Symbol:
    def __init__(self, name: str, category: str, data_type: str, scope: str, line: int):
        self.name = name
        self.category = category  # "variable", "method", "class", "field"
        self.data_type = data_type
        self.scope = scope
        self.line = line

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "category": self.category,
            "data_type": self.data_type,
            "scope": self.scope,
            "line": self.line
        }

class SymbolTable:
    def __init__(self, scope_name: str = "global", parent: Optional['SymbolTable'] = None):
        self.scope_name = scope_name
        self.parent = parent
        self.symbols: Dict[str, Symbol] = {}

    def define(self, symbol: Symbol) -> bool:
        if symbol.name in self.symbols:
            return False  # Redeclaration in same scope
        self.symbols[symbol.name] = symbol
        return True

    def lookup(self, name: str) -> Optional[Symbol]:
        if name in self.symbols:
            return self.symbols[name]
        if self.parent:
            return self.parent.lookup(name)
        return None

    def get_all_symbols((self)) -> List[Symbol]:
        all_syms = list(self.symbols.values())
        return all_syms
