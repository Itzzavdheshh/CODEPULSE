import React, { useState, useEffect } from 'react';
import { Search, X, Cpu, Database, Brain, FileBox, FileText, Code, ArrowRight } from 'lucide-react';
import { CodePulseArtifact } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  artifacts: CodePulseArtifact[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  artifacts
}) => {
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredArtifacts = artifacts.filter(a =>
    a.metadata.title.toLowerCase().includes(query.toLowerCase()) ||
    a.artifact_type.toLowerCase().includes(query.toLowerCase()) ||
    a.producer.engine.toLowerCase().includes(query.toLowerCase())
  );

  const navigationItems = [
    { id: 'compiler', title: 'Compiler Studio — AST, IR, Scope, CFG', icon: Cpu },
    { id: 'data', title: 'Data Studio — Profiling & Visualization Builder', icon: Database },
    { id: 'ml', title: 'ML Studio — Training, Evaluation & Explainability', icon: Brain },
    { id: 'visualizations', title: 'Visual Analytics & Interactive Graphs', icon: FileBox },
    { id: 'artifacts', title: 'Shared Artifact Exchange Repository', icon: FileBox },
    { id: 'reports', title: 'Executive Report Studio', icon: FileText }
  ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '80px'
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0F172A',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '650px',
          padding: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
          <Search size={20} color="#6366F1" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search studios, artifacts, symbols, metrics..."
            style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.05rem', width: '100%', outline: 'none' }}
          />
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Studios */}
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Navigation Destinations</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {navigationItems.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => { onNavigate(item.id); onClose(); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '6px', background: '#070A11', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={16} color="#6366F1" />
                      <span style={{ fontSize: '0.88rem', color: '#FFF' }}>{item.title}</span>
                    </div>
                    <ArrowRight size={14} color="#64748B" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matching Artifacts */}
          {filteredArtifacts.length > 0 && (
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matching Artifacts</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {filteredArtifacts.map(art => (
                  <div
                    key={art.artifact_id}
                    onClick={() => { onNavigate('artifacts'); onClose(); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '6px', background: '#070A11', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFF' }}>{art.metadata.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{art.producer.engine} · {art.metadata.summary}</div>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{art.artifact_type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
