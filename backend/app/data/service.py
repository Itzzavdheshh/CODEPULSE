import pandas as pd
import io
from typing import Dict, Any, List, Optional
from .profiler import DataProfiler
from .cleaner import DataCleaner

class DataService:
    """
    Data Intelligence Engine Orchestrator.
    Handles CSV/JSON ingestion, statistical profiling, cleaning, and export payload creation.
    """
    def __init__(self):
        self.profiler = DataProfiler()
        self.cleaner = DataCleaner()

    def process_csv_content(self, csv_text: str, dataset_name: str = "Uploaded Dataset") -> Dict[str, Any]:
        try:
            df = pd.read_csv(io.StringIO(csv_text))
        except Exception as e:
            return {
                "error": f"Failed to parse CSV file: {str(e)}",
                "dataset_name": dataset_name
            }

        profile = self.profiler.profile_dataframe(df, dataset_name)
        return {
            "dataset_name": dataset_name,
            "profile": profile,
            "raw_records": df.head(100).replace({pd.NA: None}).to_dict(orient="records")
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

        return {
            "summary": cleaning_summary,
            "cleaned_profile": cleaned_profile,
            "csv_export": cleaned_df.to_csv(index=False),
            "preview": cleaned_df.head(50).replace({pd.NA: None}).to_dict(orient="records")
        }
