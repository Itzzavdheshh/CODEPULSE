import React from 'react';
import { Cpu, Brain, Eye, Settings, Terminal, Shield, ArrowLeftRight } from 'lucide-react';

interface SidebarProps {
  activeModule: 'compiler' | 'ai' | 'visual';
  onSelectModule: (module: 'compiler' | 'ai' | 'visual') => void;
  engineerMode: boolean;
  onToggleEngineerMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  engineerMode,
  onToggleEngineerMode
}) => {
  const navItems = [
    {
      id: 'compiler' as const,
      label: 'Compiler',
      tooltip: 'Compiler Intelligence (AST, IR, CFG, Metrics)',
      icon: Cpu,
    },
    {
      id: 'ai' as const,
      label: 'AI',
      tooltip: 'AI Intelligence (Data Profiling & ML Models)',
      icon: Brain,
    },
    {
      id: 'visual' as const,
      label: 'Visual',
      tooltip: 'Visual Analytics, Risk & Provenance',
      icon: Eye,
    },
  ];

  return (
    <aside style={{
      width: '64px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 0',
      justifyContent: 'space-between',
      height: 'calc(100vh - 56px)',
      position: 'sticky',
      top: '56px',
      zIndex: 90,
      flexShrink: 0
    }}>
      {/* Primary 3 Product Modules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              title={item.tooltip}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'var(--brand-primary-light)' : 'transparent',
                border: isActive ? '1px solid var(--brand-primary)' : '1px solid transparent',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <Icon size={20} />
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  width: '3px',
                  height: '20px',
                  borderRadius: '0 2px 2px 0',
                  background: 'var(--brand-primary)'
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Settings & Engineer Mode Control */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
        <button
          onClick={onToggleEngineerMode}
          title={engineerMode ? 'Standard Mode' : 'Engineer Mode (Raw JSON & Debug Metadata)'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: engineerMode ? 'var(--color-amber-light)' : 'var(--bg-subtle)',
            border: `1px solid ${engineerMode ? 'var(--color-amber)' : 'var(--border-light)'}`,
            color: engineerMode ? 'var(--color-amber)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Terminal size={18} />
        </button>
      </div>
    </aside>
  );
};
