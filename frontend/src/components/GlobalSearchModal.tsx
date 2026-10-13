import React, { useState, useEffect } from 'react';
import { Search, X, Cpu, Database, Brain, FileBox, FileText, ArrowRight, Eye } from 'lucide-react';
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
    { id: 'compiler', title: 'Compiler Module — Code Editor, AST, TAC IR, CFG, Metrics & Compiler Report', icon: Cpu },
    { id: 'data', title: 'AI Module — Data Profiling, Quality Audit, Cleaning & Chart Builder', icon: Database },
    { id: 'ml', title: 'AI Module — ML Model Training, Evaluation, Explainability & AI Report', icon: Brain },
    { id: 'visualizations', title: 'Visual Module — Control Flow Topology & Risk Analytics', icon: Eye },
    { id: 'artifacts', title: 'Visual Module — Artifact Lineage & Provenance Explorer', icon: FileBox },
  ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          width: '90%',
          maxWidth: '620px',
          padding: '20px',
          boxShadow: 'var(--shadow-dropdown)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
          <Search size={20} color="var(--brand-primary)" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Compiler, AI, Visual modules, artifacts, metrics..."
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1rem', width: '100%', outline: 'none' }}
          />
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Modules */}
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Primary Product Modules &amp; Submodules
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              {navigationItems.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={16} color="var(--brand-primary)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</span>
                    </div>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Artifacts */}
          {filteredArtifacts.length > 0 && (
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Repository Artifacts ({filteredArtifacts.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                {filteredArtifacts.map(art => (
                  <div
                    key={art.artifact_id}
                    onClick={() => {
                      onNavigate('artifacts');
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{art.metadata.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{art.metadata.summary}</div>
                    </div>
                    <span className="badge badge-info">{art.producer.engine}</span>
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
