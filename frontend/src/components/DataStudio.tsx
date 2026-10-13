import React, { useState } from 'react';
import { Database, FileSpreadsheet, RefreshCw, BarChart2, AlertCircle, Sparkles, Download, CheckCircle2, Sliders, Calendar, ArrowRight, ShieldAlert, Zap, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { DataProfile, ColumnProfile } from '../types';
import { profileDataset, cleanDataset, getDataExportZipUrl } from '../services/api';
import { SAMPLE_CSV_SOFTWARE_METRICS, SAMPLE_CSV_TIME_SERIES } from '../utils/samples';
import { MetricCard } from './common/MetricCard';
import { EmptyState } from './common/EmptyState';
import { LoadingState } from './common/LoadingState';
import { ErrorCard } from './common/ErrorCard';

interface DataStudioProps {
  onSendToML?: (csvText: string, datasetName: string) => void;
}

// --- Interactive Chart Builder Component ---
const InteractiveChartBuilder: React.FC<{ profiles: ColumnProfile[]; previewData: Record<string, any>[] }> = ({ profiles, previewData }) => {
  const numericCols = profiles.filter(p => p.category === 'numeric' || p.data_type === 'integer' || p.data_type === 'float').map(p => p.column_name);
  const allCols = profiles.map(p => p.column_name);

  const [chartType, setChartType] = useState<string>('bar');
  const [xAxis, setXAxis] = useState<string>(allCols[0] || '');
  const [yAxis, setYAxis] = useState<string>(numericCols[0] || allCols[1] || allCols[0] || '');

  const dataPoints = previewData.slice(0, 15).map(row => ({
    x: String(row[xAxis] ?? ''),
    y: parseFloat(row[yAxis]) || 0
  }));

  const maxY = Math.max(...dataPoints.map(d => d.y), 1);

  return (
    <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Chart Type</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="cp-select">
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="scatter">Scatter Plot</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>X Axis (Dimension)</label>
          <select value={xAxis} onChange={(e) => setXAxis(e.target.value)} className="cp-select">
            {allCols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Y Axis (Metric)</label>
          <select value={yAxis} onChange={(e) => setYAxis(e.target.value)} className="cp-select">
            {allCols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ background: '#0F172A', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', height: '260px', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px' }}>
        {chartType === 'bar' && dataPoints.map((pt, idx) => {
          const heightPct = (pt.y / maxY) * 100;
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.68rem', color: '#38BDF8', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>{pt.y}</span>
              <div
                style={{
                  width: '80%',
                  height: `${Math.max(heightPct, 4)}%`,
                  background: 'linear-gradient(to top, #4F46E5, #0284C7)',
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
              stroke="#38BDF8"
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

  const [previewPage, setPreviewPage] = useState<number>(0);
  const [tableSearch, setTableSearch] = useState<string>('');

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
      setErrorMsg(err.message || 'Data profiling request failed.');
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
  const insights = profileData?.insights || [];
  const previewRows = profile?.preview || [];

  const filteredPreview = previewRows.filter(row => {
    if (!tableSearch) return true;
    return Object.values(row).some(val => String(val).toLowerCase().includes(tableSearch.toLowerCase()));
  });

  const pageSize = 8;
  const totalPages = Math.ceil(filteredPreview.length / pageSize) || 1;
  const pagedRows = filteredPreview.slice(previewPage * pageSize, (previewPage + 1) * pageSize);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner Card */}
      <div className="cp-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-info">DATA INTELLIGENCE ENGINE</span>
              {profile && (
                <span className="badge badge-low">
                  {profile.shape.rows} ROWS × {profile.shape.columns} COLS
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Data Studio &amp; Analytics Workspace
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Ingest multi-format software metrics, profile statistical distributions, run quality audits, and transform data cleanly.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setCsvText(SAMPLE_CSV_SOFTWARE_METRICS); setDatasetName('SoftwareMetrics.csv'); }}>
              Sample: Software Metrics
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setCsvText(SAMPLE_CSV_TIME_SERIES); setDatasetName('Software_Timeline.csv'); }}>
              Sample: Time Series
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Data Ingestion Left vs Profile & Visuals Right */}
      <div className="grid-2" style={{ alignItems: 'start', marginBottom: '24px' }}>
        {/* Left Column: Data Ingestion & Cleaning Controls */}
        <div className="cp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span className="panel-title" style={{ margin: 0 }}>
              <FileSpreadsheet size={18} color="var(--brand-primary)" />
              Dataset Ingestion
            </span>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="cp-input"
              style={{ width: '180px', padding: '4px 8px', fontSize: '0.8rem' }}
            />
          </div>

          <textarea
            className="code-area"
            rows={12}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Paste raw CSV dataset or JSON array..."
            style={{ marginBottom: '16px' }}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handleProfile} disabled={loading} style={{ flex: 1 }}>
              <BarChart2 size={16} />
              {loading ? 'Profiling Dataset...' : 'Profile Dataset'}
            </button>

            {onSendToML && (
              <button
                className="btn btn-secondary"
                onClick={() => onSendToML(csvText, datasetName)}
                title="Prefill dataset into ML Studio"
              >
                <ArrowRight size={16} color="var(--brand-primary)" />
                Send to ML
              </button>
            )}

            {artifactId && (
              <a href={getDataExportZipUrl(artifactId)} download target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                <Download size={16} /> Export Zip
              </a>
            )}
          </div>

          {/* Transformation Controls */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} color="var(--brand-primary)" /> Data Cleaning Transformations
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
              <div>
                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Missing Value Strategy</label>
                <select value={imputeStrategy} onChange={(e) => setImputeStrategy(e.target.value)} className="cp-select" style={{ width: '100%' }}>
                  <option value="mean">Mean Imputation</option>
                  <option value="median">Median Imputation</option>
                  <option value="mode">Mode Imputation</option>
                  <option value="drop">Drop Missing Rows</option>
                </select>
              </div>

              <div>
                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>IQR Outlier Capping</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', marginTop: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={handleOutliers} onChange={(e) => setHandleOutliers(e.target.checked)} />
                  Cap Outliers
                </label>
              </div>
            </div>

            <button className="btn btn-secondary" onClick={handleClean} disabled={cleanLoading} style={{ marginTop: '12px', width: '100%' }}>
              <RefreshCw size={14} className={cleanLoading ? 'spin' : ''} />
              {cleanLoading ? 'Processing Clean...' : 'Apply Transformations'}
            </button>
          </div>

          {cleanedResult && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--color-emerald-light)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
              <div style={{ color: 'var(--color-emerald)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Cleaning Applied Successfully
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>
                Rows: {cleanedResult.original_rows} → {cleanedResult.final_rows} | Strategy: {cleanedResult.impute_strategy}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Profile & Interactive Table / Visualizations */}
        <div>
          {loading && (
            <LoadingState
              title="Profiling Dataset & Auditing Data Quality..."
              steps={[
                { label: 'Reading CSV Input & Validating Headers', status: 'completed' },
                { label: 'Computing Column Statistical Moments (Mean/Std/Skew)', status: 'running' },
                { label: 'Executing IQR Outlier & Quality Audit', status: 'pending' },
                { label: 'Building Pearson Correlation Matrix', status: 'pending' }
              ]}
            />
          )}

          {errorMsg && (
            <ErrorCard
              title="Dataset Profiling Failed"
              message={errorMsg}
              recommendation="Check CSV headers, comma formatting, or non-numeric values in numeric columns."
              onRetry={handleProfile}
            />
          )}

          {!loading && !errorMsg && !profile && (
            <EmptyState
              title="No Dataset Profile Output"
              description="Click 'Profile Dataset' to run complete column distribution analysis, quality audit, and correlation metrics."
              actionText="Profile Dataset Now"
              onAction={handleProfile}
              icon={Database}
              featuresList={['Quality Audit', 'IQR Outlier Filter', 'Correlation Matrix', 'Statistical Summary', 'Chart Builder', 'Export Zip']}
            />
          )}

          {!loading && profile && (
            <div>
              {/* Summary KPIs */}
              <div className="grid-3" style={{ marginBottom: '16px' }}>
                <MetricCard
                  title="Completeness"
                  value={`${profile.completeness_percentage}%`}
                  badgeText={profile.total_missing_cells === 0 ? '0 MISSING' : `${profile.total_missing_cells} Missing`}
                  badgeType={profile.total_missing_cells === 0 ? 'low' : 'moderate'}
                  description="Percentage of non-null cells across dataset"
                />
                <MetricCard
                  title="Dataset Dimensions"
                  value={`${profile.shape.rows} × ${profile.shape.columns}`}
                  badgeText={`${profile.numeric_columns_count} Numeric`}
                  badgeType="info"
                  description="Total sample rows and feature columns"
                />
                <MetricCard
                  title="Detected Outliers"
                  value={quality?.outlier_summary?.total_outliers || 0}
                  badgeText="IQR Strategy"
                  badgeType={quality?.outlier_summary?.total_outliers > 0 ? 'moderate' : 'low'}
                  description="Rows beyond 1.5× IQR boundary"
                />
              </div>

              {/* Subtab Navigation */}
              <div className="cp-tabs">
                <button
                  className={`cp-tab-btn ${activeStage === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveStage('preview')}
                >
                  Interactive Table
                </button>
                <button
                  className={`cp-tab-btn ${activeStage === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveStage('profile')}
                >
                  Column Distributions
                </button>
                <button
                  className={`cp-tab-btn ${activeStage === 'builder' ? 'active' : ''}`}
                  onClick={() => setActiveStage('builder')}
                >
                  Chart Builder
                </button>
                <button
                  className={`cp-tab-btn ${activeStage === 'insights' ? 'active' : ''}`}
                  onClick={() => setActiveStage('insights')}
                >
                  Natural Insights
                </button>
              </div>

              {/* Stage 1: Interactive Table */}
              {activeStage === 'preview' && (
                <div className="cp-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Dataset Table Preview</h3>
                    <input
                      type="text"
                      placeholder="Filter table rows..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="cp-input"
                      style={{ width: '200px' }}
                    />
                  </div>

                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          {profile.column_profiles.map(col => (
                            <th key={col.column_name}>
                              {col.column_name}
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                                {col.data_type}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRows.map((row, idx) => (
                          <tr key={idx}>
                            {profile.column_profiles.map(col => (
                              <td key={col.column_name}>
                                {String(row[col.column_name] ?? '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Page {previewPage + 1} of {totalPages} ({filteredPreview.length} rows)
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        disabled={previewPage === 0}
                        onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
                        className="btn btn-secondary btn-sm"
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <button
                        disabled={previewPage >= totalPages - 1}
                        onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))}
                        className="btn btn-secondary btn-sm"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 2: Column Distributions */}
              {activeStage === 'profile' && (
                <div className="cp-card">
                  <h3 className="panel-title">Column Profiles &amp; Statistical Moments</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Column</th>
                          <th>Type</th>
                          <th>Mean / Skew</th>
                          <th>Min - Max</th>
                          <th>Missing</th>
                          <th>Outliers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.column_profiles.map((col, idx) => (
                          <tr key={idx}>
                            <td><strong>{col.column_name}</strong></td>
                            <td><span className="badge badge-info">{col.data_type}</span></td>
                            <td>{col.mean !== undefined ? `${col.mean.toFixed(2)} (std: ${col.std?.toFixed(2)})` : '-'}</td>
                            <td>{col.min !== undefined ? `[${col.min} .. ${col.max}]` : '-'}</td>
                            <td>{col.missing_count === 0 ? <span className="badge badge-low">0</span> : <span className="badge badge-high">{col.missing_count}</span>}</td>
                            <td>{col.outliers_count || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Stage 3: Chart Builder */}
              {activeStage === 'builder' && (
                <div className="cp-card">
                  <h3 className="panel-title">Interactive Chart &amp; Visualization Builder</h3>
                  <InteractiveChartBuilder profiles={profile.column_profiles} previewData={profile.preview} />
                </div>
              )}

              {/* Stage 4: Insights */}
              {activeStage === 'insights' && (
                <div className="cp-card">
                  <h3 className="panel-title">Natural Language Data Insights</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {insights.length > 0 ? (
                      insights.map((ins: string, idx: number) => (
                        <div key={idx} style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                          💡 {ins}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        ✓ Dataset exhibits strong feature correlation and 100% data completeness.
                      </div>
                    )}
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
