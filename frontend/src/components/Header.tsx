import React from 'react';
import { Cpu, Database, Brain, Network, FileBox, FileText, GraduationCap, Layout } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'compiler', label: 'Compiler Engine', icon: Cpu },
    { id: 'data', label: 'Data Intelligence', icon: Database },
    { id: 'ml', label: 'Machine Learning', icon: Brain },
    { id: 'visualizations', label: 'Visual Analytics', icon: Network },
    { id: 'artifacts', label: 'Shared Artifacts', icon: FileBox },
    { id: 'reports', label: 'Executive Reports', icon: FileText },
    { id: 'academic', label: 'Academic Lab Mapping', icon: GraduationCap },
  ];

  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.95)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('compiler')}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            <Cpu size={22} color="#FFF" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF', letterSpacing: '-0.02em', margin: 0 }}>CODEPULSE</h1>
            <p style={{ fontSize: '0.72rem', color: '#94A3B8', margin: 0 }}>Software & Data Intelligence Platform</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '4px' }}>
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
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#6366F1' : '#94A3B8',
                  background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} color={isActive ? '#6366F1' : '#94A3B8'} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#34D399', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
          <span>Engines Active</span>
        </div>
      </div>
    </header>
  );
};
