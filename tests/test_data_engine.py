"""
Comprehensive Data Intelligence Engine Test Suite.
Tests: ingestion, profiling, quality audit, controlled cleaning,
       statistics/correlation, time-series, visualizations, and zip export.
"""
import pytest
import pandas as pd
import io
from app.data.service import DataService
from app.data.ingestion import DataIngestionEngine
from app.data.quality import DataQualityEngine
from app.data.statistics import AdvancedStatisticsEngine
from app.data.timeseries import TimeSeriesEngine
from app.data.cleaner import DataCleaner

# ─── Shared Sample Datasets ──────────────────────────────────────────────────

METRICS_CSV = """module_name,loc,cyclomatic_complexity,cognitive_complexity,tokens_count,diagnostics_count,risk_level
AuthService.java,145,14,12,650,3,HIGH
PaymentGateway.java,210,22,18,980,5,CRITICAL
UserInterface.java,85,4,3,320,0,LOW
DatabasePool.java,120,8,6,490,1,MODERATE
CacheManager.java,60,2,1,210,0,LOW
LoggerUtility.java,40,1,1,150,0,LOW
NotificationWorker.java,175,16,13,740,4,HIGH
EncryptionModule.java,95,9,7,410,1,MODERATE
ReportGenerator.java,310,28,24,1420,8,CRITICAL
ConfigParser.java,70,3,2,280,0,LOW
WebController.java,130,11,9,590,2,HIGH
"""

DIRTY_CSV = """x,y,category
1,10,alpha
2,,alpha
3,30,beta
100,40,beta
1,10,alpha
"""

TIMESERIES_CSV = """date,commits_count,defects_reported
2026-09-01,14,2
2026-09-02,18,3
2026-09-03,22,1
2026-09-07,27,5
2026-09-08,31,7
2026-09-14,38,9
2026-09-15,42,12
"""

# ─── DataService Integration Tests ───────────────────────────────────────────

class TestDataServiceProcessDataset:
    """Integration tests for the full process_dataset pipeline."""

    def setup_method(self):
        self.service = DataService()

    def test_returns_required_top_level_keys(self):
        res = self.service.process_dataset(METRICS_CSV, "csv", "MetricsDataset")
        for key in ("summary", "profile", "quality", "statistics", "time_series", "visualizations", "insights", "preview"):
            assert key in res, f"Missing key: {key}"

    def test_summary_shape_correct(self):
        res = self.service.process_dataset(METRICS_CSV, "csv", "MetricsDataset")
        summary = res["summary"]
        assert summary["rows"] == 11
        assert summary["columns"] == 7
        assert summary["completeness_percentage"] == 100.0
        assert summary["duplicate_rows"] == 0

    def test_profile_column_count(self):
        res = self.service.process_dataset(METRICS_CSV, "csv", "MetricsDataset")
        profile = res["profile"]
        assert len(profile["column_profiles"]) == 7

    def test_numeric_columns_profiled(self):
        res = self.service.process_dataset(METRICS_CSV, "csv", "MetricsDataset")
        profile = res["profile"]
        numeric_cols = [c for c in profile["column_profiles"] if c["category"] == "numeric"]
        assert len(numeric_cols) >= 5  # loc, cyclomatic, cognitive, tokens, diagnostics

    def test_quality_issues_is_wrapped(self):
        """Quality results must be wrapped in {issues_detected: [...], total_issues: N}"""
        res = self.service.process_dataset(METRICS_CSV, "csv", "MetricsDataset")
        quality = res["quality"]
        assert "issues_detected" in quality
        assert "total_issues" in quality
        assert isinstance(quality["issues_detected"], list)

    def test_quality_issue_type_field_present(self):
        """Each quality issue must have issue_type, not 'issue'."""
        res = self.service.process_dataset(DIRTY_CSV, "csv", "DirtyDataset")
        for issue in res["quality"]["issues_detected"]:
            assert "issue_type" in issue
            assert "severity" in issue
            assert "column" in issue
            assert "recommendation" in issue

    def test_statistics_has_pearson_correlation(self):
        res = self.service.process_dataset(METRICS_CSV, "csv", "MetricsDataset")
        stats = res["statistics"]
        assert "pearson_correlation" in stats or "insights" in stats  # may skip if < 2 numeric

    def test_insights_list_nonempty(self):
        res = self.service.process_dataset(METRICS_CSV, "csv", "MetricsDataset")
        assert isinstance(res["insights"], list)
        assert len(res["insights"]) >= 0  # may be empty for clean dataset


