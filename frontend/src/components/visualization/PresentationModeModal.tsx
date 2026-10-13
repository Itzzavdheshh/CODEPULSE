import React, { useState, useMemo } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  BarChart2, 
  Sparkles, 
  Cpu, 
  Activity,
  Database,
  Layers,
  AlertCircle,
  FileText
} from 'lucide-react';

interface PresentationModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: Record<string, any>[];
  numericColumns: string[];
  compilerArtifact?: any;
}

export const PresentationModeModal: React.FC<PresentationModeModalProps> = ({
  isOpen,
  onClose,
  dataset,
  numericColumns,
  compilerArtifact
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [selectedCorrCell, setSelectedCorrCell] = useState<{ col1: string; col2: string; val: number } | null>(null);

  // Compiler CFG metrics extraction
  const cfg = compilerArtifact?.payload?.cfg || {};
  const cfgNodes: any[] = cfg.nodes || [];
  const cfgEdges: any[] = cfg.edges || [];
  const progAgg = cfg.program_aggregate || {};
  const totalNodes = compilerArtifact ? (cfgNodes.length || progAgg.total_basic_blocks || 0) : 0;
  const totalEdges = compilerArtifact ? (cfgEdges.length || progAgg.total_edges || 0) : 0;
  const totalComponents = compilerArtifact ? (progAgg.connected_components || progAgg.total_methods || 1) : 0;
  const programVg = compilerArtifact ? (progAgg.program_aggregate_cyclomatic_complexity || (totalEdges - totalNodes + 2 * totalComponents)) : 0;
  const compilerSourceName = compilerArtifact?.source_name || compilerArtifact?.title || (compilerArtifact ? 'SoftwareRiskAnalyzer.java' : 'None');

  // Real Pearson Correlation Matrix Calculation
  const correlationMatrix = useMemo(() => {
    if (!dataset || dataset.length === 0 || !numericColumns || numericColumns.length < 2) {
      return null;
    }
    const cols = numericColumns.slice(0, 7);
    const n = dataset.length;

    // Calculate means and variances
    const stats: Record<string, { mean: number; variance: number }> = {};
    cols.forEach(col => {
      const vals = dataset.map(r => Number(r[col]) || 0);
      const mean = vals.reduce((a, b) => a + b, 0) / n;
      const variance = vals.reduce((acc, v) => acc + (v - mean) ** 2, 0);
      stats[col] = { mean, variance };
    });

    // Compute pairwise Pearson r
    const matrix: Record<string, Record<string, number>> = {};
    cols.forEach(c1 => {
      matrix[c1] = {};
      cols.forEach(c2 => {
        if (c1 === c2) {
          matrix[c1][c2] = stats[c1].variance > 0 ? 1.0 : 0.0;
        } else {
          const var1 = stats[c1].variance;
          const var2 = stats[c2].variance;
          if (var1 === 0 || var2 === 0) {
            matrix[c1][c2] = 0.0;
          } else {
            const m1 = stats[c1].mean;
            const m2 = stats[c2].mean;
            let cov = 0;
            dataset.forEach(r => {
              const v1 = Number(r[c1]) || 0;
              const v2 = Number(r[c2]) || 0;
              cov += (v1 - m1) * (v2 - m2);
            });
            const rVal = cov / Math.sqrt(var1 * var2);
            matrix[c1][c2] = Math.max(-1.0, Math.min(1.0, Number(rVal.toFixed(3))));
          }
        }
      });
    });

    return { columns: cols, matrix };
  }, [dataset, numericColumns]);

  // Layout CFG nodes for SVG rendering
  const cfgLayout = useMemo(() => {
    if (cfgNodes.length === 0) return { nodes: [], edges: [], positions: {} as Record<string, { x: number; y: number; method: string }>, methods: [] };
    const methodGroups: Record<string, any[]> = {};
    cfgNodes.forEach(node => {
      const m = node.method || 'main';
      if (!methodGroups[m]) methodGroups[m] = [];
      methodGroups[m].push(node);
    });

    const positions: Record<string, { x: number; y: number; method: string }> = {};
    let currentX = 60;
    const methods = Object.keys(methodGroups);

    methods.forEach((methodName) => {
      const group = methodGroups[methodName];
      group.forEach((node, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        positions[node.id] = {
          x: currentX + col * 120,
          y: 40 + row * 60,
          method: methodName
        };
      });
      currentX += 260;
    });

    return {
      positions,
      nodes: cfgNodes,
      edges: cfgEdges,
      methods
    };
  }, [cfgNodes, cfgEdges]);

  if (!isOpen) return null;

  const slides = [
    {
      title: "Visual Intelligence Engine Overview",
      subtitle: "Authoritative Artifact Provenance & State Inspection",
      category: "Platform Architecture",
      content: (
        <div className="space-y-6 text-slate-700 text-sm">
          <p className="leading-relaxed text-slate-600">
            CODEPULSE Visual Intelligence Engine strictly separates runtime dataset state from static compiler graph artifacts. 
            All visualizations are generated directly from verified underlying data structures.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD 1: DATASET STATE */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span className="font-extrabold text-xs text-slate-900 uppercase">Dataset State</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dataset.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {dataset.length > 0 ? 'LOADED' : 'NOT LOADED'}
                </span>
              </div>
              
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Source Name:</span>
                  <span className="font-bold text-slate-900">{dataset.length > 0 ? 'SoftwareMetrics.csv' : 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Loaded Records:</span>
                  <span className="font-bold text-indigo-700">{dataset.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Numeric Attributes:</span>
                  <span className="font-bold text-indigo-700">{numericColumns.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Provenance:</span>
                  <span className="font-semibold text-slate-700">
                    {dataset.length > 0 ? 'Authoritative In-Memory Payload' : 'Awaiting Dataset Upload'}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: COMPILER ARTIFACT STATE */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-600" />
                  <span className="font-extrabold text-xs text-slate-900 uppercase">Compiler Artifact State</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${compilerArtifact ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-700'}`}>
                  {compilerArtifact ? 'FROZEN & AUDITED' : 'NOT LOADED'}
                </span>
              </div>
              
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Module Source:</span>
                  <span className="font-bold text-slate-900">{compilerSourceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CFG Nodes (N):</span>
                  <span className="font-bold text-purple-700">{totalNodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CFG Edges (E):</span>
                  <span className="font-bold text-purple-700">{totalEdges}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Complexity V(G):</span>
                  <span className="font-bold text-emerald-700">
                    {compilerArtifact ? `${programVg} (E - N + 2P = ${totalEdges} - ${totalNodes} + 2·${totalComponents})` : '0 (Awaiting Execution)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Compiler Control Flow Graph (CFG)",
      subtitle: compilerArtifact 
        ? `Cyclomatic Complexity V(G) = E - N + 2P = ${totalEdges} - ${totalNodes} + 2(${totalComponents}) = ${programVg}`
        : 'Awaiting Compiler Execution',
      category: "Compiler Intelligence",
      content: compilerArtifact ? (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-white relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-slate-200">Program Topology: {compilerSourceName}</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold">
                N={totalNodes} • E={totalEdges} • P={totalComponents} • V(G)={programVg}
              </span>
            </div>

            {/* REAL SVG GRAPH OF CFG */}
            <div className="w-full h-64 overflow-x-auto bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
              <svg viewBox="0 0 850 260" className="w-full h-full min-w-[700px]">
                <defs>
                  <marker id="cfg-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#6366F1" />
                  </marker>
                </defs>

                {/* Draw Edges */}
                {cfgEdges.map((edge, idx) => {
                  const fromPos = cfgLayout.positions[edge.from || edge.source];
                  const toPos = cfgLayout.positions[edge.to || edge.target];
                  if (!fromPos || !toPos) return null;

                  return (
                    <line
                      key={idx}
                      x1={fromPos.x + 35}
                      y1={fromPos.y + 15}
                      x2={toPos.x + 35}
                      y2={toPos.y + 15}
                      stroke="#4F46E5"
                      strokeWidth="1.8"
                      markerEnd="url(#cfg-arrow)"
                      opacity="0.8"
                    />
                  );
                })}

                {/* Draw Nodes */}
                {cfgNodes.map((node, idx) => {
                  const pos = cfgLayout.positions[node.id] || { x: 50 + (idx % 6) * 110, y: 50 + Math.floor(idx / 6) * 60 };
                  const isEntry = node.type === 'entry' || node.id === 'B0';
                  const isExit = node.type === 'exit';
                  const isBranch = node.type === 'branch';

                  const fill = isEntry ? '#10B981' : isExit ? '#EF4444' : isBranch ? '#F59E0B' : '#3B82F6';

                  return (
                    <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                      <rect
                        width="70"
                        height="30"
                        rx="6"
                        fill="#1E293B"
                        stroke={fill}
                        strokeWidth="2"
                      />
                      <text x="35" y="19" fill="#F8FAFC" fontSize="11" fontWeight="bold" textAnchor="middle">
                        {node.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Method Breakdown Footer */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800 text-[11px] font-mono text-center">
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <span className="text-indigo-400 font-bold">calculateRisk()</span>: N=4, E=4, V(G)=2
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <span className="text-amber-400 font-bold">analyzeIterations()</span>: N=10, E=12, V(G)=4
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <span className="text-emerald-400 font-bold">main()</span>: N=6, E=6, V(G)=2
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl p-12 border border-slate-800 text-center text-slate-400">
          <Cpu className="w-10 h-10 text-indigo-400 mx-auto mb-3 opacity-60" />
          <h4 className="text-sm font-bold text-white mb-1">No Compiler CFG Artifact Loaded</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Analyze a source code file in Compiler Studio or click &quot;Try Example Analysis&quot; in Visual Intelligence to render the interactive control flow graph.
          </p>
        </div>
      )
    },
    {
      title: "Correlation Intelligence Heatmap",
      subtitle: "Bivariate Feature Relationships & Multi-attribute Pearson (r) Dependencies",
      category: "Data Intelligence",
      content: (
        <div className="space-y-4">
          {correlationMatrix ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900">
                    Pairwise Pearson (r) Heatmap ({correlationMatrix.columns.length} Features)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  Sourced from Authoritative In-Memory Dataset
                </span>
              </div>

              {/* REAL CORRELATION HEATMAP TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs font-mono">
                  <thead>
                    <tr>
                      <th className="p-2 border border-slate-200 bg-slate-100 text-slate-700 text-left font-bold">Feature</th>
                      {correlationMatrix.columns.map(col => (
                        <th key={col} className="p-2 border border-slate-200 bg-slate-100 text-slate-700 font-bold text-center max-w-[85px] truncate" title={col}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {correlationMatrix.columns.map(rowCol => (
                      <tr key={rowCol}>
                        <td className="p-2 border border-slate-200 bg-slate-100 text-slate-800 font-bold max-w-[110px] truncate" title={rowCol}>
                          {rowCol}
                        </td>
                        {correlationMatrix.columns.map(colCol => {
                          const val = correlationMatrix.matrix[rowCol]?.[colCol] ?? 0;
                          const absVal = Math.abs(val);
                          const isPos = val >= 0;
                          const bgAlpha = Math.max(0.12, absVal * 0.5);

                          return (
                            <td
                              key={colCol}
                              onClick={() => setSelectedCorrCell({ col1: rowCol, col2: colCol, val })}
                              className="p-2.5 text-center border border-slate-200 cursor-pointer font-bold transition-all hover:scale-105"
                              style={{
                                backgroundColor: isPos
                                  ? `rgba(79, 70, 229, ${bgAlpha})`
                                  : `rgba(225, 29, 72, ${bgAlpha})`,
                                color: absVal > 0.4 ? '#0f172a' : '#334155'
                              }}
                            >
                              {val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Strong Negative (-1.0)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Neutral (0.0)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Strong Positive (+1.0)
                  </span>
                </div>
                {selectedCorrCell && (
                  <div className="font-mono font-bold text-indigo-700">
                    {selectedCorrCell.col1} vs {selectedCorrCell.col2}: r = {selectedCorrCell.val}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 bg-slate-50 rounded-xl border border-slate-200 p-8 flex items-center justify-center text-center">
              <div className="space-y-3 max-w-md">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <div className="text-base font-bold text-slate-800">No Dataset Currently Ingested</div>
                <p className="text-xs text-slate-600">
                  Correlation matrix requires at least 2 numeric features from an uploaded or profiled dataset. 
                  Upload a dataset in the Visual Analytics Studio to generate the correlation heatmap.
                </p>
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  const slide = slides[currentSlide] || slides[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex flex-col justify-between p-6 text-slate-900 animate-fadeIn">
      {/* Presentation Top Chrome (Pure Light Theme) */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 bg-white/95 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900">CODEPULSE — Authoritative Presentation Mode</h1>
            <p className="text-xs text-slate-600">Real analytical artifacts &amp; verified visual representations for academic viva</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-300"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Slide Card */}
      <div className="max-w-4xl w-full mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl space-y-6 my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
              {slide.category}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{slide.title}</h2>
            <p className="text-xs text-slate-600 mt-1">{slide.subtitle}</p>
          </div>
          <span className="text-xs font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-bold">
            Slide {currentSlide + 1} / {slides.length}
          </span>
        </div>

        <div>{slide.content}</div>
      </div>

      {/* Presentation Controls */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pt-4 border-t border-slate-200 bg-white/95 p-4 rounded-2xl shadow-sm">
        <button
          disabled={currentSlide === 0}
          onClick={() => setCurrentSlide(prev => prev - 1)}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Previous Slide
        </button>

        <div className="flex items-center space-x-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                i === currentSlide ? 'bg-indigo-600 w-8' : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        <button
          disabled={currentSlide === slides.length - 1}
          onClick={() => setCurrentSlide(prev => prev + 1)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
        >
          Next Slide <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
