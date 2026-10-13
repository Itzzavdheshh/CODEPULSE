import React, { useState, useEffect } from 'react';
import { FileText, Download, Play, CheckCircle2, Copy, Sparkles, Layers, Printer } from 'lucide-react';
import { generateReport, fetchArtifacts } from '../services/api';
import { CodePulseArtifact } from '../types';
import { MetricCard } from './common/MetricCard';

export const ReportsStudio: React.FC = () => {
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [artifacts, setArtifacts] = useState<CodePulseArtifact[]>([]);
  const [selectedCompilerId, setSelectedCompilerId] = useState<string>('');
  const [selectedDataId, setSelectedDataId] = useState<string>('');
  const [selectedMlId, setSelectedMlId] = useState<string>('');

  useEffect(() => {
    fetchArtifacts().then(arts => {
      setArtifacts(arts);
      const c = arts.find(a => a.artifact_type === 'compiler_analysis');
      const d = arts.find(a => a.artifact_type === 'data_profile');
      const m = arts.find(a => a.artifact_type === 'ml_model_result');
      if (c) setSelectedCompilerId(c.artifact_id);
      if (d) setSelectedDataId(d.artifact_id);
      if (m) setSelectedMlId(m.artifact_id);
    });
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateReport(
        selectedCompilerId || undefined,
        selectedDataId || undefined,
        selectedMlId || undefined
      );
      setReportMarkdown(res.markdown_content);
    } catch (err) {
      alert('Report generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CodePulse_Integrated_Report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const compilerOptions = artifacts.filter(a => a.artifact_type === 'compiler_analysis');
  const dataOptions = artifacts.filter(a => a.artifact_type === 'data_profile');
  const mlOptions = artifacts.filter(a => a.artifact_type === 'ml_model_result');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner Header */}
      <div className="cp-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-info">EXECUTIVE & TECHNICAL REPORTING</span>
              <span className="badge badge-low">CROSS-ENGINE SYNTHESIS</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Executive &amp; Technical Reporting Studio
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Synthesize compiler metrics, dataset profiles, and machine learning risk predictions into an executive report.
            </p>
          </div>

          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            <Play size={16} />
            {loading ? 'Compiling Report...' : 'Compile Integrated Report'}
          </button>
        </div>
      </div>

      {/* Main Grid: Artifact Synthesis Selector Left vs Report Document Preview Right */}
      <div className="grid-2" style={{ alignItems: 'start', marginBottom: '24px' }}>
        {/* Left Column: Artifact Source Controls */}
        <div className="cp-card">
          <h2 className="panel-title">
            <Layers size={18} color="var(--brand-primary)" />
            Synthesize Artifact Sources
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Compiler Analysis Artifact</label>
              <select value={selectedCompilerId} onChange={(e) => setSelectedCompilerId(e.target.value)} className="cp-select" style={{ width: '100%' }}>
                <option value="">-- Active Compiler Run --</option>
                {compilerOptions.map(a => <option key={a.artifact_id} value={a.artifact_id}>{a.metadata.title} ({a.artifact_id.slice(0, 8)})</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Data Profile Artifact</label>
              <select value={selectedDataId} onChange={(e) => setSelectedDataId(e.target.value)} className="cp-select" style={{ width: '100%' }}>
                <option value="">-- Active Data Profile --</option>
                {dataOptions.map(a => <option key={a.artifact_id} value={a.artifact_id}>{a.metadata.title} ({a.artifact_id.slice(0, 8)})</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ML Model Result Artifact</label>
              <select value={selectedMlId} onChange={(e) => setSelectedMlId(e.target.value)} className="cp-select" style={{ width: '100%' }}>
                <option value="">-- Active ML Model --</option>
                {mlOptions.map(a => <option key={a.artifact_id} value={a.artifact_id}>{a.metadata.title} ({a.artifact_id.slice(0, 8)})</option>)}
              </select>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ width: '100%' }}>
            <FileText size={16} /> Generate Executive Report
          </button>
        </div>

        {/* Right Column: Professional Report Preview */}
        <div className="cp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>Report Document Preview</h2>

            {reportMarkdown && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                  {copied ? <CheckCircle2 size={14} color="var(--color-emerald)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
                  <Download size={14} /> Markdown
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
                  <Printer size={14} /> Print / PDF
                </button>
              </div>
            )}
          </div>

          {!reportMarkdown ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <FileText size={48} color="var(--border-subtle)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>No Report Generated Yet</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '4px', maxWidth: '360px', margin: '4px auto 0 auto' }}>
                Click 'Compile Integrated Report' to synthesize selected artifacts into a Markdown &amp; PDF document.
              </p>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              fontFamily: 'var(--font-sans)',
              maxHeight: '520px',
              overflowY: 'auto',
              lineHeight: '1.6'
            }}>
              <div style={{ borderBottom: '2px solid var(--brand-primary)', paddingBottom: '12px', marginBottom: '16px' }}>
                <span className="badge badge-info">CODEPULSE EXECUTIVE REPORT</span>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  Software Intelligence &amp; Quality Audit Report
                </h1>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Generated on {new Date().toLocaleDateString()} | Workspace: PaymentSystem
                </p>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                {reportMarkdown}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
