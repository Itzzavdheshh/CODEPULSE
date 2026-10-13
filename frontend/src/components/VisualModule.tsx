import React, { useState, useEffect } from 'react';
import { Eye, Network, BarChart3, FileBox, FileText, RefreshCw } from 'lucide-react';
import { VisualizationsStudio } from './VisualizationsStudio';
import { ArtifactsStudio } from './ArtifactsStudio';
import { generateReport, fetchArtifacts } from '../services/api';
import { CodePulseArtifact } from '../types';
import { LoadingState } from './common/LoadingState';

export const VisualModule: React.FC = () => {
  const [subTab, setSubTab] = useState<'insights' | 'provenance' | 'report'>('insights');
  const [visualReportMd, setVisualReportMd] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [artifacts, setArtifacts] = useState<CodePulseArtifact[]>([]);

  useEffect(() => {
    fetchArtifacts().then(setArtifacts);
  }, []);

  const handleGenerateVisualReport = async () => {
    setLoadingReport(true);
    try {
      const compArt = artifacts.find(a => a.artifact_type === 'compiler_analysis');
      const dataArt = artifacts.find(a => a.artifact_type === 'data_profile');
      const mlArt = artifacts.find(a => a.artifact_type === 'ml_model_result');

      const rep = await generateReport(
        compArt?.artifact_id,
        dataArt?.artifact_id,
        mlArt?.artifact_id,
        "Visual Intelligence Report"
      );
      setVisualReportMd(rep.markdown_content);
    } catch (err) {
      console.error('Failed to generate Visual report', err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (subTab === 'report' && !visualReportMd) {
      handleGenerateVisualReport();
    }
  }, [subTab]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner & Module Navigation */}
      <div className="cp-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-info">MODULE 3: VISUAL INTELLIGENCE</span>
              <span className="badge badge-low">ANALYTICS &amp; PROVENANCE</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Visual Intelligence &amp; Artifact Provenance Suite
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Interactive control-flow topology diagrams, module complexity distributions, and artifact lineage provenance graphs.
            </p>
          </div>
        </div>

        {/* Submodule Navigation */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${subTab === 'insights' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSubTab('insights')}
          >
            <Network size={14} /> Insights &amp; Risk Analytics
          </button>
          <button
            className={`btn ${subTab === 'provenance' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSubTab('provenance')}
          >
            <FileBox size={14} /> Artifact Lineage &amp; Provenance
          </button>
          <button
            className={`btn ${subTab === 'report' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSubTab('report')}
          >
            <FileText size={14} /> Visual Intelligence Report
          </button>
        </div>
      </div>

      {/* Render Selected Submodule */}
      {subTab === 'insights' && <VisualizationsStudio />}
      {subTab === 'provenance' && <ArtifactsStudio />}
      {subTab === 'report' && (
        <div className="cp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>Visual Intelligence Report</h2>
            <button className="btn btn-secondary btn-sm" onClick={handleGenerateVisualReport}>
              <RefreshCw size={14} className={loadingReport ? 'spin' : ''} /> Regenerate Report
            </button>
          </div>

          {loadingReport ? (
            <LoadingState title="Generating Visual Intelligence Report..." />
          ) : (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              whiteSpace: 'pre-wrap',
              maxHeight: '520px',
              overflowY: 'auto',
              lineHeight: '1.6'
            }}>
              {visualReportMd || 'Click Regenerate Report to synthesize visual analytics metadata.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
