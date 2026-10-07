import pandas as pd
from typing import Dict, Any, List

class VisualizationRecommendationEngine:
    """
    Automatic Visualization Recommendation Engine.
    Inspects dataset column types and shapes to deterministically recommend appropriate visual charts.
    """
    def recommend_visualizations(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        recommendations = []
        num_cols = [str(c) for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        cat_cols = [str(c) for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]

        # 1. Multi-Numeric -> Correlation Heatmap
        if len(num_cols) >= 2:
            recommendations.append({
                "chart_type": "heatmap",
                "title": "Pearson Correlation Heatmap",
                "description": f"Analyzes linear relationships across {len(num_cols)} numeric attributes.",
                "x_axis": num_cols[0],
                "y_axis": num_cols[1],
                "columns": num_cols
            })

        # 2. Categorical + Numeric -> Aggregated Bar Chart
        if cat_cols and num_cols:
            cat_col = cat_cols[0]
            num_col = num_cols[0]
            recommendations.append({
                "chart_type": "bar_chart",
                "title": f"{num_col} by {cat_col}",
                "description": f"Aggregates total {num_col} grouped by {cat_col} categories.",
                "x_axis": cat_col,
                "y_axis": num_col
            })

        # 3. Numeric -> Histogram / Box Plot Distribution
        if num_cols:
            num_col = num_cols[0]
            recommendations.append({
                "chart_type": "histogram",
                "title": f"Distribution of {num_col}",
                "description": f"Displays frequency distribution and skewness of {num_col}.",
                "x_axis": num_col,
                "y_axis": "Frequency"
            })

        # 4. Two Numeric -> Scatter Plot
        if len(num_cols) >= 2:
            recommendations.append({
                "chart_type": "scatter_plot",
                "title": f"{num_cols[1]} vs {num_cols[0]}",
                "description": f"Visualizes individual observations across {num_cols[0]} and {num_cols[1]}.",
                "x_axis": num_cols[0],
                "y_axis": num_cols[1]
            })

        return recommendations
