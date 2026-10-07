import React, { useState, useEffect } from 'react';
import { FileBox, ArrowRight, RefreshCw, CheckCircle, Network, Layers, Download, Eye, Sparkles } from 'lucide-react';
import { CodePulseArtifact } from '../types';
import { fetchArtifacts, convertCompilerToML } from '../services/api';

// --- Visual Provenance Lineage Graph Component ---
const ProvenanceGraph: React.FC<{ artifacts: CodePulseArtifact[]; onSelectArtifact: (art: CodePulseArtifact) => void }> = ({ artifacts, onSelectArtifact }) => {
  const compilerArts = artifacts.filter(a => a.artifact_type === 'compiler_analysis');
  const dataArts = artifacts.filter(a => a.artifact_type === 'data_profile');
  const mlArts = artifacts.filter(a => a.artifact_type === 'ml_model_result');

  return (
    <div style={{ background: '#070A11', padding: '24px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={18} color="#C084FC" />
          Interactive Artifact Lineage & Provenance Graph
        </h4>
        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Cross-Engine Artifact Provenance Flow</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', overflowX: 'auto', padding: '10px 0' }}>
        {/* Step 1: Source Code */}
        <div style={{ background: '#0F172A', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', width: '180px', textAlign: 'center', flexShrink: 0 }}>
          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>INPUT SOURCE</span>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF', marginTop: '6px' }}>Source Files</div>
          <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>Java / Datasets</p>
        </div>

        <ArrowRight size={20} color="#475569" style={{ flexShrink: 0 }} />

        {/* Step 2: Compiler Artifact */}
        <div
          onClick={() => compilerArts[0] && onSelectArtifact(compilerArts[0])}
          style={{
            background: compilerArts.length > 0 ? '#1E1B4B' : '#0F172A',
            border: `1.5px solid ${compilerArts.length > 0 ? '#6366F1' : 'var(--border-color)'}`,
            borderRadius: '8px',
            padding: '14px',
            width: '200px',
            textAlign: 'center',
            cursor: compilerArts.length > 0 ? 'pointer' : 'default',
            flexShrink: 0
          }}
        >
          <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>COMPILER ENGINE</span>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFF', marginTop: '6px' }}>
            {compilerArts.length > 0 ? `${compilerArts.length} Compiler Artifacts` : 'No Compiler Artifact'}
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
            {compilerArts[0] ? compilerArts[0].metadata.title : 'Run Compiler Studio'}
          </p>
        </div>

        <ArrowRight size={20} color="#475569" style={{ flexShrink: 0 }} />

        {/* Step 3: Data Profile Artifact */}
        <div
          onClick={() => dataArts[0] && onSelectArtifact(dataArts[0])}
          style={{
            background: dataArts.length > 0 ? '#083344' : '#0F172A',
            border: `1.5px solid ${dataArts.length > 0 ? '#06B6D4' : 'var(--border-color)'}`,
            borderRadius: '8px',
            padding: '14px',
            width: '200px',
            textAlign: 'center',
            cursor: dataArts.length > 0 ? 'pointer' : 'default',
            flexShrink: 0
          }}
        >
          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>DATA ENGINE</span>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFF', marginTop: '6px' }}>
            {dataArts.length > 0 ? `${dataArts.length} Data Profiles` : 'No Data Artifact'}
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
            {dataArts[0] ? dataArts[0].metadata.title : 'Run Data Studio'}
          </p>
        </div>

        <ArrowRight size={20} color="#475569" style={{ flexShrink: 0 }} />

        {/* Step 4: ML Model Artifact */}
        <div
          onClick={() => mlArts[0] && onSelectArtifact(mlArts[0])}
          style={{
            background: mlArts.length > 0 ? '#064E3B' : '#0F172A',
            border: `1.5px solid ${mlArts.length > 0 ? '#10B981' : 'var(--border-color)'}`,
            borderRadius: '8px',
            padding: '14px',
            width: '200px',
            textAlign: 'center',
            cursor: mlArts.length > 0 ? 'pointer' : 'default',
            flexShrink: 0
          }}
        >
          <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>ML ENGINE</span>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFF', marginTop: '6px' }}>
            {mlArts.length > 0 ? `${mlArts.length} ML Models` : 'No ML Model Artifact'}
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
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
    <div>
      {/* Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(168, 85, 247, 0.15))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileBox size={22} color="#C084FC" /> Shared Artifact Exchange & Provenance Explorer
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginTop: '4px' }}>
              Versioned JSON contracts connecting Compiler analysis, Data profiles, and ML models into a traceable execution graph.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={loadArtifacts}>
            <RefreshCw size={16} /> Refresh Artifact Repository
          </button>
        </div>
      </div>

      {/* Visual Provenance Lineage Graph */}
      <ProvenanceGraph artifacts={artifacts} onSelectArtifact={(art) => setSelectedArt(art)} />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Artifacts List */}
        <div className="glass-panel">
          <span className="panel-title">
            <FileBox size={18} color="#A855F7" />
            Generated Repository Artifacts ({artifacts.length})
          </span>

          {artifacts.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.88rem' }}>No saved artifacts in memory yet. Run Compiler, Data, or ML engine to produce artifacts.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {artifacts.map((art) => (
                <div
                  key={art.artifact_id}
                  onClick={() => setSelectedArt(art)}
                  style={{
                    background: selectedArt?.artifact_id === art.artifact_id ? 'rgba(168, 85, 247, 0.15)' : '#0F172A',
                    border: `1px solid ${selectedArt?.artifact_id === art.artifact_id ? '#A855F7' : 'var(--border-color)'}`,
                    padding: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#FFF', fontSize: '0.9rem' }}>{art.metadata.title}</span>
                    <span className="badge badge-info">{art.producer.engine}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0 }}>{art.metadata.summary}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{art.created_at}</span>
                    {art.artifact_type === 'compiler_analysis' && (
                      <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '4px 8px' }} onClick={(e) => { e.stopPropagation(); handleConvert(art.artifact_id); }}>
                        Convert to ML Dataset <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Artifact Payload Inspector */}
        <div className="glass-panel">
          <span className="panel-title">
            Artifact JSON Payload & Provenance Metadata
          </span>

          {convertedCSV && (
            <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <h4 style={{ fontSize: '0.88rem', color: '#C084FC', marginBottom: '6px' }}>Cross-Engine Conversion: Compiler Metrics → ML Dataset CSV</h4>
              <textarea className="code-area" rows={6} value={convertedCSV} readOnly />
            </div>
          )}

          {selectedArt ? (
            <div style={{ background: '#0B0F19', padding: '16px', borderRadius: '8px', maxHeight: '450px', overflowY: 'auto' }}>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#C084FC' }}>
                {JSON.stringify(selectedArt, null, 2)}
              </pre>
            </div>
          ) : (
            <p style={{ color: '#64748B', fontSize: '0.88rem', textAlign: 'center', padding: '40px' }}>
              Select an artifact from the list to inspect schema payload.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
