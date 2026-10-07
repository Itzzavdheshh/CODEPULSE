# CodePulse Compiler Intelligence Engine Specification

## 1. Supported Java-like Language Grammar

```ebnf
Program         ::= ( ClassDecl | TopStatement )* ;
ClassDecl       ::= [ "public" ] "class" IDENTIFIER "{" ClassMember* "}" ;
ClassMember     ::= [ "public" | "private" ] [ "static" ] ( MethodDecl | VarDecl ) ;
MethodDecl      ::= Type IDENTIFIER "(" Parameters ")" Block ;
Parameters      ::= [ Parameter ( "," Parameter )* ] ;
Parameter       ::= Type IDENTIFIER ;
VarDecl         ::= Type IDENTIFIER [ "=" Expression ] ";" ;

Statement       ::= VarDecl
                  | Assignment
                  | IfStatement
                  | WhileStatement
                  | ForStatement
                  | ReturnStatement
                  | PrintStatement
                  | Block ;

IfStatement     ::= "if" "(" Expression ")" Statement [ "else" Statement ] ;
WhileStatement  ::= "while" "(" Expression ")" Statement ;
ForStatement    ::= "for" "(" [ Statement ] ";" [ Expression ] ";" [ Expression ] ")" Statement ;
ReturnStatement ::= "return" [ Expression ] ";" ;
PrintStatement  ::= "System.out.println" "(" Expression ")" ";" ;
Block           ::= "{" Statement* "}" ;

Expression      ::= LogicalOr ;
LogicalOr       ::= LogicalAnd ( "||" LogicalAnd )* ;
LogicalAnd      ::= Equality ( "&&" Equality )* ;
Equality        ::= Relational ( ( "==" | "!=" ) Relational )* ;
Relational      ::= Additive ( ( "<" | ">" | "<=" | ">=" ) Additive )* ;
Additive        ::= Multiplicative ( ( "+" | "-" ) Multiplicative )* ;
Multiplicative  ::= Unary ( ( "*" | "/" | "%" ) Unary )* ;
Unary           ::= ( "-" | "!" ) Unary | Primary ;
Primary         ::= INT_LITERAL | FLOAT_LITERAL | STRING_LITERAL | BOOL_LITERAL | IDENTIFIER | MethodCall | "(" Expression ")" ;
MethodCall      ::= IDENTIFIER "(" [ Expression ( "," Expression )* ] ")" ;

Type            ::= "int" | "float" | "double" | "boolean" | "String" | "void" | IDENTIFIER ;
```

---

## 2. 10-Phase Pipeline Architecture

1. **Preprocessing**: String-aware comment extraction (`//` and `/* */`) and token-aware macro (`#define`) substitution.
2. **Lexical Analysis**: Scanning into tokens with line/col tracking and keyword frequency analysis.
3. **Syntax Analysis**: Recursive descent parser building Abstract Syntax Tree (AST).
4. **Hierarchical Symbol Table**: Scoped symbol registry (`global`, `class`, `method`, `block`).
5. **Semantic Diagnostics**: Type checking, undeclared identifier detection, duplicate declaration detection, unreachable statement detection.
6. **Intermediate Representation (TAC)**: Three-Address Code Quadruples `(op, arg1, arg2, result)`.
7. **Code Optimization**: Constant Folding, Constant Propagation, Dead Code Elimination, Algebraic Simplification.
8. **Basic Blocks & CFG**: Leader-based basic block partitioning and Control-Flow Graph adjacency list construction.
9. **Code Metrics**: Cyclomatic complexity $V(G) = E - N + 2P$, LOC, token density, maintainability index.
10. **Educational JVM Target Code Generation**: Assembly emitter generating stack machine instructions (`bipush`, `istore`, `iload`, `iadd`, `ifeq`, `invokevirtual`, `return`).

---

## 3. Grammar Analysis & Parsing Toolkit

- **FIRST & FOLLOW Sets**: Iterative fixed-point set computation across terminals and non-terminals.
- **Left Recursion Elimination**: Direct left recursion detection ($A \to A \alpha \mid \beta \implies A \to \beta A', A' \to \alpha A' \mid \varepsilon$).
- **Recursive Descent Trace**: Step-by-step token matching & production selection simulation.
- **Shift-Reduce Parsing Engine**: Stack, input buffer, reduction rules, and conflict detection.

---

## 4. Reusable Export Formats

- `compiler_analysis.json`
- `tokens.csv`
- `symbol_table.csv`
- `tac.csv`
- `optimized_tac.csv`
- `metrics.csv`
- `ast.json`
- `cfg.json`
- `compiler_artifacts.zip`
