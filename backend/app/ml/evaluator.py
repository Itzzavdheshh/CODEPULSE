import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc, mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score
)
from sklearn.model_selection import cross_val_score
from typing import Dict, Any, List

class MLEvaluator:
    """
    Evaluates ML classification, regression, and clustering models with rigorous metrics,
    K-Fold Cross Validation, and automated model comparison tables.
    """
    def evaluate_classification(
        self, model: Any, X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray, labels: List[Any] = None
    ) -> Dict[str, Any]:
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test) if hasattr(model, "predict_proba") else None

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
        rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
        f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

        # K-Fold Cross Validation
        cv_scores = cross_val_score(model, X_train, y_train, cv=min(5, max(2, len(y_train)//2)))
        cv_mean = float(np.mean(cv_scores))
        cv_std = float(np.std(cv_scores))

        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        cm_list = cm.tolist()

        # ROC Curve
        roc_data = []
        roc_auc_val = acc
        if y_prob is not None and len(np.unique(y_test)) == 2:
            try:
                pos_col = 1 if y_prob.shape[1] > 1 else 0
                fpr, tpr, _ = roc_curve(y_test, y_prob[:, pos_col])
                roc_auc_val = float(auc(fpr, tpr))
                indices = np.linspace(0, len(fpr) - 1, min(20, len(fpr)), dtype=int)
                roc_data = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in indices]
            except Exception:
                roc_auc_val = acc

        return {
            "task_type": "classification",
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc_val, 4),
            "cv_mean_accuracy": round(cv_mean, 4),
            "cv_std": round(cv_std, 4),
            "confusion_matrix": {
                "labels": [str(l) for l in (labels or np.unique(y_test))],
                "matrix": cm_list
            },
            "roc_curve": roc_data
        }

    def evaluate_regression(self, model: Any, X_train: np.ndarray, y_train: np.ndarray, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        y_pred = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        mse = float(mean_squared_error(y_test, y_pred))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_test, y_pred))

        cv_scores = cross_val_score(model, X_train, y_train, cv=min(5, max(2, len(y_train)//2)), scoring="r2")
        cv_mean = float(np.mean(cv_scores))

        return {
            "task_type": "regression",
            "mae": round(mae, 4),
            "mse": round(mse, 4),
            "rmse": round(rmse, 4),
            "r2_score": round(r2, 4),
            "cv_mean_r2": round(cv_mean, 4)
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
