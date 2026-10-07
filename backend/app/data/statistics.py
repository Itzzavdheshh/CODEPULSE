import pandas as pd
import numpy as np
from typing import Dict, Any, List

class AdvancedStatisticsEngine:
    """
    Computes Pearson & Spearman rank correlation matrices, covariance matrices,
    identifies strongest/suspicious variable relationships, and generates data-backed human insights.
    """
    def compute_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        num_cols = [str(c) for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        
        if len(num_cols) < 2:
            return {
                "numeric_columns": num_cols,
                "pearson_correlation": {},
                "spearman_correlation": {},
                "ranked_relationships": [],
                "insights": ["Fewer than 2 numeric columns available for correlation analysis."]
            }

        num_df = df[num_cols].dropna()
        if len(num_df) < 2:
            return {
                "numeric_columns": num_cols,
                "pearson_correlation": {},
                "spearman_correlation": {},
                "ranked_relationships": [],
                "insights": ["Insufficient non-null numeric rows for correlation matrix."]
            }

        # Pearson & Spearman
        pearson_corr = num_df.corr(method="pearson").fillna(0)
        spearman_corr = num_df.corr(method="spearman").fillna(0)

        # Extract pairwise relationships
        relationships = []
        n_cols = len(num_cols)
        for i in range(n_cols):
            for j in range(i + 1, n_cols):
                c1, c2 = num_cols[i], num_cols[j]
                p_val = float(pearson_corr.iloc[i, j])
                s_val = float(spearman_corr.iloc[i, j])
                
                abs_val = abs(p_val)
                strength = "Strong" if abs_val >= 0.7 else ("Moderate" if abs_val >= 0.4 else "Weak")
                direction = "Positive" if p_val >= 0 else "Negative"

                relationships.append({
                    "var1": c1,
                    "var2": c2,
                    "pearson_r": round(p_val, 4),
                    "spearman_r": round(s_val, 4),
                    "strength": strength,
                    "direction": direction
                })

        # Sort relationships by absolute strength
        relationships.sort(key=lambda x: abs(x["pearson_r"]), reverse=True)

        # Generate Insights referencing real computed numbers
        insights = []
        if relationships:
            top_rel = relationships[0]
            insights.append(f"Strongest relationship discovered: '{top_rel['var1']}' and '{top_rel['var2']}' (Pearson r = {top_rel['pearson_r']:.2f}, {top_rel['strength']} {top_rel['direction']}).")

        high_corr_count = sum(1 for r in relationships if abs(r["pearson_r"]) >= 0.7)
        if high_corr_count > 0:
            insights.append(f"Detected {high_corr_count} pairs of strongly correlated variables (|r| ≥ 0.70).")

        return {
            "numeric_columns": num_cols,
            "pearson_correlation": {
                "columns": num_cols,
                "values": [[round(float(pearson_corr.iloc[i, j]), 4) for j in range(n_cols)] for i in range(n_cols)]
            },
            "spearman_correlation": {
                "columns": num_cols,
                "values": [[round(float(spearman_corr.iloc[i, j]), 4) for j in range(n_cols)] for i in range(n_cols)]
            },
            "ranked_relationships": relationships,
            "insights": insights
        }
