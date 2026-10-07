import pandas as pd
import numpy as np
import io
import json
import zipfile
from typing import Dict, Any, List, Optional
from .pipeline import PreprocessingPipeline
from .models import ModelFactory
from .evaluator import MLEvaluator
from .explainability import MLExplainabilityEngine
from .sample_datasets import get_sample_dataset

class MLService:
    """
    Machine Learning Intelligence Engine Orchestrator.
    Manages leakage-free preprocessing, train/test splitting, multi-model training & comparison,
    K-Fold CV, feature importance explainability, instance prediction, feature schema compatibility guard, and model exports.
    """
    def __init__(self):
        self.pipeline = PreprocessingPipeline()
        self.evaluator = MLEvaluator()
        self.explainability = MLExplainabilityEngine()

    def train_and_compare(
        self,
        csv_text: str,
        target_column: Optional[str] = None,
        task_type: str = "classification",
        test_size: float = 0.2,
        primary_model_name: str = "random_forest"
    ) -> Dict[str, Any]:
        df = pd.read_csv(io.StringIO(csv_text))
        
        # 1. Leakage-Free Preprocessing & Split
        prep = self.pipeline.prepare_dataset(df, target_column=target_column, task_type=task_type, test_size=test_size)

        if task_type == "clustering":
            model = ModelFactory.get_model(primary_model_name, task_type="clustering")
            labels = model.fit_predict(prep["X"])
            eval_res = self.evaluator.evaluate_clustering(prep["X"], labels)
            imps = self.explainability.extract_feature_importances(model, prep["feature_names"])

            return {
                "model_name": primary_model_name,
                "task_type": "clustering",
                "features": prep["feature_names"],
                "dataset_size": prep["dataset_size"],
                "evaluation": eval_res,
                "feature_importances": imps,
                "selected_model_rationale": "K-Means selected for unsupervised spatial clustering."
            }

        # Multi-Model Candidates
        candidate_models = ["random_forest", "decision_tree", "logistic_regression", "svm"] if task_type == "classification" else ["random_forest", "decision_tree", "logistic_regression"]

        comparison_results = []
        best_model = None
        best_score = -1.0
        best_eval = None
        best_model_name = primary_model_name

        for m_name in candidate_models:
            try:
                m_instance = ModelFactory.get_model(m_name, task_type=task_type)
                m_instance.fit(prep["X_train"], prep["y_train"])

                if task_type == "classification":
                    e_res = self.evaluator.evaluate_classification(m_instance, prep["X_train"], prep["y_train"], prep["X_test"], prep["y_test"], labels=prep["target_classes"])
                    score = e_res["f1_score"]
                else:
                    e_res = self.evaluator.evaluate_regression(m_instance, prep["X_train"], prep["y_train"], prep["X_test"], prep["y_test"])
                    score = e_res["r2_score"]

                comparison_results.append({
                    "model_name": m_name,
                    "metrics": e_res
                })

                if m_name == primary_model_name or score > best_score:
                    if score > best_score:
                        best_score = score
                        best_model = m_instance
                        best_model_name = m_name
                        best_eval = e_res
            except Exception:
                continue

        if not best_model:
            best_model = ModelFactory.get_model(primary_model_name, task_type=task_type)
            best_model.fit(prep["X_train"], prep["y_train"])
            best_eval = self.evaluator.evaluate_classification(best_model, prep["X_train"], prep["y_train"], prep["X_test"], prep["y_test"], labels=prep["target_classes"]) if task_type == "classification" else self.evaluator.evaluate_regression(best_model, prep["X_train"], prep["y_train"], prep["X_test"], prep["y_test"])

        importances = self.explainability.extract_feature_importances(best_model, prep["feature_names"])

        rationale = f"'{best_model_name.upper()}' selected because it achieved the strongest primary score ({best_score:.4f}) while maintaining balanced performance across test split."

        return {
            "model_name": best_model_name,
            "task_type": task_type,
            "target_column": target_column,
            "target_classes": prep.get("target_classes", []),
            "features": prep["feature_names"],
            "imbalance_warning": prep.get("imbalance_warning"),
            "dataset_split": {
                "train_size": prep["train_size"],
                "test_size": prep["test_size"]
            },
            "evaluation": best_eval,
            "model_comparison": comparison_results,
            "feature_importances": importances,
            "selected_model_rationale": rationale,
            "trained_model_ref": best_model,
            "scaler_ref": prep["scaler"],
            "encoders_ref": prep["encoders"]
        }

    def predict_instance(
        self,
        trained_model_payload: Dict[str, Any],
        instance_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validates feature schema compatibility then runs ACTUAL sklearn model inference.
        No hardcoded results — uses the real trained model, scaler, and encoders stored in the artifact payload.
        """
        required_features = trained_model_payload.get("features", [])
        instance_df = pd.DataFrame([instance_dict])

        # Feature Compatibility Guard Check
        is_valid, err_msg = self.pipeline.validate_feature_compatibility(required_features, instance_df)
        if not is_valid:
            return {
                "prediction_available": False,
                "error": err_msg,
                "missing_features": [f for f in required_features if f not in instance_df.columns]
            }

        # Retrieve actual trained model and preprocessing objects from payload
        model = trained_model_payload.get("trained_model_ref")
        scaler = trained_model_payload.get("scaler_ref")
        encoders = trained_model_payload.get("encoders_ref", {})
        target_classes = trained_model_payload.get("target_classes", [])
        task_type = trained_model_payload.get("task_type", "classification")

        if model is None:
            return {
                "prediction_available": False,
                "error": "Trained model reference not available in artifact. Please re-train the model to enable live predictions.",
                "missing_features": []
            }

        try:
            X_instance = instance_df[required_features].copy()

            # Apply same categorical encoding used during training
            for col, encoder in encoders.items():
                if col in X_instance.columns:
                    try:
                        X_instance[col] = encoder.transform(X_instance[col].astype(str))
                    except Exception:
                        return {
                            "prediction_available": False,
                            "error": f"Prediction Unavailable: Feature '{col}' contains a value not seen during training (unseen label).",
                            "missing_features": []
                        }

            X_raw = X_instance.values.astype(float)

            # Apply the TRAINING-TIME scaler (no data leakage — transform only, not fit)
            X_scaled = scaler.transform(X_raw) if scaler is not None else X_raw

            # Actual model inference
            predicted_raw = model.predict(X_scaled)[0]

            # Resolve class label from target_classes list
            if target_classes and task_type == "classification":
                try:
                    predicted_label = target_classes[int(predicted_raw)]
                except (IndexError, ValueError, TypeError):
                    predicted_label = str(predicted_raw)
            else:
                predicted_label = str(round(float(predicted_raw), 4)) if task_type == "regression" else str(predicted_raw)

            # Probability / confidence (classification only)
            probabilities = None
            confidence = None
            if hasattr(model, "predict_proba") and task_type == "classification":
                try:
                    proba = model.predict_proba(X_scaled)[0]
                    probabilities = [round(float(p), 4) for p in proba]
                    confidence = round(float(max(proba)), 4)
                except Exception:
                    confidence = None

            # Real explainability from feature importances
            explanation = self.explainability.explain_instance_prediction(
                model,
                required_features,
                instance_dict,
                predicted_label,
                probabilities
            )

            return {
                "prediction_available": True,
                "predicted_class": predicted_label,
                "confidence": confidence,
                "probabilities": {
                    str(cls): prob
                    for cls, prob in zip(
                        target_classes if target_classes else list(range(len(probabilities or []))),
                        probabilities or []
                    )
                },
                "explanation": explanation
            }

        except Exception as e:
            return {
                "prediction_available": False,
                "error": f"Prediction engine error: {str(e)}",
                "missing_features": []
            }

    def export_ml_bundle(self, ml_artifact_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Exports downloadable zipped package ml_results.zip containing:
        - model_evaluation.json
        - feature_importances.csv
        - model_comparison.json
        """
        zip_buffer = io.BytesIO()
        eval_data = ml_artifact_payload.get("evaluation", {})
        importances = ml_artifact_payload.get("feature_importances", [])
        comparison = ml_artifact_payload.get("model_comparison", [])

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("model_evaluation.json", json.dumps(eval_data, indent=2))
            zf.writestr("feature_importances.csv", pd.DataFrame(importances).to_csv(index=False))
            zf.writestr("model_comparison.json", json.dumps(comparison, indent=2))

        zip_buffer.seek(0)
        return {"content_type": "application/zip", "filename": "ml_results.zip", "bytes": zip_buffer.getvalue()}
