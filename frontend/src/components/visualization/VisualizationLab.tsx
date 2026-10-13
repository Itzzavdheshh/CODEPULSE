import React, { useState, useEffect } from 'react';
import { FlaskConical, Play, CheckCircle2, FileText, ArrowRight, Layers, Database, Code, BarChart, Calendar, Sliders } from 'lucide-react';
import { fetchLabExperiments, executeLabExperiment } from '../../services/api';
import { LoadingState } from '../common/LoadingState';
import {
  LabDonutChart,
  LabScatterChart,
  LabHeatmapChart,
  LabCalendarHeatmapChart,
  LabTimeSeriesChart,
  LabRadarChart,
  LabTreemapChart,
  LabBarChart
} from './LabChartRenderers';

export const VisualizationLab: React.FC = () => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [activeExpId, setActiveExpId] = useState<string>('01');
  const [expResult, setExpResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [customCsv, setCustomCsv] = useState<string>('');

  useEffect(() => {
    fetchLabExperiments().then(exps => {
      setExperiments(exps);
      if (exps.length > 0) {
        runExperiment(exps[0].id);
      }
    });
  }, []);

  const runExperiment = async (expId: string) => {
    setActiveExpId(expId);
    setLoading(true);
    try {
      const res = await executeLabExperiment(expId, customCsv || undefined);
      setExpResult(res);
    } catch (err) {
      console.error('Experiment execution error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
      {/* Left Sidebar: Syllabus Experiment Explorer */}
      <div className="cp-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FlaskConical size={18} color="var(--brand-primary)" />
          <h3 className="panel-title" style={{ margin: 0 }}>Visualization Lab Syllabus</h3>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Click any experiment to execute backend data transformation, visual encoding, and academic explanation.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
          {experiments.map((exp) => {
            const isActive = activeExpId === exp.id;
            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => runExperiment(exp.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: isActive ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-subtle)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <span className={`badge ${isActive ? 'badge-info' : 'badge-low'}`} style={{ fontSize: '0.72rem' }}>
                  EXP {exp.id}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--brand-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {exp.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {exp.domain}
                  </div>
                </div>
                {isActive && <CheckCircle2 size={14} color="var(--brand-primary)" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Main Pane: Executed Experiment Details & Visualization */}
      <div>
        {loading ? (
          <LoadingState title={`Executing Experiment ${activeExpId}...`} />
        ) : expResult ? (
          <div className="cp-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '6px' }}>
                  LAB EXPERIMENT {expResult.experiment_id}
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {expResult.title}
                </h2>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => runExperiment(expResult.experiment_id)}>
                <Play size={14} /> Re-Run Experiment
              </button>
            </div>

            {/* Pipeline Stage Cards: Input -> Transformation -> Visual Encoding -> Insight */}
            <div className="grid-2" style={{ gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={14} /> INPUT &amp; TRANSFORMATION
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {expResult.transformation}
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-emerald)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> ACADEMIC SYLLABUS INSIGHT
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {expResult.academic_insight}
                </div>
              </div>
            </div>

            {/* Render Experiment Interactive Visualization (Pure Light Theme) */}
            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#0F172A' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '16px', fontWeight: 700, letterSpacing: '0.05em' }}>
                INTERACTIVE VISUAL ENCODING ({(expResult.chart_type || '').toUpperCase()})
              </div>

              {/* Experiment 01: Table Profile */}
              {(expResult.experiment_id === '01' || expResult.chart_type === 'table_profile') && (
                <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', color: '#1E293B', textAlign: 'left', fontWeight: 700 }}>
                        <th style={{ padding: '8px 12px' }}>Attribute</th>
                        <th style={{ padding: '8px 12px' }}>Type</th>
                        <th style={{ padding: '8px 12px' }}>Mean / Summary</th>
                        <th style={{ padding: '8px 12px' }}>Missing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(expResult.data?.column_profiles || []).map((cp: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>{cp.column_name}</td>
                          <td style={{ padding: '8px 12px', color: '#64748B' }}>{cp.data_type}</td>
                          <td style={{ padding: '8px 12px', color: '#334155', fontWeight: 600 }}>
                            {cp.mean !== undefined ? `Mean: ${cp.mean.toFixed(2)}` : `Unique: ${cp.unique_values_count}`}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: cp.missing_count > 0 ? '#DC2626' : '#059669' }}>
                            {cp.missing_count} ({cp.missing_percentage}%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Experiment 02: Relational Bar Chart */}
              {expResult.experiment_id === '02' && (
                <LabBarChart data={expResult.data} />
              )}

              {/* Experiment 03: Semi-Structured Nested Document Donut Chart */}
              {(expResult.experiment_id === '03' || expResult.chart_type === 'donut') && (
                <LabDonutChart data={expResult.data} />
              )}

              {/* Experiment 04: Risk Aggregation Bar Chart */}
              {expResult.experiment_id === '04' && (
                <LabBarChart data={expResult.data} isRiskGroup={true} />
              )}

              {/* Experiment 05: Spider Radar Multivariate Encoding */}
              {(expResult.experiment_id === '05' || expResult.chart_type === 'radar') && (
                <LabRadarChart data={expResult.data} />
              )}

              {/* Experiment 06: Bivariate Scatter Plot with Linear Regression */}
              {(expResult.experiment_id === '06' || expResult.chart_type === 'scatter') && (
                <LabScatterChart data={expResult.data} />
              )}

              {/* Experiment 07: Hierarchical Partition Treemap */}
              {(expResult.experiment_id === '07' || expResult.chart_type === 'treemap') && (
                <LabTreemapChart data={expResult.data} />
              )}

              {/* Experiment 08: Topographical Density Pearson Correlation Heatmap */}
              {(expResult.experiment_id === '08' || expResult.chart_type === 'heatmap') && (
                <LabHeatmapChart data={expResult.data} />
              )}

              {/* Experiment 09: Calendar Activity Heatmap */}
              {(expResult.experiment_id === '09' || expResult.chart_type === 'calendar_heatmap') && (
                <LabCalendarHeatmapChart data={expResult.data} />
              )}

              {/* Experiment 10: Time-Series Dual Curve Trendline */}
              {(expResult.experiment_id === '10' || expResult.chart_type === 'line') && (
                <LabTimeSeriesChart data={expResult.data} />
              )}

              {/* Fallback for generic or custom chart types */}
              {!['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'].includes(expResult.experiment_id) &&
               !['table_profile', 'donut', 'scatter', 'heatmap', 'calendar_heatmap', 'line', 'radar', 'treemap', 'bar'].includes(expResult.chart_type) && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#334155' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#4F46E5' }}>
                    {JSON.stringify(expResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

