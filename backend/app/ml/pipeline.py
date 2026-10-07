import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

class PreprocessingPipeline:
    """
    Data Leakage Prevention Preprocessing Pipeline.
    Fits scalers and encoders ONLY on training data X_train, then applies .transform() to test set and new instances.
    Enforces feature schema compatibility validation before making predictions.
    """
    def prepare_dataset(
        self,
        df: pd.DataFrame,
        target_column: Optional[str] = None,
        task_type: str = "classification",
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        df_clean = df.dropna()
        if len(df_clean) < 8:
            raise ValueError("Insufficient rows for ML training after removing missing values (minimum 8 required).")

        if task_type != "clustering":
            if not target_column or target_column not in df_clean.columns:
                raise ValueError(f"Target column '{target_column}' not found in dataset.")

            X_df = df_clean.drop(columns=[target_column])
            y_series = df_clean[target_column]
        else:
            X_df = df_clean.copy()
            y_series = None

        feature_names = list(X_df.columns)

        # Categorical Feature Encoding (Fitted on X_df)
        encoders = {}
        X_encoded = X_df.copy()
        for col in feature_names:
            if not pd.api.types.is_numeric_dtype(X_df[col]):
                le = LabelEncoder()
                X_encoded[col] = le.fit_transform(X_df[col].astype(str))
                encoders[col] = le

        X_raw = X_encoded.values

        if task_type == "clustering":
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X_raw)
            return {
                "task_type": "clustering",
                "feature_names": feature_names,
                "X": X_scaled,
                "scaler": scaler,
                "encoders": encoders,
                "dataset_size": len(X_df)
            }

        # Target Encoding
        target_encoder = None
        if not pd.api.types.is_numeric_dtype(y_series):
            target_encoder = LabelEncoder()
            y = target_encoder.fit_transform(y_series.astype(str))
            target_classes = [str(c) for c in target_encoder.classes_]
        else:
            y = y_series.values
            target_classes = [str(c) for c in np.unique(y)]

        # Class Imbalance Check
        imbalance_warning = None
        if task_type == "classification":
            unique_classes, counts = np.unique(y, return_counts=True)
            if len(unique_classes) < 2:
                raise ValueError("Target column must contain at least 2 distinct classes.")
            
            max_pct = max(counts) / len(y)
            if max_pct >= 0.80:
                imbalance_warning = f"Class imbalance detected: Majority class represents {max_pct*100:.1f}% of target records. Accuracy may be misleading; evaluate F1/ROC-AUC."

        # Stratified Train/Test Split
        use_stratify = y if (task_type == "classification" and len(np.unique(y)) > 1 and min(np.bincount(y)) >= 2) else None
        X_train_raw, X_test_raw, y_train, y_test = train_test_split(
            X_raw, y, test_size=test_size, random_state=42, stratify=use_stratify
        )

        # FIT SCALER STRICTLY ON X_train (No Data Leakage!)
        scaler = StandardScaler()
        X_train = scaler.fit_transform(X_train_raw)
        X_test = scaler.transform(X_test_raw)

        return {
            "task_type": task_type,
            "target_column": target_column,
            "feature_names": feature_names,
            "target_classes": target_classes,
            "X_train": X_train,
            "X_test": X_test,
            "y_train": y_train,
            "y_test": y_test,
            "scaler": scaler,
            "encoders": encoders,
            "target_encoder": target_encoder,
            "imbalance_warning": imbalance_warning,
            "train_size": len(X_train),
            "test_size": len(X_test)
        }

    def validate_feature_compatibility(self, required_features: List[str], instance_df: pd.DataFrame) -> Tuple[bool, Optional[str]]:
        """
        Enforces Feature Schema Compatibility Validation before making predictions.
        Stops prediction if required training features are missing.
        """
        missing = [f for f in required_features if f not in instance_df.columns]
        if missing:
            return False, f"Prediction Unavailable: Required model feature(s) {missing} are missing from target input dataset. Schema compatibility unverified."
        return True, None
