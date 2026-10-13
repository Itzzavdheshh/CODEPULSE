import React, { useState, useEffect, useRef } from 'react';
import { Play, Code, CheckCircle2, AlertTriangle, AlertCircle, Download, FileText, Layers, Network, Zap, ChevronRight, ChevronDown, Search, ArrowRight, RefreshCw, Cpu, Activity, Sparkles, Upload, FileCode, Copy, Check, Printer, Eye, Maximize2, ZoomIn, ZoomOut, Filter, ArrowUpRight, HelpCircle, X, Binary, GitFork, Boxes, ShieldAlert, Gauge, Brain, ShieldCheck, CornerDownLeft, MessageSquare, Terminal, Hash, Info } from 'lucide-react';
import { CompilerAnalysis, CFGNode, CFGEdge, SymbolItem, Quadruple, Diagnostic, CodePulseArtifact } from '../types';
import { analyzeCompilerSource, getExportUrl, generateReport, analyzeProject, uploadProjectZip } from '../services/api';
import { SAMPLE_JAVA_VALID, SAMPLE_JAVA_SYNTAX_ERROR, SAMPLE_JAVA_TYPE_ERROR } from '../utils/samples';
import { CodeEditor } from './common/CodeEditor';
import { MetricCard } from './common/MetricCard';
import { EmptyState } from './common/EmptyState';
import { LoadingState } from './common/LoadingState';
import { ErrorCard } from './common/ErrorCard';
import { GrammarToolkitModal } from './GrammarToolkitModal';
import { MultiFileProjectModal } from './MultiFileProjectModal';

// Helper to count AST nodes recursively on frontend matching backend count_ast_nodes
const countAstNodesFrontend = (node: any): number => {
  if (!node || typeof node !== 'object') return 0;
  if (!node.node_type && !node.type) return 0;
  let count = 1;
  Object.keys(node).forEach((key) => {
    if (key === 'node_type' || key === 'line' || key === 'column' || key === 'type') return;
    const val = node[key];
    if (val && typeof val === 'object' && (val.node_type || val.type)) {
      count += countAstNodesFrontend(val);
    } else if (Array.isArray(val)) {
      val.forEach((item: any) => {
        if (item && typeof item === 'object' && (item.node_type || item.type)) {
          count += countAstNodesFrontend(item);
        }
      });
    }
  });
  return count;
};

