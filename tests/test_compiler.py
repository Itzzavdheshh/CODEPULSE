import pytest
from app.compiler.service import CompilerService

def test_compiler_service_valid_code():
    code = """
    public class Factorial {
        public static void main(String[] args) {
            int n = 5;
            int result = 1;
            int i = 1;
            while (i <= n) {
                result = result * i;
                i = i + 1;
            }
            System.out.println(result);
        }
    }
    """
    service = CompilerService()
    res = service.analyze_source(code, "Factorial.java")

    assert res["file_name"] == "Factorial.java"
    assert len(res["tokens"]) > 10
    assert res["ast"]["node_type"] == "Program"
    assert len(res["symbol_table"]) > 0
    assert res["metrics"]["cyclomatic_complexity"] >= 2
    assert len(res["intermediate_code"]) > 0
    assert len(res["cfg"]["nodes"]) >= 2
    assert res["stats"]["errors_count"] == 0

def test_compiler_service_syntax_error():
    code = "class Test { int x = ; }"
    service = CompilerService()
    res = service.analyze_source(code, "SyntaxErr.java")

    assert res["stats"]["errors_count"] > 0
    assert any(d["phase"] == "Syntax Analysis" for d in res["diagnostics"])

def test_compiler_service_type_error():
    code = """
    class TypeTest {
        void test() {
            int x = "hello";
        }
    }
    """
    service = CompilerService()
    res = service.analyze_source(code, "TypeErr.java")

    assert any("Type mismatch" in d["message"] for d in res["diagnostics"])
