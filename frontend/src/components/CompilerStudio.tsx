import React, { useState } from 'react';
import { Play, Code, CheckCircle, AlertTriangle, AlertCircle, Download, FileText, Layers, Network, Zap, BookOpen, Terminal, ChevronRight, ChevronDown, Search, ArrowRight, Eye, RefreshCw } from 'lucide-react';
import { CompilerAnalysis, CFGNode, CFGEdge, SymbolItem, Quadruple, Diagnostic } from '../types';
import { analyzeCompilerSource, getExportUrl } from '../services/api';
import { SAMPLE_JAVA_VALID, SAMPLE_JAVA_SYNTAX_ERROR, SAMPLE_JAVA_TYPE_ERROR } from '../utils/samples';
import { GrammarToolkitModal } from './GrammarToolkitModal';
import { MultiFileProjectModal } from './MultiFileProjectModal';

// --- AST Interactive Tree Component ---
const AstTreeNode: React.FC<{ node: any; selectedLine?: number; onSelectLine: (line: number) => void }> = ({ node, selectedLine, onSelectLine }) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  if (!node) return null;

  const nodeType = node.node_type || node.type || 'ASTNode';
  const line = node.line || (node.position && node.position.line);
  const children = node.children || node.body || node.statements || [];
  const hasChildren = Array.isArray(children) && children.length > 0;
  const isSelected = line && line === selectedLine;

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
          padding: '4px 8px',
          borderRadius: '4px',
          background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={14} color="#94A3B8" /> : <ChevronRight size={14} color="#94A3B8" />
        ) : (
          <div style={{ width: '14px' }} />
        )}
        <span style={{ color: '#6366F1', fontWeight: 600 }}>{nodeType}</span>
        {node.name && <span style={{ color: '#F59E0B' }}>"{node.name}"</span>}
        {node.value && <span style={{ color: '#34D399' }}>= {String(node.value)}</span>}
        {line && <span style={{ fontSize: '0.72rem', color: '#64748B', marginLeft: 'auto' }}>L{line}</span>}
      </div>

      {expanded && hasChildren && (
        <div style={{ borderLeft: '1px dotted rgba(255, 255, 255, 0.15)', marginLeft: '6px' }}>
          {children.map((child: any, idx: number) => (
            <AstTreeNode key={idx} node={child} selectedLine={selectedLine} onSelectLine={onSelectLine} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Interactive SVG CFG Visualizer ---
const SvgCfgVisualizer: React.FC<{ nodes: CFGNode[]; edges: CFGEdge[]; onSelectLine: (line: number) => void }> = ({ nodes, edges, onSelectLine }) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(nodes[0]?.id || null);
  const selectedNode = nodes.find(n => n.id === selectedBlockId) || nodes[0];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }}>
        {/* SVG Canvas */}
        <div style={{ background: '#070A11', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '20px', overflow: 'auto', minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '12px' }}>Interactive Basic Block Graph — Click block to inspect instructions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
            {nodes.map((node) => {
              const isSelected = node.id === selectedBlockId;
              const outgoing = edges.filter(e => e.from === node.id);
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedBlockId(node.id)}
                  style={{
                    background: isSelected ? '#1E1B4B' : '#0F172A',
                    border: `2px solid ${isSelected ? '#6366F1' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    padding: '14px',
                    width: '220px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, color: isSelected ? '#A5B4FC' : '#FFF', fontSize: '0.9rem' }}>{node.label}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{node.instructions_count} instrs</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#CBD5E1', background: '#070A11', padding: '8px', borderRadius: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                    {node.instructions.slice(0, 3).map((inst, i) => (
                      <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inst}</div>
                    ))}
                    {node.instructions.length > 3 && <div style={{ color: '#64748B' }}>+ {node.instructions.length - 3} more...</div>}
                  </div>
                  {outgoing.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#38BDF8', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      Jumps to: {outgoing.map((e, idx) => <span key={idx} className="badge badge-low">{e.to}</span>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Block Details Inspector */}
        {selectedNode && (
          <div style={{ background: '#0F172A', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#FFF', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="#6366F1" /> Block Details: {selectedNode.label}
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '12px' }}>
              Instructions executed sequentially in this single-entry single-exit basic block:
            </p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', background: '#070A11', padding: '12px', borderRadius: '6px', maxHeight: '220px', overflowY: 'auto' }}>
              {selectedNode.instructions.map((inst, idx) => (
                <div key={idx} style={{ color: '#38BDF8', marginBottom: '4px', paddingBottom: '4px', borderBottom: '1px dotted rgba(255, 255, 255, 0.05)' }}>
                  {idx + 1}. {inst}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CompilerStudio: React.FC = () => {
  const [sourceCode, setSourceCode] = useState<string>(SAMPLE_JAVA_VALID);
  const [fileName, setFileName] = useState<string>('SoftwareRiskAnalyzer.java');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<CompilerAnalysis | null>(null);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeSubtab, setActiveSubtab] = useState<string>('metrics');

  // Interactive line highlighting & filters
  const [highlightedLine, setHighlightedLine] = useState<number | undefined>(undefined);
  const [symbolSearch, setSymbolSearch] = useState<string>('');
  const [symbolScopeFilter, setSymbolScopeFilter] = useState<string>('all');

  const handleAnalyze = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await analyzeCompilerSource(sourceCode, fileName);
      setAnalysis(res.analysis);
      if (res.artifact) {
        setArtifactId(res.artifact.artifact_id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Compiler analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const linesArray = sourceCode.split('\n');

  // Filter symbol table
  const filteredSymbols = analysis?.symbol_table.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(symbolSearch.toLowerCase()) || s.category.toLowerCase().includes(symbolSearch.toLowerCase());
    const matchesScope = symbolScopeFilter === 'all' || s.scope.toLowerCase().includes(symbolScopeFilter.toLowerCase());
    return matchesSearch && matchesScope;
  }) || [];

  return (
    <div>
      {/* Header Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code size={22} color="#6366F1" /> Compiler Intelligence Studio
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginTop: '4px' }}>
              Complete 10-phase analysis: Preprocessing → Lexer → Parser → AST → Scoping → Type Checking → IR → Optimization → CFG → Target Assembly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => { setSourceCode(SAMPLE_JAVA_VALID); setFileName('SoftwareRiskAnalyzer.java'); }}>Sample: Valid Code</button>
            <button className="btn btn-secondary" onClick={() => { setSourceCode(SAMPLE_JAVA_SYNTAX_ERROR); setFileName('SyntaxDemo.java'); }}>Sample: Syntax Error</button>
            <button className="btn btn-secondary" onClick={() => { setSourceCode(SAMPLE_JAVA_TYPE_ERROR); setFileName('TypeMismatchDemo.java'); }}>Sample: Type Error</button>
          </div>
        </div>

        {/* 10-Phase Pipeline Stepper Bar */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'metrics', label: '1. SOURCE', status: analysis ? 'COMPLETE' : 'READY' },
            { id: 'preprocess', label: '2. PREPROCESS', status: analysis ? 'COMPLETE' : 'READY' },
            { id: 'tokens', label: '3. LEXICAL', status: analysis ? 'COMPLETE' : 'READY' },
            { id: 'ast', label: '4. AST PARSE', status: analysis ? 'COMPLETE' : 'READY' },
            { id: 'symbols', label: '5. SEMANTIC', status: analysis ? 'COMPLETE' : 'READY' },
            { id: 'ir', label: '6. TAC IR', status: analysis ? 'COMPLETE' : 'READY' },
            { id: 'ir', label: '7. OPTIMIZE', status: analysis ? 'COMPLETE' : 'READY' },
            { id: 'cfg', label: '8. CFG GRAPH', status: analysis ? 'COMPLETE' : 'READY' },
            { id: 'metrics', label: '9. METRICS', status: analysis ? 'COMPLETE' : 'READY' },
            { id: 'target', label: '10. TARGET', status: analysis ? 'COMPLETE' : 'READY' }
          ].map((phase, idx) => (
            <div
              key={idx}
              onClick={() => setActiveSubtab(phase.id)}
              style={{
                flex: 1,
                minWidth: '100px',
                padding: '8px',
                borderRadius: '6px',
                background: activeSubtab === phase.id ? 'rgba(99, 102, 241, 0.2)' : '#0F172A',
                border: `1px solid ${activeSubtab === phase.id ? '#6366F1' : 'var(--border-color)'}`,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: activeSubtab === phase.id ? '#A5B4FC' : '#94A3B8' }}>{phase.label}</div>
              <span className={`badge ${analysis ? 'badge-low' : 'badge-info'}`} style={{ fontSize: '0.62rem', padding: '2px 6px', marginTop: '4px' }}>
                {analysis ? 'DONE ✓' : 'READY'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Code Editor with Line Numbers & Jump Markers */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="panel-title" style={{ margin: 0 }}>
              <Code size={18} color="#6366F1" />
              Source Editor
            </span>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              style={{ background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Custom Editor Container with Line Numbers */}
          <div style={{ display: 'flex', background: '#0B0F19', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Line Numbers Gutter */}
            <div style={{ padding: '16px 8px', background: '#070A11', color: '#475569', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', textAlign: 'right', userSelect: 'none', borderRight: '1px solid var(--border-color)' }}>
              {linesArray.map((_, i) => {
                const lineNum = i + 1;
                const isDiag = analysis?.diagnostics.some(d => d.line === lineNum);
                const isHighlighted = highlightedLine === lineNum;
                return (
                  <div
                    key={i}
                    style={{
                      height: '21px',
                      color: isDiag ? '#EF4444' : isHighlighted ? '#6366F1' : '#475569',
                      fontWeight: isDiag || isHighlighted ? 700 : 400
                    }}
                  >
                    {isDiag ? '● ' : ''}{lineNum}
                  </div>
                );
              })}
            </div>

            {/* Editable Text Area */}
            <textarea
              className="code-area"
              rows={22}
              style={{ border: 'none', borderRadius: 0, padding: '16px 12px', lineHeight: '21px', background: 'transparent' }}
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="Write Java source code..."
            />
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
              <Play size={16} />
              {loading ? 'Analyzing Source Pipeline...' : 'Run Compiler Engine'}
            </button>
            {analysis && (
              <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                Processed {analysis.stats.lines} LOC, {analysis.stats.tokens_count} tokens
              </span>
            )}
          </div>

          {errorMsg && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '0.85rem' }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Right Column: Engine Analysis Inspector */}
        <div className="glass-panel">
          {!analysis ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
              <Zap size={48} color="#334155" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#94A3B8', fontWeight: 600 }}>No Analysis Output Yet</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>Click "Run Compiler Engine" to execute full 10-phase analysis.</p>
            </div>
          ) : (
            <div>
              {/* Pipeline Subtabs */}
              <div className="subtabs" style={{ flexWrap: 'wrap' }}>
                <button className={`subtab-btn ${activeSubtab === 'metrics' ? 'active' : ''}`} onClick={() => setActiveSubtab('metrics')}>Metrics & Risk</button>
                <button className={`subtab-btn ${activeSubtab === 'preprocess' ? 'active' : ''}`} onClick={() => setActiveSubtab('preprocess')}>Preprocess</button>
                <button className={`subtab-btn ${activeSubtab === 'tokens' ? 'active' : ''}`} onClick={() => setActiveSubtab('tokens')}>Tokens</button>
                <button className={`subtab-btn ${activeSubtab === 'ast' ? 'active' : ''}`} onClick={() => setActiveSubtab('ast')}>AST Explorer</button>
                <button className={`subtab-btn ${activeSubtab === 'symbols' ? 'active' : ''}`} onClick={() => setActiveSubtab('symbols')}>Symbol Table</button>
                <button className={`subtab-btn ${activeSubtab === 'ir' ? 'active' : ''}`} onClick={() => setActiveSubtab('ir')}>TAC & Optimization</button>
                <button className={`subtab-btn ${activeSubtab === 'cfg' ? 'active' : ''}`} onClick={() => setActiveSubtab('cfg')}>CFG Visualizer</button>
                <button className={`subtab-btn ${activeSubtab === 'target' ? 'active' : ''}`} onClick={() => setActiveSubtab('target')}>JVM Assembly</button>
                <button className={`subtab-btn ${activeSubtab === 'grammar' ? 'active' : ''}`} onClick={() => setActiveSubtab('grammar')}>Grammar Toolkit</button>
                <button className={`subtab-btn ${activeSubtab === 'project' ? 'active' : ''}`} onClick={() => setActiveSubtab('project')}>Multi-File</button>
              </div>

              {/* Subtab Content: Metrics & Diagnostics */}
              {activeSubtab === 'metrics' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Cyclomatic V(G)</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#6366F1' }}>{analysis.metrics.cyclomatic_complexity}</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Risk Level</span>
                      <div style={{ marginTop: '4px' }}>
                        <span className={`badge badge-${analysis.metrics.risk_level.toLowerCase()}`}>{analysis.metrics.risk_level}</span>
                      </div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Maintainability</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10B981', marginTop: '4px' }}>{analysis.metrics.maintainability_index}</div>
                    </div>
                  </div>

                  {/* Downloads */}
                  {artifactId && (
                    <div style={{ background: '#0B0F19', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '0.85rem', color: '#38BDF8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={14} /> Download Reusable Artifacts & Datasets
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <a className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '4px 10px' }} href={getExportUrl(artifactId, 'zip')} download>
                          Download All (.zip)
                        </a>
                        <a className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} href={getExportUrl(artifactId, 'json')} download>
                          compiler_analysis.json
                        </a>
                        <a className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} href={getExportUrl(artifactId, 'tokens_csv')} download>
                          tokens.csv
                        </a>
                        <a className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} href={getExportUrl(artifactId, 'symbol_table_csv')} download>
                          symbol_table.csv
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Diagnostics list with jump-to-line */}
                  <h4 style={{ fontSize: '0.95rem', color: '#FFF', marginBottom: '10px' }}>Diagnostics & Syntax Errors ({analysis.diagnostics.length})</h4>
                  {analysis.diagnostics.length === 0 ? (
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#34D399', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
                      Clean compile: Zero lexical, syntax, or semantic diagnostics found!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                      {analysis.diagnostics.map((d, idx) => (
                        <div
                          key={idx}
                          onClick={() => setHighlightedLine(d.line)}
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            background: d.severity === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            border: `1px solid ${d.severity === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                            color: d.severity === 'error' ? '#F87171' : '#FBBF24',
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>[{d.phase}] Line {d.line}, Col {d.column} (Click to jump)</div>
                          <div>{d.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtab Content: Preprocess */}
              {activeSubtab === 'preprocess' && analysis.preprocessing && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '8px' }}>Comment Analysis & Macro Expansion</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Single Line //</span>
                      <div style={{ fontWeight: 700, color: '#38BDF8' }}>{analysis.preprocessing.comment_stats.single_line_comments_count}</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Block /* */</span>
                      <div style={{ fontWeight: 700, color: '#38BDF8' }}>{analysis.preprocessing.comment_stats.block_comments_count}</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Removed Chars</span>
                      <div style={{ fontWeight: 700, color: '#F59E0B' }}>{analysis.preprocessing.comment_stats.removed_characters}</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Macros Defined</span>
                      <div style={{ fontWeight: 700, color: '#10B981' }}>{analysis.preprocessing.macros.length}</div>
                    </div>
                  </div>
                  <pre style={{ background: '#0B0F19', padding: '12px', borderRadius: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', maxHeight: '200px', overflowY: 'auto' }}>
                    {analysis.preprocessing.cleaned_source}
                  </pre>
                </div>
              )}

              {/* Subtab Content: Tokens */}
              {activeSubtab === 'tokens' && (
                <div>
                  <div className="data-table-container" style={{ maxHeight: '320px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Line:Col</th>
                          <th>Type</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.tokens.map((t, idx) => (
                          <tr key={idx} onClick={() => setHighlightedLine(t.line)} style={{ cursor: 'pointer' }}>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>{t.line}:{t.column}</td>
                            <td><span className="badge badge-info">{t.type}</span></td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#F8FAFC' }}>{t.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab Content: AST Tree Explorer */}
              {activeSubtab === 'ast' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#FFF' }}>Interactive AST Node Hierarchy</h4>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Click node to highlight line</span>
                  </div>
                  <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                    <AstTreeNode node={analysis.ast} selectedLine={highlightedLine} onSelectLine={(l) => setHighlightedLine(l)} />
                  </div>
                </div>
              )}

              {/* Subtab Content: Symbol Table */}
              {activeSubtab === 'symbols' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Search identifier or category..."
                      value={symbolSearch}
                      onChange={(e) => setSymbolSearch(e.target.value)}
                      style={{ background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', flex: 1 }}
                    />
                  </div>
                  <div className="data-table-container" style={{ maxHeight: '340px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Identifier</th>
                          <th>Category</th>
                          <th>Type</th>
                          <th>Scope</th>
                          <th>Line</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSymbols.map((s, idx) => (
                          <tr key={idx} onClick={() => setHighlightedLine(s.line)} style={{ cursor: 'pointer' }}>
                            <td style={{ fontWeight: 600, color: '#6366F1' }}>{s.name}</td>
                            <td>{s.category}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>{s.data_type}</td>
                            <td style={{ color: '#94A3B8' }}>{s.scope}</td>
                            <td>Line {s.line}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtab Content: TAC IR & Optimization */}
              {activeSubtab === 'ir' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '8px' }}>Side-by-Side TAC Optimization</h4>
                  <div className="grid-2" style={{ gap: '12px', marginBottom: '16px' }}>
                    {/* Before Optimization */}
                    <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F59E0B', marginBottom: '8px' }}>Original Quadruples</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {analysis.intermediate_code.map((q, idx) => (
                          <div key={idx} style={{ marginBottom: '4px' }}>
                            <span style={{ color: '#F59E0B' }}>{q.op}</span> {q.arg1} {q.arg2} → <span style={{ color: '#34D399' }}>{q.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* After Optimization */}
                    <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10B981', marginBottom: '8px' }}>Optimized Quadruples</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {analysis.optimized_code.map((q, idx) => (
                          <div key={idx} style={{ marginBottom: '4px' }}>
                            <span style={{ color: '#10B981' }}>{q.op}</span> {q.arg1} {q.arg2} → <span style={{ color: '#38BDF8' }}>{q.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {analysis.optimization_transformations.length > 0 && (
                    <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h5 style={{ fontSize: '0.82rem', color: '#10B981', marginBottom: '6px' }}>Transformations Applied:</h5>
                      <ul style={{ fontSize: '0.78rem', color: '#94A3B8', paddingLeft: '18px' }}>
                        {analysis.optimization_transformations.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Subtab Content: CFG Visualizer */}
              {activeSubtab === 'cfg' && (
                <SvgCfgVisualizer nodes={analysis.cfg.nodes} edges={analysis.cfg.edges} onSelectLine={(l) => setHighlightedLine(l)} />
              )}

              {/* Subtab Content: Target Code */}
              {activeSubtab === 'target' && analysis.target_code && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#FFF' }}>Educational JVM Assembly Bytecode</h4>
                    <span className="badge badge-info">Max Stack Depth: {analysis.target_code.max_stack_depth}</span>
                  </div>
                  <pre style={{ background: '#0B0F19', padding: '14px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38BDF8', maxHeight: '320px', overflowY: 'auto' }}>
                    {analysis.target_code.assembly_code}
                  </pre>
                </div>
              )}

              {/* Subtab Content: Grammar Toolkit */}
              {activeSubtab === 'grammar' && <GrammarToolkitModal />}

              {/* Subtab Content: Multi-File Project */}
              {activeSubtab === 'project' && <MultiFileProjectModal />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
