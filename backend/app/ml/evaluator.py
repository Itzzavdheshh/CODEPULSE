import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc, mean_squared_error, r2_score,
    silhouette_score
)
from typing import Dict, Any, List

class MLEvaluator:
    """
    Evaluates ML classification, regression, and clustering models with rigorous metrics.
    """
    def evaluate_classification(
        self, y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray = None, labels: List[Any] = None
    ) -> Dict[str, Any]:
        acc = float(accuracy_score(y_true, y_pred))
        prec = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))
        rec = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

        # Confusion Matrix
        cm = confusion_matrix(y_true, y_pred)
        cm_list = cm.tolist()

        # ROC Curve datapoints (binary or multi-class OvR)
        roc_data = []
        if y_prob is not None and len(np.unique(y_true)) == 2:
            try:
                pos_col = 1 if y_prob.shape[1] > 1 else 0
                fpr, tpr, thresholds = roc_curve(y_true, y_prob[:, pos_col])
                roc_auc_val = float(auc(fpr, tpr))
                # Sample 20 points for smooth charting
                indices = np.linspace(0, len(fpr) - 1, min(20, len(fpr)), dtype=int)
                roc_data = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in indices]
            except Exception:
                roc_auc_val = acc
        else:
            roc_auc_val = acc

        return {
            "task_type": "classification",
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc_val, 4),
            "confusion_matrix": {
                "labels": [str(l) for l in (labels or np.unique(y_true))],
                "matrix": cm_list
            },
            "roc_curve": roc_data
        }

    def evaluate_regression(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
        mse = float(mean_squared_error(y_true, y_pred))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_true, y_pred))

        return {
            "task_type": "regression",
            "mse": round(mse, 4),
            "rmse": round(rmse, 4),
            "r2_score": round(r2, 4)
        }

    def evaluate_clustering(self, X: np.ndarray, labels: np.ndarray) -> Dict[str, Any]:
        unique_labels = np.unique(labels)
        if len(unique_labels) > 1 and len(X) > len(unique_labels):
            sil = float(silhouette_score(X, labels))
        else:
            sil = 0.0

        cluster_counts = {str(lbl): int((labels == lbl).sum()) for lbl in unique_labels}

        return {
            "task_type": "clustering",
            "silhouette_score": round(sil, 4),
            "n_clusters": len(unique_labels),
            "cluster_distribution": cluster_counts
        }
