import React, { useState, useEffect } from 'react';
import { FileBox, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react';
import { CodePulseArtifact } from '../types';
import { fetchArtifacts, convertCompilerToML } from '../services/api';

export const ArtifactsStudio: React.FC = () => {
  const [artifacts, setArtifacts] = useState<CodePulseArtifact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [convertedCSV, setConvertedCSV] = useState<string>('');
  const [selectedArt, setSelectedArt] = useState<CodePulseArtifact | null>(null);

  const loadArtifacts = async () => {
    setLoading(true);
    const data = await fetchArtifacts();
    setArtifacts(data);
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
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(168, 85, 247, 0.15))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Shared Artifact Exchange Layer</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Schema-driven, versioned JSON artifact repository enabling cross-engine interoperability (e.g. Compiler Analysis → ML Feature Dataset).
            </p>
          </div>
          <button className="btn btn-secondary" onClick={loadArtifacts}>
            <RefreshCw size={16} /> Refresh Repository
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Artifacts List */}
        <div className="glass-panel">
          <span className="panel-title">
            <FileBox size={18} color="#A855F7" />
            Generated Engine Artifacts ({artifacts.length})
          </span>

          {artifacts.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '0.88rem' }}>No saved artifacts in memory yet. Run Compiler, Data, or ML engine to automatically produce artifacts.</p>
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
                        Send to ML Engine <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Artifact Payload Viewer & Pipeline Output */}
        <div className="glass-panel">
          <span className="panel-title">
            Artifact JSON Payload & Cross-Engine Interop
          </span>

          {convertedCSV && (
            <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <h4 style={{ fontSize: '0.88rem', color: '#C084FC', marginBottom: '6px' }}>Cross-Engine Conversion: Compiler → ML Dataset CSV</h4>
              <textarea className="code-area" rows={6} value={convertedCSV} readOnly />
            </div>
          )}

          {selectedArt ? (
            <div style={{ background: '#0B0F19', padding: '16px', borderRadius: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#C084FC' }}>
                {JSON.stringify(selectedArt, null, 2)}
              </pre>
            </div>
          ) : (
            <p style={{ color: '#64748B', fontSize: '0.88rem', textAlign: 'center', padding: '40px' }}>
              Select an artifact from the list to inspect raw schema payload.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
