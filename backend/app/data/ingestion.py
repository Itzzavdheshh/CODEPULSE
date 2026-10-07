import pandas as pd
import numpy as np
import io
import json
from typing import Dict, Any, Tuple, Optional

class DataIngestionEngine:
    """
    Multi-format Dataset Ingestion Engine supporting CSV, JSON, Excel/XLSX,
    Compiler Artifacts, and ML Prediction datasets.
    """
    def ingest(self, content: str, file_type: str = "csv", name: str = "Dataset") -> Tuple[pd.DataFrame, Dict[str, Any]]:
        file_type = file_type.lower()

        if file_type == "json":
            try:
                data = json.loads(content)
                if isinstance(data, list):
                    df = pd.DataFrame(data)
                elif isinstance(data, dict):
                    # Handle compiler analysis artifact payload ingestion
                    if "tokens" in data:
                        df = pd.DataFrame(data["tokens"])
                    elif "symbol_table" in data:
                        df = pd.DataFrame(data["symbol_table"])
                    elif "metrics" in data:
                        df = pd.DataFrame([data["metrics"]])
                    else:
                        df = pd.DataFrame([data])
                else:
                    raise ValueError("Unsupported JSON structure")
            except Exception as e:
                raise ValueError(f"Failed to parse JSON dataset: {str(e)}")

        elif file_type in ("excel", "xlsx"):
            try:
                df = pd.read_excel(io.BytesIO(content.encode('utf-8') if isinstance(content, str) else content))
            except Exception as e:
                raise ValueError(f"Failed to parse Excel file: {str(e)}")
        else: # Default CSV
            try:
                df = pd.read_csv(io.StringIO(content))
            except Exception as e:
                raise ValueError(f"Failed to parse CSV dataset: {str(e)}")

        if df.empty:
            raise ValueError("Ingested dataset contains zero rows.")

        num_rows, num_cols = df.shape
        num_numeric = sum(1 for c in df.columns if pd.api.types.is_numeric_dtype(df[c]))
        num_categorical = sum(1 for c in df.columns if not pd.api.types.is_numeric_dtype(df[c]))
        
        # Check datetime columns
        num_datetime = 0
        for col in df.columns:
            if not pd.api.types.is_numeric_dtype(df[col]):
                try:
                    pd.to_datetime(df[col], errors='raise')
                    num_datetime += 1
                except Exception:
                    pass

        duplicate_rows = int(df.duplicated().sum())
        total_cells = max(1, num_rows * num_cols)
        missing_cells = int(df.isnull().sum().sum())
        completeness_pct = round(((total_cells - missing_cells) / total_cells) * 100.0, 2)
        memory_usage_kb = round(df.memory_usage(deep=True).sum() / 1024.0, 2)

        summary = {
            "dataset_name": name,
            "format": file_type.upper(),
            "rows": num_rows,
            "columns": num_cols,
            "numeric_columns": num_numeric,
            "categorical_columns": num_categorical,
            "datetime_columns": num_datetime,
            "duplicate_rows": duplicate_rows,
            "total_missing_cells": missing_cells,
            "completeness_percentage": completeness_pct,
            "memory_usage_kb": memory_usage_kb
        }

        return df, summary
