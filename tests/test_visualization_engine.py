import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.visualization.service import visualization_service

client = TestClient(app)

@pytest.fixture
def sample_csv():
    return (
        "module,loc,cyclomatic_complexity,cognitive_complexity,tokens_count,diagnostics_count,risk_level\n"
        "AuthService.py,145,14,12,650,3,HIGH\n"
        "PaymentGateway.py,210,22,18,980,5,CRITICAL\n"
        "UserInterface.py,85,4,3,320,0,LOW\n"
        "DatabasePool.py,120,8,6,490,1,MODERATE\n"
        "CacheManager.py,60,2,1,210,0,LOW\n"
        "LoggerUtility.py,40,1,1,150,0,LOW\n"
        "NotificationWorker.py,175,16,13,740,4,HIGH\n"
        "EncryptionModule.py,95,9,7,410,1,MODERATE\n"
        "ReportGenerator.py,310,28,24,1420,8,CRITICAL\n"
        "ConfigParser.py,70,3,2,280,0,LOW\n"
    )

@pytest.fixture
def sample_json():
    return '[{"a": 10, "b": 100}, {"a": 20, "b": 200}, {"a": 30, "b": 300}]'

class TestVisualizationEngineService:
    def test_parse_dataset_csv(self, sample_csv):
        df = visualization_service.parse_dataset(sample_csv, "csv")
        assert not df.empty
        assert len(df) == 10
        assert "cyclomatic_complexity" in df.columns

    def test_parse_dataset_json(self, sample_json):
        df = visualization_service.parse_dataset(sample_json, "json")
        assert len(df) == 3
        assert list(df.columns) == ["a", "b"]

    def test_data_quality_score(self, sample_csv):
        df = visualization_service.parse_dataset(sample_csv, "csv")
        score_data = visualization_service.compute_data_quality_score(df)
        assert 0 <= score_data["score"] <= 100
        assert isinstance(score_data["score"], float)

    def test_profile_dataset(self, sample_csv):
        df = visualization_service.parse_dataset(sample_csv, "csv")
        profile = visualization_service.profile_dataset(df, "SoftwareMetrics.csv")
        assert profile["summary"]["rows"] == 10
        assert len(profile["numeric_columns"]) >= 4
        assert "quality" in profile or "data_quality_score" in profile

    def test_recommendations(self, sample_csv):
        df = visualization_service.parse_dataset(sample_csv, "csv")
        profile = visualization_service.profile_dataset(df)
        recs = visualization_service.recommend_visualizations(profile)
        assert len(recs) > 0
        for rec in recs:
            assert "chart_type" in rec
            assert "reason" in rec or "why" in rec



    def test_correlation_matrix(self, sample_csv):
        df = visualization_service.parse_dataset(sample_csv, "csv")
        corr = visualization_service.compute_correlation_matrix(df)
        assert "pearson_matrix" in corr or "matrix" in corr or "columns" in corr

    def test_anomalies_iqr(self, sample_csv):
        df = visualization_service.parse_dataset(sample_csv, "csv")
        res = visualization_service.detect_anomalies(df)
        assert "anomalies" in res or "total_anomalies" in res

    def test_time_series_resampling(self):
        dates = pd.date_range("2026-01-01", periods=30, freq="D")
        vals = np.sin(np.linspace(0, 10, 30)) * 50 + 100
        df = pd.DataFrame({"timestamp": dates, "commits": vals})
        ts_res = visualization_service.analyze_time_series(df, "timestamp", "commits")
        assert "points" in ts_res or "resampled" in ts_res


    def test_hierarchy_generator(self, sample_csv):
        df = visualization_service.parse_dataset(sample_csv, "csv")
        hier = visualization_service.generate_hierarchy_data(df, ["risk_level", "module"], "loc")
        assert "name" in hier or "children" in hier

    def test_visual_story(self, sample_csv):
        df = visualization_service.parse_dataset(sample_csv, "csv")
        profile = visualization_service.profile_dataset(df)
        story = visualization_service.generate_visual_story(profile_data=profile)
        assert isinstance(story, list)
        assert len(story) > 0
        for step in story:
            assert "what" in step
            assert "why" in step

    def test_visual_query_parser(self):
        q1 = visualization_service.parse_visual_query("Compare LOC and cyclomatic complexity")
        assert "chart_type" in q1

    def test_lab_experiments_execution(self):
        experiments = visualization_service.get_lab_experiments()
        assert len(experiments) == 10
        for exp in experiments:
            res = visualization_service.execute_lab_experiment(exp["id"])
            assert "chart_type" in res or "experiment_id" in res

