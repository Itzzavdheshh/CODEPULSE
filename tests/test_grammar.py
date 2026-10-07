import pytest
from app.compiler.grammar import GrammarAnalyzer

def test_grammar_analyzer_first_follow():
    analyzer = GrammarAnalyzer()
    res = analyzer.analyze_grammar({
        "S": ["c A d"],
        "A": ["a b", "a"]
    })

    assert "S" in res["first_sets"]
    assert "c" in res["first_sets"]["S"]
    assert "$" in res["follow_sets"]["S"]
    assert "d" in res["follow_sets"]["A"]

def test_grammar_left_recursion_elimination():
    analyzer = GrammarAnalyzer()
    res = analyzer.eliminate_left_recursion({
        "E": ["E + T", "T"]
    })

    assert res["has_left_recursion"] is True
    assert "E" in res["detected_non_terminals"]
    assert "E'" in res["transformed_productions"]

def test_recursive_descent_simulation():
    analyzer = GrammarAnalyzer()
    res = analyzer.simulate_recursive_descent("c a b d")

    assert res["success"] is True
    assert len(res["trace"]) > 0

def test_shift_reduce_simulation():
    analyzer = GrammarAnalyzer()
    res = analyzer.simulate_shift_reduce("i + i * i")

    assert res["success"] is True
    assert any(s["action"] == "ACCEPT" for s in res["steps"])
