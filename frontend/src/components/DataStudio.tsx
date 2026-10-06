import React, { useState } from 'react';
import { Database, FileSpreadsheet, RefreshCw, BarChart2, AlertCircle } from 'lucide-react';
import { DataProfile } from '../types';
import { profileDataset } from '../services/api';
import { SAMPLE_CSV_SOFTWARE_METRICS } from '../utils/samples';

export const DataStudio: React.FC = () => {
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV_SOFTWARE_METRICS);
  const [datasetName, setDatasetName] = useState<string>('SoftwareMetrics.csv');
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<DataProfile | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await profileDataset(csvText, datasetName);
      setProfile(res.data_summary.profile);
      setPreviewData(res.data_summary.preview || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Data profiling failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(6, 182, 212, 0.15))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Data Intelligence & Statistical Profiling Hub</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Automated data ingestion, dynamic type inference, statistical moments (Mean/Std/IQR/Skewness), null audits, and Pearson correlation heatmaps.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => { setCsvText(SAMPLE_CSV_SOFTWARE_METRICS); setDatasetName('SoftwareMetrics.csv'); }}>
            Load Sample CSV
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Dataset Ingestion */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="panel-title" style={{ margin: 0 }}>
              <FileSpreadsheet size={18} color="#06B6D4" />
              CSV Ingestion & Source Data
            </span>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              style={{ background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem' }}
            />
          </div>

          <textarea
            className="code-area"
            rows={16}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste raw CSV content here..."
          />

          <div style={{ marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={handleProfile} disabled={loading} style={{ background: 'linear-gradient(135deg, #06B6D4, #0284C7)' }}>
              <BarChart2 size={16} />
              {loading ? 'Profiling Dataset...' : 'Profile Dataset & Audit Quality'}
            </button>
          </div>

          {errorMsg && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '0.85rem' }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Right Column: Profiling Dashboard */}
        <div className="glass-panel">
          {!profile ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <Database size={48} color="#334155" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#94A3B8', fontWeight: 600 }}>No Data Profile Available</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>Click "Profile Dataset & Audit Quality" to generate statistical summaries, distributions, and correlation matrix.</p>
            </div>
          ) : (
            <div>
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Shape (Rows × Cols)</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#06B6D4' }}>{profile.shape.rows} × {profile.shape.columns}</div>
                </div>
                <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Completeness</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>{profile.completeness_percentage}%</div>
                </div>
                <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Missing Cells</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: profile.total_missing_cells > 0 ? '#F59E0B' : '#34D399' }}>{profile.total_missing_cells}</div>
                </div>
              </div>

              {/* Column Statistical Profiles Table */}
              <h4 style={{ fontSize: '0.95rem', color: '#FFF', marginBottom: '10px' }}>Attribute Statistical Profiles</h4>
              <div className="data-table-container" style={{ maxHeight: '240px', marginBottom: '20px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Nulls</th>
                      <th>Mean</th>
                      <th>Std</th>
                      <th>Min</th>
                      <th>Max</th>
                      <th>Skewness</th>
                      <th>Outliers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.column_profiles.map((col, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: '#FFF' }}>{col.column_name}</td>
                        <td><span className="badge badge-info">{col.data_type}</span></td>
                        <td style={{ color: col.missing_count > 0 ? '#F87171' : '#94A3B8' }}>{col.missing_count}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{col.mean ?? '-'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{col.std ?? '-'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{col.min ?? '-'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{col.max ?? '-'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{col.skewness ?? '-'}</td>
                        <td style={{ color: (col.outliers_count || 0) > 0 ? '#FBBF24' : '#94A3B8' }}>{col.outliers_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Correlation Matrix Heatmap */}
              {profile.correlation_matrix && profile.correlation_matrix.columns.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: '#FFF', marginBottom: '10px' }}>Pearson Correlation Matrix</h4>
                  <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: '0.78rem', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '6px', color: '#94A3B8' }}></th>
                          {profile.correlation_matrix.columns.map((c, i) => (
                            <th key={i} style={{ padding: '6px', color: '#06B6D4', fontWeight: 600 }}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {profile.correlation_matrix.values.map((row, i) => (
                          <tr key={i}>
                            <td style={{ padding: '6px', fontWeight: 600, color: '#06B6D4' }}>{profile.correlation_matrix?.columns[i]}</td>
                            {row.map((val, j) => {
                              const opacity = Math.abs(val);
                              const isPos = val >= 0;
                              const bg = isPos ? `rgba(99, 102, 241, ${opacity * 0.8})` : `rgba(239, 68, 68, ${opacity * 0.8})`;
                              return (
                                <td key={j} style={{ padding: '8px', textAlign: 'center', background: bg, borderRadius: '4px', color: '#FFF', fontFamily: 'var(--font-mono)' }}>
                                  {val.toFixed(2)}
                                </td>
                              );
                            })}
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
    </div>
  );
};