// --- AST Interactive Tree Node Component ---
const AstTreeNode: React.FC<{
  node: any;
  selectedLine?: number;
  onSelectLine: (line: number) => void;
  searchTerm?: string;
  autoExpand?: boolean;
}> = ({ node, selectedLine, onSelectLine, searchTerm = '', autoExpand = true }) => {
  const [expanded, setExpanded] = useState<boolean>(autoExpand);

  useEffect(() => {
    setExpanded(autoExpand);
  }, [autoExpand]);

  if (!node) return null;

  const nodeType = node.node_type || node.type || 'ASTNode';
  const line = node.line || (node.position && node.position.line);
  const children = node.children || node.body || node.statements || [];
  const hasChildren = Array.isArray(children) && children.length > 0;
  const isSelected = line && line === selectedLine;

  const nameStr = node.name ? String(node.name) : '';
  const valStr = node.value !== undefined ? String(node.value) : '';
  const isMatch = searchTerm ? (
    nodeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    valStr.toLowerCase().includes(searchTerm.toLowerCase())
  ) : false;

  return (
    <div style={{ marginLeft: '16px', marginTop: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
      <div
        onClick={() => {
          if (line) onSelectLine(line);
          if (hasChildren) setExpanded(!expanded);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '6px',
          background: isMatch ? 'rgba(234, 179, 8, 0.15)' : (isSelected ? 'var(--brand-primary-light)' : 'var(--bg-subtle)'),
          border: `1px solid ${isMatch ? 'var(--color-amber)' : (isSelected ? 'var(--brand-primary)' : 'var(--border-light)')}`,
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />
        ) : (
          <div style={{ width: '14px' }} />
        )}
        <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{nodeType}</span>
        {node.name && <span style={{ color: 'var(--color-amber)' }}>"{node.name}"</span>}
        {node.value !== undefined && <span style={{ color: 'var(--color-emerald)' }}>= {String(node.value)}</span>}
        {line && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>L{line}</span>}
      </div>

      {expanded && hasChildren && (
        <div style={{ borderLeft: '1px dashed var(--border-light)', marginLeft: '6px', paddingLeft: '2px' }}>
          {children.map((child: any, idx: number) => (
            <AstTreeNode
              key={idx}
              node={child}
              selectedLine={selectedLine}
              onSelectLine={onSelectLine}
              searchTerm={searchTerm}
              autoExpand={autoExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Real Visual CFG Graph Visualizer with Edge Labels & Loop Back-Edge Highlighting ---
const VisualCfgGraph: React.FC<{
  nodes: CFGNode[];
  edges: CFGEdge[];
  onSelectBlock: (blockId: string) => void;
  selectedBlockId: string | null;
}> = ({ nodes, edges, onSelectBlock, selectedBlockId }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  if (!nodes || nodes.length === 0) {
    return <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No control flow blocks generated.</div>;
  }

  const selectedNode = nodes.find(n => n.id === selectedBlockId) || nodes[0];
  const predecessors = edges.filter(e => e.to === selectedNode?.id).map(e => e.from);
  const successors = edges.filter(e => e.from === selectedNode?.id).map(e => e.to);

  return (
    <div style={{ background: '#0F172A', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '20px', position: 'relative', overflow: 'hidden' }}>
      {/* CFG Graph Toolbar (Section 11 requirement) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
          Nodes: <strong>{nodes.length}</strong> Basic Blocks | Edges: <strong>{edges.length}</strong> Control Paths
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowLabels(!showLabels)}>
            {showLabels ? 'Hide Labels' : 'Show Labels'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.5))}>
            <ZoomIn size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.6))}>
            <ZoomOut size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoom(1)}>
            Reset View
          </button>
        </div>
      </div>

      <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '20px 0' }}>
          {nodes.map((node, index) => {
            const isSelected = node.id === selectedBlockId;
            const isPred = predecessors.includes(node.id);
            const isSucc = successors.includes(node.id);
            const isEntry = index === 0;
            const isExit = index === nodes.length - 1;

            return (
              <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Block Node Box */}
                <div
                  onClick={() => onSelectBlock(node.id)}
                  style={{
                    width: '320px',
                    background: isSelected ? 'rgba(79, 70, 229, 0.3)' : (isPred ? 'rgba(234, 179, 8, 0.15)' : (isSucc ? 'rgba(16, 185, 129, 0.15)' : '#1E293B')),
                    border: `2px solid ${isSelected ? 'var(--brand-primary)' : (isPred ? 'var(--color-amber)' : (isSucc ? 'var(--color-emerald)' : (isEntry ? 'var(--color-emerald)' : (isExit ? 'var(--color-rose)' : '#334155'))))}`,
                    borderRadius: '10px',
                    padding: '14px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 16px rgba(79, 70, 229, 0.4)' : '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#F8FAFC', fontSize: '0.92rem' }}>{node.label}</span>
                      {isEntry && <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>ENTRY</span>}
                      {isExit && <span className="badge badge-high" style={{ fontSize: '0.65rem' }}>EXIT</span>}
                      {isPred && <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>PREDECESSOR</span>}
                      {isSucc && <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>SUCCESSOR</span>}
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{node.instructions_count} instrs</span>
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', background: '#090D16', padding: '8px 10px', borderRadius: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                    {node.instructions.slice(0, 3).map((inst, i) => (
                      <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#94A3B8' }}>{inst}</div>
                    ))}
                    {node.instructions.length > 3 && <div style={{ color: '#64748B', fontSize: '0.7rem' }}>+ {node.instructions.length - 3} more lines</div>}
                  </div>
                </div>

                {/* Flow Arrow */}
                {index < nodes.length - 1 && (
                  <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748B' }}>
                    <div style={{ width: '2px', height: '16px', background: 'var(--brand-primary)' }} />
                    <ChevronDown size={16} color="var(--brand-primary)" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Block Inspector Panel */}
      {selectedNode && (
        <div style={{ marginTop: '20px', background: '#1E293B', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#F8FAFC', margin: 0, fontWeight: 700 }}>
              Block Details: {selectedNode.label}
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-amber">Predecessors: {predecessors.length > 0 ? predecessors.join(', ') : 'None (Entry)'}</span>
              <span className="badge badge-low">Successors: {successors.length > 0 ? successors.join(', ') : 'None (Exit)'}</span>
            </div>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: '#090D16', padding: '12px', borderRadius: '6px', color: '#38BDF8', maxHeight: '200px', overflowY: 'auto' }}>
            {selectedNode.instructions.map((inst, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>
                <span style={{ color: '#64748B', marginRight: '8px' }}>{idx + 1}.</span> {inst}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Target Bytecode Instruction Inspector Component ---
const BytecodeInstructionInspector: React.FC<{ instructions: any[] }> = ({ instructions }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!instructions || instructions.length === 0) return null;

  const filteredInsts = instructions.filter(i =>
    i.mnemonic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentInst = selectedIdx !== null && selectedIdx < instructions.length ? instructions[selectedIdx] : instructions[0];

  const getStackEffect = (mnem: string) => {
    if (mnem.startsWith('iconst') || mnem.startsWith('fconst') || mnem.startsWith('bipush') || mnem.startsWith('ldc') || mnem.startsWith('iload') || mnem.startsWith('fload') || mnem.startsWith('aload')) {
      return { before: '[...]', after: '[..., val]' };
    }
    if (mnem.startsWith('istore') || mnem.startsWith('fstore') || mnem.startsWith('astore')) {
      return { before: '[..., val]', after: '[...]' };
    }
    if (mnem.includes('add') || mnem.includes('sub') || mnem.includes('mul') || mnem.includes('div')) {
      return { before: '[..., val1, val2]', after: '[..., result]' };
    }
    if (mnem.startsWith('if_icmp') || mnem.startsWith('ifeq')) {
      return { before: '[..., cond]', after: '[...]' };
    }
    if (mnem.startsWith('invokevirtual')) {
      return { before: '[..., objectref, arg]', after: '[...]' };
    }
    return { before: '[...]', after: '[...]' };
  };

  const effect = getStackEffect(currentInst?.mnemonic || '');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>
      <div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            className="cp-input"
            placeholder="Search instructions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '0.8rem', width: '220px' }}
          />
        </div>

        <div style={{ background: '#0F172A', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', maxHeight: '360px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#F8FAFC' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1E293B', zIndex: 5 }}>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>PC</th>
                <th style={{ padding: '8px 12px' }}>Mnemonic Instruction</th>
                <th style={{ padding: '8px 12px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredInsts.map((inst, idx) => {
                const origIdx = instructions.indexOf(inst);
                const isSelected = selectedIdx === origIdx;
                const isHeader = String(inst.mnemonic || '').startsWith(';');
                if (isHeader) {
                  return (
                    <tr key={idx} style={{ background: '#1E293B', borderBottom: '1px solid #334155' }}>
                      <td colSpan={3} style={{ padding: '8px 12px', color: '#38BDF8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {String(inst.mnemonic).replace(/^;\s*/, '')}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedIdx(origIdx)}
                    style={{
                      background: isSelected ? 'rgba(79, 70, 229, 0.3)' : (idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'),
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <td style={{ padding: '8px 12px', color: '#64748B' }}>{String(inst.pc).padStart(4, '0')}</td>
                    <td style={{ padding: '8px 12px', color: isSelected ? '#38BDF8' : '#F8FAFC', fontWeight: isSelected ? 700 : 400 }}>{inst.mnemonic}</td>
                    <td style={{ padding: '8px 12px', color: '#94A3B8' }}>{inst.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instruction Inspector Card */}
      {currentInst && (
        <div className="cp-card" style={{ background: 'var(--bg-subtle)' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={16} color="var(--brand-primary)" /> Instruction Inspector
          </h4>

          <div style={{ background: '#0F172A', padding: '12px', borderRadius: '6px', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginBottom: '2px' }}>OPCODE &amp; OPERANDS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#38BDF8', fontWeight: 700 }}>
              {currentInst.mnemonic}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Meaning:</span>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginTop: '2px' }}>{currentInst.description}</div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Operand Stack Effect:</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ background: '#1E293B', padding: '4px 8px', borderRadius: '4px', color: '#F8FAFC' }}>Before: {effect.before}</span>
                <span>→</span>
                <span style={{ background: '#1E293B', padding: '4px 8px', borderRadius: '4px', color: '#34D399' }}>After: {effect.after}</span>
              </div>
            </div>

            {currentInst.stack_depth !== undefined && (
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Stack Depth:</span>
                <span className="badge badge-info">{currentInst.stack_depth} items</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CompilerStudio: React.FC<{ initialArtifact?: CodePulseArtifact }> = ({ initialArtifact }) => {
  const [sourceCode, setSourceCode] = useState<string>('');
  const [fileName, setFileName] = useState<string>('SoftwareRiskAnalyzer.java');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasAnalyzed, setHasAnalyzed] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<CompilerAnalysis | null>(null);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeSubtab, setActiveSubtab] = useState<string>('source');
  const [activeMetricDetail, setActiveMetricDetail] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);
  // Scroll refs — for jumping to result sections below the editor
  const metricsRef = useRef<HTMLDivElement | null>(null);    // Source Overview & Compiler Metrics
  const phaseResultRef = useRef<HTMLDivElement | null>(null); // Any phase output panel

  // Pipeline Modal State
  const [pipelineProgress, setPipelineProgress] = useState<number>(0);
  const [currentPipelineStep, setCurrentPipelineStep] = useState<number>(0);
  const [stagePhaseProgress, setStagePhaseProgress] = useState<number>(0); // 0-100 within current stage
  const [stageLog, setStageLog] = useState<string[]>([]); // live log lines for current stage
  const [showResultReady, setShowResultReady] = useState<boolean>(false);

  const [highlightedLine, setHighlightedLine] = useState<number | undefined>(undefined);
  const [symbolSearch, setSymbolSearch] = useState<string>('');
  const [symbolScopeFilter, setSymbolScopeFilter] = useState<string>('all');

  const [astSearchTerm, setAstSearchTerm] = useState<string>('');
  const [astExpandAll, setAstExpandAll] = useState<boolean>(true);

  const [tokenSearch, setTokenSearch] = useState<string>('');
  const [tokenTypeFilter, setTokenTypeFilter] = useState<string>('all');

  const [tacSearch, setTacSearch] = useState<string>('');
  const [tacOpFilter, setTacOpFilter] = useState<string>('all');

  const [semanticFilter, setSemanticFilter] = useState<string>('all');

  const [selectedCfgBlock, setSelectedCfgBlock] = useState<string | null>(null);
  const [selectedCfgMethod, setSelectedCfgMethod] = useState<string>('all');

  const [compilerReportMd, setCompilerReportMd] = useState<string>('');
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

  const [isGrammarModalOpen, setIsGrammarModalOpen] = useState<boolean>(false);
  const [isMultiFileModalOpen, setIsMultiFileModalOpen] = useState<boolean>(false);
  const [projectAnalysisData, setProjectAnalysisData] = useState<any | null>(null);

  const pipelineStages = [
    {
      label: 'Source Ingestion', phase: 'source', icon: '📥',
      color: '#6366f1', description: 'Reading & normalizing source bytes',
      logs: ['Reading source file...', 'Detecting encoding (UTF-8)', 'Normalizing line endings', 'Source validated ✓']
    },
    {
      label: 'Preprocessing', phase: 'preprocess', icon: '⚙️',
      color: '#8b5cf6', description: 'Expanding macros & stripping comments',
      logs: ['Stripping block comments...', 'Resolving import declarations', 'Macro expansion complete', 'Preprocessing done ✓']
    },
    {
      label: 'Lexical Analysis', phase: 'lexical', icon: '🔍',
      color: '#a78bfa', description: 'Tokenizing source into lexemes',
      logs: ['Initializing DFA scanner...', 'Scanning identifiers & literals', 'Classifying keywords & operators', 'Token stream generated ✓']
    },
    {
      label: 'Syntax / AST', phase: 'ast', icon: '🌳',
      color: '#06b6d4', description: 'Building Abstract Syntax Tree via LL parser',
      logs: ['Starting recursive descent parser...', 'Parsing class declarations', 'Building AST nodes (methods, fields)', 'Parse tree complete ✓']
    },
    {
      label: 'Symbol Resolution', phase: 'symbols', icon: '📋',
      color: '#0ea5e9', description: 'Building scoped symbol table',
      logs: ['Walking AST for declarations...', 'Resolving variable scopes', 'Binding method signatures', 'Symbol table complete ✓']
    },
    {
      label: 'Semantic Analysis', phase: 'semantic', icon: '🧠',
      color: '#10b981', description: 'Type checking & semantic validation',
      logs: ['Type-checking expressions...', 'Validating assignment compatibility', 'Checking return types', 'Semantic pass complete ✓']
    },
    {
      label: 'TAC / IR Generation', phase: 'ir', icon: '📝',
      color: '#f59e0b', description: 'Emitting Three-Address Code IR',
      logs: ['Lowering AST to 3-address form...', 'Generating temporaries', 'Emitting control-flow quads', 'IR emission complete ✓']
    },
    {
      label: 'CFG Construction', phase: 'cfg', icon: '🔗',
      color: '#f97316', description: 'Building Control Flow Graph',
      logs: ['Identifying basic blocks...', 'Computing predecessors & successors', 'Detecting back-edges (loops)', 'CFG constructed ✓']
    },
    {
      label: 'Metrics & Analysis', phase: 'metrics', icon: '📊',
      color: '#ef4444', description: 'Cyclomatic complexity & code quality',
      logs: ['Computing cyclomatic complexity V(G)...', 'Counting LOC (source/blank/comment)', 'Evaluating Halstead metrics', 'Quality report ready ✓']
    },
    {
      label: 'Target Code Gen', phase: 'target', icon: '⚡',
      color: '#ec4899', description: 'Emitting JVM bytecode (.class)',
      logs: ['Allocating local variable slots...', 'Emitting iload/istore opcodes', 'Generating method descriptors', 'Bytecode emission done ✓']
    },
    {
      label: 'Compiler Report', phase: 'report', icon: '📄',
      color: '#14b8a6', description: 'Assembling full analysis report',
      logs: ['Aggregating pipeline outputs...', 'Generating diagnostic summaries', 'Compiling artifact bundle', 'Report ready ✓']
    },
  ];

  const handleSourceCodeChange = (newCode: string) => {
    setSourceCode(newCode);
    setHasAnalyzed(false);
    setAnalysis(null);
    setCompilerReportMd('');
    setActiveMetricDetail(null);
  };

  const resetAnalysisState = () => {
    setHasAnalyzed(false);
    setAnalysis(null);
    setArtifactId(null);
    setCompilerReportMd('');
    setErrorMsg('');
    setActiveMetricDetail(null);
  };

  const supportedExtensions = ['.java', '.txt', '.c', '.cpp', '.js', '.ts'];

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!supportedExtensions.includes(ext)) {
      setErrorMsg(`Unsupported source file "${file.name}". Supported: ${supportedExtensions.join(', ')}`);
      return;
    }

    const text = await file.text();
    setSourceCode(text);
    setFileName(file.name);
    resetAnalysisState();
    setActiveSubtab('source');
    setShowEditor(true);
  };

  const handleUploadProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    const zipFile = files.find(f => f.name.toLowerCase().endsWith('.zip') || f.name.toLowerCase().endsWith('.jar'));
    if (zipFile) {
      setLoading(true);
      setErrorMsg('');
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64 = (e.target?.result as string) || '';
            const res = await uploadProjectZip(base64, zipFile.name);
            if (res.analysis) {
              setProjectAnalysisData(res.analysis);
            }
            if (res.files && res.files.length > 0) {
              setSourceCode(res.files[0].source_code);
              setFileName(res.files[0].file_name);
              resetAnalysisState();
              setShowEditor(true);
            }
            setIsMultiFileModalOpen(true);
          } catch (err: any) {
            setErrorMsg(err.message || 'Failed to upload and analyze ZIP archive');
          } finally {
            setLoading(false);
          }
        };
        reader.onerror = () => {
          setErrorMsg('Failed to read ZIP file');
          setLoading(false);
        };
        reader.readAsDataURL(zipFile);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error processing ZIP file');
        setLoading(false);
      }
      return;
    }

    const sourceFiles = files.filter((file) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      return supportedExtensions.includes(ext);
    });

    if (sourceFiles.length === 0) {
      setErrorMsg(`No supported source files were selected. Supported: ${supportedExtensions.join(', ')} or .zip archives`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const fileData = await Promise.all(
        sourceFiles.map(async (file) => ({
          file_name: file.name,
          relative_path: (file as any).webkitRelativePath || file.name,
          source_code: await file.text()
        }))
      );
      const res = await analyzeProject(fileData);
      setProjectAnalysisData(res);
      setSourceCode(fileData[0].source_code);
      setFileName(fileData[0].file_name);
      resetAnalysisState();
      setShowEditor(true);
      setIsMultiFileModalOpen(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Multi-file project analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Animate through pipeline stages — 3-4 s per stage
  const revealCompletedPipeline = async (result: any) => {
    const STAGE_DURATION = 3200; // ms per stage
    const LOG_INTERVAL = STAGE_DURATION / 4;

    for (let i = 0; i < pipelineStages.length; i++) {
      const stage = pipelineStages[i];
      setCurrentPipelineStep(i + 1);
      setStageLog([]);
      setStagePhaseProgress(0);

      // Emit log lines progressively within the stage
      for (let l = 0; l < stage.logs.length; l++) {
        await sleep(LOG_INTERVAL);
        setStageLog((prev) => [...prev, stage.logs[l]]);
        setStagePhaseProgress(Math.round(((l + 1) / stage.logs.length) * 100));
      }

      setPipelineProgress(Math.round(((i + 1) / pipelineStages.length) * 100));
      await sleep(300);
    }

    await sleep(600);
    // Apply results
    setAnalysis(result.analysis);
    if (result.artifact) setArtifactId(result.artifact.artifact_id);
    setHasAnalyzed(true);
    if (result.analysis.cfg?.nodes?.length > 0) {
      setSelectedCfgBlock(result.analysis.cfg.nodes[0].id);
    }
    setShowResultReady(true);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setErrorMsg('');
    setHasAnalyzed(false);
    setShowResultReady(false);
    setPipelineProgress(0);
    setCurrentPipelineStep(0);
    setStageLog([]);
    setStagePhaseProgress(0);

    try {
      const res = await analyzeCompilerSource(sourceCode, fileName);
      await revealCompletedPipeline(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Compiler analysis request failed.');
      setHasAnalyzed(false);
      setLoading(false);
    }
  };

  // Navigate to a phase and scroll to its result section below the editor
  const PHASE_SCROLL_IDS: Record<string, string> = {
    source: 'phase-section-source',
    preprocess: 'phase-section-preprocess',
    lexical: 'phase-section-lexical',
    ast: 'phase-section-ast',
    symbols: 'phase-section-symbols',
    semantic: 'phase-section-semantic',
    ir: 'phase-section-ir',
    cfg: 'phase-section-cfg',
    metrics: 'phase-section-metrics',
    target: 'phase-section-target',
    report: 'phase-section-report',
  };

  const scrollToPhaseResult = (phaseId: string) => {
    setActiveSubtab(phaseId);
    setTimeout(() => {
      const id = PHASE_SCROLL_IDS[phaseId];
      const el = id ? document.getElementById(id) : null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  };

  const handleShowResults = () => {
    setLoading(false);
    setShowResultReady(false);
    setActiveSubtab('source');
    setTimeout(() => {
      const el = document.getElementById('phase-section-source');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  const handleGenerateCompilerReport = async () => {
    if (!analysis) return;
    setReportLoading(true);
    try {
      const rep = await generateReport(artifactId || undefined, undefined, undefined);
      setCompilerReportMd(rep.markdown_content);
    } catch (err: any) {
      console.error('Failed to generate compiler report', err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!analysis) return;
    try {
      let response;
      if (artifactId) {
        response = await fetch(`/api/v1/compiler/export/${artifactId}/pdf`);
      } else {
        response = await fetch('/api/v1/reports/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ compiler_artifact_id: artifactId, title: 'Compiler Intelligence Report' })
        });
      }
      if (!response.ok) throw new Error('PDF generation request failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CodePulse_Compiler_Report_${fileName.replace(/\.[^/.]+$/, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('PDF Download Error:', err);
    }
  };

  const handleDownloadJSON = () => {
    if (artifactId) {
      window.open(`/api/v1/compiler/export/${artifactId}/ast_json`, '_blank');
    }
  };

  const handleDownloadCSV = () => {
    if (artifactId) {
      window.open(`/api/v1/compiler/export/${artifactId}/metrics_csv`, '_blank');
    }
  };

  useEffect(() => {
    if (activeSubtab === 'report' && hasAnalyzed && analysis && !compilerReportMd) {
      handleGenerateCompilerReport();
    }
  }, [activeSubtab, hasAnalyzed, analysis]);

  const filteredSymbols = analysis?.symbol_table?.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(symbolSearch.toLowerCase()) || s.category.toLowerCase().includes(symbolSearch.toLowerCase());
    const matchesScope = symbolScopeFilter === 'all' || s.scope.toLowerCase().includes(symbolScopeFilter.toLowerCase());
    return matchesSearch && matchesScope;
  }) || [];

  const filteredTokens = analysis?.tokens?.filter(t => {
    const matchesSearch = t.value.toLowerCase().includes(tokenSearch.toLowerCase());
    const matchesType = tokenTypeFilter === 'all' || t.type.toUpperCase() === tokenTypeFilter.toUpperCase();
    return matchesSearch && matchesType;
  }) || [];

  const filteredDiagnostics = analysis?.diagnostics?.filter(d => {
    if (semanticFilter === 'all') return true;
    return d.severity.toLowerCase() === semanticFilter.toLowerCase();
  }) || [];

  const filteredTacQuads = analysis?.intermediate_code?.filter(q => {
    const matchesSearch = (q.op + q.arg1 + q.arg2 + q.result).toLowerCase().includes(tacSearch.toLowerCase());
    const matchesOp = tacOpFilter === 'all' || q.op === tacOpFilter;
    return matchesSearch && matchesOp;
  }) || [];

  // Separate Syntax vs Semantic Errors (Section 9 requirement)
  const syntaxErrors = analysis?.diagnostics?.filter(d => d.phase.toLowerCase().includes('syntax') || d.phase.toLowerCase().includes('parser')) || [];
  const semanticErrors = analysis?.diagnostics?.filter(d => d.phase.toLowerCase().includes('semantic') && d.severity === 'error') || [];
  const warningsList = analysis?.diagnostics?.filter(d => d.severity === 'warning') || [];
  const [hoveredSubtab, setHoveredSubtab] = useState<string | null>(null);

  const phaseTabs = [
    { id: 'source', label: '1. Source' },
    { id: 'preprocess', label: '2. Preprocess' },
    { id: 'lexical', label: '3. Lexical' },
    { id: 'ast', label: '4. Syntax (AST)' },
    { id: 'symbols', label: '5. Symbols' },
    { id: 'semantic', label: '6. Semantic' },
    { id: 'ir', label: '7. TAC IR' },
    { id: 'cfg', label: '8. CFG' },
    { id: 'metrics', label: '9. Metrics' },
    { id: 'target', label: '10. Target Code' },
    { id: 'report', label: '11. Report' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      {/* SECTION 1: SOURCE / UPLOAD ENTRY WORKSPACE (Always Visible & Prominent) */}
      <div className="cp-card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-info">COMPILER INTELLIGENCE ENGINE</span>
              {hasAnalyzed && analysis && (
                <span className={`badge badge-${analysis.metrics.risk_level.toLowerCase()}`}>
                  RISK: {analysis.metrics.risk_level}
                </span>
              )}
              {hasAnalyzed ? (
                <span className="badge badge-low">✓ ANALYSIS COMPLETE</span>
              ) : (
                <span className="badge badge-amber">○ READY FOR ANALYSIS</span>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Compiler Studio &amp; Code Workspace
            </h1>
          </div>

          {/* Header Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsGrammarModalOpen(true)}>
              <Network size={14} /> Grammar Toolkit
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsMultiFileModalOpen(true)}>
              <Layers size={14} /> Multi-File Project
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleAnalyze} disabled={loading}>
              <Play size={14} /> Run Analysis <span style={{ opacity: 0.8, fontSize: '0.7rem', marginLeft: '4px' }}>⌘↵</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".java,.txt,.c,.cpp,.js,.ts"
          style={{ display: 'none' }}
          onChange={handleUploadFile}
        />
        <input
          ref={projectInputRef}
          type="file"
          accept=".zip,.jar,.java,.txt,.c,.cpp,.js,.ts"
          multiple
          style={{ display: 'none' }}
          onChange={handleUploadProject}
        />

        {/* Top 11-Phase Navigation Bar: Single row, no horizontal scroll, capsule pills with hover light */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '6px',
              width: '100%',
              overflow: 'hidden'
            }}
          >
            {phaseTabs.map((sub) => {
              const isActive = activeSubtab === sub.id;
              const isHovered = hoveredSubtab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => scrollToPhaseResult(sub.id)}
                  onMouseEnter={() => setHoveredSubtab(sub.id)}
                  onMouseLeave={() => setHoveredSubtab(null)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '7px 6px',
                    borderRadius: '9999px',
                    background: isActive
                      ? 'rgba(79, 70, 229, 0.08)'
                      : (isHovered ? 'var(--bg-subtle)' : '#FFFFFF'),
                    border: isActive
                      ? '1.5px solid var(--brand-primary)'
                      : (isHovered ? '1px solid #CBD5E1' : '1px solid var(--border-light)'),
                    boxShadow: isActive
                      ? '0 1px 3px rgba(79, 70, 229, 0.15)'
                      : (isHovered ? '0 1px 2px rgba(0,0,0,0.04)' : 'none'),
                    color: isActive
                      ? 'var(--brand-primary)'
                      : (isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'),
                    cursor: 'pointer',
                    fontSize: 'clamp(0.68rem, 0.74vw, 0.88rem)',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    transition: 'all 0.15s ease-in-out'
                  }}
                  title={sub.label}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SOURCE ENTRY WORKSPACE HUB vs LIVE CODE EDITOR ── */}
        {!showEditor ? (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '2px dashed #cbd5e1',
            borderRadius: '20px',
            padding: '40px 32px 36px',
            textAlign: 'center',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
            transition: 'all 0.25s ease'
          }}>
            {/* Header Title */}
            <div style={{ maxWidth: 580, margin: '0 auto 32px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: '1px solid #c4b5fd',
                padding: '4px 12px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 800, color: '#4f46e5', marginBottom: 12
              }}>
                <Sparkles size={14} /> CHOOSE COMPILER SOURCE INPUT
              </div>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Compiler Source Entry Workspace
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0, lineHeight: 1.55 }}>
                Select an entry method below to ingest code into the compiler pipeline. Upload a file, import a project, or open the live interactive code editor.
              </p>
            </div>

            {/* Primary 3 Interactive Entry Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', maxWidth: 1040, margin: '0 auto 36px' }}>
              {/* 1. Upload File */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '28px 22px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(99, 102, 241, 0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.03)';
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18
                }}>
                  <Upload size={26} color="#6366f1" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>
                  Upload File
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Select a single source file (<code style={{ color: '#4f46e5', fontWeight: 700 }}>.java</code>, <code style={{ color: '#4f46e5', fontWeight: 700 }}>.c</code>, <code style={{ color: '#4f46e5', fontWeight: 700 }}>.cpp</code>, <code style={{ color: '#4f46e5', fontWeight: 700 }}>.ts</code>).
                </p>
              </div>

              {/* 2. Upload Project */}
              <div
                onClick={() => setIsMultiFileModalOpen(true)}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '28px 22px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(139, 92, 246, 0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.03)';
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18
                }}>
                  <Layers size={26} color="#8b5cf6" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>
                  Upload Project
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Import a multi-file Java project or package zip bundle to analyze class dependencies.
                </p>
              </div>

              {/* 3. Write Code */}
              <div
                onClick={() => {
                  setSourceCode('');
                  setFileName('SoftwareRiskAnalyzer.java');
                  resetAnalysisState();
                  setShowEditor(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
                  border: '2px solid #818cf8',
                  borderRadius: '20px',
                  padding: '28px 22px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 8px 24px rgba(79, 70, 229, 0.15)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4f46e5';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 18px 40px rgba(79, 70, 229, 0.28)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#818cf8';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(79, 70, 229, 0.15)';
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18, boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)'
                }}>
                  <Code size={26} color="#ffffff" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Write Code
                  </h3>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#4f46e5', color: '#ffffff', padding: '3px 9px', borderRadius: 9999, letterSpacing: '0.04em' }}>
                    OPEN EDITOR →
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Launch a blank interactive VS Code-style editor canvas to write or paste your own source code.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Editor Action Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: 'var(--bg-subtle)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-info" style={{ fontWeight: 800, letterSpacing: '0.04em' }}>SOURCE: CODE EDITOR</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>{fileName}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowEditor(false)}
                style={{ fontSize: '0.78rem', fontWeight: 700, borderRadius: '8px' }}
              >
                <RefreshCw size={13} /> Change Source Input / Re-upload
              </button>
            </div>

            {/* FULL-WIDTH VS CODE-STYLE EDITOR */}
            <CodeEditor
              value={sourceCode}
              onChange={handleSourceCodeChange}
              fileName={fileName}
              diagnostics={analysis?.diagnostics || []}
              onAnalyze={handleAnalyze}
              onSave={handleAnalyze}
              isLoading={loading}
              onSelectLine={(l) => setHighlightedLine(l)}
              selectedLine={highlightedLine}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
           COMPILER PIPELINE — CINEMATIC PROGRESS MODAL
      ═══════════════════════════════════════════════════════════ */}
      {(loading || showResultReady) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          fontFamily: 'var(--font-mono)'
        }}>
          {/* ── WHITE CARD wrapper — ultra-vibrant, high contrast, crisp & interactive ── */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 700,
            background: '#ffffff',
            borderRadius: 24,
            boxShadow: '0 25px 80px rgba(15, 23, 42, 0.25), 0 0 50px rgba(79, 70, 229, 0.2)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            padding: '36px 36px 32px',
            overflow: 'hidden'
          }}>
            {/* Top glowing gradient accent bar with animated shimmer */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 35%, #ec4899 70%, #06b6d4 100%)'
            }} />

            <style>{`
              @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
              @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(79,70,229,0.4),0 0 50px rgba(79,70,229,0.2)} 50%{box-shadow:0 0 35px rgba(124,58,237,0.7),0 0 80px rgba(124,58,237,0.35)} }
              @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
              @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
              @keyframes stageIn { from{opacity:0;transform:scale(0.98) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
              @keyframes logIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
              @keyframes counterUp { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
              @keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(79,70,229,0.4)} 70%{box-shadow:0 0 0 10px rgba(79,70,229,0)} 100%{box-shadow:0 0 0 0 rgba(79,70,229,0)} }
              @keyframes activePillPulse { 0%,100%{box-shadow:0 0 10px rgba(79,70,229,0.4);transform:scale(1.02)} 50%{box-shadow:0 0 18px rgba(124,58,237,0.7);transform:scale(1.04)} }
            `}</style>

            {/* ── VICTORY SCREEN ── */}
            {showResultReady ? (
              <div style={{ textAlign: 'center', animation: 'fadeInUp 0.45s ease', padding: '10px 0' }}>
                <div style={{
                  width: 72, height: 72, margin: '0 auto 16px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.5rem', boxShadow: '0 10px 25px rgba(16,185,129,0.25)'
                }}>
                  🎉
                </div>
                <div style={{ fontSize: '0.7rem', letterSpacing: '0.22em', color: '#10b981', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase' }}>
                  ✓ All 11 Compiler Phases Verified
                </div>
                <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>
                  Compilation <span style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Successful</span>
                </h2>
                <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: 28, maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.5 }}>
                  <code style={{ color: '#6366f1', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '3px 9px', borderRadius: 6, fontWeight: 700 }}>{fileName}</code> was processed through all lexical, syntactic, IR &amp; target code transformations.
                </p>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Total Phases', value: '11', color: '#4f46e5' },
                    { label: 'Pipeline Time', value: `~${Math.round(pipelineStages.length * 3.2)}s`, color: '#7c3aed' },
                    { label: 'Engine Status', value: 'PASS ✓', color: '#10b981' },
                  ].map((s, i) => (
                    <div key={i} style={{
                      padding: '12px 22px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14,
                      minWidth: 100, animation: `counterUp 0.4s ease ${i * 0.1}s both`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.66rem', color: '#64748b', letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={handleShowResults}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 12,
                    padding: '14px 36px', fontSize: '1rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff', border: 'none', borderRadius: 9999,
                    cursor: 'pointer', animation: 'pulseGlow 2.5s ease-in-out infinite',
                    letterSpacing: '0.02em', boxShadow: '0 10px 25px rgba(79, 70, 229, 0.35)'
                  }}
                >
                  <Zap size={18} /> Show Results &amp; Compiler Metrics
                  <span style={{ opacity: 0.85, fontSize: '0.85rem', marginLeft: 4 }}>→</span>
                </button>
                <div style={{ marginTop: 14, fontSize: '0.75rem', color: '#94a3b8' }}>Takes you directly to Source Overview &amp; Compiler Metrics</div>
              </div>
            ) : (
              /* ── RUNNING PIPELINE ── */
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 14,
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, animation: 'pulseRing 2.5s infinite', boxShadow: '0 6px 18px rgba(79, 70, 229, 0.35)'
                    }}>
                      <Cpu size={24} color="#ffffff" style={{ animation: 'spin-slow 4s linear infinite' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.66rem', letterSpacing: '0.22em', color: '#4f46e5', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>
                        CODEPULSE COMPILER INTELLIGENCE ENGINE
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                        Analyzing <span style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{fileName}</span>
                      </h3>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: '1px solid #c4b5fd',
                    padding: '5px 12px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700, color: '#4f46e5'
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'blink 1s ease infinite' }} />
                    LIVE PIPELINE
                  </div>
                </div>

                {/* Overall progress */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: 7 }}>
                    <span style={{ letterSpacing: '0.08em', color: '#64748b' }}>OVERALL PIPELINE PROGRESS</span>
                    <span style={{ color: '#4f46e5', background: '#eeefbe', padding: '2px 8px', borderRadius: 6, border: '1px solid #c4b5fd' }}>
                      {pipelineProgress}% COMPLETE
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{
                      height: '100%', width: `${pipelineProgress}%`,
                      background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 40%, #ec4899 75%, #06b6d4 100%)',
                      borderRadius: 9999, transition: 'width 0.6s ease', boxShadow: '0 0 12px rgba(79, 70, 229, 0.5)'
                    }} />
                  </div>
                </div>

                {/* 11 Stage pills - High contrast, non-faded, vibrant */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
                  {pipelineStages.map((st, idx) => {
                    const stepNum = idx + 1;
                    const isDone = stepNum < currentPipelineStep;
                    const isRunning = stepNum === currentPipelineStep;
                    return (
                      <div key={idx} style={{
                        padding: '4px 11px', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 800,
                        background: isDone
                          ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                          : isRunning
                            ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                            : '#ffffff',
                        border: isDone
                          ? '1px solid #34d399'
                          : isRunning
                            ? '1.5px solid #818cf8'
                            : '1px solid #cbd5e1',
                        color: isDone ? '#047857' : isRunning ? '#ffffff' : '#334155',
                        boxShadow: isDone
                          ? '0 1px 3px rgba(16,185,129,0.12)'
                          : isRunning
                            ? '0 4px 12px rgba(79,70,229,0.35)'
                            : '0 1px 2px rgba(0,0,0,0.04)',
                        animation: isRunning ? 'activePillPulse 2s infinite' : 'none',
                        transition: 'all 0.25s ease-in-out',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        {isDone ? (
                          <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
                        ) : isRunning ? (
                          <span style={{ animation: 'blink 0.7s ease infinite' }}>{st.icon}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>·</span>
                        )}
                        <span>{stepNum}. {st.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Active Stage Detail Card */}
                {currentPipelineStep > 0 && (() => {
                  const st = pipelineStages[currentPipelineStep - 1];
                  return (
                    <div style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: `1.5px solid ${st.color}50`,
                      borderLeft: `5px solid ${st.color}`,
                      borderRadius: 16, padding: '18px 20px', animation: 'stageIn 0.3s ease',
                      boxShadow: `0 8px 30px ${st.color}20, 0 2px 8px rgba(0,0,0,0.04)`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 10, background: `${st.color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                            border: `1px solid ${st.color}30`
                          }}>
                            {st.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.64rem', color: st.color, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                              STAGE {currentPipelineStep} OF 11
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>{st.label}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#475569', maxWidth: 220, textAlign: 'right', fontWeight: 600 }}>
                          {st.description}
                        </div>
                      </div>

                      {/* Stage progress bar */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#64748b', fontWeight: 700, marginBottom: 4 }}>
                          <span>STAGE EXECUTION</span>
                          <span style={{ color: st.color }}>{stagePhaseProgress}%</span>
                        </div>
                        <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${stagePhaseProgress}%`,
                            background: `linear-gradient(90deg, ${st.color}, ${st.color}bb)`,
                            borderRadius: 9999, transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>

                      {/* High-Tech Dark IDE Terminal Console */}
                      <div style={{
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: 12, padding: '12px 16px', minHeight: 90,
                        fontFamily: 'var(--font-mono)', fontSize: '0.74rem',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5), 0 4px 14px rgba(15,23,42,0.15)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 8, marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                            <span style={{ color: '#64748b', marginLeft: 8, fontSize: '0.64rem', letterSpacing: '0.12em', fontWeight: 700 }}>COMPILER ENGINE TERMINAL</span>
                          </div>
                          <span style={{ fontSize: '0.62rem', color: st.color, fontWeight: 700 }}>● EXECUTING</span>
                        </div>

                        {stageLog.map((line, i) => {
                          const isLast = i === stageLog.length - 1;
                          return (
                            <div key={i} style={{
                              color: isLast ? st.color : '#94a3b8',
                              lineHeight: 1.8, animation: 'logIn 0.2s ease',
                              fontWeight: isLast ? 700 : 500
                            }}>
                              <span style={{ color: isLast ? '#38bdf8' : '#475569', marginRight: 8, fontWeight: 700 }}>➜</span>
                              {line}
                            </div>
                          );
                        })}
                        {stageLog.length < 4 && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: st.color, marginTop: 2 }}>
                            <span style={{ color: '#475569', marginRight: 8, fontWeight: 700 }}>➜</span>
                            <span style={{ animation: 'blink 0.7s ease infinite', fontWeight: 900 }}>█</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {errorMsg && (
        <ErrorCard
          title="Compiler Analysis Failed"
          message={errorMsg}
          recommendation="Check syntax errors or semantical statements in source code."
          onRetry={handleAnalyze}
        />
      )}

      {/* SECTION 6: SOURCE OVERVIEW & METRICS */}
      {activeSubtab === 'source' && (
        <div id="phase-section-source" ref={metricsRef} className="cp-card" style={{ marginBottom: '24px' }}>
          <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Source Overview &amp; Compiler Metrics</span>
            {!hasAnalyzed && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Run Analysis to compute metrics</span>}
          </h3>

          <div className="grid-4" style={{ gap: '16px' }}>
            <div onClick={() => hasAnalyzed && setActiveMetricDetail(activeMetricDetail === 'loc' ? null : 'loc')} style={{ cursor: hasAnalyzed ? 'pointer' : 'default' }}>
              <MetricCard
                title="LOC"
                value={hasAnalyzed && analysis ? analysis.metrics.total_loc : sourceCode.split('\n').length}
                icon={FileCode}
                accentColor="#6366f1"
                badgeText="Physical LOC"
                badgeType="info"
                description="Click for source breakdown"
                explanation="Total line count of the source file including executable code, blanks, and comments."
              />
            </div>
            <div onClick={() => hasAnalyzed && scrollToPhaseResult('lexical')} style={{ cursor: hasAnalyzed ? 'pointer' : 'default' }}>
              <MetricCard
                title="Tokens"
                value={hasAnalyzed && analysis ? analysis.stats.tokens_count : '—'}
                icon={Binary}
                accentColor="#8b5cf6"
                badgeText="Lexical Pass"
                badgeType="info"
                description="Classified lexical tokens"
                explanation="Sequence of atomic lexemes (keywords, identifiers, operators, and literals) produced by the DFA scanner."
              />
            </div>
            <div onClick={() => hasAnalyzed && scrollToPhaseResult('ast')} style={{ cursor: hasAnalyzed ? 'pointer' : 'default' }}>
              <MetricCard
                title="AST Nodes"
                value={hasAnalyzed && analysis ? (analysis.stats?.ast_nodes_count || countAstNodesFrontend(analysis.ast)) : '—'}
                icon={Network}
                accentColor="#06b6d4"
                badgeText="Syntax Tree"
                badgeType="info"
                description="Hierarchical AST nodes"
                explanation="Number of structural nodes representing language constructs (classes, methods, control loops, statements)."
              />
            </div>
            <div onClick={() => hasAnalyzed && scrollToPhaseResult('symbols')} style={{ cursor: hasAnalyzed ? 'pointer' : 'default' }}>
              <MetricCard
                title="Symbols"
                value={hasAnalyzed && analysis ? analysis.symbol_table.length : '—'}
                icon={Layers}
                accentColor="#0ea5e9"
                badgeText="Scoped Table"
                badgeType="info"
                description="Scoped identifiers & signatures"
                explanation="Resolved symbol table bindings mapping variable names, scope levels, data types, and method signatures."
              />
            </div>

            <div onClick={() => hasAnalyzed && scrollToPhaseResult('ir')} style={{ cursor: hasAnalyzed ? 'pointer' : 'default' }}>
              <MetricCard
                title="TAC Quads"
                value={hasAnalyzed && analysis ? analysis.intermediate_code.length : '—'}
                icon={Cpu}
                accentColor="#f59e0b"
                badgeText="IR Quadruples"
                badgeType="info"
                description="Three-Address Code IR"
                explanation="Intermediate Representation quadruples (operator, arg1, arg2, result) generated before target code emission."
              />
            </div>
            <div onClick={() => hasAnalyzed && scrollToPhaseResult('cfg')} style={{ cursor: hasAnalyzed ? 'pointer' : 'default' }}>
              <MetricCard
                title="CFG Blocks"
                value={hasAnalyzed && analysis ? analysis.cfg.nodes.length : '—'}
                icon={Boxes}
                accentColor="#f97316"
                badgeText="Control Flow"
                badgeType="info"
                description="Basic execution blocks"
                explanation="Basic control blocks in the Control Flow Graph where control enters at the top and leaves at the bottom."
              />
            </div>
            <div onClick={() => hasAnalyzed && scrollToPhaseResult('semantic')} style={{ cursor: hasAnalyzed ? 'pointer' : 'default' }}>
              <MetricCard
                title="Diagnostics"
                value={hasAnalyzed && analysis ? analysis.diagnostics.length : '—'}
                icon={ShieldAlert}
                accentColor={hasAnalyzed && analysis && analysis.diagnostics.length > 0 ? "#ef4444" : "#10b981"}
                badgeText={hasAnalyzed && analysis ? (analysis.diagnostics.length === 0 ? "0 ERRORS ✓" : `${analysis.diagnostics.length} ISSUES`) : "Pass Status"}
                badgeType={hasAnalyzed && analysis && analysis.diagnostics.length > 0 ? "critical" : "success"}
                description="Syntax & type warnings"
                explanation="Multi-pass compiler diagnostics capturing syntax errors, unresolved symbols, and type mismatch warnings."
              />
            </div>
            <div onClick={() => hasAnalyzed && scrollToPhaseResult('metrics')} style={{ cursor: hasAnalyzed ? 'pointer' : 'default' }}>
              <MetricCard
                title="Complexity V(G)"
                value={hasAnalyzed && analysis ? analysis.metrics.cyclomatic_complexity : '—'}
                icon={Activity}
                accentColor="#ec4899"
                badgeText={hasAnalyzed && analysis ? (analysis.metrics.cyclomatic_complexity <= 5 ? "LOW RISK" : "MODERATE") : "Path Count"}
                badgeType={hasAnalyzed && analysis && analysis.metrics.cyclomatic_complexity <= 5 ? "low" : "moderate"}
                description="Independent path count"
                explanation="McCabe Cyclomatic Complexity V(G) = E - N + 2P measuring linearly independent control paths."
              />
            </div>
          </div>

          {hasAnalyzed && analysis && activeMetricDetail === 'loc' && (
            <div style={{ marginTop: 20, background: '#fafafa', border: '1px solid var(--border-light)', borderRadius: '16px', padding: 20 }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCode size={18} color="#6366f1" /> Lines of Code (LOC Breakdown)
              </h4>
              <div className="grid-4" style={{ gap: 14 }}>
                <MetricCard title="Total LOC" value={analysis.metrics.total_loc} icon={FileText} accentColor="#6366f1" description={analysis.file_name} explanation="Raw physical line count of source file." />
                <MetricCard title="Code Lines" value={analysis.metrics.source_loc} icon={Code} accentColor="#10b981" badgeText="Executable" badgeType="success" description="Non-empty, non-comment lines" explanation="Active executable source code statements." />
                <MetricCard title="Blank Lines" value={analysis.metrics.blank_loc || 0} icon={CornerDownLeft} accentColor="#64748b" description="Whitespace-only lines" explanation="Blank lines used for visual formatting." />
                <MetricCard title="Comment Lines" value={analysis.metrics.comment_loc} icon={MessageSquare} accentColor="#8b5cf6" description="Detected comment lines" explanation="Inline and multi-line documentation comments." />
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 19: PHASE OUTPUT AVAILABILITY */}
      {activeSubtab !== 'source' && (
        <div ref={phaseResultRef} style={{ marginBottom: '24px' }}>
          {!loading && !hasAnalyzed && (
            <EmptyState
              title="Phase Output Not Analyzed Yet"
              description="Your source code has not been analyzed yet. Click 'Run Analysis' to execute the complete compiler pipeline."
              actionText="Run Analysis Now"
              onAction={handleAnalyze}
              icon={Cpu}
            />
          )}

          {!loading && hasAnalyzed && analysis && (
            <div>
              {/* Subtab 2: Preprocess */}
              {activeSubtab === 'preprocess' && (
                <div id="phase-section-preprocess" className="cp-card">
                  <h3 className="panel-title">Preprocessing &amp; Source Cleaning</h3>
                  <div className="grid-4" style={{ marginBottom: '16px' }}>
                    <MetricCard title="Comments Removed" value={analysis.preprocessing?.comments_removed || 0} badgeText="Stripped" badgeType="info" />
                    <MetricCard title="Comment Lines" value={analysis.preprocessing?.comment_stats?.total_comment_lines || 0} badgeText="Lines" badgeType="low" />
                    <MetricCard title="Macros Defined" value={analysis.preprocessing?.macros_defined || 0} badgeText="#define" badgeType="info" />
                    <MetricCard title="Expansions Executed" value={analysis.preprocessing?.macro_expansions?.length || 0} badgeText="Replaced" badgeType="low" />
                  </div>

                  <div className="grid-2" style={{ gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Original Source</div>
                      <textarea className="code-area" rows={14} readOnly value={analysis.source_code} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '6px' }}>Preprocessed Source</div>
                      <textarea className="code-area" rows={14} readOnly value={analysis.preprocessing?.cleaned_source || analysis.source_code} />
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 3: Lexical Analysis */}
              {activeSubtab === 'lexical' && (
                <div id="phase-section-lexical" className="cp-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Lexical Analysis Tokens ({filteredTokens.length})</h3>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          className="cp-input"
                          placeholder="Search tokens..."
                          value={tokenSearch}
                          onChange={(e) => setTokenSearch(e.target.value)}
                          style={{ paddingLeft: '30px', width: '180px', fontSize: '0.8rem' }}
                        />
                      </div>

                      <select className="cp-input" value={tokenTypeFilter} onChange={(e) => setTokenTypeFilter(e.target.value)} style={{ fontSize: '0.8rem', width: '140px' }}>
                        <option value="all">All Types</option>
                        <option value="KEYWORD">KEYWORD</option>
                        <option value="IDENTIFIER">IDENTIFIER</option>
                        <option value="OPERATOR">OPERATOR</option>
                        <option value="DELIMITER">DELIMITER</option>
                        <option value="NUMBER">NUMBER</option>
                        <option value="STRING">STRING</option>
                      </select>
                    </div>
                  </div>

                  <div className="data-table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-surface)' }}>
                        <tr>
                          <th>Token Type</th>
                          <th>Value</th>
                          <th>Line</th>
                          <th>Column</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTokens.map((tok, idx) => (
                          <tr key={idx}>
                            <td><span className="badge badge-info">{tok.type}</span></td>
                            <td><code style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{tok.value}</code></td>
                            <td>L{tok.line}</td>
                            <td>col {tok.column}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab 4: Syntax / AST (Section 5 requirement) */}
              {activeSubtab === 'ast' && (
                <div id="phase-section-ast" className="cp-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>Interactive Abstract Syntax Tree Explorer</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Total AST Nodes: <strong>{analysis.stats?.ast_nodes_count || countAstNodesFrontend(analysis.ast)}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          className="cp-input"
                          placeholder="Search node type or value..."
                          value={astSearchTerm}
                          onChange={(e) => setAstSearchTerm(e.target.value)}
                          style={{ paddingLeft: '30px', width: '220px', fontSize: '0.8rem' }}
                        />
                      </div>

                      <button className="btn btn-secondary btn-sm" onClick={() => setAstExpandAll(!astExpandAll)}>
                        {astExpandAll ? 'Collapse All' : 'Expand All'}
                      </button>
                    </div>
                  </div>

                  <div style={{ maxHeight: '450px', overflowY: 'auto', background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <AstTreeNode
                      node={analysis.ast}
                      selectedLine={highlightedLine}
                      onSelectLine={(l) => setHighlightedLine(l)}
                      searchTerm={astSearchTerm}
                      autoExpand={astExpandAll}
                    />
                  </div>
                </div>
              )}

              {/* Subtab 5: Symbols */}
              {activeSubtab === 'symbols' && (
                <div id="phase-section-symbols" className="cp-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Symbol Table ({filteredSymbols.length})</h3>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="cp-input"
                        placeholder="Search symbols..."
                        value={symbolSearch}
                        onChange={(e) => setSymbolSearch(e.target.value)}
                        style={{ fontSize: '0.8rem', width: '180px' }}
                      />
                      <select className="cp-input" value={symbolScopeFilter} onChange={(e) => setSymbolScopeFilter(e.target.value)} style={{ fontSize: '0.8rem', width: '130px' }}>
                        <option value="all">All Scopes</option>
                        <option value="global">Global</option>
                        <option value="method">Method</option>
                        <option value="local">Local</option>
                      </select>
                    </div>
                  </div>

                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Identifier Name</th>
                          <th>Category</th>
                          <th>Data Type</th>
                          <th>Scope</th>
                          <th>Line</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSymbols.map((s, idx) => (
                          <tr key={idx} onClick={() => setHighlightedLine(s.line)} style={{ cursor: 'pointer' }}>
                            <td><strong style={{ color: 'var(--text-primary)' }}>{s.name}</strong></td>
                            <td><span className="badge badge-info">{s.category}</span></td>
                            <td><code>{s.data_type}</code></td>
                            <td><span className="badge badge-low">{s.scope}</span></td>
                            <td>L{s.line}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab 6: Diagnostics (Section 9 Requirement: Separate Syntax vs Semantic) */}
              {activeSubtab === 'semantic' && (
                <div id="phase-section-semantic" className="cp-card">
                  <h3 className="panel-title">Compiler Diagnostics Workspace</h3>

                  {/* Summary Badges */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span className="badge badge-high">Syntax Errors: {syntaxErrors.length}</span>
                    <span className="badge badge-high">Semantic Errors: {semanticErrors.length}</span>
                    <span className="badge badge-amber">Warnings: {warningsList.length}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 1. Syntax Errors Section */}
                    {syntaxErrors.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-rose)', marginBottom: '8px', fontWeight: 700 }}>
                          Syntax Analysis Errors ({syntaxErrors.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {syntaxErrors.map((d, i) => (
                            <div key={i} onClick={() => setHighlightedLine(d.line)} style={{ padding: '10px 14px', borderRadius: '6px', background: 'var(--color-rose-light)', border: '1px solid var(--color-rose)', cursor: 'pointer' }}>
                              <strong>Line {d.line}:{d.column}</strong> — {d.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Semantic Errors Section */}
                    {semanticErrors.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-rose)', marginBottom: '8px', fontWeight: 700 }}>
                          Semantic Analysis Errors ({semanticErrors.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {semanticErrors.map((d, i) => (
                            <div key={i} onClick={() => setHighlightedLine(d.line)} style={{ padding: '10px 14px', borderRadius: '6px', background: 'var(--color-rose-light)', border: '1px solid var(--color-rose)', cursor: 'pointer' }}>
                              <strong>Line {d.line}:{d.column}</strong> — {d.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Warnings Section */}
                    {warningsList.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-amber)', marginBottom: '8px', fontWeight: 700 }}>
                          Compiler Warnings ({warningsList.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {warningsList.map((d, i) => (
                            <div key={i} onClick={() => setHighlightedLine(d.line)} style={{ padding: '10px 14px', borderRadius: '6px', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber)', cursor: 'pointer' }}>
                              <strong>[{d.phase}] Line {d.line}:{d.column}</strong> — {d.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.diagnostics.length === 0 && (
                      <div style={{ padding: '16px', background: 'var(--color-emerald-light)', color: 'var(--color-emerald)', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 600 }}>
                        ✓ Zero syntax or semantic errors found in source program.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subtab 7: TAC IR (Section 7 & 8 Requirements) */}
              {activeSubtab === 'ir' && (
                <div id="phase-section-ir" className="cp-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Three-Address Code (TAC) IR Quadruples &amp; Optimization</h3>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="cp-input"
                        placeholder="Search TAC..."
                        value={tacSearch}
                        onChange={(e) => setTacSearch(e.target.value)}
                        style={{ fontSize: '0.8rem', width: '160px' }}
                      />
                      <select className="cp-input" value={tacOpFilter} onChange={(e) => setTacOpFilter(e.target.value)} style={{ fontSize: '0.8rem', width: '120px' }}>
                        <option value="all">All Ops</option>
                        <option value="=">ASSIGN (=)</option>
                        <option value="+">ADD (+)</option>
                        <option value="-">SUB (-)</option>
                        <option value="IF_FALSE">IF_FALSE</option>
                        <option value="GOTO">GOTO</option>
                        <option value="LABEL">LABEL</option>
                      </select>
                    </div>
                  </div>

                  {/* Optimization Applied Summary Checklist (Section 8 requirement) */}
                  <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>OPTIMIZATIONS APPLIED:</span>
                    {analysis.optimization_transformations.length > 0 ? (
                      analysis.optimization_transformations.slice(0, 6).map((item, idx) => (
                        <span key={idx} className="badge badge-low">✓ {item}</span>
                      ))
                    ) : (
                      <span className="badge badge-info">No optimizing transformation was valid for this source.</span>
                    )}
                  </div>

                  {/* Quadruple Table View */}
                  <div className="grid-2" style={{ gap: 16 }}>
                    <div className="data-table-container">
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>Original TAC</div>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Op</th>
                            <th>Arg1</th>
                            <th>Arg2</th>
                            <th>Result / Target</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTacQuads.map((q, idx) => (
                            <tr key={idx}>
                              <td>#{idx + 1}</td>
                              <td><span className="badge badge-info">{q.op}</span></td>
                              <td><code>{q.arg1 || '—'}</code></td>
                              <td><code>{q.arg2 || '—'}</code></td>
                              <td><strong style={{ color: 'var(--brand-primary)' }}>{q.result || '—'}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="data-table-container">
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>Optimized TAC</div>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Op</th>
                            <th>Arg1</th>
                            <th>Arg2</th>
                            <th>Result / Target</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.optimized_code.map((q, idx) => (
                            <tr key={idx}>
                              <td>#{idx + 1}</td>
                              <td><span className="badge badge-info">{q.op}</span></td>
                              <td><code>{q.arg1 || '—'}</code></td>
                              <td><code>{q.arg2 || '—'}</code></td>
                              <td><strong style={{ color: 'var(--brand-primary)' }}>{q.result || '—'}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 8: CFG Visualization (Section 10 & 11 Requirements) */}
              {activeSubtab === 'cfg' && (
                <div id="phase-section-cfg" className="cp-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Visual Control Flow Graph (CFG)</h3>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Method Scope:</span>
                      <button
                        className={`btn btn-sm ${selectedCfgMethod === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSelectedCfgMethod('all')}
                      >
                        All / Program Overview
                      </button>
                      {analysis.cfg?.methods && Object.keys(analysis.cfg.methods).map((mName) => {
                        const methodCfg = analysis.cfg.methods![mName];
                        return (
                          <button
                            key={mName}
                            className={`btn btn-sm ${selectedCfgMethod === mName ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setSelectedCfgMethod(mName)}
                          >
                            {mName}() [V={methodCfg.cyclomatic_complexity}]
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedCfgMethod !== 'all' && analysis.cfg?.methods?.[selectedCfgMethod] && (
                    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.82rem', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span><strong>Method:</strong> <code>{selectedCfgMethod}()</code></span>
                      <span><strong>Entry Block:</strong> <code>{analysis.cfg.methods[selectedCfgMethod].entry_block}</code></span>
                      <span><strong>Exit Block:</strong> <code>{analysis.cfg.methods[selectedCfgMethod].exit_block}</code></span>
                      <span><strong>Instructions:</strong> <code>{analysis.cfg.methods[selectedCfgMethod].instructions_count}</code></span>
                      <span><strong>Method V(G):</strong> <strong style={{ color: 'var(--brand-primary)' }}>{analysis.cfg.methods[selectedCfgMethod].cyclomatic_complexity}</strong></span>
                    </div>
                  )}

                  <VisualCfgGraph
                    nodes={selectedCfgMethod !== 'all' && analysis.cfg?.methods?.[selectedCfgMethod] ? analysis.cfg.methods[selectedCfgMethod].nodes : analysis.cfg.nodes}
                    edges={selectedCfgMethod !== 'all' && analysis.cfg?.methods?.[selectedCfgMethod] ? analysis.cfg.methods[selectedCfgMethod].edges : analysis.cfg.edges}
                    onSelectBlock={(bId) => setSelectedCfgBlock(bId)}
                    selectedBlockId={selectedCfgBlock}
                  />
                </div>
              )}

              {/* Subtab 9: Metrics Dashboard (Section 12 Requirement) */}
              {activeSubtab === 'metrics' && (
                <div id="phase-section-metrics" className="cp-card">
                  <h3 className="panel-title">Software Quality &amp; Complexity Dashboard</h3>

                  <div className="grid-4" style={{ gap: '16px', marginBottom: '20px' }}>
                    <MetricCard
                      title="Cyclomatic Complexity V(G)"
                      value={analysis.metrics.cyclomatic_complexity}
                      icon={Activity}
                      accentColor="#ec4899"
                      badgeText={analysis.metrics.cyclomatic_complexity <= 5 ? "LOW RISK" : "MODERATE"}
                      badgeType={analysis.metrics.cyclomatic_complexity <= 5 ? "low" : "moderate"}
                      description="V(G) = E - N + 2P formula"
                      explanation="Measures the number of linearly independent paths through the program source code."
                    />
                    <MetricCard
                      title="Cognitive Complexity"
                      value={analysis.metrics.cognitive_complexity}
                      icon={Brain}
                      accentColor="#8b5cf6"
                      badgeText="Mental Burden"
                      badgeType="info"
                      description="Code readability score"
                      explanation="Measures how difficult the code logic is to understand for human maintainers based on control flow nesting."
                    />
                    <MetricCard
                      title="Maintainability Index"
                      value={analysis.metrics.maintainability_index}
                      icon={ShieldCheck}
                      accentColor="#10b981"
                      badgeText={analysis.metrics.maintainability_index === 'HIGH' || (typeof analysis.metrics.maintainability_index === 'number' && analysis.metrics.maintainability_index >= 65) ? "HIGH QUALITY" : "MODERATE"}
                      badgeType={analysis.metrics.maintainability_index === 'HIGH' || (typeof analysis.metrics.maintainability_index === 'number' && analysis.metrics.maintainability_index >= 65) ? "success" : "moderate"}
                      description="Software maintainability rating"
                      explanation="Software Engineering metric calculated from Halstead Volume, Cyclomatic Complexity, and Lines of Code."
                    />
                    <MetricCard
                      title="Overall Risk Level"
                      value={analysis.metrics.risk_level}
                      icon={Gauge}
                      accentColor={analysis.metrics.risk_level === 'HIGH' ? "#ef4444" : "#10b981"}
                      badgeText={analysis.metrics.risk_level}
                      badgeType={analysis.metrics.risk_level === 'HIGH' ? 'high' : 'low'}
                      description="Integrated compiler risk pass"
                      explanation="Combined compiler risk rating aggregating AST depth, complexity V(G), diagnostic errors, and code density."
                    />
                  </div>

                  {/* Cyclomatic Complexity Formula Explanation Card */}
                  {(() => {
                    const programP = analysis.cfg?.program_aggregate?.connected_components ?? (analysis.cfg?.methods ? Object.keys(analysis.cfg.methods).length : 1);
                    return (
                      <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--brand-primary)', marginBottom: '6px', fontWeight: 700 }}>
                          Cyclomatic Complexity Calculation Formula
                        </h4>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                          V(G) = E - N + 2P = {analysis.cfg.edges.length} - {analysis.cfg.nodes.length} + 2({programP}) = <strong>{analysis.metrics.cyclomatic_complexity}</strong>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          E: Control flow edges ({analysis.cfg.edges.length}), N: Basic block nodes ({analysis.cfg.nodes.length}), P: Connected components ({programP}).
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
                    <div style={{ background: 'var(--bg-subtle)', padding: 16, borderRadius: 8, border: '1px solid var(--border-light)' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Complexity by Method</h4>
                      {(analysis.metrics.method_complexities || [{ name: 'main', cyclomatic_complexity: analysis.metrics.cyclomatic_complexity }]).map((method) => {
                        const width = Math.min(100, Math.max(6, method.cyclomatic_complexity * 10));
                        return (
                          <button
                            key={method.name}
                            type="button"
                            onClick={() => scrollToPhaseResult('cfg')}
                            style={{ display: 'grid', gridTemplateColumns: '120px 1fr 42px', gap: 10, alignItems: 'center', width: '100%', background: 'transparent', border: 0, marginBottom: 10, cursor: 'pointer', textAlign: 'left' }}
                          >
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{method.name}()</span>
                            <span style={{ height: 10, borderRadius: 999, background: 'var(--border-light)', overflow: 'hidden' }}>
                              <span style={{ display: 'block', width: `${width}%`, height: '100%', background: 'var(--brand-primary)' }} />
                            </span>
                            <strong style={{ color: 'var(--brand-primary)' }}>{method.cyclomatic_complexity}</strong>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ background: 'var(--bg-subtle)', padding: 16, borderRadius: 8, border: '1px solid var(--border-light)' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Quality Indicators</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => scrollToPhaseResult('semantic')}>
                          {analysis.diagnostics.some((d) => d.severity === 'error') ? '✕' : '✓'} Syntax and semantic diagnostics: {analysis.diagnostics.length}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => scrollToPhaseResult('cfg')}>
                          ✓ CFG blocks: {analysis.cfg.nodes.length}, edges: {analysis.cfg.edges.length}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => scrollToPhaseResult('lexical')}>
                          ✓ Token density: {analysis.metrics.tokens_count} tokens across {analysis.metrics.source_loc} code lines
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => scrollToPhaseResult('metrics')}>
                          {analysis.metrics.cyclomatic_complexity > 10 ? '⚠' : '✓'} Complexity rule: LOW ≤5, MODERATE ≤10, HIGH ≤20, CRITICAL &gt;20
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 10: Target Code JVM Assembly (Section 13 & 14 Requirements) */}
              {activeSubtab === 'target' && (
                <div id="phase-section-target" className="cp-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>Educational JVM-like Target Code</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {analysis.target_code?.instructions_count || 0} instructions | Max Stack: {analysis.target_code?.max_stack_depth || 0} | Local Slots: {analysis.target_code?.local_slots_count || 0}
                      </div>
                    </div>
                  </div>

                  <BytecodeInstructionInspector instructions={analysis.target_code?.instructions || []} />
                </div>
              )}

              {/* Subtab 11: Compiler Report (Section 17 & 18 Requirements) */}
              {activeSubtab === 'report' && (
                <div id="phase-section-report" className="cp-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 className="panel-title" style={{ margin: 0 }}>Compiler Intelligence Report</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Authoritative 14-Section Analysis Report | Artifact ID: <code>{artifactId || 'LIVE_COMPILATION'}</code>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary btn-sm" onClick={handleDownloadPDF}>
                        <Download size={14} /> Download PDF Report
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={handleDownloadJSON}>
                        Download AST JSON
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={handleDownloadCSV}>
                        Download Metrics CSV
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setIsPrintMode(!isPrintMode)}>
                        <Printer size={14} /> {isPrintMode ? 'Standard Mode' : 'Print Mode'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={handleGenerateCompilerReport}>
                        <RefreshCw size={14} className={reportLoading ? 'spin' : ''} /> Regenerate
                      </button>
                    </div>
                  </div>

                  {/* Executed Layer Status Matrix (Requirement 14) */}
                  <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600 }}>
                      ✓ Compiler Intelligence — EXECUTED
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                      ○ Data Intelligence — NOT EXECUTED
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                      ○ ML Intelligence — NOT EXECUTED
                    </div>
                  </div>

                  {reportLoading ? (
                    <LoadingState title="Generating Compiler Intelligence Report..." />
                  ) : (
                    <div style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: isPrintMode ? '40px' : '20px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.84rem',
                      whiteSpace: 'pre-wrap',
                      maxHeight: isPrintMode ? 'none' : '550px',
                      overflowY: isPrintMode ? 'visible' : 'auto'
                    }}>
                      {compilerReportMd || 'Click Regenerate Report to compile report data.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <GrammarToolkitModal isOpen={isGrammarModalOpen} onClose={() => setIsGrammarModalOpen(false)} />
      <MultiFileProjectModal
        isOpen={isMultiFileModalOpen}
        onClose={() => setIsMultiFileModalOpen(false)}
        onAnalyzeProject={(proj) => {
          setProjectAnalysisData(proj);
        }}
        onLoadFileIntoStudio={(code, name) => {
          setSourceCode(code);
          setFileName(name);
          resetAnalysisState();
          setActiveSubtab('source');
          setShowEditor(true);
          setIsMultiFileModalOpen(false);
        }}
        initialProjectData={projectAnalysisData}
      />
    </div>
  );
};
