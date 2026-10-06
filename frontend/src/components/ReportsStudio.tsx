import React, { useState } from 'react';
import { FileText, Download, Play, CheckCircle } from 'lucide-react';
import { generateReport } from '../services/api';

export const ReportsStudio: React.FC = () => {
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateReport();
      setReportMarkdown(res.markdown_content);
    } catch (err) {
      alert('Report generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(245, 158, 11, 0.15))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Executive & Technical Reporting Engine</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Synthesizes Compiler AST/Metrics, Data Profiling statistics, and Machine Learning model predictions into publication-ready Markdown/PDF reports.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
            <Play size={16} />
            {loading ? 'Generating Report...' : 'Compile Integrated Report'}
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <span className="panel-title">
          <FileText size={18} color="#F59E0B" />
          Markdown Report Output
        </span>

        {reportMarkdown ? (
          <div>
            <div style={{ background: '#0B0F19', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', maxHeight: '500px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#CBD5E1' }}>
              {reportMarkdown}
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748B', fontSize: '0.88rem', textAlign: 'center', padding: '60px' }}>
            Click "Compile Integrated Report" to synthesize active compiler, data, and ML engine state.
          </p>
        )}
      </div>
    </div>
  );
};
