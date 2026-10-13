import React, { useState, useEffect } from 'react';
import { FileBox, ArrowRight, RefreshCw, CheckCircle, Network, Layers, Download, Eye, Sparkles } from 'lucide-react';
import { CodePulseArtifact } from '../types';
import { fetchArtifacts, convertCompilerToML } from '../services/api';
import { MetricCard } from './common/MetricCard';

// --- Visual Provenance Lineage Graph Component ---
const ProvenanceGraph: React.FC<{ artifacts: CodePulseArtifact[]; onSelectArtifact: (art: CodePulseArtifact) => void }> = ({ artifacts, onSelectArtifact }) => {
  const compilerArts = artifacts.filter(a => a.artifact_type === 'compiler_analysis');
  const dataArts = artifacts.filter(a => a.artifact_type === 'data_profile');
  const mlArts = artifacts.filter(a => a.artifact_type === 'ml_model_result');

  return (
    <div className="cp-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="panel-title" style={{ margin: 0 }}>
          <Network size={18} color="var(--brand-primary)" />
          Interactive Artifact Lineage &amp; Provenance Graph
        </h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cross-Engine Lineage Flow</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', overflowX: 'auto', padding: '10px 0' }}>
        {/* Step 1: Input Source */}
        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px', width: '180px', textAlign: 'center', flexShrink: 0 }}>
          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>1. INPUT SOURCE</span>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>Source Code</div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Java / C Files</p>
        </div>

        <ArrowRight size={20} color="var(--text-dim)" style={{ flexShrink: 0 }} />

        {/* Step 2: Compiler Engine */}
        <div
          onClick={() => compilerArts[0] && onSelectArtifact(compilerArts[0])}
          style={{
            background: compilerArts.length > 0 ? 'var(--brand-primary-light)' : 'var(--bg-subtle)',
            border: `1.5px solid ${compilerArts.length > 0 ? 'var(--brand-primary)' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            width: '200px',
            textAlign: 'center',
            cursor: compilerArts.length > 0 ? 'pointer' : 'default',
            flexShrink: 0
          }}
        >
          <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>2. COMPILER ENGINE</span>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {compilerArts.length > 0 ? `${compilerArts.length} Compiler Artifacts` : 'No Compiler Artifact'}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {compilerArts[0] ? compilerArts[0].metadata.title : 'Run Compiler Studio'}
          </p>
        </div>

        <ArrowRight size={20} color="var(--text-dim)" style={{ flexShrink: 0 }} />

        {/* Step 3: Data Engine */}
        <div
          onClick={() => dataArts[0] && onSelectArtifact(dataArts[0])}
          style={{
            background: dataArts.length > 0 ? 'var(--color-blue-light)' : 'var(--bg-subtle)',
            border: `1.5px solid ${dataArts.length > 0 ? 'var(--color-blue)' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            width: '200px',
            textAlign: 'center',
            cursor: dataArts.length > 0 ? 'pointer' : 'default',
            flexShrink: 0
          }}
        >
          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>3. DATA ENGINE</span>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {dataArts.length > 0 ? `${dataArts.length} Data Profiles` : 'No Data Artifact'}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {dataArts[0] ? dataArts[0].metadata.title : 'Run Data Studio'}
          </p>
        </div>

        <ArrowRight size={20} color="var(--text-dim)" style={{ flexShrink: 0 }} />

        {/* Step 4: ML Engine */}
        <div
          onClick={() => mlArts[0] && onSelectArtifact(mlArts[0])}
          style={{
            background: mlArts.length > 0 ? 'var(--color-emerald-light)' : 'var(--bg-subtle)',
            border: `1.5px solid ${mlArts.length > 0 ? 'var(--color-emerald)' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            width: '200px',
            textAlign: 'center',
            cursor: mlArts.length > 0 ? 'pointer' : 'default',
            flexShrink: 0
          }}
        >
          <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>4. ML ENGINE</span>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {mlArts.length > 0 ? `${mlArts.length} ML Models` : 'No ML Model Artifact'}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {mlArts[0] ? mlArts[0].metadata.title : 'Run ML Studio'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const ArtifactsStudio: React.FC = () => {
  const [artifacts, setArtifacts] = useState<CodePulseArtifact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [convertedCSV, setConvertedCSV] = useState<string>('');
  const [selectedArt, setSelectedArt] = useState<CodePulseArtifact | null>(null);

  const loadArtifacts = async () => {
    setLoading(true);
    const data = await fetchArtifacts();
    setArtifacts(data);
    if (data.length > 0 && !selectedArt) {
      setSelectedArt(data[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadArtifacts();
  }, []);

  const handleConvert = async (artId: string) => {
    try {
      const res = await convertCompilerToML(artId);
      setConvertedCSV(res.csv_dataset);
    } catch (err) {
      alert('Conversion failed');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner Header */}
      <div className="cp-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-info">ARTIFACT INTEROPERABILITY STORE</span>
              <span className="badge badge-low">{artifacts.length} ARTIFACTS IN MEMORY</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Artifact Store &amp; Provenance Lineage Explorer
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Schema-validated JSON contracts connecting compiler static analysis, data profiles, and trained ML models.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadArtifacts}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Repository
          </button>
        </div>
      </div>

      {/* Visual Provenance Lineage */}
      <ProvenanceGraph artifacts={artifacts} onSelectArtifact={(art) => setSelectedArt(art)} />

      {/* Main Grid: Artifact List Left vs Payload Inspector Right */}
      <div className="grid-2" style={{ alignItems: 'start', marginBottom: '24px' }}>
        {/* Left Column: Artifacts List */}
        <div className="cp-card">
          <h2 className="panel-title">
            <FileBox size={18} color="var(--brand-primary)" />
            Stored Artifact Contracts ({artifacts.length})
          </h2>

          {artifacts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No saved artifacts in memory yet. Run Compiler, Data, or ML Studio to produce artifacts.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {artifacts.map((art) => (
                <div
                  key={art.artifact_id}
                  onClick={() => setSelectedArt(art)}
                  style={{
                    background: selectedArt?.artifact_id === art.artifact_id ? 'var(--brand-primary-light)' : 'var(--bg-subtle)',
                    border: `1px solid ${selectedArt?.artifact_id === art.artifact_id ? 'var(--brand-primary)' : 'var(--border-light)'}`,
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{art.metadata.title}</span>
                    <span className="badge badge-info">{art.producer.engine}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>{art.metadata.summary}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {art.artifact_id.slice(0, 16)}...</span>
                    {art.artifact_type === 'compiler_analysis' && (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem' }}
                        onClick={(e) => { e.stopPropagation(); handleConvert(art.artifact_id); }}
                      >
                        Convert to ML Dataset <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Payload Inspector */}
        <div className="cp-card">
          <h2 className="panel-title">Artifact JSON Contract Payload</h2>

          {convertedCSV && (
            <div style={{ marginBottom: '16px', padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary-light)', border: '1px solid var(--brand-primary)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', marginBottom: '6px' }}>
                Cross-Engine Conversion Output: Compiler Metrics -&gt; ML Dataset CSV
              </h4>
              <textarea className="code-area" rows={6} value={convertedCSV} readOnly />
            </div>
          )}

          {selectedArt ? (
            <div style={{ background: '#0F172A', padding: '16px', borderRadius: 'var(--radius-md)', maxHeight: '450px', overflowY: 'auto' }}>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#F8FAFC' }}>
                {JSON.stringify(selectedArt, null, 2)}
              </pre>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '40px' }}>
              Select an artifact from the list to inspect schema payload.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
