import pytest
from app.data.service import DataService

SAMPLE_CSV = """loc,cyclomatic_complexity,diagnostics_count,risk_level
10,2,0,LOW
25,5,1,LOW
45,12,3,HIGH
80,22,6,CRITICAL
15,3,0,LOW
30,7,2,MODERATE
"""

def test_data_service_profiling():
    service = DataService()
    res = service.process_csv_content(SAMPLE_CSV, "SoftwareMetrics.csv")

    assert "profile" in res
    prof = res["profile"]
    assert prof["shape"]["rows"] == 6
    assert prof["shape"]["columns"] == 4
    assert prof["completeness_percentage"] == 100.0
    assert len(prof["column_profiles"]) == 4

def test_data_service_cleaning():
    dirty_csv = """x,y\n1,10\n2,\n3,30\n100,40\n"""
    service = DataService()
    res = service.clean_and_transform(dirty_csv, impute_strategy="mean", handle_outliers=True)

    assert "summary" in res
    assert len(res["summary"]["actions"]) > 0
