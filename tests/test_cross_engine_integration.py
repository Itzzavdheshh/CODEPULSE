"""
Cross-Engine Integration Test Suite.
Tests: Compiler → Artifact Store → ML Pipeline (feature compatibility guard).
Tests: Data Engine → ML Engine (dataset passthrough, schema compatibility).
Tests: Artifact Store cross-engine contract integrity.
"""
import pytest
import pandas as pd
import io
from app.data.service import DataService
from app.ml.service import MLService
from app.ml.pipeline import PreprocessingPipeline
from app.artifacts.store import ArtifactStore

# ─── Shared Fixtures ─────────────────────────────────────────────────────────

# 25-row dataset with 4 balanced classes (≥5 per class) — safe for stratified 80/20 split
SHARED_METRICS_CSV = """loc,cyclomatic_complexity,cognitive_complexity,tokens_count,diagnostics_count,risk_level
145,14,12,650,3,HIGH
85,4,3,320,0,LOW
120,8,6,490,1,MODERATE
60,2,1,210,0,LOW
175,16,13,740,4,HIGH
95,9,7,410,1,MODERATE
310,28,24,1420,8,CRITICAL
70,3,2,280,0,LOW
130,11,9,590,2,HIGH
210,22,18,980,5,CRITICAL
40,1,1,150,0,LOW
160,15,11,700,3,HIGH
250,25,20,1100,7,CRITICAL
50,2,1,180,0,LOW
110,10,8,520,2,MODERATE
200,20,16,900,5,CRITICAL
75,5,4,340,1,MODERATE
190,18,14,820,4,HIGH
45,2,1,170,0,LOW
280,26,21,1250,8,CRITICAL
105,9,7,480,2,MODERATE
155,13,11,680,3,HIGH
230,21,17,1020,6,CRITICAL
90,7,5,400,1,MODERATE
65,3,2,260,0,LOW
"""


# ─── Data → ML Cross-Engine Bridge Tests ─────────────────────────────────────

