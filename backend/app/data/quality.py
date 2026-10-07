import pandas as pd
import numpy as np
from typing import Dict, Any, List

class DataQualityEngine:
    """
    Data Quality Audit Engine.
    Detects missing values, duplicate rows, constant/near-constant columns, outliers, and high-cardinality flags.
    Generates actionable issue list with Severity, Column, Count, and Recommendation.
    """
    def audit_quality(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        issues = []
        num_rows = len(df)

        # 1. Duplicate Rows Check
        dupes = int(df.duplicated().sum())
        if dupes > 0:
            issues.append({
                "issue": "Duplicate Rows",
                "severity": "High" if dupes > 0.1 * num_rows else "Medium",
                "column": "Dataset Level",
                "count": dupes,
                "recommendation": f"Remove {dupes} duplicate rows using data cleaning deduplication."
            })

        # 2. Missing Values Check
        for col in df.columns:
            null_count = int(df[col].isnull().sum())
            if null_count > 0:
                null_pct = (null_count / num_rows) * 100.0
                severity = "High" if null_pct > 30 else ("Medium" if null_pct > 5 else "Low")
                strategy = "Median or Mean imputation" if pd.api.types.is_numeric_dtype(df[col]) else "Mode imputation or drop"
                issues.append({
                    "issue": "Missing Values",
                    "severity": severity,
                    "column": str(col),
                    "count": null_count,
                    "recommendation": f"{null_pct:.1f}% missing. {strategy} recommended."
                })

        # 3. Constant / Near-Constant Columns
        for col in df.columns:
            top_freq = df[col].value_counts(normalize=True).max() if not df[col].empty else 0
            if top_freq >= 0.95:
                issues.append({
                    "issue": "Constant / Near-Constant Column",
                    "severity": "Medium",
                    "column": str(col),
                    "count": int(top_freq * num_rows),
                    "recommendation": f"Column '{col}' has {top_freq*100:.1f}% identical values. Consider dropping feature."
                })

        # 4. Outliers (IQR Method)
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                clean_s = df[col].dropna()
                if len(clean_s) > 4:
                    q25, q75 = clean_s.quantile(0.25), clean_s.quantile(0.75)
                    iqr = q75 - q25
                    lower, upper = q25 - 1.5 * iqr, q75 + 1.5 * iqr
                    outliers = int(((clean_s < lower) | (clean_s > upper)).sum())
                    if outliers > 0:
                        issues.append({
                            "issue": "IQR Outliers",
                            "severity": "Medium" if outliers > 0.05 * num_rows else "Low",
                            "column": str(col),
                            "count": outliers,
                            "recommendation": f"Clipped outliers outside range [{lower:.2f}, {upper:.2f}] via IQR truncation."
                        })

        # 5. High Cardinality Categoricals
        for col in df.columns:
            if not pd.api.types.is_numeric_dtype(df[col]):
                unique_cnt = df[col].nunique()
                if unique_cnt > 50 and unique_cnt > 0.5 * num_rows:
                    issues.append({
                        "issue": "High Cardinality Categorical",
                        "severity": "Low",
                        "column": str(col),
                        "count": unique_cnt,
                        "recommendation": f"High unique categories count ({unique_cnt}). Use target or frequency encoding for ML."
                    })

        return issues
