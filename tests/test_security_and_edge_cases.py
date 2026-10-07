import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.artifacts.store import ArtifactStore
from app.ml.service import MLService

client = TestClient(app)

class TestSecurityAndEdgeCases:

    def test_path_traversal_rejection_in_artifacts(self):
        """Verifies path traversal strings return 404 instead of exposing filesystem."""
        res = client.get("/api/v1/artifacts/../../etc/passwd")
        assert res.status_code in [404, 422]

        res = client.get("/api/v1/compiler/export/..%2F..%2Fsecret/zip")
        assert res.status_code in [404, 422]

    def test_empty_source_code_rejection(self):
        """Verifies empty compiler source returns 400 Bad Request."""
        res = client.post("/api/v1/compiler/analyze", json={"source_code": "   ", "file_name": "Empty.java"})
        assert res.status_code == 400
        assert "cannot be empty" in res.json()["detail"].lower()

    def test_invalid_ml_prediction_schema_mismatch(self):
        """Verifies ML engine rejects predictions when feature schema is incompatible."""
        ml_service = MLService()
        csv_data = "loc,cyclomatic_complexity,risk_level\n10,2,LOW\n50,12,HIGH\n15,3,LOW\n60,15,HIGH\n20,4,LOW\n12,2,LOW\n55,14,HIGH\n18,3,LOW\n65,16,HIGH\n22,4,LOW"
        res = ml_service.train_and_compare(csv_data, target_column="risk_level", primary_model_name="random_forest")

        # Incompatible prediction payload (missing cyclomatic_complexity, extra author_stars)
        incompatible_payload = {"loc": 10, "author_stars": 500}
        pred_res = ml_service.predict_instance(res, incompatible_payload)

        assert pred_res["prediction_available"] is False
        assert "missing from target input dataset" in pred_res["error"].lower()

    def test_large_source_code_handling(self):
        """Verifies compiler handles large source code inputs without infinite loops or memory crashes."""
        large_source = "public class LargeDemo {\n" + "    int x = 1;\n" * 500 + "}\n"
        res = client.post("/api/v1/compiler/analyze", json={"source_code": large_source, "file_name": "LargeDemo.java"})
        assert res.status_code == 200
        data = res.json()
        assert data["analysis"]["stats"]["lines"] >= 500

    def test_malformed_dataset_handling(self):
        """Verifies data engine gracefully handles malformed CSV input with a 400 error."""
        malformed_csv = "a,b,c\n1,2\n3,4,5,6,7\n"
        res = client.post("/api/v1/data/profile", json={"csv_text": malformed_csv, "dataset_name": "Malformed.csv"})
        assert res.status_code == 400