class TestDataToMLBridge:
    """
    Tests that data profiled via DataEngine can be seamlessly fed into MLEngine.
    Validates: cleaned_csv output from DataService can be parsed by ML pipeline.
    """

    def setup_method(self):
        self.data_service = DataService()
        self.ml_service = MLService()

    def test_cleaned_csv_parseable_by_ml_pipeline(self):
        """DataService.clean_and_transform → MLService.train_and_compare pipeline."""
        clean_result = self.data_service.clean_and_transform(
            SHARED_METRICS_CSV, impute_strategy="mean", handle_outliers=True
        )
        cleaned_csv = clean_result["cleaned_csv"]
        assert cleaned_csv, "cleaned_csv must not be empty"

        # Verify ML can consume the cleaned output
        ml_result = self.ml_service.train_and_compare(
            csv_text=cleaned_csv,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        assert "evaluation" in ml_result
        assert ml_result["evaluation"]["accuracy"] >= 0.0

    def test_data_profile_features_match_ml_features(self):
        """Features from Data profile must be a superset of ML model training features."""
        profile_result = self.data_service.process_dataset(SHARED_METRICS_CSV, "csv", "Test")
        profile_columns = [c["column_name"] for c in profile_result["profile"]["column_profiles"]]

        ml_result = self.ml_service.train_and_compare(
            csv_text=SHARED_METRICS_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        ml_features = ml_result["features"]

        for f in ml_features:
            assert f in profile_columns, f"ML feature '{f}' not found in Data profile columns"

    def test_schema_guard_catches_column_mismatch_post_profiling(self):
        """
        Scenario: Train model on full dataset. Try to predict on Data profile summary
        (which does not have the original rows). Feature compatibility guard must fire.
        """
        ml_result = self.ml_service.train_and_compare(
            csv_text=SHARED_METRICS_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        # Attempt prediction with only 2 of the required features
        pred = self.ml_service.predict_instance(
            trained_model_payload=ml_result,
            instance_dict={"loc": 200}   # grossly incomplete instance
        )
        assert pred["prediction_available"] is False
        assert "missing_features" in pred
        # All other features must be listed as missing
        assert len(pred["missing_features"]) >= 3


# ─── ArtifactStore Cross-Engine Contract Tests ───────────────────────────────

class TestArtifactStoreCrossEngine:
    """Tests that artifact schema integrity is maintained across all engine types."""

    def setup_method(self):
        self.store = ArtifactStore()

    def _create_test_artifact(self, artifact_type: str, payload: dict):
        return self.store.create_artifact(
            artifact_type=artifact_type,
            payload=payload,
            title=f"Test {artifact_type}",
            engine=artifact_type.split("_")[0],
            source_name="test_source.csv",
            summary=f"Test artifact of type {artifact_type}"
        )

    def test_compiler_artifact_schema_fields(self):
        artifact = self._create_test_artifact(
            "compiler_analysis",
            {"source_code": "int x = 1;", "metrics": {"cyclomatic_complexity": 1}, "tokens": []}
        )
        assert "artifact_id" in artifact
        assert "artifact_type" in artifact
        assert artifact["artifact_type"] == "compiler_analysis"
        assert "created_at" in artifact
        assert "schema" in artifact
        assert "producer" in artifact
        assert artifact["producer"]["engine"] == "compiler"

    def test_data_profile_artifact_schema_fields(self):
        artifact = self._create_test_artifact(
            "data_profile",
            {"summary": {"rows": 10, "columns": 5}, "profile": {"column_profiles": []}}
        )
        assert artifact["artifact_type"] == "data_profile"
        assert "payload" in artifact

    def test_ml_model_artifact_schema_fields(self):
        artifact = self._create_test_artifact(
            "ml_model_result",
            {"model_name": "random_forest", "evaluation": {"accuracy": 0.92}, "feature_importances": []}
        )
        assert artifact["artifact_type"] == "ml_model_result"
        assert artifact["producer"]["engine"] == "ml"

    def test_artifact_retrieval_by_id(self):
        artifact = self._create_test_artifact("data_profile", {"test": True})
        artifact_id = artifact["artifact_id"]
        retrieved = self.store.get_artifact(artifact_id)
        assert retrieved is not None
        assert retrieved["artifact_id"] == artifact_id

    def test_list_artifacts_by_type(self):
        # Create one of each type
        self._create_test_artifact("compiler_analysis", {"tokens": []})
        self._create_test_artifact("data_profile", {"summary": {}})
        all_artifacts = self.store.list_artifacts()
        assert len(all_artifacts) >= 2

    def test_compiler_to_ml_conversion_output(self):
        """Tests the convert_compiler_to_ml_dataset function produces a parseable CSV."""
        compiler_artifact = self._create_test_artifact(
            "compiler_analysis",
            {
                "file_name": "Test.java",
                "metrics": {
                    "cyclomatic_complexity": 10,
                    "total_loc": 150,
                    "tokens_count": 500,
                    "risk_level": "HIGH",
                    "maintainability_index": "C"
                },
                "diagnostics": [],
                "symbol_table": []
            }
        )
        csv_output = self.store.convert_compiler_to_ml_dataset(compiler_artifact)
        assert csv_output, "CSV output must not be empty"
        # Must be parseable as a DataFrame
        df = pd.read_csv(io.StringIO(csv_output))
        assert len(df) >= 1


# ─── Full End-to-End Pipeline Test ───────────────────────────────────────────

class TestEndToEndPipeline:
    """
    Simulates the complete user workflow:
    1. Profile dataset (DataEngine)
    2. Clean dataset (DataEngine)
    3. Train ML model on cleaned data (MLEngine)
    4. Validate feature schema guard fires correctly on incomplete input
    5. Export ML results as zip
    """

    def test_full_pipeline(self):
        data_service = DataService()
        ml_service = MLService()

        # Step 1: Profile
        profile_result = data_service.process_dataset(SHARED_METRICS_CSV, "csv", "MetricsDataset")
        assert "profile" in profile_result

        # Step 2: Clean
        clean_result = data_service.clean_and_transform(SHARED_METRICS_CSV, impute_strategy="mean")
        cleaned_csv = clean_result["cleaned_csv"]
        assert cleaned_csv

        # Step 3: Train
        ml_result = ml_service.train_and_compare(
            csv_text=cleaned_csv,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        assert ml_result["evaluation"]["accuracy"] >= 0.0

        # Step 4: Schema Guard
        bad_pred = ml_service.predict_instance(ml_result, {"loc": 100})
        assert bad_pred["prediction_available"] is False

        # Step 5: Export
        export = ml_service.export_ml_bundle(ml_result)
        assert export["content_type"] == "application/zip"
        assert len(export["bytes"]) > 50