class TestVisualizationEndpoints:
    def test_profile_endpoint(self, sample_csv):
        resp = client.post("/api/v1/visualization/profile", json={
            "dataset_content": sample_csv,
            "file_type": "csv",
            "dataset_name": "Test.csv"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "profile" in data

    def test_experiments_list_endpoint(self):
        resp = client.get("/api/v1/visualization/experiments")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["experiments"]) == 10

    def test_experiments_execute_endpoint(self):
        resp = client.post("/api/v1/visualization/experiments/execute", json={
            "experiment_id": "01_spreadsheet"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "chart_type" in data or "experiment_id" in data

    def test_correlation_endpoint(self, sample_csv):
        resp = client.post("/api/v1/visualization/correlation", json={
            "dataset_content": sample_csv,
            "file_type": "csv",
            "dataset_name": "Test.csv"
        })
        assert resp.status_code == 200

    def test_lineage_endpoint(self):
        resp = client.get("/api/v1/visualization/lineage")
        assert resp.status_code == 200
        data = resp.json()
        assert "nodes" in data
        assert "edges" in data

    def test_invalid_payload_security(self):
        resp = client.post("/api/v1/visualization/profile", json={
            "dataset_content": "invalid,malformed\n1,2,3,4,5,6,7,8",
            "file_type": "csv"
        })
        assert resp.status_code in [200, 400]

    def test_correlation_matrix_mathematical_properties(self, sample_csv):
        df = visualization_service.parse_dataset(sample_csv, "csv")
        res = visualization_service.compute_correlation_matrix(df)
        assert "columns" in res
        assert "matrix" in res
        assert "pearson_matrix" in res
        
        cols = res["columns"]
        matrix = res["matrix"]
        
        # Verify diagonal = 1.0 and symmetry matrix[c1][c2] == matrix[c2][c1]
        for c1 in cols:
            assert matrix[c1][c1] == 1.0
            for c2 in cols:
                assert -1.0 <= matrix[c1][c2] <= 1.0
                assert matrix[c1][c2] == matrix[c2][c1]

    def test_correlation_constant_column_graceful(self):
        # A dataset with a constant column
        df = pd.DataFrame({
            "var1": [10.0, 20.0, 30.0, 40.0],
            "constant": [5.0, 5.0, 5.0, 5.0],
            "var2": [100.0, 200.0, 300.0, 400.0]
        })
        res = visualization_service.compute_correlation_matrix(df)
        assert "matrix" in res
        # Correlation of constant column with var1 must be 0.0, no NaN
        assert res["matrix"]["constant"]["var1"] == 0.0
        assert res["matrix"]["var1"]["constant"] == 0.0
        # Correlation of var1 and var2 should be 1.0
        assert res["matrix"]["var1"]["var2"] == 1.0

    def test_anomaly_dual_contract_fields(self, sample_csv):
        df = visualization_service.parse_dataset(sample_csv, "csv")
        res = visualization_service.detect_anomalies(df)
        assert "anomalies" in res
        assert "anomaly_records" in res
        if res["anomalies"]:
            anom = res["anomalies"][0]
            assert "row_index" in anom
            assert "column" in anom
            assert "column_name" in anom
            assert "value" in anom
            assert "expected_min" in anom
            assert "expected_max" in anom
            assert "deviation_factor" in anom

    def test_correlation_list_payload_endpoint(self):
        dataset_records = [
            {"loc": 10, "complexity": 1},
            {"loc": 20, "complexity": 2},
            {"loc": 30, "complexity": 3},
            {"loc": 40, "complexity": 4}
        ]
        resp = client.post("/api/v1/visualization/correlation", json={
            "dataset": dataset_records,
            "columns": ["loc", "complexity"]
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "matrix" in data
        assert data["matrix"]["loc"]["complexity"] == 1.0

    def test_anomalies_list_payload_endpoint(self):
        dataset_records = [
            {"loc": 10}, {"loc": 12}, {"loc": 11}, {"loc": 10}, {"loc": 13}, {"loc": 500}
        ]
        resp = client.post("/api/v1/visualization/anomalies", json={
            "dataset": dataset_records,
            "columns": ["loc"],
            "method": "iqr"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "anomalies" in data
        assert len(data["anomalies"]) > 0
        assert data["anomalies"][0]["value"] == 500.0

    def test_story_endpoint(self):
        dataset_records = [
            {"loc": 10, "complexity": 1},
            {"loc": 20, "complexity": 2}
        ]
        resp = client.post("/api/v1/visualization/story", json={
            "dataset": dataset_records,
            "columns": ["loc", "complexity"]
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "steps" in data
        assert len(data["steps"]) > 0

    def test_visual_query_top_complex_methods(self):
        compiler_data = {
            "metrics": {
                "method_complexities": [
                    {"name": "analyzeIterations", "cyclomatic_complexity": 4, "decision_points": 3, "instruction_count": 31},
                    {"name": "calculateRisk", "cyclomatic_complexity": 2, "decision_points": 1, "instruction_count": 19},
                    {"name": "main", "cyclomatic_complexity": 2, "decision_points": 1, "instruction_count": 31}
                ]
            }
        }
        resp = client.post("/api/v1/visualization/query", json={
            "query_text": "Show top 10 most complex methods",
            "compiler_data": compiler_data
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["chart_type"] == "bar"
        assert len(data["rows"]) == 3
        assert data["rows"][0]["method"] == "analyzeIterations"
        assert data["rows"][0]["cyclomatic_complexity"] == 4
        assert data["data"]["x"] == ["analyzeIterations", "calculateRisk", "main"]
        assert data["data"]["y"] == [4, 2, 2]

    def test_visual_query_complexity_distribution(self):
        compiler_data = {
            "metrics": {
                "method_complexities": [
                    {"name": "calculateRisk", "cyclomatic_complexity": 2},
                    {"name": "analyzeIterations", "cyclomatic_complexity": 4},
                    {"name": "main", "cyclomatic_complexity": 2}
                ]
            }
        }
        resp = client.post("/api/v1/visualization/query", json={
            "query_text": "Show complexity distribution",
            "compiler_data": compiler_data
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["chart_type"] == "bar"
        assert len(data["rows"]) == 4
        # Low Risk (1-2) should have 2 methods, Moderate (3-5) should have 1 method
        bracket_map = {r["risk_bracket"]: r["count"] for r in data["rows"]}
        assert bracket_map["Low Risk (1-2)"] == 2
        assert bracket_map["Moderate Risk (3-5)"] == 1
        assert sum(bracket_map.values()) == 3

    def test_visual_query_loc_vs_complexity(self):
        compiler_data = {
            "metrics": {
                "method_complexities": [
                    {"name": "analyzeIterations", "cyclomatic_complexity": 4, "instruction_count": 31},
                    {"name": "calculateRisk", "cyclomatic_complexity": 2, "instruction_count": 19}
                ]
            }
        }
        resp = client.post("/api/v1/visualization/query", json={
            "query_text": "Compare LOC and cyclomatic complexity",
            "compiler_data": compiler_data
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["chart_type"] == "scatter"
        assert len(data["rows"]) == 2
        assert isinstance(data["data"], list)
        assert len(data["data"]) == 2
        assert data["data"][0]["label"] == "analyzeIterations"
        assert data["data"][0]["y"] == 4

    def test_visual_query_empty_result(self):
        resp = client.post("/api/v1/visualization/query", json={
            "query_text": "Show top 10 most complex methods",
            "dataset": [],
            "compiler_data": {}
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_records"] == 0
        assert data["rows"] == []
        assert data["data"]["x"] == []
        assert data["data"]["y"] == []
        assert "No method complexity data available" in data["explanation"]

    def test_visual_query_invalid_query_data(self):
        # Empty query text must raise 400
        resp_empty = client.post("/api/v1/visualization/query", json={
            "query_text": "   "
        })
        assert resp_empty.status_code == 400
        assert "cannot be empty" in resp_empty.json()["detail"]

    def test_visual_query_active_software_risk_analyzer_flow(self):
        # 1. Analyze SoftwareRiskAnalyzer code and store artifact
        src = (
            "public class SoftwareRiskAnalyzer {\n"
            "    public static int calculateRisk(int c, int e) {\n"
            "        if (c > 10) return 20;\n"
            "        return 5;\n"
            "    }\n"
            "    public static int analyzeIterations(int c) {\n"
            "        int i = 0;\n"
            "        while (i < 5) i = i + 1;\n"
            "        return i;\n"
            "    }\n"
            "}\n"
        )
        comp_resp = client.post("/api/v1/compiler/analyze", json={
            "source_code": src,
            "file_name": "SoftwareRiskAnalyzer.java",
            "save_artifact": True
        })
        assert comp_resp.status_code == 200
        artifact = comp_resp.json()["artifact"]
        assert artifact is not None

        # 2. Query visualization without passing compiler_data explicitly (resolves from artifact store)
        query_resp = client.post("/api/v1/visualization/query", json={
            "query_text": "Show top 10 most complex methods",
            "artifact_id": artifact["artifact_id"]
        })
        assert query_resp.status_code == 200
        qdata = query_resp.json()
        assert qdata["chart_type"] == "bar"
        assert len(qdata["rows"]) >= 2
        methods = [r["method"] for r in qdata["rows"]]
        assert "calculateRisk" in methods
        assert "analyzeIterations" in methods


