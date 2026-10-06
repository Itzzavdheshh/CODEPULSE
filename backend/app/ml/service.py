import pandas as pd
import numpy as np
import io
from typing import Dict, Any, List, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from .models import ModelFactory
from .evaluator import MLEvaluator
from .explainability import MLExplainabilityEngine

class MLService:
    """
    Machine Learning Engine Orchestrator.
    Manages dataset ingestion, target selection, encoding, training, evaluation, explainability, and prediction.
    """
    def __init__(self):
        self.evaluator = MLEvaluator()
        self.explainability = MLExplainabilityEngine()

    def train_and_evaluate(
        self,
        csv_text: str,
        target_column: str,
        model_name: str = "random_forest",
        task_type: str = "classification",
        test_size: float = 0.2,
        model_params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        df = pd.read_csv(io.StringIO(csv_text))
        
        if target_column not in df.columns and task_type != "clustering":
            return {"error": f"Target column '{target_column}' not found in dataset."}

        # Handle missing values in dataset
        df = df.dropna()
        if len(df) < 10:
            return {"error": "Insufficient valid dataset rows after dropping missing values (minimum 10 required)."}

        # Feature / Target split
        if task_type != "clustering":
            X_df = df.drop(columns=[target_column])
            y_series = df[target_column]
        else:
            X_df = df.copy()
            y_series = None

        # Categorical Encoding for Features
        feature_encoders = {}
        for col in X_df.columns:
            if not pd.api.types.is_numeric_dtype(X_df[col]):
                le = LabelEncoder()
                X_df[col] = le.fit_transform(X_df[col].astype(str))
                feature_encoders[col] = le

        feature_names = list(X_df.columns)
        X = X_df.values

        # Scaling
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        if task_type == "clustering":
            model = ModelFactory.get_model(model_name, task_type="clustering", params=model_params)
            cluster_labels = model.fit_predict(X_scaled)
            eval_results = self.evaluator.evaluate_clustering(X_scaled, cluster_labels)
            importances = self.explainability.extract_feature_importances(model, feature_names)

            return {
                "model_name": model_name,
                "task_type": "clustering",
                "features": feature_names,
                "dataset_size": len(df),
                "evaluation": eval_results,
                "feature_importances": importances
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

        if len(np.unique(y)) < 2 and task_type == "classification":
            return {"error": "Target column must contain at least 2 distinct classes for classification."}

        # Train/Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=test_size, random_state=42
        )

        # Model Instantiation & Training
        model = ModelFactory.get_model(model_name, task_type=task_type, params=model_params)
        model.fit(X_train, y_train)

        # Evaluation
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test) if hasattr(model, "predict_proba") and task_type == "classification" else None

        if task_type == "classification":
            eval_results = self.evaluator.evaluate_classification(y_test, y_pred, y_prob, labels=target_classes)
        else:
            eval_results = self.evaluator.evaluate_regression(y_test, y_pred)

        importances = self.explainability.extract_feature_importances(model, feature_names)

        return {
            "model_name": model_name,
            "task_type": task_type,
            "target_column": target_column,
            "target_classes": target_classes,
            "features": feature_names,
            "dataset_split": {
                "train_size": len(X_train),
                "test_size": len(X_test)
            },
            "evaluation": eval_results,
            "feature_importances": importances
        }
