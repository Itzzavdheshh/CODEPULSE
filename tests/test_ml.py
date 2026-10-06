import pytest
from app.ml.service import MLService

ML_DATASET_CSV = """loc,cyclomatic,diagnostics,risk_level
10,2,0,LOW
12,2,0,LOW
15,3,0,LOW
18,3,1,LOW
22,4,1,LOW
40,9,2,MODERATE
45,10,3,MODERATE
50,11,3,MODERATE
80,20,5,HIGH
90,25,7,HIGH
100,28,8,HIGH
110,30,9,HIGH
"""

def test_ml_service_classification():
    service = MLService()
    res = service.train_and_evaluate(
        csv_text=ML_DATASET_CSV,
        target_column="risk_level",
        model_name="random_forest",
        task_type="classification"
    )

    assert "evaluation" in res
    assert res["evaluation"]["accuracy"] > 0.5
    assert len(res["feature_importances"]) == 3

def test_ml_service_clustering():
    service = MLService()
    res = service.train_and_evaluate(
        csv_text=ML_DATASET_CSV,
        target_column="risk_level",
        model_name="kmeans",
        task_type="clustering"
    )

    assert res["task_type"] == "clustering"
    assert "silhouette_score" in res["evaluation"]
