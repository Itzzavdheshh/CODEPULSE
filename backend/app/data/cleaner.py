import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

class DataCleaner:
    """
    Data Cleaning & Transformation Engine.
    Imputes missing values, clips outliers, and normalizes numeric columns.
    """
    def clean_dataframe(
        self,
        df: pd.DataFrame,
        impute_strategy: str = "mean", # "mean", "median", "mode", "drop"
        handle_outliers: bool = True,
        normalize: bool = False
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        cleaned_df = df.copy()
        log_actions = []

        # 1. Missing values
        for col in cleaned_df.columns:
            null_count = cleaned_df[col].isnull().sum()
            if null_count > 0:
                if impute_strategy == "drop":
                    cleaned_df = cleaned_df.dropna(subset=[col])
                    log_actions.append(f"Dropped {null_count} rows with missing values in column '{col}'")
                elif pd.api.types.is_numeric_dtype(cleaned_df[col]):
                    fill_val = cleaned_df[col].mean() if impute_strategy == "mean" else cleaned_df[col].median()
                    cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                    log_actions.append(f"Imputed {null_count} missing values in '{col}' using {impute_strategy} ({round(fill_val, 4)})")
                else:
                    mode_val = cleaned_df[col].mode()[0] if not cleaned_df[col].mode().empty else "Unknown"
                    cleaned_df[col] = cleaned_df[col].fillna(mode_val)
                    log_actions.append(f"Imputed {null_count} missing values in '{col}' using mode ('{mode_val}')")

        # 2. Outliers (IQR clipping)
        if handle_outliers:
            for col in cleaned_df.columns:
                if pd.api.types.is_numeric_dtype(cleaned_df[col]):
                    p25 = cleaned_df[col].quantile(0.25)
                    p75 = cleaned_df[col].quantile(0.75)
                    iqr = p75 - p25
                    lower = p25 - 1.5 * iqr
                    upper = p75 + 1.5 * iqr
                    
                    clipped = np.clip(cleaned_df[col], lower, upper)
                    outliers = (cleaned_df[col] < lower) | (cleaned_df[col] > upper)
                    outlier_cnt = int(outliers.sum())
                    if outlier_cnt > 0:
                        cleaned_df[col] = clipped
                        log_actions.append(f"Clipped {outlier_cnt} IQR outliers in '{col}' to range [{round(lower, 4)}, {round(upper, 4)}]")

        # 3. Normalization (Min-Max Scaling)
        if normalize:
            for col in cleaned_df.columns:
                if pd.api.types.is_numeric_dtype(cleaned_df[col]):
                    min_val = cleaned_df[col].min()
                    max_val = cleaned_df[col].max()
                    if max_val > min_val:
                        cleaned_df[col] = (cleaned_df[col] - min_val) / (max_val - min_val)
                        log_actions.append(f"Min-Max scaled column '{col}' to range [0.0, 1.0]")

        summary = {
            "initial_shape": {"rows": len(df), "columns": len(df.columns)},
            "cleaned_shape": {"rows": len(cleaned_df), "columns": len(cleaned_df.columns)},
            "actions": log_actions
        }
        return cleaned_df, summary
