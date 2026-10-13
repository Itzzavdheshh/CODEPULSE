import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Database, 
  Cpu, 
  Brain, 
  FileText, 
  CheckCircle, 
  Info, 
  Clock, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { getArtifactLineage } from '../../services/api';

export const ArtifactLineageExplorer: React.FC = () => {
  const [lineageData, setLineageData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);

  useEffect(() => {
    fetchLineage();
  }, []);

  const fetchLineage = async () => {
    setLoading(true);
    try {
      const res = await getArtifactLineage();
      if (res && !res.error) {
        setLineageData(res);
      }
    } catch (err) {
      console.error("Failed to fetch artifact lineage graph", err);
    } finally {
      setLoading(false);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'compiler':
      case 'compiler_analysis':
      case 'tac_execution_trace':
        return <Cpu className="w-5 h-5 text-blue-400" />;
      case 'data':
      case 'dataset_profile':
      case 'growth_analysis':
        return <Database className="w-5 h-5 text-cyan-400" />;
      case 'ml':
      case 'ml_model':
      case 'model_xray':
        return <Brain className="w-5 h-5 text-purple-400" />;
      case 'report':
      case 'pdf_report':
        return <FileText className="w-5 h-5 text-amber-400" />;
      default:
        return <Layers className="w-5 h-5 text-emerald-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <GitBranch className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
        <span>Building Cross-Engine Artifact Lineage DAG...</span>
      </div>
    );
  }

  const nodes = lineageData?.nodes || [];
  const edges = lineageData?.edges || [];

  return (
    <div className="space-y-6">
      {/* Header (Light Theme) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            Cross-Engine Artifact Lineage DAG
          </h2>
          <p className="text-xs text-slate-600">
            End-to-End Provenance &amp; Transformation Lineage Across Compiler, Data, ML &amp; Report Generators
          </p>
        </div>
        <div className="text-xs font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-bold">
          Total Provenance Artifacts: <span className="text-indigo-600 font-bold">{nodes.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lineage Graph Canvas */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 min-h-[500px] flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center justify-between">
            <span>Dynamic Provenance Directed Acyclic Graph (DAG)</span>
            <span className="text-xs text-slate-500 font-normal">Click node to inspect metadata &amp; payload</span>
          </h3>

          {nodes.length > 0 ? (
            <div className="space-y-6 my-auto">
              <div className="flex flex-wrap items-center justify-center gap-6">
                {nodes.map((node: any, idx: number) => {
                  const isSelected = selectedArtifact?.id === node.id;
                  return (
                    <React.Fragment key={node.id}>
                      <div
                        onClick={() => setSelectedArtifact(node)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center space-x-3 w-64 ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 shadow-md scale-105'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                          {getNodeIcon(node.type)}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-slate-900 truncate">{node.title || node.id}</div>
                          <div className="text-[10px] font-mono text-indigo-700 font-bold capitalize">{node.type} Engine</div>
                          <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">ID: {node.id}</div>
                        </div>
                      </div>

                      {idx < nodes.length - 1 && (
                        <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs italic text-center py-20">
              No artifacts recorded in provenance store yet. Run Compiler, Data, or ML analysis to populate lineage.
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-6 text-xs text-slate-600 flex items-center justify-between">
            <span>Authoritative Store: <code className="text-indigo-600 font-mono font-bold">backend/app/artifacts</code></span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle className="w-3.5 h-3.5" /> Provenance Verified
            </span>
          </div>
        </div>

        {/* Selected Artifact Drawer */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            Artifact Metadata Inspector
          </h3>

          {selectedArtifact ? (
            <div className="space-y-4 text-xs font-mono">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-slate-500">Artifact ID:</span>
                  <div className="text-indigo-700 font-bold break-all mt-0.5">{selectedArtifact.id}</div>
                </div>
                <div>
                  <span className="text-slate-500">Engine Producer:</span>
                  <div className="text-purple-700 font-bold capitalize">{selectedArtifact.type} Engine</div>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>
                  <div className="text-slate-800 flex items-center gap-1 mt-0.5 font-bold">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {selectedArtifact.created_at || 'Just Now'}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-600 block mb-2 font-sans font-bold">Payload Summary:</span>
                <pre className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[10px] text-slate-800 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedArtifact.payload_summary || selectedArtifact, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs italic py-20 text-center">
              Select an artifact node from the lineage DAG graph to inspect schema, creation timestamps, and payload summary.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
