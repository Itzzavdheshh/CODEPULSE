import React, { useState } from 'react';
import { Upload, BarChart3, Filter, Sparkles, PieChart, LineChart, Activity, ShieldCheck, Database, Layers, ArrowUpRight, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { profileVisualizationDataset } from '../../services/api';
import { LoadingState } from '../common/LoadingState';

interface VisualAnalyticsStudioProps {
  onDatasetLoaded?: (dataset: Record<string, any>[], numericCols: string[], profile: any) => void;
  existingDataset?: Record<string, any>[];
  existingNumericCols?: string[];
  existingProfile?: any;
}

export const VisualAnalyticsStudio: React.FC<VisualAnalyticsStudioProps> = ({
  onDatasetLoaded,
  existingDataset,
  existingNumericCols,
  existingProfile
}) => {
  const [datasetText, setDatasetText] = useState<string>('');
  const [fileType, setFileType] = useState<string>('csv');
  const [datasetName, setDatasetName] = useState<string>('');
  const [isUserUploaded, setIsUserUploaded] = useState<boolean>(false);
  const [isDemoLoaded, setIsDemoLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any | null>(existingProfile || null);

  const handleLoadExample = () => {
    const demoData = 
      "module,loc,cyclomatic_complexity,cognitive_complexity,tokens_count,diagnostics_count,risk_level\n" +
      "AuthService.java,145,14,12,650,3,HIGH\n" +
      "PaymentGateway.java,210,22,18,980,5,CRITICAL\n" +
      "UserInterface.java,85,4,3,320,0,LOW\n" +
      "DatabasePool.java,120,8,6,490,1,MODERATE\n" +
      "CacheManager.java,60,2,1,210,0,LOW\n" +
      "LoggerUtility.java,40,1,1,150,0,LOW\n" +
      "NotificationWorker.java,175,16,13,740,4,HIGH\n" +
      "EncryptionModule.java,95,9,7,410,1,MODERATE\n" +
      "ReportGenerator.java,310,28,24,1420,8,CRITICAL\n" +
      "ConfigParser.java,70,3,2,280,0,LOW\n";
    setDatasetText(demoData);
    setDatasetName("SoftwareMetrics.csv");
    setIsUserUploaded(false);
    setIsDemoLoaded(true);
  };

  const handleClearDataset = () => {
    setDatasetText('');
    setDatasetName('');
    setProfileData(null);
    setIsUserUploaded(false);
    setIsDemoLoaded(false);
    if (onDatasetLoaded) {
      onDatasetLoaded([], [], null);
    }
  };

  // Active chart builder selection
  const [chartType, setChartType] = useState<string>('bar');
  const [selectedX, setSelectedX] = useState<string>('module');
  const [selectedY, setSelectedY] = useState<string>('loc');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  const handleProfileDataset = async () => {
    if (!datasetText.trim()) return;
    setLoading(true);
    try {
      const res = await profileVisualizationDataset(datasetText, fileType, datasetName);
      setProfileData(res);
      if (res.profile?.columns?.length > 0) {
        setSelectedX(res.profile.columns[0]);
        if (res.profile.numeric_columns?.length > 0) {
          setSelectedY(res.profile.numeric_columns[0]);
        }
      }
      if (onDatasetLoaded && res.profile) {
        onDatasetLoaded(res.profile.head_records || [], res.profile.numeric_columns || [], res.profile);
      }
    } catch (err) {
      console.error('Failed to profile visualization dataset', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDatasetName(file.name);
    setIsUserUploaded(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'csv';
    setFileType(ext);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setDatasetText(text);
      }
    };
    reader.readAsText(file);
  };

  // Type-Aware Validation
  const validateEncoding = () => {
    if (!profileData?.profile) return { isValid: true, message: '' };
    const numCols = profileData.profile.numeric_columns || [];
    const allCols = profileData.profile.columns || [];

    if (chartType === 'scatter') {
      if (!selectedX || !numCols.includes(selectedX)) {
        return { isValid: false, message: `Scatter plots require two numeric attributes. "${selectedX || 'None'}" is categorical.` };
      }
      if (!selectedY || !numCols.includes(selectedY)) {
        return { isValid: false, message: `Scatter plots require two numeric attributes. "${selectedY || 'None'}" is categorical.` };
      }
    } else if (chartType === 'histogram') {
      if (!selectedX || !numCols.includes(selectedX)) {
        return { isValid: false, message: `Histogram requires a numeric attribute to calculate bins. "${selectedX || 'None'}" is categorical.` };
      }
    } else if (chartType === 'treemap') {
      if (!selectedY || !numCols.includes(selectedY)) {
        return { isValid: false, message: `Treemap requires a numeric attribute for area sizing. "${selectedY || 'None'}" is not numeric.` };
      }
    } else if (chartType === 'parallel_coordinates') {
      if (numCols.length < 2) {
        return { isValid: false, message: `Parallel Coordinates requires at least 2 numeric attributes in the dataset.` };
      }
    } else if (chartType === 'correlation_matrix') {
      if (numCols.length < 2) {
        return { isValid: false, message: `Correlation Matrix requires at least 2 numeric attributes to calculate Pearson (r).` };
      }
    }
    return { isValid: true, message: '' };
  };

  const validation = validateEncoding();
  const records = profileData?.profile?.head_records || [];
  const numCols = profileData?.profile?.numeric_columns || [];
  const catCols = profileData?.profile?.categorical_columns || [];
  const allCols = profileData?.profile?.columns || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Controls: File Upload & Standalone Profiling */}
      <div className="cp-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-info">UNIVERSAL VISUAL WORKBENCH</span>
              <span className={`badge ${isUserUploaded ? 'badge-low' : isDemoLoaded ? 'badge-moderate' : 'badge-neutral'}`}>
                {isUserUploaded ? `USER DATASET: ${datasetName}` : isDemoLoaded ? 'DEMO FIXTURE: SoftwareMetrics.csv' : 'NO DATASET LOADED'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Data Profiling &amp; Custom Visual Analytics Studio
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={handleLoadExample}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Database size={13} /> Try Example Dataset
            </button>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={13} /> Upload Dataset (CSV/JSON)
              <input type="file" accept=".csv,.json,.jsonl,.tsv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleProfileDataset}
              disabled={!datasetText.trim()}
              style={{ opacity: datasetText.trim() ? 1 : 0.5 }}
            >
              <Sparkles size={13} /> Profile &amp; Build Analytics
            </button>
            {(datasetText || profileData) && (
              <button 
                className="btn btn-ghost btn-sm text-slate-500 hover:text-rose-600"
                onClick={handleClearDataset}
                title="Reset to empty workspace"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Dataset Textarea Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span>
              Dataset Buffer ({datasetName || 'Empty'}) — Source: {isUserUploaded ? 'User Upload' : isDemoLoaded ? 'Demo Fixture' : 'None'}:
            </span>
            <span>Format: {fileType.toUpperCase()}</span>
          </div>
          <textarea
            value={datasetText}
            placeholder="No dataset loaded. Paste CSV, JSON, or TSV data here, upload a file, or click 'Try Example Dataset'..."
            onChange={(e) => {
              setDatasetText(e.target.value);
              setIsUserUploaded(true);
              setIsDemoLoaded(false);
            }}
            rows={datasetText ? 4 : 2}
            style={{
              width: '100%',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: '6px',
              padding: '10px',
              color: 'var(--text-primary)',
              resize: 'vertical'
            }}
          />
        </div>
      </div>

      {loading && <LoadingState title="Profiling Dataset & Generating Smart Chart Recommendations..." />}

      {!profileData && !loading && (
        <div className="cp-card text-center" style={{ padding: '48px 24px' }}>
          <Database size={40} color="var(--brand-primary)" style={{ margin: '0 auto 12px auto', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            No Active Dataset Ingested
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 18px auto', lineHeight: '1.5' }}>
            The Visual Analytics Studio operates strictly on verified data. Upload a tabular dataset (CSV, JSON, JSONL, TSV) or click below to explore with the reference SoftwareMetrics dataset.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button className="btn btn-primary btn-sm" onClick={handleLoadExample}>
              <Sparkles size={14} /> Try Example Dataset
            </button>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={14} /> Upload Dataset
              <input type="file" accept=".csv,.json,.jsonl,.tsv" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {profileData && !loading && (
        <>
          {/* Quality Score & Profile Metrics Grid */}
          <div className="grid-4" style={{ gap: '16px' }}>
            <div className="cp-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>DATA QUALITY SCORE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: profileData.profile.quality.score >= 80 ? 'var(--color-emerald)' : 'var(--color-amber)' }}>
                {profileData.profile.quality.score} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>/ 100</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Rating: <strong>{profileData.profile.quality.rating}</strong>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Outliers: {profileData.anomalies?.total_anomalies || profileData.profile.quality?.factors?.outlier_count || 0} / {profileData.profile.summary.rows} ({Math.round(((profileData.anomalies?.total_anomalies || profileData.profile.quality?.factors?.outlier_count || 0) / Math.max(1, profileData.profile.summary.rows)) * 100)}%)
              </div>
            </div>

            <div className="cp-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>DIMENSIONS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {profileData.profile.summary.rows} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>rows ×</span> {profileData.profile.summary.columns} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>cols</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Completeness: <strong>{profileData.profile.summary.completeness_percentage}%</strong>
              </div>
            </div>

            <div className="cp-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ATTRIBUTE SPLIT</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                {profileData.profile.summary.numeric_columns_count} Numeric / {profileData.profile.summary.categorical_columns_count} Categorical
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Duplicates: <strong>{profileData.profile.summary.duplicate_rows} rows</strong>
              </div>
            </div>

            <div className="cp-card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ANOMALIES DETECTED</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-rose)' }}>
                {profileData.anomalies.total_anomalies} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>outliers</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Context: <strong>{profileData.anomalies.total_anomalies} / {profileData.profile.summary.rows} ({Math.round((profileData.anomalies.total_anomalies / Math.max(1, profileData.profile.summary.rows)) * 100)}%)</strong>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Method: IQR (1.5x) • {profileData.profile.quality?.factors?.outlier_percentage || 0}% of cells
              </div>
            </div>
          </div>

          {/* Smart Chart Advisor Panel */}
          <div className="cp-card">
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--brand-primary)" />
              Smart Chart Advisor (Automated Type-Aware Recommendations)
            </h3>

            <div className="grid-3" style={{ gap: '14px' }}>
              {(profileData.recommendations || []).map((rec: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => {
                    setChartType(rec.chart_type);
                    if (rec.x_col) setSelectedX(rec.x_col);
                    if (rec.y_col) setSelectedY(rec.y_col);
                    if (rec.date_col) setSelectedX(rec.date_col);
                    if (rec.value_col) setSelectedY(rec.value_col);
                    if (rec.hierarchy_cols?.length) setSelectedX(rec.hierarchy_cols[0]);
                  }}
                  style={{
                    background: chartType === rec.chart_type ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-subtle)',
                    padding: '14px',
                    borderRadius: '8px',
                    border: chartType === rec.chart_type ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{rec.title}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{rec.confidence}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {rec.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Interactive Chart Builder & Renderer */}
          <div className="cp-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h3 className="panel-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={16} color="var(--brand-primary)" />
                Interactive Chart Builder &amp; Visual Encoding Workbench
              </h3>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select className="cp-input" value={chartType} onChange={(e) => setChartType(e.target.value)} style={{ fontSize: '0.8rem', width: '165px' }}>
                  <option value="bar">Bar Chart (Vertical)</option>
                  <option value="horizontal_bar">Horizontal Bar</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="histogram">Histogram</option>
                  <option value="treemap">Treemap Hierarchy</option>
                  <option value="parallel_coordinates">Parallel Coordinates</option>
                  <option value="correlation_matrix">Correlation Matrix</option>
                </select>

                {/* Dynamic Context-Aware Selectors */}
                {chartType === 'parallel_coordinates' ? (
                  <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                    Multi-Dimensional ({numCols.length} Axes)
                  </span>
                ) : chartType === 'correlation_matrix' ? (
                  <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                    All Numeric Features ({numCols.length} × {numCols.length})
                  </span>
                ) : chartType === 'treemap' ? (
                  <>
                    <select className="cp-input" value={selectedX} onChange={(e) => setSelectedX(e.target.value)} style={{ fontSize: '0.8rem', width: '150px' }}>
                      <option value="">Hierarchy: Select</option>
                      {allCols.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="cp-input" value={selectedY} onChange={(e) => setSelectedY(e.target.value)} style={{ fontSize: '0.8rem', width: '150px' }}>
                      <option value="">Size Metric: Select</option>
                      {numCols.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </>
                ) : chartType === 'histogram' ? (
                  <select className="cp-input" value={selectedX} onChange={(e) => setSelectedX(e.target.value)} style={{ fontSize: '0.8rem', width: '180px' }}>
                    <option value="">Numeric Metric: Select</option>
                    {numCols.map((c: string) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <>
                    <select className="cp-input" value={selectedX} onChange={(e) => setSelectedX(e.target.value)} style={{ fontSize: '0.8rem', width: '140px' }}>
                      <option value="">X-Axis: Select</option>
                      {(chartType === 'scatter' ? numCols : allCols).map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select className="cp-input" value={selectedY} onChange={(e) => setSelectedY(e.target.value)} style={{ fontSize: '0.8rem', width: '140px' }}>
                      <option value="">Y-Axis: Select</option>
                      {numCols.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </>
                )}
              </div>
            </div>

            {/* Semantic Visual Encoding Header */}
            <div style={{ background: '#0F172A', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-light)', minHeight: '380px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>
                  {chartType === 'treemap'
                    ? `RENDERED VISUAL ENCODING (TREEMAP) — Hierarchy: ${selectedX || 'Auto'}, Size: ${selectedY || 'Auto'}`
                    : chartType === 'parallel_coordinates'
                    ? `RENDERED VISUAL ENCODING (PARALLEL_COORDINATES) — Dimensions: [${numCols.join(', ')}]`
                    : chartType === 'histogram'
                    ? `RENDERED VISUAL ENCODING (HISTOGRAM) — Variable: ${selectedX || 'Auto'}, Frequency: Count`
                    : chartType === 'correlation_matrix'
                    ? `RENDERED VISUAL ENCODING (CORRELATION_MATRIX) — Pearson (r) Matrix across ${numCols.length} features`
                    : `RENDERED VISUAL ENCODING (${chartType.toUpperCase()}) — X: ${selectedX || 'Auto'}, Y: ${selectedY || 'Auto'}`}
                </div>
                <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>
                  {isUserUploaded ? `SOURCE: ${datasetName}` : 'SOURCE: DEMO FIXTURE'}
                </span>
              </div>

              {/* Type-Aware Error State */}
              {!validation.isValid ? (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', padding: '24px', color: '#FCA5A5', textAlign: 'center' }}>
                  <AlertTriangle size={32} color="#EF4444" style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#F87171', marginBottom: '4px' }}>Invalid Visualization Configuration</div>
                  <div style={{ fontSize: '0.82rem' }}>{validation.message}</div>
                </div>
              ) : records.length === 0 ? (
                <div style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>
                  <Info size={32} style={{ margin: '0 auto 8px auto' }} />
                  <div>No data records available to render this visualization.</div>
                </div>
              ) : chartType === 'correlation_matrix' ? (
                /* CORRELATION MATRIX HEATMAP */
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', width: '100%' }}>
                    <thead>
                      <tr style={{ background: '#1E293B', color: '#38BDF8' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Feature</th>
                        {(profileData.correlations.columns || []).map((c: string) => <th key={c} style={{ padding: '8px', textAlign: 'center' }}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(profileData.correlations.pearson_matrix || []).map((row: any, rIdx: number) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '8px', fontWeight: 700, color: '#F8FAFC' }}>{row.column}</td>
                          {row.values.map((v: number, vIdx: number) => {
                            const absV = Math.abs(v);
                            const bg = v >= 0 ? `rgba(16, 185, 129, ${Math.max(0.15, absV * 0.7)})` : `rgba(239, 68, 68, ${Math.max(0.15, absV * 0.7)})`;
                            return (
                              <td key={vIdx} style={{ padding: '8px', textAlign: 'center', background: bg, color: '#F8FAFC', fontWeight: 600 }}>
                                {v.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '12px', fontSize: '0.72rem', color: '#94A3B8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '2px', display: 'inline-block' }} /> Negative (-1.0)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '10px', height: '10px', background: '#334155', borderRadius: '2px', display: 'inline-block' }} /> Neutral (0.0)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '2px', display: 'inline-block' }} /> Positive (+1.0)
                    </span>
                  </div>
                </div>
              ) : chartType === 'treemap' ? (
                /* TREEMAP HIERARCHICAL PARTITION */
                (() => {
                  const items = records.map((r: any) => ({
                    label: String(r[selectedX] || 'Item'),
                    value: Math.max(1, Number(r[selectedY]) || 1)
                  }));
                  const total = items.reduce((acc: number, cur: any) => acc + cur.value, 0);
                  const colors = ['#6366F1', '#38BDF8', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#F43F5E'];

                  return (
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '260px' }}>
                        {items.map((item: any, idx: number) => {
                          const pct = Math.max(8, Math.round((item.value / total) * 100));
                          const color = colors[idx % colors.length];
                          return (
                            <div
                              key={idx}
                              style={{
                                flexGrow: pct,
                                flexBasis: `${pct * 2}%`,
                                minWidth: '90px',
                                minHeight: '80px',
                                background: color,
                                borderRadius: '6px',
                                padding: '10px',
                                color: '#FFFFFF',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              <div style={{ fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.label}
                              </div>
                              <div>
                                <div style={{ fontSize: '1rem', fontWeight: 900 }}>{item.value}</div>
                                <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>{pct}% of total {selectedY}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '10px', textAlign: 'right' }}>
                        Hierarchy Partition: <strong>{selectedX}</strong> • Sized by: <strong>{selectedY}</strong> (Total: {total})
                      </div>
                    </div>
                  );
                })()
              ) : chartType === 'parallel_coordinates' ? (
                /* PARALLEL COORDINATES MULTIVARIATE RENDERER */
                (() => {
                  const dims = numCols.slice(0, 6);
                  const width = 760;
                  const height = 240;
                  const padding = 50;
                  const stepX = (width - padding * 2) / Math.max(1, dims.length - 1);

                  // Compute min and max per dimension
                  const dimStats: Record<string, { min: number; max: number }> = {};
                  dims.forEach((d: string) => {
                    const vals = records.map((r: any) => Number(r[d]) || 0);
                    dimStats[d] = {
                      min: Math.min(...vals),
                      max: Math.max(...vals, 1)
                    };
                  });

                  return (
                    <div style={{ overflowX: 'auto' }}>
                      <svg viewBox={`0 0 ${width} ${height + 60}`} style={{ width: '100%', maxHeight: '300px' }}>
                        {/* Vertical Axes */}
                        {dims.map((dim: string, dIdx: number) => {
                          const x = padding + dIdx * stepX;
                          return (
                            <g key={dim}>
                              <line x1={x} y1={20} x2={x} y2={height} stroke="#475569" strokeWidth="2" strokeDasharray="3,3" />
                              <text x={x} y={height + 20} fill="#94A3B8" fontSize="10" textAnchor="middle" fontWeight="bold">
                                {dim}
                              </text>
                              <text x={x} y={15} fill="#38BDF8" fontSize="9" textAnchor="middle">
                                {dimStats[dim]?.max}
                              </text>
                              <text x={x} y={height + 34} fill="#64748B" fontSize="8" textAnchor="middle">
                                {dimStats[dim]?.min}
                              </text>
                            </g>
                          );
                        })}

                        {/* Multi-variable Record Polylines */}
                        {records.map((r: any, rIdx: number) => {
                          const points = dims.map((dim: string, dIdx: number) => {
                            const x = padding + dIdx * stepX;
                            const stats = dimStats[dim];
                            const val = Number(r[dim]) || stats.min;
                            const range = stats.max - stats.min || 1;
                            const norm = (val - stats.min) / range;
                            const y = height - norm * (height - 30);
                            return `${x},${y}`;
                          }).join(' ');

                          const colors = ['#6366F1', '#38BDF8', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#F43F5E', '#A855F7', '#06B6D4'];
                          const strokeColor = colors[rIdx % colors.length];

                          return (
                            <polyline
                              key={rIdx}
                              points={points}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="2.5"
                              opacity="0.8"
                              style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
                              onMouseEnter={() => setHoveredPoint(r)}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          );
                        })}
                      </svg>
                      {hoveredPoint && (
                        <div style={{ background: '#1E293B', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#F8FAFC', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: '#38BDF8' }}>{hoveredPoint.module || 'Record'}:</span>
                          {dims.map((d: string) => (
                            <span key={d}>{d}: <strong>{hoveredPoint[d]}</strong></span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : chartType === 'histogram' ? (
                /* HISTOGRAM DISTRIBUTION */
                (() => {
                  const vals = records.map((r: any) => Number(r[selectedX]) || 0);
                  const min = Math.min(...vals);
                  const max = Math.max(...vals, min + 1);
                  const binCount = 5;
                  const binWidth = (max - min) / binCount;
                  const bins = Array.from({ length: binCount }, (_, i) => ({
                    start: min + i * binWidth,
                    end: min + (i + 1) * binWidth,
                    count: 0
                  }));

                  vals.forEach((v: number) => {
                    const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
                    if (bins[idx]) bins[idx].count += 1;
                  });

                  const maxCount = Math.max(...bins.map((b: any) => b.count), 1);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '220px', padding: '16px 0', borderBottom: '1px solid #334155' }}>
                        {bins.map((b: any, idx: number) => {
                          const heightPct = Math.round((b.count / maxCount) * 100);
                          return (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                              <span style={{ color: '#38BDF8', fontSize: '0.75rem', fontWeight: 800, marginBottom: '4px' }}>{b.count}</span>
                              <div style={{ width: '100%', background: '#6366F1', height: `${Math.max(8, heightPct)}%`, borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                        {bins.map((b: any, idx: number) => (
                          <span key={idx}>[{b.start.toFixed(0)} - {b.end.toFixed(0)}]</span>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : chartType === 'scatter' ? (
                /* SCATTER PLOT */
                (() => {
                  const width = 760;
                  const height = 240;
                  const padding = 50;
                  const xVals = records.map((r: any) => Number(r[selectedX]) || 0);
                  const yVals = records.map((r: any) => Number(r[selectedY]) || 0);
                  const minX = Math.min(...xVals);
                  const maxX = Math.max(...xVals, minX + 1);
                  const minY = Math.min(...yVals);
                  const maxY = Math.max(...yVals, minY + 1);

                  return (
                    <div>
                      <svg viewBox={`0 0 ${width} ${height + 40}`} style={{ width: '100%', maxHeight: '280px' }}>
                        {/* Axes */}
                        <line x1={padding} y1={height} x2={width - 20} y2={height} stroke="#475569" strokeWidth="1.5" />
                        <line x1={padding} y1={20} x2={padding} y2={height} stroke="#475569" strokeWidth="1.5" />
                        <text x={width / 2} y={height + 30} fill="#94A3B8" fontSize="10" textAnchor="middle" fontWeight="bold">{selectedX}</text>
                        <text x={20} y={height / 2} fill="#94A3B8" fontSize="10" textAnchor="middle" transform={`rotate(-90 20 ${height / 2})`} fontWeight="bold">{selectedY}</text>

                        {/* Data Points */}
                        {records.map((r: any, idx: number) => {
                          const xVal = Number(r[selectedX]) || minX;
                          const yVal = Number(r[selectedY]) || minY;
                          const cx = padding + ((xVal - minX) / (maxX - minX || 1)) * (width - padding - 40);
                          const cy = height - ((yVal - minY) / (maxY - minY || 1)) * (height - 40);

                          return (
                            <g key={idx} onMouseEnter={() => setHoveredPoint(r)} onMouseLeave={() => setHoveredPoint(null)} style={{ cursor: 'pointer' }}>
                              <circle cx={cx} cy={cy} r="6" fill="#6366F1" stroke="#38BDF8" strokeWidth="2" opacity="0.9" />
                            </g>
                          );
                        })}
                      </svg>
                      {hoveredPoint && (
                        <div style={{ background: '#1E293B', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', color: '#F8FAFC', textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#38BDF8' }}>{hoveredPoint.module || 'Data Point'}:</span> {selectedX}={hoveredPoint[selectedX]}, {selectedY}={hoveredPoint[selectedY]}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : chartType === 'line' || chartType === 'area' ? (
                /* LINE & AREA CHART */
                (() => {
                  const width = 760;
                  const height = 220;
                  const padding = 50;
                  const yVals = records.map((r: any) => Number(r[selectedY]) || 0);
                  const minY = Math.min(...yVals, 0);
                  const maxY = Math.max(...yVals, 1);
                  const stepX = (width - padding * 2) / Math.max(1, records.length - 1);

                  const pts = records.map((r: any, idx: number) => {
                    const x = padding + idx * stepX;
                    const yVal = Number(r[selectedY]) || 0;
                    const y = height - ((yVal - minY) / (maxY - minY || 1)) * (height - 40);
                    return { x, y, val: yVal, label: r[selectedX] || `Row ${idx+1}` };
                  });

                  const polylinePoints = pts.map((p: any) => `${p.x},${p.y}`).join(' ');
                  const areaPoints = `${pts[0]?.x},${height} ` + polylinePoints + ` ${pts[pts.length - 1]?.x},${height}`;

                  return (
                    <div style={{ overflowX: 'auto' }}>
                      <svg viewBox={`0 0 ${width} ${height + 40}`} style={{ width: '100%', maxHeight: '280px' }}>
                        {/* Axes and Grid Lines */}
                        <line x1={padding} y1={height} x2={width - 20} y2={height} stroke="#334155" strokeWidth="1.5" />
                        <line x1={padding} y1={20} x2={width - 20} y2={20} stroke="#1E293B" strokeDasharray="3,3" />

                        {chartType === 'area' && (
                          <polygon points={areaPoints} fill="rgba(99, 102, 241, 0.25)" />
                        )}
                        <polyline points={polylinePoints} fill="none" stroke="#6366F1" strokeWidth="3" />

                        {pts.map((p: any, idx: number) => (
                          <g key={idx}>
                            <circle cx={p.x} cy={p.y} r="5" fill="#38BDF8" stroke="#0F172A" strokeWidth="2" />
                            <text x={p.x} y={height + 18} fill="#94A3B8" fontSize="8" textAnchor="middle">{String(p.label).slice(0, 10)}</text>
                            <text x={p.x} y={p.y - 8} fill="#F8FAFC" fontSize="9" textAnchor="middle" fontWeight="bold">{p.val}</text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  );
                })()
              ) : chartType === 'bar' ? (
                /* VERTICAL BAR CHART */
                (() => {
                  const maxVal = Math.max(...records.map((r: any) => Number(r[selectedY]) || 1), 1);
                  return (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '240px', padding: '16px 0', borderBottom: '1px solid #334155' }}>
                      {records.map((rec: any, idx: number) => {
                        const label = String(rec[selectedX] || `Row ${idx + 1}`);
                        const val = Number(rec[selectedY]) || 0;
                        const pct = Math.max(5, Math.round((val / maxVal) * 100));

                        return (
                          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ color: '#38BDF8', fontSize: '0.75rem', fontWeight: 800, marginBottom: '4px' }}>{val}</span>
                            <div style={{ width: '100%', background: 'linear-gradient(180deg, #6366F1 0%, #4338CA 100%)', height: `${pct}%`, borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                            <span style={{ color: '#94A3B8', fontSize: '0.7rem', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70px', textAlign: 'center' }}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                /* HORIZONTAL BAR CHART */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {records.slice(0, 10).map((rec: any, idx: number) => {
                    const label = rec[selectedX] || rec[allCols[0]] || `Row ${idx + 1}`;
                    const val = Number(rec[selectedY]) || Number(rec[numCols[0]]) || 0;
                    const maxVal = Math.max(...records.map((r: any) => Number(r[selectedY]) || 1), 1);
                    const pct = Math.min(100, Math.max(5, Math.round((val / maxVal) * 100)));

                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#F8FAFC', marginBottom: '4px' }}>
                          <span>{String(label)}</span>
                          <span style={{ color: '#38BDF8', fontWeight: 700 }}>{val}</span>
                        </div>
                        <div style={{ background: '#1E293B', height: '14px', borderRadius: '6px' }}>
                          <div style={{ background: 'linear-gradient(90deg, #6366F1, #38BDF8)', height: '100%', width: `${pct}%`, borderRadius: '6px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
