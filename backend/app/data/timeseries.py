import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

class TimeSeriesEngine:
    """
    Time-Series & Calendar Heatmap Analysis Engine.
    Detects datetime columns, performs daily/weekly/monthly resampling,
    computes moving averages (SMA), trends, growth/decline %, and calendar activity intensity.
    """
    def analyze_timeseries(
        self, df: pd.DataFrame, date_column: Optional[str] = None, value_column: Optional[str] = None
    ) -> Dict[str, Any]:
        # 1. Detect datetime column
        target_date_col = date_column
        if not target_date_col:
            for col in df.columns:
                if not pd.api.types.is_numeric_dtype(df[col]):
                    try:
                        pd.to_datetime(df[col], errors='raise')
                        target_date_col = col
                        break
                    except Exception:
                        pass

        if not target_date_col:
            return {
                "has_timeseries": False,
                "message": "No valid datetime column detected in dataset for time-series analysis."
            }

        # Parse datetime
        ts_df = df.copy()
        ts_df["parsed_date"] = pd.to_datetime(ts_df[target_date_col], errors='coerce')
        ts_df = ts_df.dropna(subset=["parsed_date"]).sort_values("parsed_date")

        if len(ts_df) < 3:
            return {
                "has_timeseries": False,
                "message": "Insufficient valid date entries for time-series aggregation."
            }

        # Detect value column
        target_val_col = value_column
        if not target_val_col or target_val_col not in ts_df.columns:
            num_cols = [c for c in ts_df.columns if pd.api.types.is_numeric_dtype(ts_df[c]) and c != "parsed_date"]
            target_val_col = num_cols[0] if num_cols else None

        if not target_val_col:
            # Create count metric if no numeric column exists
            ts_df["metric_value"] = 1
            target_val_col = "metric_value"

        # Resample Daily & Weekly
        ts_df = ts_df.set_index("parsed_date")
        daily_res = ts_df[target_val_col].resample("D").sum().fillna(0)
        weekly_res = ts_df[target_val_col].resample("W").sum().fillna(0)

        # Moving Average SMA-3 & SMA-7
        sma3 = daily_res.rolling(window=3, min_periods=1).mean()
        sma7 = daily_res.rolling(window=7, min_periods=1).mean()

        # Growth / Decline %
        start_val = daily_res.iloc[0]
        end_val = daily_res.iloc[-1]
        growth_pct = round(((end_val - start_val) / max(1, start_val)) * 100.0, 2)
        trend = "Increasing" if growth_pct > 5 else ("Decreasing" if growth_pct < -5 else "Stable")

        # Peak & Valley
        peak_idx = daily_res.idxmax()
        peak_val = float(daily_res.max())
        valley_idx = daily_res.idxmin()
        valley_val = float(daily_res.min())

        # Calendar Heatmap Data (Date -> Value)
        calendar_heatmap = [
            {
                "date": date.strftime("%Y-%m-%d"),
                "value": round(float(val), 2),
                "intensity": min(4, int(val / (peak_val or 1) * 4))
            }
            for date, val in daily_res.items()
        ]

        # Time-Series Datapoints
        points = [
            {
                "date": date.strftime("%Y-%m-%d"),
                "value": round(float(val), 2),
                "sma3": round(float(sma3.loc[date]), 2),
                "sma7": round(float(sma7.loc[date]), 2)
            }
            for date, val in daily_res.items()
        ]

        return {
            "has_timeseries": True,
            "date_column": target_date_col,
            "value_column": target_val_col,
            "period_start": daily_res.index[0].strftime("%Y-%m-%d"),
            "period_end": daily_res.index[-1].strftime("%Y-%m-%d"),
            "total_days": len(daily_res),
            "trend": trend,
            "overall_growth_percentage": growth_pct,
            "peak": {"date": peak_idx.strftime("%Y-%m-%d"), "value": peak_val},
            "valley": {"date": valley_idx.strftime("%Y-%m-%d"), "value": valley_val},
            "datapoints": points,
            "calendar_heatmap": calendar_heatmap
        }
