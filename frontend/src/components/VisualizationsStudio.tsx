import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Cpu, 
  FlaskConical, 
  Sliders, 
  Activity, 
  GitBranch, 
  BookOpen, 
  Database, 
  Layers, 
  FileText,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  Upload,
  ArrowRight,
  ShieldAlert,
  Terminal,
  FileCode,
  GitCompare,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { VisualizationLab } from './visualization/VisualizationLab';
import { VisualAnalyticsStudio } from './visualization/VisualAnalyticsStudio';
import { SoftwareIntelligenceExplorer } from './visualization/SoftwareIntelligenceExplorer';
import { AdvancedAnalyticsStudio } from './visualization/AdvancedAnalyticsStudio';
import { ArtifactLineageExplorer } from './visualization/ArtifactLineageExplorer';
import { VisualStoryExplorer } from './visualization/VisualStoryExplorer';
import { FileComparisonView } from './visualization/FileComparisonView';
import { ComplexityRiskView } from './visualization/ComplexityRiskView';
import { getCompilerArtifact, loadExampleCompilerAnalysis, fetchArtifacts } from '../services/api';

export const VisualizationsStudio: React.FC = () => {
  // Navigation tabs organized around PRODUCT philosophy: ANALYZE -> UNDERSTAND -> ACADEMIC LAB
  const [activeTab, setActiveTab] = useState<
    'overview' | 'topology' | 'risk' | 'data' | 'advanced' | 'story' | 'lineage' | 'comparison' | 'lab'
  >('overview');

  // Shared state
  const [dataset, setDataset] = useState<Record<string, any>[]>([]);
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [compilerArtifact, setCompilerArtifact] = useState<any>(null);
  const [mlArtifact, setMlArtifact] = useState<any>(null);
  const [loadingExample, setLoadingExample] = useState<boolean>(false);

  // Load existing ML artifact if available in store
  useEffect(() => {
    fetchArtifacts().then((arts) => {
      const ml = (arts || []).find((a: any) => a.artifact_type === 'ml_model' || a.engine === 'ml');
      if (ml) setMlArtifact(ml);
    }).catch(() => {});
  }, []);

  const handleDatasetLoaded = (newDataset: Record<string, any>[], newNumericCols: string[], newProfile: any) => {
    setDataset(newDataset);
    setNumericColumns(newNumericCols);
    setProfile(newProfile);
  };

  const handleLoadExampleAnalysis = async () => {
    setLoadingExample(true);
    try {
      const art = await loadExampleCompilerAnalysis();
      setCompilerArtifact(art);
    } catch (e) {
      console.error('Failed to load example analysis', e);
    } finally {
      setLoadingExample(false);
    }
  };

  const payload = compilerArtifact?.payload || {};
  const cfgInfo = payload.cfg || {};
  const progAgg = cfgInfo.program_aggregate || {};
  const nodesCount = compilerArtifact ? ((cfgInfo.nodes || []).length || progAgg.total_basic_blocks || 0) : 0;
  const edgesCount = compilerArtifact ? ((cfgInfo.edges || []).length || progAgg.total_edges || 0) : 0;
  const pCount = compilerArtifact ? (progAgg.connected_components || (cfgInfo.connected_components || []).length || 1) : 0;
  const programVg = compilerArtifact ? (progAgg.program_aggregate_cyclomatic_complexity || (edgesCount - nodesCount + 2 * pCount)) : 0;
  const methodCount = compilerArtifact ? (progAgg.total_methods || (cfgInfo.methods || []).length || 1) : 0;
  const maxMethodVg = compilerArtifact ? (progAgg.max_method_complexity || 0) : 0;
  const compilerSourceName = compilerArtifact?.source_name || compilerArtifact?.title || 'SoftwareRiskAnalyzer.java';

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 text-slate-900 font-sans">
      {/* Product Header (Pure Light Theme) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                CODEPULSE — INTELLIGENT SOFTWARE ANALYSIS PLATFORM
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> WORKSPACE ACTIVE
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Visual Intelligence Engine
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Transform compiler artifacts, tabular datasets, and machine learning outputs into actionable software architecture, complexity topology, and risk intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('data')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" /> Ingest Dataset
            </button>
          </div>
        </div>

        {/* Truthful Workspace Active Sources Provenance Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Compiler:</span>
            {compilerArtifact ? (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold">
                {compilerSourceName}
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-md">
                None (Awaiting Execution)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Dataset:</span>
            {dataset.length > 0 ? (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold">
                {profile?.summary?.dataset_name || 'SoftwareMetrics.csv'} ({dataset.length} records)
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-md">
                NONE
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">ML:</span>
            {mlArtifact ? (
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-bold">
                Executed ({mlArtifact.payload?.model_name || mlArtifact.metadata?.title || 'Trained Model'})
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-md">
                Not Executed
              </span>
            )}
          </div>
        </div>

        {/* Product Information Architecture Category Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">ANALYZE:</span>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Overview &amp; Health
            </button>
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'topology' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Software Topology (CFG / AST)
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'risk' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Complexity &amp; Risk
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'data' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Data Analytics &amp; Profiling
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'advanced' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Advanced Analytics
            </button>

            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">UNDERSTAND:</span>
            <button
              onClick={() => setActiveTab('story')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'story' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Visual Story
            </button>
            <button
              onClick={() => setActiveTab('lineage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'lineage' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Artifact Lineage
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'comparison' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              File Comparison
            </button>

            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">ACADEMIC:</span>
            <button
              onClick={() => setActiveTab('lab')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'lab' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Academic Lab (Ex 01–10)
            </button>
          </div>
        </div>
      </div>

      {/* OVERVIEW PAGE (100% LIGHT THEME) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Section 1: SOFTWARE COMPILER TOPOLOGY */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Software Compiler Topology
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold">
                Source: {compilerArtifact ? compilerSourceName : 'None (Awaiting Execution)'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Program V(G)</div>
                <div className="text-2xl font-bold text-indigo-600 font-mono mt-0.5">
                  {compilerArtifact ? programVg : 0}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  {compilerArtifact ? `E-N+2P (${edgesCount}-${nodesCount}+${2 * pCount})` : 'Awaiting Execution'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Connected Components (P)</div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
                  {compilerArtifact ? pCount : 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">CFG Component Subgraphs</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Methods</div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
                  {compilerArtifact ? methodCount : 0}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {compilerArtifact ? `Max Method V(G): ${maxMethodVg}` : 'Awaiting Execution'}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">CFG Nodes (N)</div>
                <div className="text-2xl font-bold text-emerald-600 font-mono mt-0.5">{nodesCount}</div>
                <div className="text-[10px] text-slate-500 mt-1">Basic Control Blocks</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">CFG Edges (E)</div>
                <div className="text-2xl font-bold text-cyan-600 font-mono mt-0.5">{edgesCount}</div>
                <div className="text-[10px] text-slate-500 mt-1">Branch Transitions</div>
              </div>
            </div>
          </div>

          {/* Section 2: TABULAR DATASET INTELLIGENCE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Tabular Dataset Intelligence
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                Source: {dataset.length > 0 ? (profile?.summary?.dataset_name || 'SoftwareMetrics.csv') : 'NONE'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Loaded Records</div>
                <div className="text-2xl font-bold text-purple-600 font-mono mt-0.5">{dataset.length}</div>
                <div className="text-[10px] text-slate-500 mt-1">Observations Ingested</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Numeric Columns</div>
                <div className="text-2xl font-bold text-amber-600 font-mono mt-0.5">{numericColumns.length}</div>
                <div className="text-[10px] text-slate-500 mt-1">Measured Feature Dimensions</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Data Quality Score</div>
                <div className="text-2xl font-bold text-emerald-600 font-mono mt-0.5">
                  {profile?.quality?.score !== undefined ? `${profile.quality.score} / 100` : dataset.length > 0 ? '100 / 100' : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {profile ? (
                    <span>
                      {profile.quality?.rating || 'EXCELLENT'} • Outliers: {profile.quality?.factors?.outlier_count || 0} / {dataset.length} ({Math.round(((profile.quality?.factors?.outlier_count || 0) / Math.max(1, dataset.length)) * 100)}%)
                    </span>
                  ) : dataset.length > 0 ? (
                    'Ingested & Verified'
                  ) : (
                    'No Dataset Ingested'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Pillar Actions if Workspace Components are Unloaded */}
          {(!compilerArtifact || dataset.length === 0 || !mlArtifact) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {!compilerArtifact && (
                <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase">Pillar 1: Compiler Engine</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 mb-1">No Compiler Artifact Loaded</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Analyze a source file in Compiler Studio or click below to inspect the verified reference SoftwareRiskAnalyzer artifact.
                    </p>
                  </div>
                  <button
                    onClick={handleLoadExampleAnalysis}
                    disabled={loadingExample}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {loadingExample ? 'Analyzing via Real Compiler...' : 'Try Example Analysis (SoftwareRiskAnalyzer.java)'}
                  </button>
                </div>
              )}

              {dataset.length === 0 && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">Pillar 2: Data Engine</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 mb-1">No Tabular Dataset Ingested</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Upload a CSV/JSON dataset in the Data Analytics Studio to unlock data profiling, correlations, outliers, and chart building.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('data')}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start"
                  >
                    <Database className="w-3.5 h-3.5" /> Open Data Analytics Studio
                  </button>
                </div>
              )}

              {!mlArtifact && (
                <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">Pillar 3: Machine Learning</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 mb-1">ML Engine — Not Executed</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      No trained machine learning model exists in the artifact store. Ingest a dataset with labels to train a defect predictor, or inspect static CFG risk.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('risk')}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> View Complexity &amp; Risk
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Software Health & Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => setActiveTab('topology')}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl group-hover:scale-105 transition-transform">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-indigo-700">EXPLORE TOPOLOGY →</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Software Topology (CFG &amp; AST)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Render interactive Control Flow Graphs, navigate basic blocks, trace method call hierarchies, and explore hierarchical Abstract Syntax Trees.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('risk')}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-purple-700">INSPECT RISK →</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Complexity &amp; Multi-Pillar Risk</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evidence-based software risk assessment strictly separating static compiler metrics, trained machine learning predictions, and data quality.
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('comparison')}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-cyan-50 text-cyan-700 rounded-xl group-hover:scale-105 transition-transform">
                  <GitCompare className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-bold text-cyan-700">COMPARE MODULES →</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">First-Class File Comparison</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Compare two source code files or compiler artifacts side-by-side with automated delta calculation for V(G), LOC, tokens, and CFG topology.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT VIEWS */}
      {activeTab === 'topology' && (
        <SoftwareIntelligenceExplorer compilerArtifact={compilerArtifact} />
      )}

      {activeTab === 'risk' && (
        <ComplexityRiskView 
          compilerArtifact={compilerArtifact}
          dataset={dataset}
          profile={profile}
        />
      )}

      {activeTab === 'data' && (
        <VisualAnalyticsStudio 
          onDatasetLoaded={handleDatasetLoaded}
          existingDataset={dataset}
          existingNumericCols={numericColumns}
          existingProfile={profile}
        />
      )}

      {activeTab === 'advanced' && (
        <AdvancedAnalyticsStudio dataset={dataset} numericColumns={numericColumns} />
      )}

      {activeTab === 'story' && (
        <VisualStoryExplorer 
          dataset={dataset} 
          numericColumns={numericColumns} 
          compilerArtifact={compilerArtifact} 
        />
      )}

      {activeTab === 'lineage' && <ArtifactLineageExplorer />}

      {activeTab === 'comparison' && <FileComparisonView />}

      {activeTab === 'lab' && <VisualizationLab />}
    </div>
  );
};
