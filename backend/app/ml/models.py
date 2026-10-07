from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.cluster import KMeans
from typing import Any, Dict

class ModelFactory:
    """
    Creates and configures scikit-learn machine learning model instances.
    """
    @staticmethod
    def get_model(model_name: str, task_type: str = "classification", params: Dict[str, Any] = None) -> Any:
        params = params or {}
        model_name_lower = model_name.lower()

        if task_type == "classification":
            if "random_forest" in model_name_lower or "rf" == model_name_lower:
                return RandomForestClassifier(n_estimators=params.get("n_estimators", 100), max_depth=params.get("max_depth", None), random_state=42)
            elif "decision_tree" in model_name_lower or "dt" == model_name_lower:
                return DecisionTreeClassifier(max_depth=params.get("max_depth", None), random_state=42)
            elif "naive_bayes" in model_name_lower or "nb" == model_name_lower:
                return GaussianNB()
            elif "svm" in model_name_lower or "svc" in model_name_lower:
                from sklearn.svm import SVC
                return SVC(probability=True, random_state=42)
            else: # Fallback to Logistic Regression
                return LogisticRegression(max_iter=1000, random_state=42)

        elif task_type == "regression":
            if "random_forest" in model_name_lower or "rf" == model_name_lower:
                return RandomForestRegressor(n_estimators=params.get("n_estimators", 100), max_depth=params.get("max_depth", None), random_state=42)
            elif "decision_tree" in model_name_lower or "dt" == model_name_lower:
                return DecisionTreeRegressor(max_depth=params.get("max_depth", None), random_state=42)
            elif "svm" in model_name_lower or "svr" in model_name_lower:
                from sklearn.svm import SVR
                return SVR()
            else: # Fallback to Linear Regression
                return LinearRegression()

        elif task_type == "clustering":
            n_clusters = params.get("n_clusters", 3)
            return KMeans(n_clusters=n_clusters, random_state=42, n_init=10)

        raise ValueError(f"Unsupported model or task: {model_name} ({task_type})")
