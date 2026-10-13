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
  label?: string;
}

export interface CompilerMetrics {
  total_loc: number;
  source_loc: number;
  blank_loc?: number;
  comment_loc: number;
  cyclomatic_complexity: number;
  cognitive_complexity: number;
  decision_points?: number;
  method_complexities?: { name: string; cyclomatic_complexity: number; decision_points?: number }[];
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
  comments_removed?: number;
  macros_defined?: number;
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
    ast_nodes_count?: number;
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
    methods?: Record<string, {
      method_name: string;
      nodes: CFGNode[];
      edges: CFGEdge[];
      cyclomatic_complexity: number;
      decision_points: number;
      instruction_count: number;
      instructions_count: number;
      loop_count: number;
      connected_components?: number;
      entry_block: string;
      exit_block: string;
    }>;
    program_aggregate?: {
      total_methods: number;
      total_basic_blocks: number;
      total_edges: number;
      connected_components?: number;
      program_aggregate_cyclomatic_complexity: number;
      max_method_complexity: number;
    };
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
  imbalance_warning?: string;
  dataset_split?: { train_size: number; test_size: number };
  selected_model_rationale?: string;
  model_comparison?: { model_name: string; metrics: any }[];
  evaluation: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    roc_auc?: number;
    cv_mean_accuracy?: number;
    cv_std?: number;
    cv_mean_r2?: number;
    confusion_matrix?: {
      labels: string[];
      matrix: number[][];
    };
    roc_curve?: { fpr: number; tpr: number }[];
    mae?: number;
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

// ==========================================
// Growth Lab Types
// ==========================================

export interface GrowthMethodParam {
  name: string;
  type: string;
}

export interface GrowthMethodInfo {
  name: string;
  params: GrowthMethodParam[];
  return_type: string;
}

export interface GrowthInspectResponse {
  ok: boolean;
  diagnostics: Array<{
    stage?: string;
    severity?: string;
    message: string;
    line?: number;
    column?: number;
  }>;
  methods: GrowthMethodInfo[];
}

export interface GrowthSample {
  n: number;
  steps: number;
  status: string;
  return_value: any;
}

export interface GrowthCandidate {
  basis: string;
  a: number;
  b: number;
  r2: number;
  max_relative_error: number;
}

export interface DoublingRatio {
  from_n: number;
  to_n: number;
  ratio: number;
}

export interface GrowthFit {
  classification: string;
  confidence: 'high' | 'medium' | 'low';
  formula: string;
  r2: number;
  max_relative_error: number;
  log_log_slope: number;
  doubling_ratios: DoublingRatio[];
  candidates: GrowthCandidate[];
  notes: string[];
  valid_points_count: number;
}

export interface GrowthStaticHint {
  loop_depth: number;
  has_recursion: boolean;
  hint_class: string;
}

export interface GrowthVariantComparison {
  classes_match: boolean;
  steps_saved_at_largest_n: number;
  steps_saved_pct: number;
  largest_n: number;
}

export interface GrowthVariants {
  raw: {
    samples: GrowthSample[];
    fit: GrowthFit;
    truncated_reason?: string | null;
  };
  optimized: {
    samples: GrowthSample[];
    fit: GrowthFit;
    truncated_reason?: string | null;
  };
  comparison: GrowthVariantComparison;
}

export interface GrowthLabResponse {
  samples: GrowthSample[];
  fit: GrowthFit;
  static_hint: GrowthStaticHint;
  variants?: GrowthVariants;
  truncated_reason?: string | null;
  cost_model: string;
  elapsed_ms: number;
  artifact?: CodePulseArtifact;
}

export interface GrowthLabRequestPayload {
  source_code: string;
  method: string;
  size_param: string | number;
  fixed_args?: Record<string, any>;
  sizes?: number[];
  variant?: 'raw' | 'optimized' | 'both';
  save_artifact?: boolean;
}