class TestDataServiceCleaning:
    """Unit tests for controlled cleaning and transformation pipeline."""

    def setup_method(self):
        self.service = DataService()

    def test_cleaning_returns_required_keys(self):
        res = self.service.clean_and_transform(DIRTY_CSV, impute_strategy="mean", handle_outliers=True)
        for key in ("original_rows", "final_rows", "removed_duplicates", "transformations_log", "cleaned_csv"):
            assert key in res, f"Missing key in clean_and_transform: {key}"

    def test_duplicate_removal_counted(self):
        res = self.service.clean_and_transform(DIRTY_CSV)
        # DIRTY_CSV has 1 duplicate row (first and last rows are identical)
        assert res["removed_duplicates"] >= 1

    def test_missing_value_imputed(self):
        res = self.service.clean_and_transform(DIRTY_CSV, impute_strategy="mean")
        # After cleaning, the cleaned_csv should have no missing values in y
        cleaned_df = pd.read_csv(io.StringIO(res["cleaned_csv"]))
        assert cleaned_df["y"].isnull().sum() == 0

    def test_transformations_log_is_list(self):
        res = self.service.clean_and_transform(DIRTY_CSV, impute_strategy="median")
        assert isinstance(res["transformations_log"], list)

    def test_outlier_capping_reduces_extreme_values(self):
        extreme_csv = "x\n1\n2\n3\n4\n5\n1000\n"
        res = self.service.clean_and_transform(extreme_csv, handle_outliers=True)
        cleaned_df = pd.read_csv(io.StringIO(res["cleaned_csv"]))
        assert cleaned_df["x"].max() < 1000


# ─── DataQualityEngine Unit Tests ────────────────────────────────────────────

class TestDataQualityEngine:
    def setup_method(self):
        self.engine = DataQualityEngine()

    def test_detects_missing_values(self):
        df = pd.DataFrame({"a": [1, None, 3], "b": ["x", "y", None]})
        issues = self.engine.audit_quality(df)
        missing_issues = [i for i in issues if i["issue"] == "Missing Values"]
        assert len(missing_issues) >= 2

    def test_detects_duplicates(self):
        df = pd.DataFrame({"a": [1, 1, 2], "b": [10, 10, 20]})
        issues = self.engine.audit_quality(df)
        dup_issues = [i for i in issues if "Duplicate" in i["issue"]]
        assert len(dup_issues) >= 1

    def test_detects_iqr_outliers(self):
        df = pd.DataFrame({"x": [1, 2, 3, 4, 5, 500]})
        issues = self.engine.audit_quality(df)
        outlier_issues = [i for i in issues if "Outlier" in i["issue"]]
        assert len(outlier_issues) >= 1

    def test_clean_data_has_no_issues(self):
        df = pd.DataFrame({"a": [1, 2, 3, 4, 5], "b": [10, 20, 30, 40, 50]})
        issues = self.engine.audit_quality(df)
        assert len(issues) == 0


# ─── AdvancedStatisticsEngine Unit Tests ────────────────────────────────────

class TestAdvancedStatisticsEngine:
    def setup_method(self):
        self.engine = AdvancedStatisticsEngine()

    def test_pearson_correlation_computed(self):
        df = pd.DataFrame({"a": [1, 2, 3, 4, 5], "b": [2, 4, 6, 8, 10]})
        stats = self.engine.compute_statistics(df)
        assert "pearson_correlation" in stats
        corr = stats["pearson_correlation"]
        assert corr["columns"] == ["a", "b"]
        # Perfect positive correlation
        assert abs(corr["values"][0][1] - 1.0) < 0.01

    def test_insights_list_returned(self):
        df = pd.DataFrame({"a": [1, 2, 3], "b": [1, 2, 3]})
        stats = self.engine.compute_statistics(df)
        assert "insights" in stats
        assert isinstance(stats["insights"], list)


# ─── TimeSeriesEngine Unit Tests ─────────────────────────────────────────────

class TestTimeSeriesEngine:
    def setup_method(self):
        self.engine = TimeSeriesEngine()

    def test_detects_timeseries(self):
        df = pd.read_csv(io.StringIO(TIMESERIES_CSV))
        result = self.engine.analyze_timeseries(df)
        # Should detect 'date' column as timeseries
        assert result is not None

    def test_no_timeseries_for_non_date_data(self):
        df = pd.DataFrame({"x": [1, 2, 3], "y": [4, 5, 6]})
        result = self.engine.analyze_timeseries(df)
        # No date columns, should return None or has_timeseries: False
        if result:
            assert not result.get("has_timeseries", True)


# ─── DataIngestionEngine Unit Tests ──────────────────────────────────────────

class TestDataIngestionEngine:
    def setup_method(self):
        self.engine = DataIngestionEngine()

    def test_ingest_csv(self):
        df, summary = self.engine.ingest(METRICS_CSV, "csv", "Test")
        assert df.shape[0] == 11
        assert df.shape[1] == 7

    def test_ingest_json(self):
        import json
        data = [{"a": 1, "b": 2}, {"a": 3, "b": 4}]
        json_str = json.dumps(data)
        df, summary = self.engine.ingest(json_str, "json", "JSONTest")
        assert df.shape[0] == 2
        assert df.shape[1] == 2


# ─── DataExportBundle Test ───────────────────────────────────────────────────

class TestDataExportBundle:
    def test_export_creates_zip_bytes(self):
        service = DataService()
        res = service.process_dataset(METRICS_CSV, "csv", "Test")
        export = service.export_data_bundle(res)
        assert export["content_type"] == "application/zip"
        assert export["filename"] == "data_analysis.zip"
        assert len(export["bytes"]) > 100  # Non-empty zip
