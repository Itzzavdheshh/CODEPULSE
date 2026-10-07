import pytest
from app.compiler.preprocessor import Preprocessor

def test_preprocessor_comment_stripping():
    prep = Preprocessor()
    code = """
    // This is a single line comment
    int x = 10; /* Multi-line
    comment block */
    String url = "http://example.com//not_a_comment";
    """
    res = prep.preprocess(code)
    stats = res["comment_stats"]

    assert stats["single_line_comments_count"] == 1
    assert stats["block_comments_count"] == 1
    assert "http://example.com//not_a_comment" in res["cleaned_source"]
    assert "This is a single line comment" not in res["cleaned_source"]

def test_preprocessor_macro_expansion():
    prep = Preprocessor()
    code = """
    #define MAX 100
    #define LIMIT 10
    int total = MAX + LIMIT;
    """
    res = prep.preprocess(code)

    assert len(res["macros"]) == 2
    assert "int total = 100 + 10;" in res["cleaned_source"]
