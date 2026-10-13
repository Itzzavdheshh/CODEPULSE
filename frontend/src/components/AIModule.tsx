import React, { useState, useEffect } from 'react';
import { Database, Brain, FileText, Play, RefreshCw, Layers } from 'lucide-react';
import { DataStudio } from './DataStudio';
import { MLStudio } from './MLStudio';
import { generateReport, fetchArtifacts } from '../services/api';
import { CodePulseArtifact } from '../types';
import { LoadingState } from './common/LoadingState';

export const AIModule: React.FC = () => {
  const [subTab, setSubTab] = useState<'data' | 'ml' | 'report'>('data');
  const [mlPrefillCsv, setMlPrefillCsv] = useState<string | undefined>(undefined);
  const [mlPrefillName, setMlPrefillName] = useState<string | undefined>(undefined);

  const [aiReportMd, setAiReportMd] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [artifacts, setArtifacts] = useState<CodePulseArtifact[]>([]);

  useEffect(() => {
    fetchArtifacts().then(setArtifacts);
  }, []);

  const handleSendToML = (csvText: string, datasetName: string) => {
    setMlPrefillCsv(csvText);
    setMlPrefillName(datasetName);
    setSubTab('ml');
  };

  const handleGenerateAIReport = async () => {
    setLoadingReport(true);
    try {
      const dataArt = artifacts.find(a => a.artifact_type === 'data_profile');
      const mlArt = artifacts.find(a => a.artifact_type === 'ml_model_result');

      const rep = await generateReport(
        undefined,
        dataArt?.artifact_id,
        mlArt?.artifact_id,
        "AI Intelligence Report"
      );
      setAiReportMd(rep.markdown_content);
    } catch (err) {
      console.error('Failed to generate AI report', err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (subTab === 'report' && !aiReportMd) {
      handleGenerateAIReport();
    }
  }, [subTab]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner & Module Navigation */}
      <div className="cp-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-info">MODULE 2: AI INTELLIGENCE</span>
              <span className="badge badge-low">DATA &amp; MACHINE LEARNING</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              AI &amp; Data Intelligence Suite
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Statistical data profiling, leakage-safe machine learning model training, defect prediction, and feature explainability.
            </p>
          </div>
        </div>

        {/* Submodule Navigation */}
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${subTab === 'data' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSubTab('data')}
          >
            <Database size={14} /> Data Intelligence
          </button>
          <button
            className={`btn ${subTab === 'ml' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSubTab('ml')}
          >
            <Brain size={14} /> ML Intelligence &amp; Risk Prediction
          </button>
          <button
            className={`btn ${subTab === 'report' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setSubTab('report')}
          >
            <FileText size={14} /> AI Intelligence Report
          </button>
        </div>
      </div>

      {/* Render Selected Submodule */}
      {subTab === 'data' && <DataStudio onSendToML={handleSendToML} />}
      {subTab === 'ml' && <MLStudio prefillCsv={mlPrefillCsv} prefillName={mlPrefillName} />}
      {subTab === 'report' && (
        <div className="cp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>AI Intelligence Report</h2>
            <button className="btn btn-secondary btn-sm" onClick={handleGenerateAIReport}>
              <RefreshCw size={14} className={loadingReport ? 'spin' : ''} /> Regenerate Report
            </button>
          </div>

          {loadingReport ? (
            <LoadingState title="Generating AI Intelligence Report..." />
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
              {aiReportMd || 'Click Regenerate Report to synthesize active Data & ML artifacts.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
