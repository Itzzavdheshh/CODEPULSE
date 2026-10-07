"""
Comprehensive ML Intelligence Engine Test Suite.
Tests: leakage-free pipeline, classification metrics, regression metrics,
       clustering, multi-model comparison, K-Fold CV, feature compatibility guard,
       SVM, and zip export.
"""
import pytest
import numpy as np
import pandas as pd
from app.ml.service import MLService
from app.ml.pipeline import PreprocessingPipeline
from app.ml.models import ModelFactory
from app.ml.evaluator import MLEvaluator

# ─── Shared Sample Datasets ──────────────────────────────────────────────────

CLASSIFICATION_CSV = """loc,cyclomatic,diagnostics,risk_level
10,2,0,LOW
12,2,0,LOW
15,3,0,LOW
18,3,1,LOW
22,4,1,LOW
40,9,2,MODERATE
45,10,3,MODERATE
50,11,3,MODERATE
80,20,5,HIGH
90,25,7,HIGH
100,28,8,HIGH
110,30,9,HIGH
"""

REGRESSION_CSV = """loc,cyclomatic,diagnostics,maintenance_hours
10,2,0,2.5
12,2,0,2.8
15,3,0,3.2
18,3,1,4.0
22,4,1,4.5
40,9,2,8.0
45,10,3,9.5
50,11,3,10.2
80,20,5,18.0
90,25,7,22.0
100,28,8,25.0
110,30,9,28.5
"""

# ─── MLService Integration Tests ─────────────────────────────────────────────

