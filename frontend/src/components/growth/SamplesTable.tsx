import React, { useState } from 'react';
import { GrowthSample, GrowthFit } from '../../types';
import { Table, Info } from 'lucide-react';

interface SamplesTableProps {
  samples: GrowthSample[];
  fit?: GrowthFit;
  truncatedReason?: string | null;
}

export const SamplesTable: React.FC<SamplesTableProps> = ({
  samples,
  fit,
  truncatedReason
}) => {
  const [activeTab, setActiveTab] = useState<'samples' | 'ratios' | 'candidates'>('samples');

  // Build map of doubling ratios
  const ratioMap = new Map<number, number>();
  if (fit?.doubling_ratios) {
    fit.doubling_ratios.forEach((dr) => {
      ratioMap.set(dr.to_n, dr.ratio);
    });
  }

  const top3Candidates = fit?.candidates ? fit.candidates.slice(0, 3) : [];

  return (
    <div style={{
      background: 'var(--bg-surface, #FFFFFF)',
      border: '1px solid var(--border-light, #E2E8F0)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '22px 26px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))'
    }}>
      {/* Header & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Table size={18} color="var(--brand-primary, #4F46E5)" />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
            Empirical Evidence &amp; Execution Points
          </h4>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'inline-flex',
          borderRadius: '8px',
          border: '1px solid var(--border-light, #CBD5E1)',
          background: 'var(--bg-inset, #F1F5F9)',
          padding: '3px'
        }}>
          <button
            onClick={() => setActiveTab('samples')}
            style={{
              background: activeTab === 'samples' ? 'var(--brand-primary, #4F46E5)' : 'transparent',
              color: activeTab === 'samples' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sample Ladder ({samples.length})
          </button>
          <button
            onClick={() => setActiveTab('ratios')}
            style={{
              background: activeTab === 'ratios' ? 'var(--brand-primary, #4F46E5)' : 'transparent',
              color: activeTab === 'ratios' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Doubling Ratios &amp; Slope
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            style={{
              background: activeTab === 'candidates' ? 'var(--brand-primary, #4F46E5)' : 'transparent',
              color: activeTab === 'candidates' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Candidate Ranking (Top 3)
          </button>
        </div>
      </div>

      {/* Tab Content: Samples Table */}
      {activeTab === 'samples' && (
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-light, #E2E8F0)' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.82rem',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{
                background: 'var(--bg-inset, #F8FAFC)',
                borderBottom: '1px solid var(--border-light, #E2E8F0)',
                color: 'var(--text-secondary, #475569)',
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '10px 14px' }}>Input Size (n)</th>
                <th style={{ padding: '10px 14px' }}>Abstract Steps</th>
                <th style={{ padding: '10px 14px' }}>T(2n) / T(n)</th>
                <th style={{ padding: '10px 14px' }}>Return Value</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s, idx) => {
                const ratio = ratioMap.get(s.n);
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--border-light, #E2E8F0)',
                      background: idx % 2 === 0 ? '#FFFFFF' : 'var(--bg-subtle, #F8FAFC)'
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>
                      {s.n.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: '#0284C7', fontWeight: 700 }}>
                      {s.steps.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: ratio !== undefined ? '#B45309' : 'var(--text-muted, #94A3B8)', fontWeight: 600 }}>
                      {ratio !== undefined ? `${ratio.toFixed(2)}x` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary, #475569)' }}>
                      {s.return_value !== null && s.return_value !== undefined ? String(s.return_value) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '3px 9px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: s.status === 'ok' ? '#ECFDF5' : '#FEF2F2',
                        color: s.status === 'ok' ? '#065F46' : '#991B1B',
                        border: `1px solid ${s.status === 'ok' ? '#A7F3D0' : '#FECACA'}`
                      }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Doubling Ratios & Log-Log Slope */}
      {activeTab === 'ratios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <div style={{
              background: 'var(--bg-inset, #F8FAFC)',
              border: '1px solid var(--border-light, #E2E8F0)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)', fontWeight: 700 }}>
                Asymptotic Log-Log Slope
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: '#0284C7', marginTop: '4px' }}>
                m = {fit?.log_log_slope.toFixed(3) ?? '0.000'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748B)', marginTop: '4px' }}>
                Fitted on largest 50% ladder points (ln(steps) vs ln(n))
              </div>
            </div>

            <div style={{
              background: 'var(--bg-inset, #F8FAFC)',
              border: '1px solid var(--border-light, #E2E8F0)',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)', fontWeight: 700 }}>
                Theoretical Multiplier Benchmark
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #334155)', marginTop: '6px', lineHeight: 1.6 }}>
                • <strong>O(1)</strong>: 1.0x &nbsp;|&nbsp; <strong>O(n)</strong>: 2.0x<br />
                • <strong>O(n log n)</strong>: ~2.1x–2.3x &nbsp;|&nbsp; <strong>O(n²)</strong>: 4.0x<br />
                • <strong>O(n³)</strong>: 8.0x &nbsp;|&nbsp; <strong>O(2ⁿ)</strong>: 2ⁿx
              </div>
            </div>
          </div>

          {/* Doubling Ratios List */}
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-light, #E2E8F0)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-inset, #F8FAFC)', borderBottom: '1px solid var(--border-light, #E2E8F0)', color: 'var(--text-secondary, #475569)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Step Progression</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Doubling Factor (T(2n) / T(n))</th>
                </tr>
              </thead>
              <tbody>
                {(fit?.doubling_ratios || []).map((dr, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-light, #E2E8F0)', background: idx % 2 === 0 ? '#FFFFFF' : 'var(--bg-subtle, #F8FAFC)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #0F172A)' }}>
                      n = {dr.from_n} ➔ n = {dr.to_n}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#B45309' }}>
                      {dr.ratio.toFixed(3)}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Candidate Ranking */}
      {activeTab === 'candidates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #475569)' }}>
            Top 3 least-squares candidate bases evaluated against the ≤ 5% max relative error rule:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {top3Candidates.map((cand, idx) => {
              const isWinner = cand.basis === fit?.classification;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    background: isWinner ? '#EEF2FF' : 'var(--bg-inset, #F8FAFC)',
                    border: isWinner ? '1px solid #A5B4FC' : '1px solid var(--border-light, #E2E8F0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isWinner ? 'var(--brand-primary, #4F46E5)' : '#94A3B8',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #0F172A)' }}>
                        {cand.basis} {isWinner && <span style={{ fontSize: '0.72rem', color: '#059669', marginLeft: '6px' }}>(Selected Winner)</span>}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748B)', fontFamily: 'var(--font-mono, monospace)' }}>
                        a = {cand.a.toFixed(4)}, b = {cand.b.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: 600 }}>Max Rel Error</div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: cand.max_relative_error <= 0.05 ? '#059669' : '#DC2626'
                      }}>
                        {(cand.max_relative_error * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: 600 }}>R²</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: '#0284C7' }}>
                        {cand.r2.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Honest Notes Footer */}
      {fit?.notes && fit.notes.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border-light, #E2E8F0)',
          paddingTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: 'var(--bg-subtle, #F8FAFC)',
          margin: '0 -26px -22px -26px',
          padding: '12px 26px',
          borderBottomLeftRadius: 'var(--radius-lg, 12px)',
          borderBottomRightRadius: 'var(--radius-lg, 12px)'
        }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted, #64748B)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={14} color="var(--brand-primary, #4F46E5)" />
            <span>Methodology &amp; Honest Limitations</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.75rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.6 }}>
            {fit.notes.map((note, nIdx) => (
              <li key={nIdx}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
