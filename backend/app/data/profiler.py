import numpy as np
import pandas as pd
from typing import Dict, Any, List

class DataProfiler:
    """
    Computes statistical profiles, data distributions, correlation matrices, and quality audits.
    """
    def profile_dataframe(self, df: pd.DataFrame, dataset_name: str = "Dataset") -> Dict[str, Any]:
        num_rows, num_cols = df.shape
        
        column_profiles = []
        numeric_cols = []
        categorical_cols = []

        for col in df.columns:
            series = df[col]
            dtype_str = str(series.dtype)
            missing_count = int(series.isnull().sum())
            missing_pct = round((missing_count / max(1, num_rows)) * 100.0, 2)
            unique_count = int(series.nunique())

            col_info = {
                "column_name": str(col),
                "data_type": dtype_str,
                "missing_count": missing_count,
                "missing_percentage": missing_pct,
                "unique_count": unique_count,
            }

            if pd.api.types.is_numeric_dtype(series):
                numeric_cols.append(str(col))
                clean_s = series.dropna()
                if len(clean_s) > 0:
                    mean_val = float(clean_s.mean())
                    std_val = float(clean_s.std()) if len(clean_s) > 1 else 0.0
                    min_val = float(clean_s.min())
                    p25_val = float(clean_s.quantile(0.25))
                    p50_val = float(clean_s.median())
                    p75_val = float(clean_s.quantile(0.75))
                    max_val = float(clean_s.max())
                    skew_val = float(clean_s.skew()) if len(clean_s) > 2 else 0.0

                    # Detect outliers via IQR
                    iqr = p75_val - p25_val
                    lower_bound = p25_val - 1.5 * iqr
                    upper_bound = p75_val + 1.5 * iqr
                    outliers_count = int(((clean_s < lower_bound) | (clean_s > upper_bound)).sum())

                    col_info.update({
                        "category": "numeric",
                        "mean": round(mean_val, 4),
                        "std": round(std_val, 4),
                        "min": round(min_val, 4),
                        "p25": round(p25_val, 4),
                        "p50": round(p50_val, 4),
                        "p75": round(p75_val, 4),
                        "max": round(max_val, 4),
                        "skewness": round(skew_val, 4),
                        "outliers_count": outliers_count
                    })
                else:
                    col_info.update({"category": "numeric", "mean": 0, "std": 0, "min": 0, "p25": 0, "p50": 0, "p75": 0, "max": 0, "skewness": 0, "outliers_count": 0})
            else:
                categorical_cols.append(str(col))
                top_values = series.value_counts().head(5).to_dict()
                col_info.update({
                    "category": "categorical",
                    "top_frequencies": {str(k): int(v) for k, v in top_values.items()}
                })

            column_profiles.append(col_info)

        # Correlation Matrix for Numeric Columns
        correlation_matrix = {}
        if len(numeric_cols) > 1:
            num_df = df[numeric_cols].dropna()
            if len(num_df) > 1:
                corr_df = num_df.corr().fillna(0)
                correlation_matrix = {
                    "columns": numeric_cols,
                    "values": [[round(float(corr_df.iloc[i, j]), 4) for j in range(len(numeric_cols))] for i in range(len(numeric_cols))]
                }

        # Data Quality Score
        total_cells = max(1, num_rows * num_cols)
        total_missing = int(df.isnull().sum().sum())
        completeness_pct = round(((total_cells - total_missing) / total_cells) * 100.0, 2)

        return {
            "dataset_name": dataset_name,
            "shape": {"rows": num_rows, "columns": num_cols},
            "completeness_percentage": completeness_pct,
            "total_missing_cells": total_missing,
            "numeric_columns_count": len(numeric_cols),
            "categorical_columns_count": len(categorical_cols),
            "column_profiles": column_profiles,
            "correlation_matrix": correlation_matrix,
            "preview": df.head(10).replace({np.nan: None}).to_dict(orient="records")
        }
