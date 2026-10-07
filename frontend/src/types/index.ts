export interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  phase: string;
  message: string;
  line: number;
  column: number;
}

export interface SymbolItem {
  name: string;
  category: string;
  data_type: string;
  scope: string;
  line: number;
}

export interface Quadruple {
  op: string;
  arg1: string;
  arg2: string;
  result: string;
  line: number;
}

export interface CFGNode {
  id: string;
  label: string;
  instructions_count: number;
  instructions: string[];
}

export interface CFGEdge {
  from: string;
  to: string;
  type: string;
}

export interface CompilerMetrics {
  total_loc: number;
  source_loc: number;
  comment_loc: number;
  cyclomatic_complexity: number;
  cognitive_complexity: number;
  tokens_count: number;
  keywords_count: number;
  identifiers_count: number;
  operators_count: number;
  risk_level: string;
  maintainability_index: string;
}

export interface PreprocessingData {
  original_source: string;
  macro_expanded_source: string;
  cleaned_source: string;
  macros: { name: string; value: string }[];
  macro_expansions: string[];
  comment_stats: {
    single_line_comments_count: number;
    block_comments_count: number;
    total_comment_lines: number;
    removed_characters: number;
    comment_lines: number[];
  };
}

export interface TargetCodeData {
  target_architecture: string;
  instructions_count: number;
  max_stack_depth: number;
  local_slots_count: number;
  assembly_code: string;
  instructions: { pc: number; mnemonic: string; description: string; stack_depth: number }[];
}

export interface CompilerAnalysis {
  source_code: string;
  file_name: string;
  stats: {
    lines: number;
    characters: number;
    tokens_count: number;
    keywords_count: number;
    identifiers_count: number;
    diagnostics_count: number;
    errors_count: number;
    warnings_count: number;
  };
  preprocessing?: PreprocessingData;
  keyword_frequency?: Record<string, number>;
  tokens: Token[];
  ast: any;
  symbol_table: SymbolItem[];
  diagnostics: Diagnostic[];
  intermediate_code: Quadruple[];
  optimized_code: Quadruple[];
  optimization_transformations: string[];
  basic_blocks: any[];
  cfg: {
    nodes: CFGNode[];
    edges: CFGEdge[];
  };
  target_code?: TargetCodeData;
  metrics: CompilerMetrics;
}

export interface ColumnProfile {
  column_name: string;
  data_type: string;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  category: 'numeric' | 'categorical';
  mean?: number;
  std?: number;
  min?: number;
  p25?: number;
  p50?: number;
  p75?: number;
  max?: number;
  skewness?: number;
  outliers_count?: number;
  top_frequencies?: Record<string, number>;
}

export interface DataProfile {
  dataset_name: string;
  shape: { rows: number; columns: number };
  completeness_percentage: number;
  total_missing_cells: number;
  numeric_columns_count: number;
  categorical_columns_count: number;
  column_profiles: ColumnProfile[];
  correlation_matrix?: {
    columns: string[];
    values: number[][];
  };
  preview: Record<string, any>[];
}

export interface MLResult {
  model_name: string;
  task_type: string;
  target_column?: string;
  target_classes?: string[];
  features: string[];
  evaluation: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    roc_auc?: number;
    confusion_matrix?: {
      labels: string[];
      matrix: number[][];
    };
    roc_curve?: { fpr: number; tpr: number }[];
    mse?: number;
    rmse?: number;
    r2_score?: number;
    silhouette_score?: number;
    n_clusters?: number;
    cluster_distribution?: Record<string, number>;
  };
  feature_importances: { feature_name: string; importance: number }[];
}

export interface CodePulseArtifact {
  artifact_id: string;
  artifact_type: string;
  schema: string;
  created_at: string;
  producer: { engine: string };
  metadata: { title: string; source_file: string; summary: string };
  payload: any;
}
