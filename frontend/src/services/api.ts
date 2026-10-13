import { CompilerAnalysis, DataProfile, MLResult, CodePulseArtifact } from '../types';

const API_BASE = '/api/v1';

export async function analyzeCompilerSource(sourceCode: string, fileName: string = 'SoftwareRiskAnalyzer.java'): Promise<{ analysis: CompilerAnalysis; artifact?: CodePulseArtifact }> {
  const res = await fetch(`${API_BASE}/compiler/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_code: sourceCode, file_name: fileName, save_artifact: true })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Compiler analysis request failed');
  }
  return res.json();
}

export async function analyzeGrammar(productions?: Record<string, string[]>, rdInput?: string, srInput?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/compiler/grammar/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productions: productions || null,
      recursive_descent_input: rdInput || 'c a b d',
      shift_reduce_input: srInput || 'i + i * i'
    })
  });
  if (!res.ok) {
    throw new Error('Grammar analysis request failed');
  }
  return res.json();
}

export async function analyzeProject(files: { file_name: string; source_code: string; relative_path?: string }[]): Promise<any> {
  const res = await fetch(`${API_BASE}/compiler/project/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Multi-file project analysis failed');
  }
  return res.json();
}

export async function uploadProjectZip(zipBase64: string, fileName: string = 'project.zip'): Promise<any> {
  const res = await fetch(`${API_BASE}/compiler/project/upload-zip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zip_base64: zipBase64, file_name: fileName })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'ZIP archive project upload and analysis failed');
  }
  return res.json();
}

export function getExportUrl(artifactId: string, format: string): string {
  return `${API_BASE}/compiler/export/${artifactId}/${format}`;
}

export async function cleanDataset(
  csvText: string,
  imputeStrategy: string = 'mean',
  handleOutliers: boolean = true,
  normalize: boolean = false
): Promise<any> {
  const res = await fetch(`${API_BASE}/data/clean`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      csv_text: csvText,
      impute_strategy: imputeStrategy,
      handle_outliers: handleOutliers,
      normalize: normalize
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Data cleaning failed.');
  }
  return res.json();
}

export function getDataExportZipUrl(artifactId: string): string {
  return `${API_BASE}/data/export/${artifactId}`;
}

export function getMLExportZipUrl(artifactId: string): string {
  return `${API_BASE}/ml/export/${artifactId}`;
}

export async function predictMLInstance(mlArtifactId: string, instanceData: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/ml/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ml_artifact_id: mlArtifactId,
      instance_data: instanceData
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'ML prediction failed.');
  }
  return res.json();
}

export async function profileDataset(csvText: string, datasetName: string = 'Dataset.csv'): Promise<{ data_summary: any; artifact?: CodePulseArtifact }> {
  const res = await fetch(`${API_BASE}/data/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv_text: csvText, dataset_name: datasetName, save_artifact: true })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Data profiling request failed');
  }
  return res.json();
}

export async function trainMLModel(
  csvText: string,
  targetColumn: string,
  modelName: string = 'random_forest',
  taskType: string = 'classification'
): Promise<{ ml_result: MLResult; artifact?: CodePulseArtifact }> {
  const res = await fetch(`${API_BASE}/ml/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv_text: csvText, target_column: targetColumn, model_name: modelName, task_type: taskType, save_artifact: true })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'ML training request failed');
  }
  return res.json();
}

export async function fetchArtifacts(): Promise<CodePulseArtifact[]> {
  const res = await fetch(`${API_BASE}/artifacts`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.artifacts || [];
}

export async function fetchAcademicMapping(): Promise<any> {
  const res = await fetch(`${API_BASE}/academic/mapping`);
  if (!res.ok) return null;
  return res.json();
}

export async function generateReport(
  compilerId?: string,
  dataId?: string,
  mlId?: string,
  title?: string
): Promise<{ title: string; timestamp: string; markdown_content: string }> {
  const res = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compiler_artifact_id: compilerId,
      data_artifact_id: dataId,
      ml_artifact_id: mlId,
      title: title || "CodePulse Intelligence Report"
    })
  });
  if (!res.ok) {
    throw new Error('Report generation failed');
  }
  return res.json();
}

export async function convertCompilerToML(compilerArtifactId: string): Promise<{ csv_dataset: string; suggested_target: string }> {
  const res = await fetch(`${API_BASE}/artifacts/convert-compiler-to-ml?compiler_artifact_id=${compilerArtifactId}`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error('Conversion failed');
  }
  return res.json();
}

// --- Visualization Intelligence Engine API Functions ---
export async function profileVisualizationDataset(datasetContent: string, fileType: string = 'csv', datasetName: string = 'Uploaded Dataset'): Promise<any> {
  const res = await fetch(`${API_BASE}/visualization/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_content: datasetContent, file_type: fileType, dataset_name: datasetName })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Visualization profiling failed');
  }
  return res.json();
}

export async function fetchVisualizationLineage(): Promise<any> {
  const res = await fetch(`${API_BASE}/visualization/lineage`);
  if (!res.ok) return { nodes: [], edges: [] };
  return res.json();
}

