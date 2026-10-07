import React, { useState, useEffect } from 'react';
import { FileText, Download, Play, CheckCircle, Copy, Sparkles, Layers } from 'lucide-react';
import { generateReport, fetchArtifacts } from '../services/api';
import { CodePulseArtifact } from '../types';

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

  const compilerOptions = artifacts.filter(a => a.artifact_type === 'compiler_analysis');
  const dataOptions = artifacts.filter(a => a.artifact_type === 'data_profile');
  const mlOptions = artifacts.filter(a => a.artifact_type === 'ml_model_result');

  return (
    <div>
      {/* Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(245, 158, 11, 0.15))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={22} color="#F59E0B" /> Executive & Technical Reporting Studio
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginTop: '4px' }}>
              Synthesizes Compiler AST/Metrics, Data Profiling, and Machine Learning results into structured Markdown & PDF documents.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            <Play size={16} />
            {loading ? 'Generating Report...' : 'Compile Integrated Report'}
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Artifact Source Selection */}
        <div className="glass-panel">
          <span className="panel-title">
            <Layers size={18} color="#F59E0B" />
            Synthesize Artifacts Into Report
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Compiler Analysis Artifact</label>
              <select value={selectedCompilerId} onChange={(e) => setSelectedCompilerId(e.target.value)} style={{ width: '100%', background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '8px', borderRadius: '6px', fontSize: '0.82rem' }}>
                <option value="">-- None (Synthesize Active Engine) --</option>
                {compilerOptions.map(a => <option key={a.artifact_id} value={a.artifact_id}>{a.metadata.title} ({a.artifact_id.slice(0, 8)})</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Data Profile Artifact</label>
              <select value={selectedDataId} onChange={(e) => setSelectedDataId(e.target.value)} style={{ width: '100%', background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '8px', borderRadius: '6px', fontSize: '0.82rem' }}>
                <option value="">-- None (Synthesize Active Engine) --</option>
                {dataOptions.map(a => <option key={a.artifact_id} value={a.artifact_id}>{a.metadata.title} ({a.artifact_id.slice(0, 8)})</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>ML Model Result Artifact</label>
              <select value={selectedMlId} onChange={(e) => setSelectedMlId(e.target.value)} style={{ width: '100%', background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '8px', borderRadius: '6px', fontSize: '0.82rem' }}>
                <option value="">-- None (Synthesize Active Engine) --</option>
                {mlOptions.map(a => <option key={a.artifact_id} value={a.artifact_id}>{a.metadata.title} ({a.artifact_id.slice(0, 8)})</option>)}
              </select>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #F59E0B, #D97706)', padding: '12px' }}>
            <Sparkles size={16} />
            {loading ? 'Synthesizing Engines...' : 'Generate Comprehensive Markdown Report'}
          </button>
        </div>

        {/* Right Column: Rendered Markdown Report */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span className="panel-title" style={{ margin: 0 }}>
              <FileText size={18} color="#F59E0B" />
              Generated Report
            </span>
            {reportMarkdown && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={handleCopy}>
                  <Copy size={14} /> {copied ? 'Copied ✓' : 'Copy'}
                </button>
                <button className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={handleDownload}>
                  <Download size={14} /> Download .md
                </button>
              </div>
            )}
          </div>

          {reportMarkdown ? (
            <div style={{ background: '#0B0F19', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', maxHeight: '520px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#CBD5E1', lineHeight: 1.6 }}>
              {reportMarkdown}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
              <FileText size={48} color="#334155" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#94A3B8', fontWeight: 600 }}>No Report Generated Yet</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>Select input artifacts and click "Generate Comprehensive Markdown Report".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
