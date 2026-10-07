import React, { useState } from 'react';
import { Database, FileSpreadsheet, RefreshCw, BarChart2, AlertCircle, Sparkles, Download, CheckCircle2, Sliders, Calendar, ArrowRight, ShieldAlert, Zap } from 'lucide-react';
import { DataProfile } from '../types';
import { profileDataset, cleanDataset, getDataExportZipUrl } from '../services/api';
import { SAMPLE_CSV_SOFTWARE_METRICS, SAMPLE_CSV_TIME_SERIES } from '../utils/samples';

interface DataStudioProps {
  onSendToML?: (csvText: string, datasetName: string) => void;
}

export const DataStudio: React.FC<DataStudioProps> = ({ onSendToML }) => {
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV_SOFTWARE_METRICS);
  const [datasetName, setDatasetName] = useState<string>('SoftwareMetrics.csv');
  const [loading, setLoading] = useState<boolean>(false);
  const [cleanLoading, setCleanLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [cleanedResult, setCleanedResult] = useState<any | null>(null);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeStage, setActiveStage] = useState<'profile' | 'quality' | 'stats' | 'timeseries' | 'visuals' | 'insights'>('profile');

  // Cleaning options
  const [imputeStrategy, setImputeStrategy] = useState<string>('mean');
  const [handleOutliers, setHandleOutliers] = useState<boolean>(true);
  const [normalize, setNormalize] = useState<boolean>(false);

  const handleProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await profileDataset(csvText, datasetName);
      setProfileData(res.data_summary);
      if (res.artifact) {
        setArtifactId(res.artifact.artifact_id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Data profiling failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClean = async () => {
    setCleanLoading(true);
    setErrorMsg('');
    try {
      const res = await cleanDataset(csvText, imputeStrategy, handleOutliers, normalize);
      setCleanedResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Cleaning failed.');
    } finally {
      setCleanLoading(false);
    }
  };

  const profile: DataProfile | null = profileData?.profile || null;
  const quality = profileData?.quality || null;
  const stats = profileData?.statistics || null;
  const timeseries = profileData?.time_series || null;
  const visuals = profileData?.visualizations || [];
  const insights = profileData?.insights || [];
  const summary = profileData?.summary || null;

  return (
    <div>
      {/* Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(6, 182, 212, 0.15))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database color="#06B6D4" size={24} />
              Data Intelligence Engine & Analytics Workspace
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginTop: '4px' }}>
              Automated multi-format ingestion, statistical moment profiling, quality audit, loss-less cleaning, Pearson/Spearman correlations, time-series resampling, and deterministic visualization recommendations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => { setCsvText(SAMPLE_CSV_SOFTWARE_METRICS); setDatasetName('SoftwareMetrics.csv'); }}>
              Software Metrics
            </button>
            <button className="btn btn-secondary" onClick={() => { setCsvText(SAMPLE_CSV_TIME_SERIES); setDatasetName('Software_Timeline.csv'); }}>
              Time-Series Activity
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Dataset Ingestion & Controlled Cleaning Controls */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="panel-title" style={{ margin: 0 }}>
              <FileSpreadsheet size={18} color="#06B6D4" />
              Source Dataset Ingestion
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
            rows={14}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste CSV / JSON / Structured dataset here..."
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={handleProfile} disabled={loading} style={{ background: 'linear-gradient(135deg, #06B6D4, #0284C7)', flex: 1 }}>
              <BarChart2 size={16} />
              {loading ? 'Analyzing Dataset...' : 'Profile & Audit Quality'}
            </button>

            {artifactId && (
              <a href={getDataExportZipUrl(artifactId)} download target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                <Download size={16} />
                Export Zip
              </a>
            )}
          </div>

          {/* Controlled Cleaning Options */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span className="panel-title" style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
              <Sliders size={16} color="#38BDF8" />
              Controlled Data Cleaning & Transformations
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
              <div>
                <label style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Missing Value Imputation</label>
                <select
                  value={imputeStrategy}
                  onChange={(e) => setImputeStrategy(e.target.value)}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '6px', borderRadius: '4px' }}
                >
                  <option value="mean">Mean Imputation</option>
                  <option value="median">Median Imputation</option>
                  <option value="mode">Mode Imputation</option>
                  <option value="drop">Drop Rows</option>
                </select>
              </div>

              <div>
                <label style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Outliers Handling</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFF', marginTop: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={handleOutliers} onChange={(e) => setHandleOutliers(e.target.checked)} />
                  IQR Outlier Capping
                </label>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFF', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={normalize} onChange={(e) => setNormalize(e.target.checked)} />
                Min-Max Standard Normalization [0, 1]
              </label>
            </div>

            <button className="btn btn-secondary" onClick={handleClean} disabled={cleanLoading} style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
              <RefreshCw size={14} className={cleanLoading ? 'spin' : ''} />
              {cleanLoading ? 'Processing Transformations...' : 'Apply Controlled Cleaning Pipeline'}
            </button>
          </div>

          {cleanedResult && (
            <div style={{ marginTop: '14px', background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid #10B981' }}>
              <div style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Cleaning Pipeline Complete
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '4px' }}>
                Original rows: {cleanedResult.original_rows} → Final rows: {cleanedResult.final_rows} (Removed {cleanedResult.removed_duplicates} duplicates).
              </p>
              <div style={{ marginTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600 }}>Recorded Transformations:</span>
                <ul style={{ paddingLeft: '16px', margin: '4px 0', fontSize: '0.75rem', color: '#CBD5E1' }}>
                  {cleanedResult.transformations_log.map((t: string, idx: number) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
              {onSendToML && (
                <button
                  className="btn btn-primary"
                  onClick={() => onSendToML(cleanedResult.cleaned_csv, datasetName)}
                  style={{ marginTop: '8px', background: 'linear-gradient(135deg, #10B981, #059669)', width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}
                >
                  <ArrowRight size={14} /> Send Cleaned Dataset to ML Engine
                </button>
              )}
            </div>
          )}

          {errorMsg && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '0.85rem' }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Analytical Workspace */}
        <div className="glass-panel">
          {!profile ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
              <Database size={56} color="#334155" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#94A3B8', fontWeight: 600 }}>Data Intelligence Hub Idle</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>
                Click "Profile & Audit Quality" to generate empirical statistics, correlation matrices, calendar heatmaps, and automated insights.
              </p>
            </div>
          ) : (
            <div>
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px', overflowX: 'auto' }}>
                <button
                  className={`btn ${activeStage === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveStage('profile')}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  Profile & Moments
                </button>
                <button
                  className={`btn ${activeStage === 'quality' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveStage('quality')}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  Quality Audit ({quality?.issues_detected?.length || 0})
                </button>
                <button
                  className={`btn ${activeStage === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveStage('stats')}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  Relationships & Correlations
                </button>
                {timeseries && (
                  <button
                    className={`btn ${activeStage === 'timeseries' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveStage('timeseries')}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    Time-Series & Heatmap
                  </button>
                )}
                <button
                  className={`btn ${activeStage === 'visuals' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveStage('visuals')}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  Visualizations ({visuals.length})
                </button>
                <button
                  className={`btn ${activeStage === 'insights' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveStage('insights')}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  Insights ({insights.length})
                </button>
              </div>

              {/* STAGE 1: Profile & Statistical Moments */}
              {activeStage === 'profile' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Rows × Columns</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#06B6D4' }}>{summary?.rows} × {summary?.columns}</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Completeness</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>{summary?.completeness_percentage}%</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Numeric / Categorical</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F59E0B' }}>{summary?.numeric_columns} / {summary?.categorical_columns}</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Duplicates / Nulls</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F87171' }}>{summary?.duplicate_rows} / {summary?.missing_cells}</div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '8px' }}>Attribute Statistical Moments Table</h4>
                  <div className="data-table-container" style={{ maxHeight: '280px' }}>
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
                          <th>Skew</th>
                          <th>Outliers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.column_profiles.map((col: any, idx: number) => (
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
                </div>
              )}

              {/* STAGE 2: Quality Audit */}
              {activeStage === 'quality' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert color="#F59E0B" size={18} /> Automated Data Quality Audit Findings
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                    {quality?.issues_detected.length === 0 ? (
                      <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '8px', textAlign: 'center' }}>
                        No data quality issues detected! Dataset is clean and ready.
                      </div>
                    ) : (
                      quality?.issues_detected.map((issue: any, idx: number) => {
                        const sevColor = issue.severity === 'High' ? '#F87171' : issue.severity === 'Medium' ? '#F59E0B' : '#38BDF8';
                        return (
                          <div key={idx} style={{ background: '#0F172A', padding: '12px 14px', borderRadius: '8px', borderLeft: `4px solid ${sevColor}`, border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, color: '#FFF', fontSize: '0.85rem' }}>{issue.issue_type}</span>
                              <span className="badge" style={{ background: `${sevColor}25`, color: sevColor, border: `1px solid ${sevColor}50` }}>
                                {issue.severity} Severity
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>Column: <strong>{issue.column}</strong> ({issue.count} occurrences)</div>
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px' }}>💡 Recommendation: {issue.recommendation}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* STAGE 3: Relationships & Correlation Matrix */}
              {activeStage === 'stats' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px' }}>Pearson Correlation Matrix</h4>
                  {stats?.pearson_correlation && stats.pearson_correlation.columns.length > 0 ? (
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto', marginBottom: '16px' }}>
                      <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', width: '100%' }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '4px', color: '#94A3B8' }}></th>
                            {stats.pearson_correlation.columns.map((c: string, i: number) => (
                              <th key={i} style={{ padding: '4px', color: '#06B6D4', fontWeight: 600 }}>{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.pearson_correlation.values.map((row: number[], i: number) => (
                            <tr key={i}>
                              <td style={{ padding: '4px', fontWeight: 600, color: '#06B6D4' }}>{stats.pearson_correlation.columns[i]}</td>
                              {row.map((val: number, j: number) => {
                                const opacity = Math.abs(val);
                                const isPos = val >= 0;
                                const bg = isPos ? `rgba(99, 102, 241, ${opacity * 0.85})` : `rgba(239, 68, 68, ${opacity * 0.85})`;
                                return (
                                  <td key={j} style={{ padding: '6px', textAlign: 'center', background: bg, borderRadius: '4px', color: '#FFF', fontFamily: 'var(--font-mono)' }}>
                                    {val.toFixed(2)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p style={{ color: '#94A3B8' }}>No numeric columns for correlation.</p>}

                  {/* Top Variable Relationships */}
                  {stats?.ranked_relationships && (
                    <div>
                      <h4 style={{ fontSize: '0.88rem', color: '#FFF', marginBottom: '8px' }}>Top Variable Relationships</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {stats.ranked_relationships.slice(0, 4).map((rel: any, idx: number) => (
                          <div key={idx} style={{ background: '#0F172A', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                            <div style={{ color: '#FFF', fontWeight: 600 }}>{rel.var1} ↔ {rel.var2}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', color: rel.correlation > 0 ? '#34D399' : '#F87171' }}>
                              <span>{rel.type}</span>
                              <span style={{ fontWeight: 700 }}>{rel.correlation.toFixed(3)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 4: Time-Series Analysis & Calendar Heatmap */}
              {activeStage === 'timeseries' && timeseries && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar color="#10B981" size={18} /> Time-Series Resampling & Moving Averages
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Observed Period</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38BDF8' }}>{timeseries.date_range.min_date} to {timeseries.date_range.max_date}</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Total Days</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>{timeseries.date_range.duration_days} Days</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Growth Trend %</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: (timeseries.trend_metrics?.growth_percentage || 0) >= 0 ? '#10B981' : '#F87171' }}>
                        {timeseries.trend_metrics?.growth_percentage ?? 0}%
                      </div>
                    </div>
                  </div>

                  {/* Calendar Activity Intensity Grid */}
                  {timeseries.calendar_heatmap && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '0.85rem', color: '#FFF', marginBottom: '6px' }}>Calendar Activity Intensity Heatmap</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        {timeseries.calendar_heatmap.data.map((day: any, idx: number) => {
                          const intensity = day.intensity || 0;
                          const bg = intensity > 0.75 ? '#06B6D4' : intensity > 0.5 ? '#0284C7' : intensity > 0.25 ? '#1E3A8A' : '#1E293B';
                          return (
                            <div key={idx} style={{ background: bg, padding: '8px', borderRadius: '4px', textAlign: 'center', color: '#FFF', fontSize: '0.7rem' }} title={`${day.date}: Value ${day.value}`}>
                              <div style={{ fontWeight: 600 }}>{day.date.slice(5)}</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '2px' }}>{day.value}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 5: Visualization Recommendations */}
              {activeStage === 'visuals' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap color="#F59E0B" size={18} /> Dynamic Chart Recommendations
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {visuals.map((vis: any, idx: number) => (
                      <div key={idx} style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.85rem' }}>{vis.title}</span>
                          <span className="badge badge-low">{vis.chart_type.toUpperCase()}</span>
                        </div>
                        <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginBottom: '8px' }}>{vis.description}</p>
                        <div style={{ background: '#1E293B', padding: '6px 10px', borderRadius: '4px', fontSize: '0.72rem', color: '#CBD5E1', fontFamily: 'var(--font-mono)' }}>
                          X: {vis.x_axis} | Y: {vis.y_axis}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 6: Calculated Data Insights */}
              {activeStage === 'insights' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles color="#A5B4FC" size={18} /> Data-Backed Human Insights
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {insights.map((ins: string, idx: number) => (
                      <div key={idx} style={{ background: '#0F172A', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', color: '#E2E8F0', fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <CheckCircle2 size={16} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Send to ML Bridge */}
              {onSendToML && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>Ready for predictive modeling?</span>
                  <button className="btn btn-primary" onClick={() => onSendToML(csvText, datasetName)} style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    Send Dataset to ML Engine <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
