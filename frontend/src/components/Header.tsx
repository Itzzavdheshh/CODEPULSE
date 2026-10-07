import React from 'react';
import { Cpu, Database, Brain, Network, FileBox, FileText, GraduationCap, Layout, Search, Terminal, ToggleLeft, ToggleRight } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  engineerMode: boolean;
  setEngineerMode: (val: boolean) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  engineerMode,
  setEngineerMode,
  onOpenSearch
}) => {
  const tabs = [
    { id: 'home', label: 'Workspace', icon: Layout },
    { id: 'compiler', label: 'Compiler Engine', icon: Cpu },
    { id: 'data', label: 'Data Intelligence', icon: Database },
    { id: 'ml', label: 'Machine Learning', icon: Brain },
    { id: 'visualizations', label: 'Visual Analytics', icon: Network },
    { id: 'artifacts', label: 'Shared Artifacts', icon: FileBox },
    { id: 'reports', label: 'Executive Reports', icon: FileText },
    { id: 'academic', label: 'Academic Mode', icon: GraduationCap },
  ];

  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.95)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '65px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            <Cpu size={20} color="#FFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', letterSpacing: '-0.02em', margin: 0 }}>CODEPULSE</h1>
            <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: 0 }}>Developer Intelligence Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '2px' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#6366F1' : '#94A3B8',
                  background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} color={isActive ? '#6366F1' : '#94A3B8'} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 12px', gap: '6px' }}
            title="Global Search (Ctrl+K)"
          >
            <Search size={14} color="#94A3B8" />
            <span>Search</span>
            <span style={{ fontSize: '0.68rem', background: '#0F172A', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border-color)', color: '#64748B' }}>⌘K</span>
          </button>

          {/* Engineer Mode Switcher */}
          <button
            onClick={() => setEngineerMode(!engineerMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: engineerMode ? '#FBBF24' : '#94A3B8',
              background: engineerMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${engineerMode ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'}`,
              cursor: 'pointer'
            }}
          >
            <Terminal size={14} />
            {engineerMode ? 'Engineer Mode' : 'Standard Mode'}
          </button>

          {/* Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#34D399', background: 'rgba(16, 185, 129, 0.1)', padding: '5px 10px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            <span>Engines Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
