from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_healthcheck():
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

def test_compiler_analyze_endpoint():
    payload = {
        "source_code": "class Hello { public static void main(String[] args) { System.out.println(10); } }",
        "file_name": "Hello.java"
    }
    resp = client.post("/api/v1/compiler/analyze", json=payload)
    assert resp.status_code == 200
    json_data = resp.json()
    assert "analysis" in json_data
    assert json_data["analysis"]["stats"]["tokens_count"] > 0

def test_academic_mapping_endpoint():
    resp = client.get("/api/v1/academic/mapping")
    assert resp.status_code == 200
    assert len(resp.json()["academic_laboratories"]) == 4
