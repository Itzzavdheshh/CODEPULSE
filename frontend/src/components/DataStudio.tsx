import React, { useState } from 'react';
import { Database, FileSpreadsheet, RefreshCw, BarChart2, AlertCircle, Sparkles, Download, CheckCircle2, Sliders, Calendar, ArrowRight, ShieldAlert, Zap, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { DataProfile, ColumnProfile } from '../types';
import { profileDataset, cleanDataset, getDataExportZipUrl } from '../services/api';
import { SAMPLE_CSV_SOFTWARE_METRICS, SAMPLE_CSV_TIME_SERIES } from '../utils/samples';

interface DataStudioProps {
  onSendToML?: (csvText: string, datasetName: string) => void;
}

// --- Interactive Dynamic SVG Chart Builder Component ---
const InteractiveChartBuilder: React.FC<{ profiles: ColumnProfile[]; previewData: Record<string, any>[] }> = ({ profiles, previewData }) => {
  const numericCols = profiles.filter(p => p.category === 'numeric' || p.data_type === 'integer' || p.data_type === 'float').map(p => p.column_name);
  const allCols = profiles.map(p => p.column_name);

  const [chartType, setChartType] = useState<string>('bar');
  const [xAxis, setXAxis] = useState<string>(allCols[0] || '');
  const [yAxis, setYAxis] = useState<string>(numericCols[0] || allCols[1] || allCols[0] || '');

  // Extract chart points from preview data
  const dataPoints = previewData.slice(0, 15).map(row => ({
    x: String(row[xAxis] ?? ''),
    y: parseFloat(row[yAxis]) || 0
  }));

  const maxY = Math.max(...dataPoints.map(d => d.y), 1);

  return (
    <div style={{ background: '#0F172A', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Chart Type</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)} style={{ background: '#070A11', border: '1px solid var(--border-color)', color: '#FFF', padding: '6px 10px', borderRadius: '6px', fontSize: '0.82rem' }}>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="scatter">Scatter Plot</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>X Axis (Dimension)</label>
          <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} style={{ background: '#070A11', border: '1px solid var(--border-color)', color: '#FFF', padding: '6px 10px', borderRadius: '6px', fontSize: '0.82rem' }}>
            {allCols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block' }}>Y Axis (Metric)</label>
          <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} style={{ background: '#070A11', border: '1px solid var(--border-color)', color: '#FFF', padding: '6px 10px', borderRadius: '6px', fontSize: '0.82rem' }}>
            {allCols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ background: '#070A11', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', height: '260px', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px' }}>
        {chartType === 'bar' && dataPoints.map((pt, idx) => {
          const heightPct = (pt.y / maxY) * 100;
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.68rem', color: '#38BDF8', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>{pt.y}</span>
              <div
                style={{
                  width: '80%',
                  height: `${Math.max(heightPct, 4)}%`,
                  background: 'linear-gradient(to top, #6366F1, #06B6D4)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.3s ease'
                }}
                title={`${xAxis}: ${pt.x}, ${yAxis}: ${pt.y}`}
              />
              <span style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40px' }}>
                {pt.x}
              </span>
            </div>
          );
        })}

        {chartType === 'line' && (
          <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <polyline
              fill="none"
              stroke="#06B6D4"
              strokeWidth="3"
              points={dataPoints.map((pt, idx) => {
                const x = (idx / (dataPoints.length - 1 || 1)) * 480 + 10;
                const y = 180 - (pt.y / maxY) * 160;
                return `${x},${y}`;
              }).join(' ')}
            />
            {dataPoints.map((pt, idx) => {
              const x = (idx / (dataPoints.length - 1 || 1)) * 480 + 10;
              const y = 180 - (pt.y / maxY) * 160;
              return (
                <circle key={idx} cx={x} cy={y} r="5" fill="#6366F1" stroke="#FFF" strokeWidth="2">
                  <title>{`${xAxis}: ${pt.x}, ${yAxis}: ${pt.y}`}</title>
                </circle>
              );
            })}
          </svg>
        )}

        {chartType === 'scatter' && (
          <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            {dataPoints.map((pt, idx) => {
              const x = (idx / (dataPoints.length - 1 || 1)) * 460 + 20;
              const y = 180 - (pt.y / maxY) * 160;
              return (
                <circle key={idx} cx={x} cy={y} r="6" fill="#10B981" opacity="0.85" stroke="#FFF" strokeWidth="1.5">
                  <title>{`${xAxis}: ${pt.x}, ${yAxis}: ${pt.y}`}</title>
                </circle>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};

export const DataStudio: React.FC<DataStudioProps> = ({ onSendToML }) => {
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV_SOFTWARE_METRICS);
  const [datasetName, setDatasetName] = useState<string>('SoftwareMetrics.csv');
  const [loading, setLoading] = useState<boolean>(false);
  const [cleanLoading, setCleanLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [cleanedResult, setCleanedResult] = useState<any | null>(null);
  const [artifactId, setArtifactId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeStage, setActiveStage] = useState<'preview' | 'profile' | 'quality' | 'stats' | 'builder' | 'insights'>('preview');

  // Preview Pagination
  const [previewPage, setPreviewPage] = useState<number>(0);
  const [tableSearch, setTableSearch] = useState<string>('');

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
  const previewRows = profile?.preview || [];

  // Filtered Preview Rows
  const filteredPreview = previewRows.filter(row => {
    if (!tableSearch) return true;
    return Object.values(row).some(val => String(val).toLowerCase().includes(tableSearch.toLowerCase()));
  });

  const pageSize = 8;
  const totalPages = Math.ceil(filteredPreview.length / pageSize) || 1;
  const pagedRows = filteredPreview.slice(previewPage * pageSize, (previewPage + 1) * pageSize);

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
              Multi-format ingestion, statistical moment profiling, quality audit, loss-less cleaning, correlations, and custom chart builder.
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
        {/* Left Column: Dataset Ingestion & Cleaning Controls */}
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
            placeholder="Paste CSV / JSON dataset here..."
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={handleProfile} disabled={loading} style={{ background: 'linear-gradient(135deg, #06B6D4, #0284C7)', flex: 1 }}>
              <BarChart2 size={16} />
              {loading ? 'Analyzing Dataset...' : 'Profile & Audit Quality'}
            </button>

            {artifactId && (
              <a href={getDataExportZipUrl(artifactId)} download target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                <Download size={16} /> Export Zip
              </a>
            )}
          </div>

          {/* Controlled Cleaning Options */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span className="panel-title" style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
              <Sliders size={16} color="#38BDF8" />
              Data Transformations & Cleaning
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
              <div>
                <label style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Missing Value Strategy</label>
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
                <label style={{ color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Outliers Capping</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFF', marginTop: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={handleOutliers} onChange={(e) => setHandleOutliers(e.target.checked)} />
                  IQR Outlier Capping
                </label>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFF', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={normalize} onChange={(e) => setNormalize(e.target.checked)} />
                Min-Max Normalization [0, 1]
              </label>
            </div>

            <button className="btn btn-secondary" onClick={handleClean} disabled={cleanLoading} style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
              <RefreshCw size={14} className={cleanLoading ? 'spin' : ''} />
              {cleanLoading ? 'Processing...' : 'Apply Transformations'}
            </button>
          </div>

          {cleanedResult && (
            <div style={{ marginTop: '14px', background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid #10B981' }}>
              <div style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Cleaning Complete
              </div>
              <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginTop: '4px' }}>
                Rows: {cleanedResult.original_rows} → {cleanedResult.final_rows}
              </p>
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

        {/* Right Column: Analytical Workspace */}
        <div className="glass-panel">
          {!profile ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
              <Database size={56} color="#334155" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#94A3B8', fontWeight: 600 }}>Data Intelligence Hub Idle</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>
                Click "Profile & Audit Quality" to generate empirical statistics and custom chart visualizations.
              </p>
            </div>
          ) : (
            <div>
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px', overflowX: 'auto' }}>
                <button className={`btn ${activeStage === 'preview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveStage('preview')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  Interactive Table ({previewRows.length})
                </button>
                <button className={`btn ${activeStage === 'profile' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveStage('profile')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  Moments & Profile
                </button>
                <button className={`btn ${activeStage === 'quality' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveStage('quality')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  Quality Audit ({quality?.issues_detected?.length || 0})
                </button>
                <button className={`btn ${activeStage === 'stats' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveStage('stats')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  Correlations
                </button>
                <button className={`btn ${activeStage === 'builder' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveStage('builder')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  Chart Builder
                </button>
                <button className={`btn ${activeStage === 'insights' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveStage('insights')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  Insights ({insights.length})
                </button>
              </div>

              {/* STAGE 1: Interactive Paginated Dataset Table */}
              {activeStage === 'preview' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Filter table rows..."
                      value={tableSearch}
                      onChange={(e) => { setTableSearch(e.target.value); setPreviewPage(0); }}
                      style={{ background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '6px 12px', borderRadius: '6px', fontSize: '0.82rem', width: '220px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94A3B8' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} disabled={previewPage === 0} onClick={() => setPreviewPage(previewPage - 1)}>
                        <ChevronLeft size={14} />
                      </button>
                      <span>Page {previewPage + 1} of {totalPages}</span>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px' }} disabled={previewPage >= totalPages - 1} onClick={() => setPreviewPage(previewPage + 1)}>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="data-table-container" style={{ maxHeight: '340px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          {profile.column_profiles.map((c, i) => (
                            <th key={i}>
                              <div>{c.column_name}</div>
                              <span className="badge badge-info" style={{ fontSize: '0.62rem', padding: '1px 4px' }}>{c.data_type}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRows.map((row, idx) => (
                          <tr key={idx}>
                            {profile.column_profiles.map((c, i) => (
                              <td key={i} style={{ fontFamily: 'var(--font-mono)' }}>
                                {row[c.column_name] === null || row[c.column_name] === undefined ? (
                                  <span style={{ color: '#F87171', fontStyle: 'italic' }}>null</span>
                                ) : (
                                  String(row[c.column_name])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STAGE 2: Statistical Moments */}
              {activeStage === 'profile' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Shape</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#06B6D4' }}>{summary?.rows} × {summary?.columns}</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Completeness</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>{summary?.completeness_percentage}%</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Numeric / Cat</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F59E0B' }}>{summary?.numeric_columns} / {summary?.categorical_columns}</div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Null Cells</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F87171' }}>{summary?.missing_cells}</div>
                    </div>
                  </div>

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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STAGE 3: Quality Audit */}
              {activeStage === 'quality' && (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                    {quality?.issues_detected.length === 0 ? (
                      <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '8px', textAlign: 'center' }}>
                        No data quality issues detected! Dataset is clean.
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
                            <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>Column: <strong>{issue.column}</strong></div>
                            <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '4px' }}>💡 Recommendation: {issue.recommendation}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* STAGE 4: Correlations */}
              {activeStage === 'stats' && (
                <div>
                  {stats?.pearson_correlation && stats.pearson_correlation.columns.length > 0 ? (
                    <div style={{ background: '#0F172A', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
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
                  ) : <p style={{ color: '#94A3B8' }}>No numeric columns for correlation matrix.</p>}
                </div>
              )}

              {/* STAGE 5: Interactive Custom Chart Builder */}
              {activeStage === 'builder' && (
                <InteractiveChartBuilder profiles={profile.column_profiles} previewData={profile.preview || []} />
              )}

              {/* STAGE 6: Calculated Insights */}
              {activeStage === 'insights' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {insights.map((ins: string, idx: number) => (
                    <div key={idx} style={{ background: '#0F172A', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', color: '#E2E8F0', fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <CheckCircle2 size={16} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Send to ML Bridge */}
              {onSendToML && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>Send profiling dataset to ML Studio:</span>
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
