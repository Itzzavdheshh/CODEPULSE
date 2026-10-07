from typing import Dict, Any

SAMPLE_SOFTWARE_DEFECT_CSV = """loc,cyclomatic_complexity,cognitive_complexity,tokens_count,diagnostics_count,has_defect
145,14,12,650,3,1
210,22,18,980,5,1
85,4,3,320,0,0
120,8,6,490,1,0
60,2,1,210,0,0
40,1,1,150,0,0
175,16,13,740,4,1
95,9,7,410,1,0
310,28,24,1420,8,1
70,3,2,280,0,0
130,11,9,590,2,1
55,2,1,190,0,0
190,18,15,810,4,1
80,5,4,340,0,0
220,24,20,1050,6,1
"""

SAMPLE_IRIS_CSV = """sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.5,3.0,5.5,1.8,virginica
5.0,3.6,1.4,0.2,setosa
6.0,2.9,4.5,1.5,versicolor
"""

def get_sample_dataset(name: str) -> str:
    name_lower = name.lower()
    if "iris" in name_lower:
        return SAMPLE_IRIS_CSV
    return SAMPLE_SOFTWARE_DEFECT_CSV
