import React, { useState } from 'react';
import { Cpu, Search, Terminal, ChevronDown, Check, FolderGit2 } from 'lucide-react';

interface HeaderProps {
  engineerMode: boolean;
  setEngineerMode: (val: boolean) => void;
  onOpenSearch: () => void;
  selectedWorkspace?: string;
  onSelectWorkspace?: (ws: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  engineerMode,
  setEngineerMode,
  onOpenSearch,
  selectedWorkspace = 'PaymentSystem',
  onSelectWorkspace
}) => {
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  const workspaces = [
    { id: 'PaymentSystem', name: 'PaymentSystem', desc: 'Java payment gateway & transaction engine', files: 8, status: 'HIGH RISK' },
    { id: 'MetricsSuite', name: 'MetricsSuite', desc: 'Compiler benchmark & quality metrics suite', files: 14, status: 'MODERATE' },
    { id: 'MLClassifierCore', name: 'MLClassifierCore', desc: 'Defect prediction & risk classification dataset', files: 4, status: 'LOW RISK' }
  ];

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-light)',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '56px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Brand & Workspace Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Cpu size={18} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
              CODEPULSE
            </h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
              Software Intelligence Platform
            </p>
          </div>
        </div>

        <div style={{ height: '20px', width: '1px', background: 'var(--border-light)' }} />

        {/* Workspace Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}
          >
            <FolderGit2 size={14} color="var(--brand-primary)" />
            <span>Workspace: <strong>{selectedWorkspace}</strong></span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {isWorkspaceMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '36px',
              left: 0,
              width: '300px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-dropdown)',
              padding: '8px',
              zIndex: 200
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', padding: '6px 10px', textTransform: 'uppercase' }}>
                Select Active Workspace
              </div>
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => {
                    if (onSelectWorkspace) onSelectWorkspace(ws.id);
                    setIsWorkspaceMenuOpen(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: selectedWorkspace === ws.id ? 'var(--brand-primary-light)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '2px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ws.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {ws.desc}
                    </div>
                  </div>
                  {selectedWorkspace === ws.id && <Check size={14} color="var(--brand-primary)" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onOpenSearch}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78rem', gap: '6px', color: 'var(--text-secondary)' }}
          title="Global Search (Ctrl+K)"
        >
          <Search size={14} color="var(--text-muted)" />
          <span>Search</span>
          <span style={{
            fontSize: '0.65rem',
            background: 'var(--bg-subtle)',
            padding: '1px 4px',
            borderRadius: '4px',
            border: '1px solid var(--border-light)',
            color: 'var(--text-muted)'
          }}>
            ⌘K
          </span>
        </button>

        <button
          onClick={() => setEngineerMode(!engineerMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: engineerMode ? 'var(--color-amber)' : 'var(--text-muted)',
            background: engineerMode ? 'var(--color-amber-light)' : 'var(--bg-subtle)',
            border: `1px solid ${engineerMode ? 'var(--color-amber)' : 'var(--border-light)'}`,
            cursor: 'pointer'
          }}
        >
          <Terminal size={13} />
          {engineerMode ? 'Engineer Mode' : 'Standard'}
        </button>
      </div>
    </header>
  );
};
