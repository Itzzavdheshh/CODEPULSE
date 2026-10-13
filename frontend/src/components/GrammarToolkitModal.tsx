import React, { useState, useEffect } from 'react';
import { BookOpen, Play, CheckCircle2, ArrowRight, X, AlertCircle, Layers } from 'lucide-react';
import { analyzeGrammar } from '../services/api';

interface GrammarToolkitModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const GrammarToolkitModal: React.FC<GrammarToolkitModalProps> = ({ isOpen, onClose }) => {
  const [rdInput, setRdInput] = useState<string>('c a b d');
  const [srInput, setSrInput] = useState<string>('i + i * i');
  const [loading, setLoading] = useState<boolean>(false);
  const [grammarData, setGrammarData] = useState<any | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await analyzeGrammar(undefined, rdInput, srInput);
      setGrammarData(res);
    } catch (err) {
      alert('Grammar analysis failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !grammarData) {
      handleAnalyze();
    }
  }, [isOpen]);

  if (isOpen === false) return null;

  const ga = grammarData?.grammar_analysis;
  const rd = grammarData?.recursive_descent_trace;
  const sr = grammarData?.shift_reduce_trace;
  const nonTerminals: string[] = ga?.non_terminals || [];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="cp-card" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
          <span className="panel-title" style={{ margin: 0, color: 'var(--brand-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} />
            Compiler Design Grammar Analysis &amp; Parsing Toolkit
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary btn-sm" onClick={handleAnalyze} disabled={loading}>
              <Play size={14} />
              {loading ? 'Computing...' : 'Analyze Grammar & Trace'}
            </button>
            {onClose && (
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                <X size={16} /> Close
              </button>
            )}
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '16px', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Recursive Descent Input Grammar (S → c A d, A → a b | a)
            </label>
            <input
              type="text"
              value={rdInput}
              onChange={(e) => setRdInput(e.target.value)}
              className="cp-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Shift-Reduce Expression Input (E → E + E | E * E | i)
            </label>
            <input
              type="text"
              value={srInput}
              onChange={(e) => setSrInput(e.target.value)}
              className="cp-input"
            />
          </div>
        </div>

        {ga && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Grammar Vocabulary Overview Badges */}
            <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>GRAMMAR SYMBOLS:</span>
              <span className="badge badge-info">Non-Terminals: {ga.non_terminals?.join(', ')}</span>
              <span className="badge badge-low">Terminals: {ga.terminals?.join(', ')}</span>
              <span className="badge badge-info">Productions: {Object.values(ga.left_recursion?.original_productions || {}).reduce((sum: number, prods: any) => sum + (Array.isArray(prods) ? prods.length : 0), 0)}</span>
              <span className="badge badge-amber">Nullable: {ga.nullable?.length > 0 ? ga.nullable.join(', ') : 'None (Ø)'}</span>
            </div>

            {/* FIRST & FOLLOW Sets Tables */}
            <div className="grid-2" style={{ gap: '16px' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '0.88rem', color: 'var(--brand-primary)', marginBottom: '8px', fontWeight: 700 }}>
                  FIRST Sets
                </h4>
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Non-Terminal</th>
                      <th>FIRST(A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonTerminals.map((nt: string) => {
                      const set = ga.first_sets?.[nt] || [];
                      return (
                      <tr key={nt}>
                        <td><strong>{nt}</strong></td>
                        <td><code style={{ color: 'var(--brand-primary)' }}>&#123; {Array.isArray(set) ? set.join(', ') : ''} &#125;</code></td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '0.88rem', color: 'var(--color-emerald)', marginBottom: '8px', fontWeight: 700 }}>
                  FOLLOW Sets
                </h4>
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Non-Terminal</th>
                      <th>FOLLOW(A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonTerminals.map((nt: string) => {
                      const set = ga.follow_sets?.[nt] || [];
                      return (
                      <tr key={nt}>
                        <td><strong>{nt}</strong></td>
                        <td><code style={{ color: 'var(--color-emerald)' }}>&#123; {Array.isArray(set) ? set.join(', ') : ''} &#125;</code></td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Left Recursion Status */}
            <div style={{ background: ga.left_recursion?.has_left_recursion ? 'var(--color-amber-light)' : 'var(--color-emerald-light)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
              <strong>Direct Left-Recursion Analysis:</strong> {ga.left_recursion?.explanation}
            </div>

            {/* Recursive Descent Trace */}
            {rd && (
              <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                    Recursive Descent Simulation Trace
                  </h4>
                  <span className={`badge badge-${rd.success ? 'low' : 'high'}`}>
                    {rd.success ? '✓ ACCEPTED' : '✕ REJECTED'}
                  </span>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>Step</th>
                        <th>Action Executed</th>
                        <th>Input Buffer Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rd.trace?.map((t: any, idx: number) => (
                        <tr key={idx}>
                          <td>#{t.step}</td>
                          <td><code>{t.action}</code></td>
                          <td><code>{t.input_remaining}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Shift-Reduce Trace */}
            {sr && (
              <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                    Shift-Reduce Operator Parsing Trace
                  </h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {sr.conflicts && sr.conflicts.length > 0 && (
                      <span className="badge badge-high">
                        ⚠️ SHIFT/REDUCE AMBIGUITY
                      </span>
                    )}
                    <span className={`badge badge-${sr.success ? 'low' : 'high'}`}>
                      {sr.success ? '✓ ACCEPTED' : '✕ PARSE ERROR'}
                    </span>
                  </div>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th>Step</th>
                        <th>Parser Stack</th>
                        <th>Input Buffer</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sr.steps?.map((s: any, idx: number) => (
                        <tr key={idx}>
                          <td>#{s.step}</td>
                          <td><code>{s.stack}</code></td>
                          <td><code>{s.input}</code></td>
                          <td><span className="badge badge-info">{s.action}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
