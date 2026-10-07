import pandas as pd
import numpy as np
import io
import json
import zipfile
from typing import Dict, Any, List, Optional
from .ingestion import DataIngestionEngine
from .profiler import DataProfiler
from .quality import DataQualityEngine
from .cleaner import DataCleaner
from .statistics import AdvancedStatisticsEngine
from .timeseries import TimeSeriesEngine
from .visualizer import VisualizationRecommendationEngine

class DataService:
    """
    Data Intelligence Engine Orchestrator.
    Manages multi-format dataset ingestion, statistical profiling, quality auditing,
    controlled cleaning/transformations, relationship analysis, time-series & calendar heatmaps,
    visualization recommendations, and downloadable dataset exports.
    """
    def __init__(self):
        self.ingestion = DataIngestionEngine()
        self.profiler = DataProfiler()
        self.quality = DataQualityEngine()
        self.cleaner = DataCleaner()
        self.statistics = AdvancedStatisticsEngine()
        self.timeseries = TimeSeriesEngine()
        self.visualizer = VisualizationRecommendationEngine()

    def process_dataset(self, content: str, file_type: str = "csv", dataset_name: str = "Dataset") -> Dict[str, Any]:
        df, summary = self.ingestion.ingest(content, file_type, dataset_name)

        # 1. Profile
        profile = self.profiler.profile_dataframe(df, dataset_name)

        # 2. Quality Audit
        quality_issues = self.quality.audit_quality(df)

        # 3. Advanced Statistics & Relationships
        stats_results = self.statistics.compute_statistics(df)

        # 4. Time-Series & Calendar Analysis
        ts_results = self.timeseries.analyze_timeseries(df)

        # 5. Visualization Recommendations
        visual_recs = self.visualizer.recommend_visualizations(df)

        # Combine Human Insights
        insights = list(stats_results.get("insights", []))
        if quality_issues:
            insights.append(f"Audit detected {len(quality_issues)} quality issues (missing values, duplicates, or outliers).")
        if ts_results.get("has_timeseries"):
            insights.append(f"Time-series trend: {ts_results['trend']} ({ts_results['overall_growth_percentage']:+.1f}% growth over {ts_results['total_days']} days).")

        return {
            "dataset_name": dataset_name,
            "summary": summary,
            "profile": profile,
            "quality_issues": quality_issues,
            "statistics": stats_results,
            "timeseries": ts_results,
            "recommendations": visual_recs,
            "insights": insights,
            "preview": df.head(100).replace({np.nan: None}).to_dict(orient="records"),
            "raw_csv": df.to_csv(index=False)
        }

    def clean_and_transform(
        self,
        csv_text: str,
        impute_strategy: str = "mean",
        handle_outliers: bool = True,
        normalize: bool = False
    ) -> Dict[str, Any]:
        df = pd.read_csv(io.StringIO(csv_text))
        cleaned_df, cleaning_summary = self.cleaner.clean_dataframe(
            df, impute_strategy=impute_strategy, handle_outliers=handle_outliers, normalize=normalize
        )
        cleaned_profile = self.profiler.profile_dataframe(cleaned_df, "Cleaned Dataset")
        quality_issues = self.quality.audit_quality(cleaned_df)

        return {
            "summary": cleaning_summary,
            "cleaned_profile": cleaned_profile,
            "remaining_quality_issues": quality_issues,
            "csv_export": cleaned_df.to_csv(index=False),
            "preview": cleaned_df.head(50).replace({np.nan: None}).to_dict(orient="records")
        }

    def export_data_bundle(self, data_artifact_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates downloadable zipped package data_analysis.zip containing:
        - raw_dataset.csv
        - data_profile.json
        - quality_audit.json
        - statistics_correlation.csv
        """
        zip_buffer = io.BytesIO()
        profile = data_artifact_payload.get("profile", {})
        raw_csv = data_artifact_payload.get("raw_csv", "")
        quality_issues = data_artifact_payload.get("quality_issues", [])

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            if raw_csv:
                zf.writestr("raw_dataset.csv", raw_csv)
            zf.writestr("data_profile.json", json.dumps(profile, indent=2))
            zf.writestr("quality_audit.json", json.dumps(quality_issues, indent=2))

        zip_buffer.seek(0)
        return {"content_type": "application/zip", "filename": "data_analysis.zip", "bytes": zip_buffer.getvalue()}
