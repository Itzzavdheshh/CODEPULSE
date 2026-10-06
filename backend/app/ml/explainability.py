import numpy as np
from typing import Dict, Any, List

class MLExplainabilityEngine:
    """
    Computes feature importance rankings and instance-level prediction explanations.
    """
    def extract_feature_importances(self, model: Any, feature_names: List[str]) -> List[Dict[str, Any]]:
        importances = []
        if hasattr(model, "feature_importances_"):
            raw_imp = model.feature_importances_
            total = sum(raw_imp) or 1.0
            for name, val in zip(feature_names, raw_imp):
                importances.append({
                    "feature_name": name,
                    "importance": round(float(val / total), 4)
                })
        elif hasattr(model, "coef_"):
            raw_coef = np.abs(model.coef_).ravel()
            total = sum(raw_coef) or 1.0
            for name, val in zip(feature_names, raw_coef[:len(feature_names)]):
                importances.append({
                    "feature_name": name,
                    "importance": round(float(val / total), 4)
                })
        else: # Equal fallback if model has no direct weights
            eq_val = round(1.0 / max(1, len(feature_names)), 4)
            for name in feature_names:
                importances.append({
                    "feature_name": name,
                    "importance": eq_val
                })

        # Sort descending
        return sorted(importances, key=lambda x: x["importance"], reverse=True)

    def explain_instance_prediction(
        self,
        model: Any,
        feature_names: List[str],
        instance_values: Dict[str, Any],
        predicted_class: Any,
        probabilities: List[float] = None
    ) -> Dict[str, Any]:
        importances = self.extract_feature_importances(model, feature_names)
        
        contributions = []
        for item in importances:
            feat = item["feature_name"]
            val = instance_values.get(feat, 0)
            contributions.append({
                "feature": feat,
                "value": val,
                "weight": item["importance"],
                "impact": "HIGH" if item["importance"] > 0.3 else ("MODERATE" if item["importance"] > 0.1 else "LOW")
            })

        conf = max(probabilities) if probabilities else 1.0

        return {
            "predicted_class": str(predicted_class),
            "confidence": round(float(conf), 4),
            "feature_contributions": contributions,
            "interpretation": f"Prediction '{predicted_class}' driven primarily by features: {', '.join([c['feature'] for c in contributions[:3]])}"
        }
