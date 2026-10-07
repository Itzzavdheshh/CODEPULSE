import pytest
from app.compiler.service import CompilerService
from app.compiler.project import MultiFileProjectAnalyzer

def test_compiler_service_full_pipeline():
    code = """
    #define MAX 100
    // Main calculation class
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
    assert "preprocessing" in res
    assert res["preprocessing"]["comment_stats"]["single_line_comments_count"] == 1
    assert "keyword_frequency" in res
    assert "while" in res["keyword_frequency"]
    assert "target_code" in res
    assert "bipush" in res["target_code"]["assembly_code"]

def test_multifile_project_analyzer():
    files = [
        {"file_name": "Main.java", "source_code": "public class Main { public static void main() { Helper.doWork(); } }"},
        {"file_name": "Helper.java", "source_code": "public class Helper { public static void doWork() { int x = 10; } }"}
    ]
    analyzer = MultiFileProjectAnalyzer()
    res = analyzer.analyze_project(files)

    assert res["files_count"] == 2
    assert "Helper" in res["declared_classes"]
    assert len(res["dependencies"]) >= 1
