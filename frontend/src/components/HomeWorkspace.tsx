import React from 'react';
import { Cpu, Database, Brain, Network, FileBox, FileText, ArrowRight, CheckCircle2, Play, Sparkles, FolderGit2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { CodePulseArtifact } from '../types';
import { MetricCard } from './common/MetricCard';

interface HomeWorkspaceProps {
  onNavigate: (tab: string) => void;
  onLoadDemoWorkspace: () => void;
  artifacts: CodePulseArtifact[];
  isDemoActive: boolean;
  selectedWorkspace?: string;
}

export const HomeWorkspace: React.FC<HomeWorkspaceProps> = ({
  onNavigate,
  onLoadDemoWorkspace,
  artifacts,
  isDemoActive,
  selectedWorkspace = 'PaymentSystem'
}) => {
  const compilerArtifacts = artifacts.filter(a => a.artifact_type === 'compiler_analysis');
  const dataArtifacts = artifacts.filter(a => a.artifact_type === 'data_profile');
  const mlArtifacts = artifacts.filter(a => a.artifact_type === 'ml_model_result');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Workspace Top Banner */}
      <div className="cp-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #FFFFFF, #F8FAFC)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-info">WORKSPACE: {selectedWorkspace}</span>
              <span className="badge badge-high">RISK LEVEL: HIGH</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              Software Intelligence Workspace
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Real-time architectural analysis, dataset quality audit, defect risk prediction, and artifact provenance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('compiler')}>
              <Cpu size={16} />
              Analyze Code
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('data')}>
              <Database size={16} color="var(--color-cyan)" />
              Profile Dataset
            </button>
            <button className="btn btn-secondary" onClick={onLoadDemoWorkspace}>
              <FolderGit2 size={16} />
              {isDemoActive ? 'Demo Workspace Active ✓' : 'Load Demo Workspace'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <MetricCard
          title="Analyzed Modules"
          value={compilerArtifacts.length > 0 ? compilerArtifacts.length + 8 : (isDemoActive ? 27 : 4)}
          badgeText="8 Active Files"
          badgeType="info"
          description="Java / C source modules under static analysis"
          icon={Cpu}
          accentColor="var(--brand-primary)"
        />
        <MetricCard
          title="Static Diagnostics"
          value="2"
          badgeText="2 Warnings"
          badgeType="moderate"
          description="Float-to-int precision & scope warnings detected"
          icon={AlertTriangle}
          accentColor="var(--color-amber)"
        />
        <MetricCard
          title="Software Datasets"
          value={dataArtifacts.length > 0 ? dataArtifacts.length : 2}
          badgeText="100% Complete"
          badgeType="low"
          description="Software metrics & defect classification datasets"
          icon={Database}
          accentColor="var(--color-emerald)"
        />
        <MetricCard
          title="Defect Risk Level"
          value="HIGH"
          badgeText="79% Prob"
          badgeType="high"
          description="Predicted by Random Forest & Gradient Boosting"
          icon={Brain}
          accentColor="var(--color-rose)"
        />
      </div>

      {/* Main Overview Grid: Storyline Pipeline + Recent Analysis & Insights */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Left Panel: Analysis Storyline Pipeline */}
        <div className="cp-card">
          <h2 className="panel-title">
            <Activity size={18} color="var(--brand-primary)" />
            Software Intelligence Storyline Pipeline
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <div
              onClick={() => onNavigate('compiler')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={16} color="var(--brand-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>1. Code &amp; Compiler Analysis</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>AST structure, TAC IR, basic block CFG &amp; cyclomatic metrics</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-dim)" />
            </div>

            <div
              onClick={() => onNavigate('data')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--color-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={16} color="var(--color-blue)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>2. Quality Audit &amp; Data Intelligence</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Missing value audit, IQR outlier filter, correlation matrix</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-dim)" />
            </div>

            <div
              onClick={() => onNavigate('ml')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--color-emerald-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={16} color="var(--color-emerald)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>3. Predictive Risk &amp; Model Explainability</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Leakage-safe scaler, Random Forest / SVM evaluation, feature importance</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-dim)" />
            </div>

            <div
              onClick={() => onNavigate('reports')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--color-amber-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color="var(--color-amber)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>4. Executive Report &amp; Provenance</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cross-engine synthesis, artifact lineage &amp; PDF/Markdown export</div>
                </div>
              </div>
              <ArrowRight size={16} color="var(--text-dim)" />
            </div>
          </div>
        </div>

        {/* Right Panel: Software Health Insights */}
        <div className="cp-card">
          <h2 className="panel-title">
            <ShieldCheck size={18} color="var(--color-emerald)" />
            Software Health &amp; Diagnostic Insights
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-rose-light)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#991B1B', marginBottom: '2px' }}>
                Elevated Cyclomatic Complexity Detected
              </div>
              <div style={{ fontSize: '0.78rem', color: '#7F1D1D' }}>
                <code>SoftwareRiskAnalyzer.java</code> has a cyclomatic complexity of 12 (Threshold: &gt;10). 4 independent control paths require unit test coverage.
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-amber-light)', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400E', marginBottom: '2px' }}>
                Float Precision Warning (Semantic Analysis)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#78350F' }}>
                Implicit cast from <code>float</code> to <code>int</code> in calculation block line 14 may cause precision loss during currency conversion.
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-emerald-light)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065F46', marginBottom: '2px' }}>
                Data Quality Audit: 100% Completeness
              </div>
              <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                Software metrics dataset verified across 11 modules. Zero missing values, 1 outlier handled by IQR strategy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
