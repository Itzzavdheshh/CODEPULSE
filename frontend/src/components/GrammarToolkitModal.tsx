import React, { useState } from 'react';
import { BookOpen, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { analyzeGrammar } from '../services/api';

export const GrammarToolkitModal: React.FC = () => {
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

  return (
    <div style={{ background: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span className="panel-title" style={{ margin: 0, color: '#6366F1' }}>
          <BookOpen size={18} />
          Compiler Design Grammar Analysis & Parsing Toolkit
        </span>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
          <Play size={14} />
          {loading ? 'Computing Grammar...' : 'Analyze Grammar & Run Trace'}
        </button>
      </div>

      <div className="grid-2" style={{ marginBottom: '16px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Recursive Descent Input Tokens (S → c A d, A → a b | a)</label>
          <input
            type="text"
            className="code-area"
            value={rdInput}
            onChange={(e) => setRdInput(e.target.value)}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Shift-Reduce Input Tokens (E → E + E | E * E | i)</label>
          <input
            type="text"
            className="code-area"
            value={srInput}
            onChange={(e) => setSrInput(e.target.value)}
          />
        </div>
      </div>

      {grammarData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* FIRST & FOLLOW */}
          <div className="grid-2">
            <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#38BDF8', marginBottom: '8px' }}>FIRST Sets</h4>
              <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                {Object.entries(grammarData.grammar_analysis.first_sets).map(([nt, firsts]: any) => (
                  <div key={nt} style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#F59E0B' }}>FIRST({nt})</span> = &#123; {firsts.join(', ')} &#125;
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#10B981', marginBottom: '8px' }}>FOLLOW Sets</h4>
              <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                {Object.entries(grammarData.grammar_analysis.follow_sets).map(([nt, follows]: any) => (
                  <div key={nt} style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#10B981' }}>FOLLOW({nt})</span> = &#123; follows.join(', ') &#125;
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Left Recursion Transformation */}
          <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#A5B4FC', marginBottom: '6px' }}>Direct Left Recursion Converter</h4>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '8px' }}>{grammarData.grammar_analysis.left_recursion.explanation}</p>
            <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: '#F8FAFC' }}>
              {Object.entries(grammarData.grammar_analysis.left_recursion.transformed_productions).map(([head, prods]: any) => (
                <div key={head}>{head} → {prods.join(' | ')}</div>
              ))}
            </div>
          </div>

          {/* Shift-Reduce Parser Simulation Table */}
          <div>
            <h4 style={{ fontSize: '0.85rem', color: '#F59E0B', marginBottom: '8px' }}>Shift-Reduce Parser Action Trace ($E \to E + E \mid E * E \mid i$)</h4>
            <div className="data-table-container" style={{ maxHeight: '180px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Stack</th>
                    <th>Input Buffer</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {grammarData.shift_reduce_trace.steps.map((s: any) => (
                    <tr key={s.step}>
                      <td>{s.step}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>{s.stack}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>{s.input}</td>
                      <td style={{ fontWeight: 600, color: s.action.startsWith('REDUCE') ? '#10B981' : (s.action === 'ACCEPT' ? '#34D399' : '#F59E0B') }}>{s.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