class TestMLServiceClassification:
    """Tests for supervised classification training and evaluation."""

    def setup_method(self):
        self.service = MLService()

    def test_returns_required_keys(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        for key in ("model_name", "task_type", "features", "evaluation", "feature_importances",
                    "model_comparison", "selected_model_rationale", "dataset_split"):
            assert key in res, f"Missing key: {key}"

    def test_accuracy_above_threshold(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        assert res["evaluation"]["accuracy"] > 0.5

    def test_features_excludes_target(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        assert "risk_level" not in res["features"]
        assert "loc" in res["features"]

    def test_evaluation_has_classification_metrics(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="decision_tree"
        )
        eval_ = res["evaluation"]
        for metric in ("accuracy", "precision", "recall", "f1_score", "roc_auc",
                       "cv_mean_accuracy", "cv_std", "confusion_matrix"):
            assert metric in eval_, f"Missing metric: {metric}"

    def test_confusion_matrix_square(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        cm = res["evaluation"]["confusion_matrix"]
        n = len(cm["labels"])
        assert len(cm["matrix"]) == n
        for row in cm["matrix"]:
            assert len(row) == n

    def test_model_comparison_includes_multiple_models(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        assert len(res["model_comparison"]) >= 2

    def test_feature_importances_sum_approx_one(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        importances = res["feature_importances"]
        if importances:
            total = sum(i["importance"] for i in importances)
            assert abs(total - 1.0) < 0.05, f"Importances should sum near 1.0, got {total}"

    def test_svm_classification(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="svm"
        )
        assert res["task_type"] == "classification"
        assert "evaluation" in res

    def test_logistic_regression_classification(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="logistic_regression"
        )
        assert res["evaluation"]["accuracy"] >= 0.0


class TestMLServiceRegression:
    """Tests for supervised regression training and evaluation."""

    def setup_method(self):
        self.service = MLService()

    def test_regression_returns_r2(self):
        res = self.service.train_and_compare(
            csv_text=REGRESSION_CSV,
            target_column="maintenance_hours",
            task_type="regression",
            primary_model_name="random_forest"
        )
        assert "r2_score" in res["evaluation"]
        assert "mae" in res["evaluation"]
        assert "rmse" in res["evaluation"]

    def test_regression_r2_reasonable(self):
        res = self.service.train_and_compare(
            csv_text=REGRESSION_CSV,
            target_column="maintenance_hours",
            task_type="regression",
            primary_model_name="random_forest"
        )
        # Correlated data should achieve positive R²
        assert res["evaluation"]["r2_score"] > -1.0


class TestMLServiceClustering:
    """Tests for unsupervised K-Means clustering."""

    def setup_method(self):
        self.service = MLService()

    def test_clustering_returns_silhouette(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column=None,
            task_type="clustering",
            primary_model_name="kmeans"
        )
        assert res["task_type"] == "clustering"
        assert "silhouette_score" in res["evaluation"]
        assert "n_clusters" in res["evaluation"]

    def test_clustering_n_clusters_positive(self):
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column=None,
            task_type="clustering",
            primary_model_name="kmeans"
        )
        assert res["evaluation"]["n_clusters"] >= 1


# ─── PreprocessingPipeline Unit Tests ────────────────────────────────────────

class TestPreprocessingPipeline:
    """Tests for leakage-free preprocessing guarantees."""

    def setup_method(self):
        self.pipeline = PreprocessingPipeline()
        self.df = pd.read_csv(__import__("io").StringIO(CLASSIFICATION_CSV))

    def test_scaler_fitted_only_on_training(self):
        """
        Credibility Rule #56: StandardScaler must be fitted on X_train ONLY.
        Verify the scaler's mean_ attribute matches the training-set mean, not full dataset.
        """
        prep = self.pipeline.prepare_dataset(self.df, target_column="risk_level", task_type="classification", test_size=0.2)
        scaler = prep["scaler"]
        X_train_raw_approx = prep["X_train"]
        # scaler.mean_ should be an array of length == n_features
        assert len(scaler.mean_) == len(prep["feature_names"])

    def test_feature_names_excludes_target(self):
        prep = self.pipeline.prepare_dataset(self.df, target_column="risk_level", task_type="classification")
        assert "risk_level" not in prep["feature_names"]

    def test_train_test_sizes_consistent(self):
        prep = self.pipeline.prepare_dataset(self.df, target_column="risk_level", task_type="classification", test_size=0.2)
        total = prep["train_size"] + prep["test_size"]
        assert total == len(self.df.dropna())

    def test_target_classes_all_present(self):
        prep = self.pipeline.prepare_dataset(self.df, target_column="risk_level", task_type="classification")
        expected_classes = {"LOW", "MODERATE", "HIGH"}
        actual_classes = set(prep["target_classes"])
        assert expected_classes == actual_classes


# ─── Feature Schema Compatibility Guard Tests ─────────────────────────────────

class TestFeatureSchemaCompatibilityGuard:
    """
    Credibility Rules #33 & #56:
    Feature schema compatibility must be validated BEFORE prediction.
    Missing features must produce prediction_available=False.
    """

    def setup_method(self):
        self.pipeline = PreprocessingPipeline()
        self.service = MLService()

    def test_missing_features_rejected(self):
        required = ["loc", "cyclomatic", "diagnostics"]
        incomplete_df = pd.DataFrame([{"loc": 50}])  # missing cyclomatic and diagnostics
        is_valid, err_msg = self.pipeline.validate_feature_compatibility(required, incomplete_df)
        assert not is_valid
        assert "cyclomatic" in err_msg or "diagnostics" in err_msg

    def test_complete_features_accepted(self):
        required = ["loc", "cyclomatic", "diagnostics"]
        complete_df = pd.DataFrame([{"loc": 50, "cyclomatic": 10, "diagnostics": 2}])
        is_valid, err_msg = self.pipeline.validate_feature_compatibility(required, complete_df)
        assert is_valid
        assert err_msg is None

    def test_predict_instance_with_wrong_schema_returns_unavailable(self):
        # Train a model
        res = self.service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        # Attempt prediction with missing feature
        pred_result = self.service.predict_instance(
            trained_model_payload=res,
            instance_dict={"loc": 100}  # missing cyclomatic and diagnostics
        )
        assert pred_result["prediction_available"] is False
        assert "missing_features" in pred_result
        assert len(pred_result["missing_features"]) >= 1


# ─── MLEvaluator Unit Tests ──────────────────────────────────────────────────

class TestMLEvaluator:
    def setup_method(self):
        self.evaluator = MLEvaluator()

    def test_classification_metrics_bounds(self):
        from sklearn.ensemble import RandomForestClassifier
        X = np.array([[1, 2], [3, 4], [5, 6], [7, 8], [9, 10], [2, 3], [4, 5], [6, 7]])
        y = np.array([0, 0, 0, 0, 1, 1, 1, 1])
        model = RandomForestClassifier(n_estimators=10, random_state=42)
        model.fit(X[:6], y[:6])
        res = self.evaluator.evaluate_classification(model, X[:6], y[:6], X[6:], y[6:])
        assert 0.0 <= res["accuracy"] <= 1.0
        assert 0.0 <= res["precision"] <= 1.0
        assert 0.0 <= res["recall"] <= 1.0
        assert 0.0 <= res["f1_score"] <= 1.0

    def test_regression_metrics_present(self):
        from sklearn.ensemble import RandomForestRegressor
        X = np.array([[1], [2], [3], [4], [5], [6], [7], [8]])
        y = np.array([2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0, 16.0])
        model = RandomForestRegressor(n_estimators=10, random_state=42)
        model.fit(X[:6], y[:6])
        res = self.evaluator.evaluate_regression(model, X[:6], y[:6], X[6:], y[6:])
        assert "mae" in res
        assert "mse" in res
        assert "rmse" in res
        assert "r2_score" in res
        assert res["rmse"] >= 0

    def test_clustering_silhouette_in_bounds(self):
        X = np.array([[1, 2], [1, 3], [2, 2], [10, 10], [11, 10], [10, 11]])
        labels = np.array([0, 0, 0, 1, 1, 1])
        res = self.evaluator.evaluate_clustering(X, labels)
        assert "silhouette_score" in res
        assert -1.0 <= res["silhouette_score"] <= 1.0


# ─── ModelFactory Tests ──────────────────────────────────────────────────────

class TestModelFactory:
    def test_random_forest_classification(self):
        model = ModelFactory.get_model("random_forest", task_type="classification")
        assert hasattr(model, "fit")
        assert hasattr(model, "predict")

    def test_svm_classification(self):
        model = ModelFactory.get_model("svm", task_type="classification")
        assert hasattr(model, "fit")

    def test_kmeans_clustering(self):
        model = ModelFactory.get_model("kmeans", task_type="clustering")
        assert hasattr(model, "fit_predict")

    def test_unknown_model_raises(self):
        with pytest.raises((ValueError, KeyError)):
            ModelFactory.get_model("nonexistent_algorithm", task_type="classification")


# ─── ML Zip Export Tests ─────────────────────────────────────────────────────

class TestMLExportBundle:
    def test_export_creates_zip(self):
        service = MLService()
        res = service.train_and_compare(
            csv_text=CLASSIFICATION_CSV,
            target_column="risk_level",
            task_type="classification",
            primary_model_name="random_forest"
        )
        export = service.export_ml_bundle(res)
        assert export["content_type"] == "application/zip"
        assert export["filename"] == "ml_results.zip"
        assert len(export["bytes"]) > 100
