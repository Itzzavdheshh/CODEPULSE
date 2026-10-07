import { CompilerAnalysis, DataProfile, MLResult, CodePulseArtifact } from '../types';

const API_BASE = '/api/v1';

export async function analyzeCompilerSource(sourceCode: string, fileName: string = 'Source.java'): Promise<{ analysis: CompilerAnalysis; artifact?: CodePulseArtifact }> {
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

export async function analyzeProject(files: { file_name: string; source_code: string }[]): Promise<any> {
  const res = await fetch(`${API_BASE}/compiler/project/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files })
  });
  if (!res.ok) {
    throw new Error('Multi-file project analysis failed');
  }
  return res.json();
}

export function getExportUrl(artifactId: string, format: string): string {
  return `${API_BASE}/compiler/export/${artifactId}/${format}`;
}

export async function profileDataset(csvText: string, datasetName: string = 'Dataset.csv'): Promise<{ data_summary: { profile: DataProfile; preview: any[] }; artifact?: CodePulseArtifact }> {
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

export async function generateReport(compilerId?: string, dataId?: string, mlId?: string): Promise<{ title: string; timestamp: string; markdown_content: string }> {
  const res = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compiler_artifact_id: compilerId, data_artifact_id: dataId, ml_artifact_id: mlId })
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
