import React from 'react';
import { Cpu, Database, Brain, Network, FileBox, FileText, ArrowRight, CheckCircle2, Play, Sparkles, FolderGit2 } from 'lucide-react';
import { CodePulseArtifact } from '../types';

interface HomeWorkspaceProps {
  onNavigate: (tab: string) => void;
  onLoadDemoWorkspace: () => void;
  artifacts: CodePulseArtifact[];
  isDemoActive: boolean;
}

export const HomeWorkspace: React.FC<HomeWorkspaceProps> = ({
  onNavigate,
  onLoadDemoWorkspace,
  artifacts,
  isDemoActive
}) => {
  const compilerCount = artifacts.filter(a => a.artifact_type === 'compiler_analysis').length;
  const dataCount = artifacts.filter(a => a.artifact_type === 'data_profile').length;
  const mlCount = artifacts.filter(a => a.artifact_type === 'ml_model_result').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Central Hero Section */}
      <div className="glass-panel" style={{
        padding: '40px',
        marginBottom: '32px',
        background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), rgba(15, 23, 42, 0.95))',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        boxShadow: '0 0 35px rgba(99, 102, 241, 0.15)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#A5B4FC',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          <Sparkles size={14} />
          ONE UNIFIED DEVELOPER INTELLIGENCE PLATFORM
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px'
        }}>
          CODEPULSE
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: '#CBD5E1',
          maxWidth: '700px',
          margin: '0 auto 24px auto',
          lineHeight: 1.6
        }}>
          Understand source structure, profile data metrics, train predictive models, and export artifact lineage — seamlessly connected in one platform.
        </p>

        {/* Central Flow Pipeline Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: '#94A3B8',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '32px',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: '#6366F1' }}>Understand</span>
          <ArrowRight size={14} color="#475569" />
          <span style={{ color: '#06B6D4' }}>Analyze</span>
          <ArrowRight size={14} color="#475569" />
          <span style={{ color: '#10B981' }}>Explain</span>
          <ArrowRight size={14} color="#475569" />
          <span style={{ color: '#F59E0B' }}>Act</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }} onClick={() => onNavigate('compiler')}>
            <Cpu size={18} />
            Analyze Code
          </button>
          <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '0.95rem' }} onClick={() => onNavigate('data')}>
            <Database size={18} color="#06B6D4" />
            Analyze Dataset
          </button>
          <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '0.95rem' }} onClick={() => onNavigate('ml')}>
            <Brain size={18} color="#10B981" />
            Train / Analyze Model
          </button>
          <button className="btn btn-outline" style={{ padding: '12px 24px', fontSize: '0.95rem' }} onClick={onLoadDemoWorkspace}>
            <FolderGit2 size={18} />
            {isDemoActive ? 'Demo Workspace Active ✓' : 'Load Demo Workspace'}
          </button>
        </div>
      </div>

      {/* Active Workspace & Summary Grid */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        {/* Workspace Info Panel */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="panel-title" style={{ margin: 0 }}>
              <FolderGit2 size={20} color="#6366F1" />
              Active Workspace
            </span>
            <span className="badge badge-info">
              {isDemoActive ? 'Payment System Analysis' : 'Default Workspace'}
            </span>
          </div>

          <div style={{
            background: '#0B0F19',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid var(--border-color)',
            marginBottom: '16px'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF', marginBottom: '6px' }}>
              {isDemoActive ? 'Payment System Analysis' : 'Interactive Workspace'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '16px' }}>
              {isDemoActive
                ? 'Prepared demonstration workspace containing multi-file Java payment source, 1,000-row software metrics dataset, and pre-configured defect classification models.'
                : 'Contains all active source files, dataset profiles, ML experiment outputs, and generated reports.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ background: '#0F172A', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Source Files</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#6366F1' }}>{isDemoActive ? 8 : 3}</div>
              </div>
              <div style={{ background: '#0F172A', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Compiler Runs</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#06B6D4' }}>{compilerCount || (isDemoActive ? 12 : 1)}</div>
              </div>
              <div style={{ background: '#0F172A', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Datasets</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>{dataCount || (isDemoActive ? 3 : 1)}</div>
              </div>
              <div style={{ background: '#0F172A', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>ML Runs</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F59E0B' }}>{mlCount || (isDemoActive ? 4 : 1)}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.82rem' }} onClick={() => onNavigate('artifacts')}>
              <FileBox size={16} /> View Artifact Lineage
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.82rem' }} onClick={() => onNavigate('reports')}>
              <FileText size={16} /> Generate Executive Report
            </button>
          </div>
        </div>

        {/* Engine Pipeline Status & Architecture Overview */}
        <div className="glass-panel">
          <span className="panel-title">
            <Network size={20} color="#06B6D4" />
            Engine Interoperability Status
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0F172A', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Cpu size={20} color="#6366F1" />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFF' }}>Compiler Intelligence Engine</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>10-Phase Analysis, AST, Scope Table, CFG, Target Bytecode</div>
                </div>
              </div>
              <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>READY</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0F172A', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Database size={20} color="#06B6D4" />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFF' }}>Data Intelligence Engine</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Multi-format Ingestion, Quality Audit, Imputation, Chart Builder</div>
                </div>
              </div>
              <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>READY</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0F172A', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Brain size={20} color="#10B981" />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFF' }}>Machine Learning Engine</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Classification & Regression, Model Comparison, Explainability</div>
                </div>
              </div>
              <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>READY</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0F172A', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileBox size={20} color="#F59E0B" />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFF' }}>Shared Artifact Store</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Cross-engine provenance graph, versioned JSON contracts</div>
                </div>
              </div>
              <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>ACTIVE ({artifacts.length} artifacts)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF', marginBottom: '16px' }}>Core Studios</h3>
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        <div className="glass-panel" style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }} onClick={() => onNavigate('compiler')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={20} color="#6366F1" />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFF' }}>Compiler Studio</h4>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Source to Assembly</span>
            </div>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '14px', height: '40px' }}>
            Interactive Lexer, Parser, AST Explorer, Symbol Table, TAC IR, Optimization & CFG graph.
          </p>
          <span style={{ color: '#6366F1', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Open Compiler Studio <ArrowRight size={14} />
          </span>
        </div>

        <div className="glass-panel" style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }} onClick={() => onNavigate('data')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={20} color="#06B6D4" />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFF' }}>Data Studio</h4>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Profiling & Charts</span>
            </div>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '14px', height: '40px' }}>
            Upload datasets or import compiler metrics, clean data, and render custom visualizations.
          </p>
          <span style={{ color: '#06B6D4', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Open Data Studio <ArrowRight size={14} />
          </span>
        </div>

        <div className="glass-panel" style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }} onClick={() => onNavigate('ml')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={20} color="#10B981" />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFF' }}>ML Studio</h4>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Training & Explainability</span>
            </div>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '14px', height: '40px' }}>
            Train Random Forests or Logistic Models, view confusion matrix and feature importance.
          </p>
          <span style={{ color: '#10B981', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Open ML Studio <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};
