import React, { useState } from 'react';
import { Play, Code, CheckCircle, AlertTriangle, AlertCircle, Download, FileText, Layers, Network, Zap, BookOpen, Terminal } from 'lucide-react';
import { CompilerAnalysis } from '../types';
import { analyzeCompilerSource, getExportUrl } from '../services/api';
import { SAMPLE_JAVA_VALID, SAMPLE_JAVA_SYNTAX_ERROR, SAMPLE_JAVA_TYPE_ERROR } from '../utils/samples';
import { GrammarToolkitModal } from './GrammarToolkitModal';
import { MultiFileProjectModal } from './MultiFileProjectModal';

export const CompilerStudio: React.FC = () => {
  const [sourceCode, setSourceCode] = useState<string>(SAMPLE_JAVA_VALID);
  const [fileName, setFileName] = useState<string>('SoftwareRiskAnalyzer.java');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<CompilerAnalysis | null>(null);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeSubtab, setActiveSubtab] = useState<string>('metrics');

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

  return (
    <div>
      {/* Guided Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Compiler Intelligence Studio</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Full 10-phase analysis: Preprocessing → Lexical & Keywords → Syntax AST → Symbol Scoping → Type Diagnostics → TAC IR → Constant Folding → Basic Block CFG → Target JVM Assembly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => { setSourceCode(SAMPLE_JAVA_VALID); setFileName('SoftwareRiskAnalyzer.java'); }}>Sample: Valid</button>
            <button className="btn btn-secondary" onClick={() => { setSourceCode(SAMPLE_JAVA_SYNTAX_ERROR); setFileName('SyntaxDemo.java'); }}>Sample: Syntax Err</button>
            <button className="btn btn-secondary" onClick={() => { setSourceCode(SAMPLE_JAVA_TYPE_ERROR); setFileName('TypeMismatchDemo.java'); }}>Sample: Type Err</button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Code Editor */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="panel-title" style={{ margin: 0 }}>
              <Code size={18} color="#6366F1" />
              Source Code Editor
            </span>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              style={{ background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem' }}
            />
          </div>

          <textarea
            className="code-area"
            rows={20}
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            placeholder="Write Java-like source code here..."
          />

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
              <Play size={16} />
              {loading ? 'Analyzing Source Pipeline...' : 'Run Compiler Engine'}
            </button>
            {analysis && (
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
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
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <Zap size={48} color="#334155" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#94A3B8', fontWeight: 600 }}>No Analysis Output Yet</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>Click "Run Compiler Engine" to generate Preprocessing, Tokens, AST, Symbol Table, TAC IR, CFG, and Target Code.</p>
            </div>
          ) : (
            <div>
              {/* Pipeline Subtabs */}
              <div className="subtabs" style={{ flexWrap: 'wrap' }}>
                <button className={`subtab-btn ${activeSubtab === 'metrics' ? 'active' : ''}`} onClick={() => setActiveSubtab('metrics')}>Metrics & Risk</button>
                <button className={`subtab-btn ${activeSubtab === 'preprocess' ? 'active' : ''}`} onClick={() => setActiveSubtab('preprocess')}>Preprocess & Macros</button>
                <button className={`subtab-btn ${activeSubtab === 'tokens' ? 'active' : ''}`} onClick={() => setActiveSubtab('tokens')}>Tokens & Keywords</button>
                <button className={`subtab-btn ${activeSubtab === 'ast' ? 'active' : ''}`} onClick={() => setActiveSubtab('ast')}>AST Tree</button>
                <button className={`subtab-btn ${activeSubtab === 'symbols' ? 'active' : ''}`} onClick={() => setActiveSubtab('symbols')}>Symbols</button>
                <button className={`subtab-btn ${activeSubtab === 'ir' ? 'active' : ''}`} onClick={() => setActiveSubtab('ir')}>TAC IR & Opt</button>
                <button className={`subtab-btn ${activeSubtab === 'cfg' ? 'active' : ''}`} onClick={() => setActiveSubtab('cfg')}>CFG Graph</button>
                <button className={`subtab-btn ${activeSubtab === 'target' ? 'active' : ''}`} onClick={() => setActiveSubtab('target')}>JVM Target Code</button>
                <button className={`subtab-btn ${activeSubtab === 'grammar' ? 'active' : ''}`} onClick={() => setActiveSubtab('grammar')}>Grammar Toolkit</button>
                <button className={`subtab-btn ${activeSubtab === 'project' ? 'active' : ''}`} onClick={() => setActiveSubtab('project')}>Multi-File Project</button>
              </div>

              {/* Subtab Content: Metrics & Risk */}
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

                  {/* Export Downloads Section */}
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
                        <a className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} href={getExportUrl(artifactId, 'tac_csv')} download>
                          tac.csv
                        </a>
                        <a className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }} href={getExportUrl(artifactId, 'metrics_csv')} download>
                          metrics.csv
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Diagnostics List */}
                  <h4 style={{ fontSize: '0.95rem', color: '#FFF', marginBottom: '10px' }}>Diagnostics & Syntax Errors ({analysis.diagnostics.length})</h4>
                  {analysis.diagnostics.length === 0 ? (
                    <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#34D399', fontSize: '0.85rem' }}>
                      <CheckCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
                      Clean compile: Zero lexical, syntax, or semantic diagnostics found!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                      {analysis.diagnostics.map((d, idx) => (
                        <div key={idx} style={{
                          padding: '10px',
                          borderRadius: '6px',
                          background: d.severity === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          border: `1px solid ${d.severity === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                          color: d.severity === 'error' ? '#F87171' : '#FBBF24',
                          fontSize: '0.82rem'
                        }}>
                          <div style={{ fontWeight: 600 }}>[{d.phase}] Line {d.line}, Col {d.column}</div>
                          <div>{d.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Subtab Content: Preprocess & Macros */}
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

                  <h5 style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>Cleaned Source Code (Comments Stripped):</h5>
                  <pre style={{ background: '#0B0F19', padding: '12px', borderRadius: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', maxHeight: '200px', overflowY: 'auto' }}>
                    {analysis.preprocessing.cleaned_source}
                  </pre>
                </div>
              )}

              {/* Subtab Content: Tokens & Keywords */}
              {activeSubtab === 'tokens' && (
                <div>
                  {analysis.keyword_frequency && (
                    <div style={{ marginBottom: '12px', background: '#0F172A', padding: '10px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38BDF8' }}>Keyword Frequency: </span>
                      {Object.entries(analysis.keyword_frequency).map(([k, v]) => (
                        <span key={k} style={{ fontSize: '0.78rem', color: '#FFF', marginRight: '10px', fontFamily: 'var(--font-mono)' }}>
                          {k}: <strong>{v}</strong>
                        </span>
                      ))}
                    </div>
                  )}

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
                          <tr key={idx}>
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

              {/* Subtab Content: AST Tree */}
              {activeSubtab === 'ast' && (
                <div style={{ background: '#0B0F19', padding: '16px', borderRadius: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                  <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#A5B4FC' }}>
                    {JSON.stringify(analysis.ast, null, 2)}
                  </pre>
                </div>
              )}

              {/* Subtab Content: Symbol Table */}
              {activeSubtab === 'symbols' && (
                <div className="data-table-container" style={{ maxHeight: '380px' }}>
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
                      {analysis.symbol_table.map((s, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: '#6366F1' }}>{s.name}</td>
                          <td>{s.category}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>{s.data_type}</td>
                          <td style={{ color: '#94A3B8' }}>{s.scope}</td>
                          <td>{s.line}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Subtab Content: TAC IR & Optimization */}
              {activeSubtab === 'ir' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '8px' }}>Three-Address Code (TAC Quadruples)</h4>
                  <div className="data-table-container" style={{ maxHeight: '200px', marginBottom: '16px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Op</th>
                          <th>Arg1</th>
                          <th>Arg2</th>
                          <th>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.intermediate_code.map((q, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600, color: '#F59E0B' }}>{q.op}</td>
                            <td>{q.arg1}</td>
                            <td>{q.arg2}</td>
                            <td style={{ color: '#34D399', fontWeight: 600 }}>{q.result}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {analysis.optimization_transformations.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: '0.85rem', color: '#10B981', marginBottom: '6px' }}>Optimization Transformations Applied:</h5>
                      <ul style={{ fontSize: '0.8rem', color: '#94A3B8', paddingLeft: '18px' }}>
                        {analysis.optimization_transformations.map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Subtab Content: CFG Graph */}
              {activeSubtab === 'cfg' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '12px' }}>Basic Blocks & Jump Edges</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                    {analysis.cfg.nodes.map((node) => (
                      <div key={node.id} style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#6366F1' }}>{node.label}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{node.instructions_count} Instructions</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#CBD5E1', background: '#0B0F19', padding: '8px', borderRadius: '4px' }}>
                          {node.instructions.map((inst, i) => (
                            <div key={i}>{inst}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab Content: Target Code */}
              {activeSubtab === 'target' && analysis.target_code && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#FFF' }}>Educational JVM Target Bytecode</h4>
                    <span className="badge badge-info">Max Stack: {analysis.target_code.max_stack_depth}</span>
                  </div>
                  <pre style={{ background: '#0B0F19', padding: '14px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38BDF8', maxHeight: '320px', overflowY: 'auto' }}>
                    {analysis.target_code.assembly_code}
                  </pre>
                </div>
              )}

              {/* Subtab Content: Grammar Toolkit */}
              {activeSubtab === 'grammar' && (
                <GrammarToolkitModal />
              )}

              {/* Subtab Content: Multi-File Project */}
              {activeSubtab === 'project' && (
                <MultiFileProjectModal />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