export async function getArtifactLineage(): Promise<any> {
  return fetchVisualizationLineage();
}

export async function parseVisualQuery(queryText: string, compilerArtifact?: any): Promise<any> {
  const payload: any = { query_text: queryText };
  if (compilerArtifact?.artifact_id) payload.artifact_id = compilerArtifact.artifact_id;
  if (compilerArtifact?.payload) payload.compiler_data = compilerArtifact.payload;
  const res = await fetch(`${API_BASE}/visualization/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Query failed');
  }
  return res.json();
}

export async function queryVisualization(
  dataset: any[],
  queryText: string,
  numericColumns: string[],
  compilerArtifact?: any
): Promise<any> {
  const payload: any = {
    query_text: queryText,
    numeric_columns: numericColumns || []
  };
  if (dataset && dataset.length > 0) {
    payload.dataset = dataset.slice(0, 200);
  }
  if (compilerArtifact?.artifact_id) {
    payload.artifact_id = compilerArtifact.artifact_id;
  }
  if (compilerArtifact?.payload) {
    payload.compiler_data = compilerArtifact.payload;
  }
  const res = await fetch(`${API_BASE}/visualization/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Query failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchLabExperiments(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/visualization/experiments`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.experiments || [];
}

export async function executeLabExperiment(experimentId: string, sampleCsv?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/visualization/experiments/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ experiment_id: experimentId, sample_csv: sampleCsv || null })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || `Experiment ${experimentId} execution failed`);
  }
  return res.json();
}

export async function getCorrelationMatrix(dataset: any[], numericColumns: string[]): Promise<any> {
  if (!dataset || dataset.length === 0 || !numericColumns || numericColumns.length < 2) {
    return { columns: [], matrix: {}, pearson_matrix: [], top_pairs: [] };
  }
  const res = await fetch(`${API_BASE}/visualization/correlation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset: dataset.slice(0, 500), columns: numericColumns })
  });
  if (!res.ok) {
    return { columns: [], matrix: {}, pearson_matrix: [], top_pairs: [] };
  }
  return res.json();
}

export async function getAnomalies(dataset: any[], numericColumns: string[]): Promise<any> {
  if (!dataset || dataset.length === 0) {
    return { total_anomalies: 0, anomalies: [], anomaly_records: [] };
  }
  const res = await fetch(`${API_BASE}/visualization/anomalies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset: dataset.slice(0, 500), columns: numericColumns })
  });
  if (!res.ok) return { total_anomalies: 0, anomalies: [], anomaly_records: [] };
  return res.json();
}

export async function getVisualStory(dataset: any[], numericColumns: string[], compilerData?: any): Promise<any> {
  const res = await fetch(`${API_BASE}/visualization/story`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset: dataset.slice(0, 200), columns: numericColumns, compiler_data: compilerData })
  });
  if (!res.ok) {
    return { steps: [] };
  }
  return res.json();
}

export async function getCompilerArtifact(): Promise<any> {
  const artifacts = await fetchArtifacts();
  const comp = artifacts.find(a => a.artifact_type === 'compiler_analysis');
  return comp || null;
}

export async function loadExampleCompilerAnalysis(): Promise<any> {
  const sampleCode = `public class SoftwareRiskAnalyzer {

    public static int calculateRisk(int complexity, int errors) {
        int baseRisk = complexity * 2 + errors * 5;
        int adjustedRisk = baseRisk + 10 - 10;

        if (complexity > 10) {
            adjustedRisk = adjustedRisk + 20;
        } else {
            adjustedRisk = adjustedRisk - 5;
        }

        return adjustedRisk;
    }

    public static int analyzeIterations(int complexity) {
        int iterations = 0;
        int score = 0;

        while (iterations < 5) {
            score = score + complexity;
            iterations = iterations + 1;
        }

        for (int i = 0; i < 3; i = i + 1) {
            if (i > 1) {
                score = score + 10;
            } else {
                score = score + 2;
            }
        }

        return score;
    }

    public static void main(String[] args) {

        int loc = 120;
        int complexity = 12;
        int errors = 2;

        int constantValue = 10 + 20 - 20;
        int riskScore = calculateRisk(complexity, errors);
        int iterationScore = analyzeIterations(complexity);

        if (riskScore > 50) {
            System.out.println("High software risk detected!");

            if (errors > 0) {
                riskScore = riskScore + errors;
            } else {
                riskScore = riskScore - 1;
            }

        } else {
            System.out.println("Software risk is acceptable.");
        }

        int finalScore = riskScore + iterationScore + constantValue;

        System.out.println(finalScore);
    }
}`;
  const res = await analyzeCompilerSource(sampleCode, "SoftwareRiskAnalyzer.java");
  return res.artifact || { payload: res.analysis, source_name: "SoftwareRiskAnalyzer.java", title: "Compiler Analysis of SoftwareRiskAnalyzer.java" };
}

