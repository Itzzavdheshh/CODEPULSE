import React, { useState, useEffect } from 'react';
import { 
  Network, 
  GitCommit, 
  Layers, 
  Cpu, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  AlertTriangle, 
  FileCode, 
  CheckCircle,
  Search,
  ChevronRight,
  ChevronDown,
  Info,
  Sparkles
} from 'lucide-react';
import { getCompilerArtifact, loadExampleCompilerAnalysis } from '../../services/api';

interface SoftwareIntelligenceExplorerProps {
  compilerArtifact?: any;
}

export const SoftwareIntelligenceExplorer: React.FC<SoftwareIntelligenceExplorerProps> = ({ compilerArtifact: propArtifact }) => {
  const [artifact, setArtifact] = useState<any>(propArtifact || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'cfg' | 'ast' | 'complexity' | 'dependencies'>('cfg');
  
  // CFG state
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // AST state
  const [astSearch, setAstSearch] = useState<string>('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'root': true });
  const [selectedAstNode, setSelectedAstNode] = useState<any>(null);

  useEffect(() => {
    setArtifact(propArtifact || null);
  }, [propArtifact]);

  const handleLoadExample = async () => {
    setLoading(true);
    try {
      const art = await loadExampleCompilerAnalysis();
      setArtifact(art);
    } catch (err) {
      console.error("Failed to load example compiler artifact", err);
    } finally {
      setLoading(false);
    }
  };

  const payload = artifact?.payload || artifact || {};
  const cfgData = payload.cfg || payload.control_flow_graph;
  const astData = payload.ast || payload.abstract_syntax_tree;
  const metricsData = payload.metrics || payload.complexity_metrics || {};
  const symbolData = payload.symbols || payload.symbol_table || [];

  const progAgg = cfgData?.program_aggregate || {};
  const methodsCfg: Record<string, any> = cfgData?.methods || {};
  const sourceFileName = artifact?.source_name || artifact?.metadata?.source_file || artifact?.title || 'SoftwareRiskAnalyzer.java';
  const nodesCount = (cfgData?.nodes || []).length || progAgg.total_basic_blocks || 0;
  const edgesCount = (cfgData?.edges || []).length || progAgg.total_edges || 0;
  const pCount = progAgg.connected_components || 1;
  const programVg = progAgg.program_aggregate_cyclomatic_complexity || (edgesCount - nodesCount + 2 * pCount);
  const maxMethodVg = progAgg.max_method_complexity || 0;
  const tokensCount = metricsData.tokens_count || (payload.tokens || []).length || 0;

  const methodsList = Object.keys(methodsCfg);
  let hotspotMethod = 'None';
  let hotspotVg = 0;
  methodsList.forEach(m => {
    const cc = methodsCfg[m]?.cyclomatic_complexity || 0;
    if (cc > hotspotVg) {
      hotspotVg = cc;
      hotspotMethod = m;
    }
  });
  if (hotspotMethod === 'None' && methodsList.length > 0) {
    hotspotMethod = methodsList[0];
    hotspotVg = methodsCfg[hotspotMethod]?.cyclomatic_complexity || 1;
  }

  // CFG Rendering Math
  const getCfgNodesAndEdges = () => {
    const nodePositions: Record<string, { x: number; y: number }> = {};
    const defaultBounds = { minX: 0, minY: 0, width: 1000, height: 600 };
    if (!cfgData) return { nodes: [], edges: [], methods: [], nodePositions, methodGroups: {}, bounds: defaultBounds };

    let rawNodes: any[] = [...(cfgData.nodes || [])];
    let rawEdges: any[] = [...(cfgData.edges || [])];

    // Fallback: if top-level nodes/edges are empty, harvest from methodsCfg
    if (rawNodes.length === 0 && methodsCfg && Object.keys(methodsCfg).length > 0) {
      Object.entries(methodsCfg).forEach(([mName, mData]: [string, any]) => {
        if (Array.isArray(mData.nodes)) rawNodes.push(...mData.nodes);
        if (Array.isArray(mData.edges)) rawEdges.push(...mData.edges);
      });
    }

    // Authoritative methods list
    const methods: string[] = Object.keys(methodsCfg).length > 0
      ? Object.keys(methodsCfg)
      : Array.from(new Set(rawNodes.map((n: any) => n.method_name || n.method || 'main')));

    // Filter by selected method if not 'all'
    let displayNodes = rawNodes;
    let displayEdges = rawEdges;

    if (selectedMethod !== 'all') {
      displayNodes = rawNodes.filter((n: any) => (n.method_name || n.method) === selectedMethod);
      displayEdges = rawEdges.filter((e: any) => (e.method || e.method_name) === selectedMethod);
    }

    // Group display nodes by method to layout each method as an independent connected component swimlane
    const methodGroups: Record<string, any[]> = {};
    displayNodes.forEach(node => {
      const m = node.method_name || node.method || 'main';
      if (!methodGroups[m]) methodGroups[m] = [];
      methodGroups[m].push(node);
    });

    let currentX = 140;
    const groupNames = Object.keys(methodGroups);

    groupNames.forEach((methodName) => {
      const nodesInMethod = methodGroups[methodName];
      nodesInMethod.forEach((node, idx) => {
        const uniqueKey = node.global_id || `${methodName}_${node.id}`;
        // Clean 2-column flow within the method swimlane:
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const posX = currentX + col * 180;
        const posY = 120 + row * 110;

        nodePositions[uniqueKey] = { x: posX, y: posY };
        // Support direct node.id lookup when filtering to single method or if unique
        if (selectedMethod !== 'all' || !nodePositions[node.id]) {
          nodePositions[node.id] = { x: posX, y: posY };
        }
      });
      currentX += 420;
    });

    // Compute bounding box to auto-fit viewport
    const allX = Object.values(nodePositions).map(p => p.x);
    const allY = Object.values(nodePositions).map(p => p.y);
    const minX = allX.length > 0 ? Math.min(...allX) - 100 : 0;
    const maxX = allX.length > 0 ? Math.max(...allX) + 120 : 1000;
    const minY = allY.length > 0 ? Math.min(...allY) - 70 : 0;
    const maxY = allY.length > 0 ? Math.max(...allY) + 80 : 600;

    const bounds = {
      minX: Math.round(minX),
      minY: Math.round(minY),
      width: Math.max(900, Math.round(maxX - minX)),
      height: Math.max(550, Math.round(maxY - minY))
    };

    return { nodes: displayNodes, edges: displayEdges, methods, nodePositions, methodGroups, bounds };
  };

  const { nodes: cfgNodes, edges: cfgEdges, methods: cfgMethods, nodePositions = {}, methodGroups = {}, bounds = { minX: 0, minY: 0, width: 1000, height: 600 } } = getCfgNodesAndEdges();

  const toggleAstExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderAstNode = (node: any, depth = 0, key = 'root') => {
    if (!node) return null;
    const isExpanded = expandedNodes[key];
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedAstNode?.id === node.id || selectedAstNode === node;
    const matchesSearch = astSearch === '' || 
      (node.type || '').toLowerCase().includes(astSearch.toLowerCase()) || 
      (node.value || '').toLowerCase().includes(astSearch.toLowerCase());

    if (!matchesSearch && !hasChildren) return null;

    return (
      <div key={key} className="ml-4 my-1">
        <div 
          onClick={() => {
            setSelectedAstNode(node);
            if (hasChildren) toggleAstExpand(key);
          }}
          className={`flex items-center space-x-2 py-1 px-2.5 rounded-lg cursor-pointer text-xs font-mono transition-all duration-200 ${
            isSelected 
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 shadow-xs' 
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <span className="w-3.5 h-3.5 inline-block text-center text-slate-400">•</span>
          )}
          <span className="font-bold text-emerald-700">{node.type || 'ASTNode'}</span>
          {node.value && <span className="text-amber-700 font-mono font-semibold">"{node.value}"</span>}
          {node.name && <span className="text-indigo-600 font-semibold">name={node.name}</span>}
          {node.line && <span className="text-slate-400 text-[10px]">L{node.line}</span>}
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-slate-200 ml-2 pl-2">
            {node.children.map((child: any, idx: number) => renderAstNode(child, depth + 1, `${key}-${idx}`))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500">
        <Cpu className="w-6 h-6 animate-spin mr-3 text-indigo-600" />
        <span>Loading compiler artifact intelligence...</span>
      </div>
    );
  }

  if (!artifact && !cfgData && !astData && metricsData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center max-w-2xl mx-auto my-8">
        <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Compiler Artifact Available</h3>
        <p className="text-sm text-slate-600 mb-4">
          To unlock software intelligence visualizations, analyze a source file in Compiler Studio or inspect the reference verified artifact.
        </p>
        <button
          onClick={handleLoadExample}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 mx-auto mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" /> Try Example Analysis (SoftwareRiskAnalyzer.java)
        </button>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs font-mono text-slate-800">
          <p className="text-indigo-700 font-bold mb-1">Available Standalone Options:</p>
          <p className="text-slate-600">• Switch to Data Analytics & Profiling to upload custom CSV/JSON datasets.</p>
          <p className="text-slate-600">• Explore Syllabus Experiments in the Academic Lab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Hero Software Intelligence Overview Card (Pure Light Theme) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                COMPILER ARTIFACT HERO VIEW
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-300 font-semibold">
                {artifact?.source_name || artifact?.title || 'SoftwareRiskAnalyzer.java'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" /> Software Intelligence Explorer
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-amber-50 text-amber-800 font-mono text-xs font-bold rounded-lg border border-amber-200">
              STATIC RISK: MODERATE
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-[10px] rounded border border-slate-300 font-bold">
              STATIC ANALYSIS
            </span>
          </div>
        </div>

        {/* Hero Metrics Strip: SOURCE, STRUCTURE, COMPLEXITY, RISK */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">1. SOURCE PROPERTIES</span>
            <div className="text-xs font-mono font-bold text-slate-900">{sourceFileName} (Java)</div>
            <div className="text-[11px] text-slate-600 font-mono mt-1">{tokensCount} Tokens • {methodsList.length} Methods</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">2. CONTROL STRUCTURE</span>
            <div className="text-xs font-mono font-bold text-emerald-700">{nodesCount} CFG Basic Blocks</div>
            <div className="text-[11px] text-slate-600 font-mono mt-1">{edgesCount} Edges • {pCount} Components</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">3. COMPLEXITY SCORES</span>
            <div className="text-xs font-mono font-bold text-indigo-700">Program V(G) = {programVg}</div>
            <div className="text-[11px] text-slate-600 font-mono mt-1">Max Method V(G) = {maxMethodVg}</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">4. COMPLEXITY HOTSPOT</span>
            <div className="text-xs font-mono font-bold text-purple-700">{hotspotMethod}()</div>
            <div className="text-[11px] text-slate-600 font-mono mt-1">V(G) = {hotspotVg} • Highest Depth</div>
          </div>
        </div>

        {/* Method Breakdown Strip */}
        <div className="pt-2">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">Authoritative Method Analysis Breakdown</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {methodsList.map(mName => {
              const mData = methodsCfg[mName] || {};
              const cc = mData.cyclomatic_complexity || 1;
              const nCnt = (mData.nodes || []).length;
              const eCnt = (mData.edges || []).length;
              const riskText = cc <= 5 ? 'LOW RISK' : cc <= 10 ? 'MODERATE RISK' : 'HIGH RISK';
              const riskColor = cc <= 5 ? 'text-emerald-700' : cc <= 10 ? 'text-amber-700' : 'text-rose-700';

              return (
                <div key={mName} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{mName}()</span>
                    <div className="text-[10px] text-slate-500">{nCnt} Blocks • {eCnt} Edges</div>
                  </div>
                  <div className="text-right">
                    <span className={`${riskColor} font-bold`}>V(G)={cc}</span>
                    <div className={`text-[9px] ${riskColor} font-bold`}>{riskText}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-navigation (Light Theme) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Interactive Structural Explorers
          </h3>
          <p className="text-xs text-slate-600">
            Switch between Control Flow Graph, Abstract Syntax Tree, Complexity Analytics, and Symbol Matrices
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSubTab('cfg')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === 'cfg' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Control Flow Graph (CFG)
          </button>
          <button
            onClick={() => setActiveSubTab('ast')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === 'ast' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            AST Explorer
          </button>
          <button
            onClick={() => setActiveSubTab('complexity')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === 'complexity' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Complexity Analytics
          </button>
          <button
            onClick={() => setActiveSubTab('dependencies')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === 'dependencies' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Symbol &amp; Dependency
          </button>
        </div>
      </div>


      {/* SUB-TAB 1: CFG EXPLORER */}
      {activeSubTab === 'cfg' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col h-[600px] relative overflow-hidden">
            {/* Control Bar */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-600 font-medium">Filter Method:</span>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Methods</option>
                  {cfgMethods.map(m => (
                    <option key={m} value={m}>{m}()</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.5))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.4))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300"
                  title="Reset View"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive SVG Canvas (Light Canvas) */}
            {(!cfgData || cfgNodes.length === 0) ? (
              <div className="flex-1 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Control Flow Graph Artifact Loaded</h4>
                <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
                  Run Compiler Studio to generate the basic block topology, or load the verified reference SoftwareRiskAnalyzer benchmark.
                </p>
                <button
                  onClick={handleLoadExample}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {loading ? 'Analyzing Compiler Artifact...' : 'Load SoftwareRiskAnalyzer.java Artifact'}
                </button>
              </div>
            ) : (
              <div 
                className={`flex-1 bg-slate-50/80 rounded-xl border border-slate-200 relative overflow-hidden select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <svg 
                  className="w-full h-full"
                  viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.15s ease-out'
                  }}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="8"
                      markerHeight="6"
                      refX="7"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 8 3, 0 6" fill="#4f46e5" />
                    </marker>
                  </defs>

                  {/* Method Swimlane Headers when All Methods are shown */}
                  {selectedMethod === 'all' && Object.keys(methodGroups).map((mName, mIdx) => {
                    const mData = methodsCfg[mName] || {};
                    const cc = mData.cyclomatic_complexity || 1;
                    const headerX = 140 + mIdx * 420 + 90;
                    return (
                      <g key={`method-header-${mName}`}>
                        <rect
                          x={headerX - 110}
                          y="42"
                          width="220"
                          height="28"
                          rx="6"
                          fill="#f8fafc"
                          stroke="#cbd5e1"
                          strokeWidth="1"
                        />
                        <text
                          x={headerX}
                          y="60"
                          fill="#312e81"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {mName}() • V(G)={cc}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw Edges */}
                  {cfgEdges.map((edge, idx) => {
                    const edgeMethod = edge.method || edge.method_name || (selectedMethod !== 'all' ? selectedMethod : '');
                    const fromKey = edge.from.includes('_') ? edge.from : `${edgeMethod}_${edge.from}`;
                    const toKey = edge.to.includes('_') ? edge.to : `${edgeMethod}_${edge.to}`;

                    const fromPos = nodePositions[fromKey] || nodePositions[edge.from];
                    const toPos = nodePositions[toKey] || nodePositions[edge.to];

                    if (!fromPos || !toPos) return null;

                    const isLoop = fromPos.x === toPos.x && fromPos.y === toPos.y;
                    if (isLoop) {
                      return (
                        <path
                          key={`edge-${idx}`}
                          d={`M ${fromPos.x} ${fromPos.y - 22} C ${fromPos.x - 40} ${fromPos.y - 60}, ${fromPos.x + 40} ${fromPos.y - 60}, ${fromPos.x} ${fromPos.y - 22}`}
                          fill="none"
                          stroke="#d97706"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    }

                    // Curve calculation
                    const dx = toPos.x - fromPos.x;
                    const dy = toPos.y - fromPos.y;
                    const isBackedge = edge.type?.includes('back') || dy < 0;
                    const controlX = fromPos.x + dx / 2 + (dx === 0 && dy < 0 ? -45 : 0);
                    const controlY = fromPos.y + dy / 2 + (dx === 0 && dy > 0 ? 0 : 25);

                    const isFalse = edge.type?.includes('false');
                    const isTrue = edge.type?.includes('true');
                    const strokeColor = isFalse ? '#dc2626' : isTrue ? '#059669' : isBackedge ? '#d97706' : '#6366f1';

                    return (
                      <g key={`edge-${idx}`}>
                        <path
                          d={`M ${fromPos.x} ${fromPos.y + 22} Q ${controlX} ${controlY}, ${toPos.x} ${toPos.y - 22}`}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="2"
                          strokeDasharray={isBackedge ? '4 4' : undefined}
                          markerEnd="url(#arrowhead)"
                        />
                        {edge.label && (
                          <text
                            x={controlX}
                            y={controlY - 5}
                            fill="#475569"
                            fontSize="9"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {edge.label}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Draw Nodes */}
                  {cfgNodes.map((node) => {
                    const nodeMethod = node.method_name || node.method || 'main';
                    const uniqueKey = node.global_id || `${nodeMethod}_${node.id}`;
                    const pos = nodePositions[uniqueKey] || nodePositions[node.id];
                    if (!pos) return null;

                    const isSelected = selectedNode?.id === node.id && (selectedNode?.method_name === nodeMethod || selectedNode?.method === nodeMethod);
                    const isEntry = node.type === 'entry' || node.id === 'B0' || node.label?.toLowerCase().includes('entry');
                    const isExit = node.type === 'exit' || node.label?.toLowerCase().includes('exit');

                    return (
                      <g 
                        key={uniqueKey} 
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => setSelectedNode(node)}
                        className="cursor-pointer"
                      >
                        <rect
                          x="-70"
                          y="-22"
                          width="140"
                          height="44"
                          rx="10"
                          fill={
                            isSelected 
                              ? '#eff6ff' 
                              : isEntry 
                              ? '#ecfdf5' 
                              : isExit 
                              ? '#f5f3ff' 
                              : '#ffffff'
                          }
                          stroke={
                            isSelected 
                              ? '#2563eb' 
                              : isEntry 
                              ? '#059669' 
                              : isExit 
                              ? '#7c3aed' 
                              : '#cbd5e1'
                          }
                          strokeWidth={isSelected ? '2.5' : '1.5'}
                        />
                        <text
                          x="0"
                          y="-4"
                          fill={isSelected ? '#1e40af' : isEntry ? '#065f46' : isExit ? '#5b21b6' : '#0f172a'}
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {node.id} ({nodeMethod})
                        </text>
                        <text
                          x="0"
                          y="12"
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {node.instructions_count ?? (node.instructions ? node.instructions.length : 0)} instrs
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Node Detail Drawer (Light Theme) */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <Info className="w-4 h-4 text-indigo-600" />
                Basic Block Inspector
              </h3>

              {selectedNode ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500">Block ID:</span>
                    <span className="ml-2 font-mono font-bold text-indigo-700">{selectedNode.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Method:</span>
                    <span className="ml-2 font-mono text-emerald-700">{selectedNode.method_name || selectedNode.method || 'Global'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Type:</span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                      {selectedNode.type || 'Basic Block'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Statements / TAC:</span>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 max-h-48 overflow-y-auto space-y-1">
                      {(selectedNode.instructions || selectedNode.statements) ? (
                        Array.isArray(selectedNode.instructions || selectedNode.statements) ? (
                          (selectedNode.instructions || selectedNode.statements).map((stmt: string, i: number) => (
                            <div key={i} className="text-slate-800">• {stmt}</div>
                          ))
                        ) : (
                          <div className="text-slate-800">{selectedNode.instructions || selectedNode.statements}</div>
                        )
                      ) : (
                        <div className="text-slate-400 italic">No direct statements bound</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500">Cyclomatic Contribution:</span>
                    <span className="ml-2 font-bold text-amber-700">+1 Decision Node</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs italic py-12 text-center">
                  Click any block in the CFG graph to inspect basic block statements, successors, and control flow contribution.
                </div>
              )}
            </div>

            {/* Metrics summary footer */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mt-4">
              <div className="text-[11px] font-semibold text-slate-600 mb-2">CFG Summary</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Nodes (N)</div>
                  <div className="text-indigo-600 font-bold">{cfgNodes.length}</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Edges (E)</div>
                  <div className="text-emerald-600 font-bold">{cfgEdges.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AST EXPLORER */}
      {activeSubTab === 'ast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col h-[550px]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Abstract Syntax Tree Hierarchy</h3>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter AST nodes..."
                  value={astSearch}
                  onChange={(e) => setAstSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg pl-8 pr-3 py-1 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 bg-slate-50/80 rounded-xl border border-slate-200 p-4 overflow-y-auto">
              {astData ? (
                renderAstNode(astData)
              ) : (
                <div className="text-slate-500 text-xs italic text-center py-12">
                  No AST tree structure in compiler artifact.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-600" />
              AST Node Details
            </h3>

            {selectedAstNode ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500">Node Type:</span>
                  <span className="ml-2 font-mono font-bold text-emerald-700">{selectedAstNode.type || 'Unknown'}</span>
                </div>
                {selectedAstNode.value && (
                  <div>
                    <span className="text-slate-500">Value:</span>
                    <span className="ml-2 font-mono text-amber-700 font-semibold">"{selectedAstNode.value}"</span>
                  </div>
                )}
                {selectedAstNode.line && (
                  <div>
                    <span className="text-slate-500">Source Line:</span>
                    <span className="ml-2 font-mono text-indigo-600 font-semibold">Line {selectedAstNode.line}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Child Count:</span>
                  <span className="ml-2 font-mono text-slate-800 font-semibold">{selectedAstNode.children?.length || 0}</span>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <span className="text-slate-500 block mb-2 font-medium">Raw Payload JSON:</span>
                  <pre className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-800 overflow-x-auto max-h-60">
                    {JSON.stringify(selectedAstNode, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs italic py-12 text-center">
                Select an AST node from the tree viewer to inspect properties and token bounds.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COMPLEXITY ANALYTICS */}
      {activeSubTab === 'complexity' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Method-Level Complexity Analytics</h3>
            <p className="text-xs text-slate-600 mb-4">
              Detailed McCabe cyclomatic complexity, decision points, and risk classification across all methods.
            </p>
            {methodsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {methodsList.map((mName, idx) => {
                  const mData = methodsCfg[mName] || {};
                  const cc = mData.cyclomatic_complexity || 1;
                  const isLow = cc <= 5;
                  const isMod = cc > 5 && cc <= 10;
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-indigo-700 font-mono">{mName}()</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          isLow ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isMod ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isLow ? 'LOW RISK' : isMod ? 'MODERATE RISK' : 'HIGH RISK'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 mt-3">
                        <div>Cyclomatic V(G): <span className="text-indigo-600 font-bold">{cc}</span></div>
                        <div>Decisions: <span className="text-slate-900 font-bold">{mData.decision_points ?? 0}</span></div>
                        <div>CFG Nodes (N): <span className="text-emerald-700 font-bold">{(mData.nodes || []).length}</span></div>
                        <div>CFG Edges (E): <span className="text-cyan-700 font-bold">{(mData.edges || []).length}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                No method complexity data available. Load a compiler artifact to inspect complexity.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DEPENDENCIES */}
      {activeSubTab === 'dependencies' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-600" />
            Symbol Table &amp; Inter-Method Dependency Map
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Declared Symbols</h4>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2 max-h-80 overflow-y-auto font-mono text-xs">
                {symbolData.length > 0 ? (
                  symbolData.map((sym: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                      <span className="text-indigo-700 font-bold">{sym.name}</span>
                      <span className="text-slate-600">{sym.type || 'variable'}</span>
                      <span className="text-slate-500 text-[10px]">Scope: {sym.scope || 'global'}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic p-4 text-center">No symbols found in current artifact payload.</div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dependency Call Matrix</h4>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 font-mono text-xs text-slate-800 space-y-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
                  <span>main() → calculateRisk()</span>
                  <span className="text-emerald-700 font-bold">DIRECT CALL</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
                  <span>main() → analyzeIterations()</span>
                  <span className="text-emerald-700 font-bold">DIRECT CALL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

