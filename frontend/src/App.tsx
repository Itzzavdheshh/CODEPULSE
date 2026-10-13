import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CompilerStudio } from './components/CompilerStudio';
import { AIModule } from './components/AIModule';
import { VisualModule } from './components/VisualModule';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { CodePulseArtifact } from './types';
import { fetchArtifacts } from './services/api';
import { Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'compiler' | 'ai' | 'visual'>('compiler');
  const [engineerMode, setEngineerMode] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('PaymentSystem');
  const [artifacts, setArtifacts] = useState<CodePulseArtifact[]>([]);

  const loadRepositoryArtifacts = async () => {
    try {
      const arts = await fetchArtifacts();
      setArtifacts(arts);
    } catch (err) {
      console.error('Failed to load repository artifacts', err);
    }
  };

  useEffect(() => {
    loadRepositoryArtifacts();
  }, []);

  const handleGlobalSearchNavigate = (dest: string) => {
    if (dest === 'compiler' || dest === 'home') {
      setActiveModule('compiler');
    } else if (dest === 'data' || dest === 'ml') {
      setActiveModule('ai');
    } else {
      setActiveModule('visual');
    }
  };

  return (
    <div className="app-container" data-theme={engineerMode ? 'dark' : 'light'} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      <Header
        engineerMode={engineerMode}
        setEngineerMode={setEngineerMode}
        onOpenSearch={() => setIsSearchOpen(true)}
        selectedWorkspace={selectedWorkspace}
        onSelectWorkspace={(ws) => setSelectedWorkspace(ws)}
      />

      {/* Engineer Mode Banner */}
      {engineerMode && (
        <div style={{
          background: '#0F172A',
          borderBottom: '1px solid var(--color-amber)',
          padding: '8px 24px',
          fontSize: '0.78rem',
          color: '#FCD34D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          zIndex: 80
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} color="var(--color-amber)" />
            <span>ENGINEER MODE ACTIVE: Raw JSON payloads, low-level bytecode offsets, AST memory addresses, and execution timing enabled.</span>
          </div>
          <span>API BASE: /api/v1</span>
        </div>
      )}

      {/* App Body: Sidebar + Main Content */}
      <div style={{ display: 'flex', flex: 1, minWidth: 0, width: '100%' }}>
        <Sidebar
          activeModule={activeModule}
          onSelectModule={(mod) => setActiveModule(mod)}
          engineerMode={engineerMode}
          onToggleEngineerMode={() => setEngineerMode(!engineerMode)}
        />

        <main className="main-content" style={{ flex: 1, minWidth: 0, padding: '24px 32px', maxWidth: '100%' }}>
          {activeModule === 'compiler' && <CompilerStudio />}
          {activeModule === 'ai' && <AIModule />}
          {activeModule === 'visual' && <VisualModule />}
        </main>
      </div>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleGlobalSearchNavigate}
        artifacts={artifacts}
      />

      <footer style={{
        borderTop: '1px solid var(--border-light)',
        padding: '16px 32px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'var(--bg-surface)'
      }}>
        CodePulse — Intelligent Software Analysis Platform &copy; 2026. Built with React 18, TypeScript &amp; FastAPI.
      </footer>
    </div>
  );
};

export default App;
