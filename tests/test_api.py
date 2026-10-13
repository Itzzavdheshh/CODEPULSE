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

def test_compiler_project_analyze_and_zip_upload():
    import zipfile
    import io
    import base64

    # 1. Multi-file project direct analysis
    project_payload = {
        "files": [
            {
                "file_name": "Main.java",
                "source_code": "public class Main { public static void main(String[] args) { Service.process(); } }"
            },
            {
                "file_name": "Service.java",
                "source_code": "public class Service { public static void process() { int x = 5; } }"
            }
        ]
    }
    resp = client.post("/api/v1/compiler/project/analyze", json=project_payload)
    assert resp.status_code == 200
    p_data = resp.json()
    assert p_data["files_analyzed"] == 2
    assert "Service" in p_data["declared_classes"]
    assert any(d["uses_class"] == "Service" for d in p_data["dependencies"])

    # 2. ZIP Archive upload and analysis
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("src/Main.java", "public class Main { public static void main(String[] args) { OrderService.create(); } }")
        zf.writestr("src/OrderService.java", "public class OrderService { public static void create() { int order = 100; } }")
    b64_zip = base64.b64encode(buf.getvalue()).decode("utf-8")

    zip_resp = client.post("/api/v1/compiler/project/upload-zip", json={"zip_base64": b64_zip, "file_name": "project.zip"})
    assert zip_resp.status_code == 200
    z_data = zip_resp.json()
    assert z_data["project_name"] == "project.zip"
    assert len(z_data["files"]) == 2
    assert z_data["analysis"]["files_analyzed"] == 2
    assert "OrderService" in z_data["analysis"]["declared_classes"]
