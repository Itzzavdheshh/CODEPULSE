import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeWorkspace } from './components/HomeWorkspace';
import { CompilerStudio } from './components/CompilerStudio';
import { DataStudio } from './components/DataStudio';
import { MLStudio } from './components/MLStudio';
import { VisualizationsStudio } from './components/VisualizationsStudio';
import { ArtifactsStudio } from './components/ArtifactsStudio';
import { ReportsStudio } from './components/ReportsStudio';
import { AcademicStudio } from './components/AcademicStudio';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { CodePulseArtifact } from './types';
import { fetchArtifacts } from './services/api';
import { Terminal, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [engineerMode, setEngineerMode] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [artifacts, setArtifacts] = useState<CodePulseArtifact[]>([]);

  // Cross-engine bridge state: DataStudio → MLStudio
  const [mlPrefillCsv, setMlPrefillCsv] = useState<string | undefined>(undefined);
  const [mlPrefillName, setMlPrefillName] = useState<string | undefined>(undefined);

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

  const handleSendToML = (csvText: string, datasetName: string) => {
    setMlPrefillCsv(csvText);
    setMlPrefillName(datasetName);
    setActiveTab('ml');
  };

  const handleLoadDemoWorkspace = () => {
    setIsDemoActive(true);
    setActiveTab('compiler');
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        engineerMode={engineerMode}
        setEngineerMode={setEngineerMode}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Engineer Mode Drawer Banner */}
      {engineerMode && (
        <div style={{
          background: '#0B0F19',
          borderBottom: '1px solid #F59E0B',
          padding: '8px 24px',
          fontSize: '0.78rem',
          color: '#FCD34D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} color="#F59E0B" />
            <span>ENGINEER MODE ACTIVE: Raw JSON payloads, low-level bytecode offsets, AST memory addresses, and execution timing enabled.</span>
          </div>
          <span>API BASE: /api/v1</span>
        </div>
      )}

      <main className="main-content">
        {activeTab === 'home' && (
          <HomeWorkspace
            onNavigate={(tab) => setActiveTab(tab)}
            onLoadDemoWorkspace={handleLoadDemoWorkspace}
            artifacts={artifacts}
            isDemoActive={isDemoActive}
          />
        )}
        {activeTab === 'compiler' && <CompilerStudio />}
        {activeTab === 'data' && (
          <DataStudio onSendToML={handleSendToML} />
        )}
        {activeTab === 'ml' && (
          <MLStudio prefillCsv={mlPrefillCsv} prefillName={mlPrefillName} />
        )}
        {activeTab === 'visualizations' && <VisualizationsStudio />}
        {activeTab === 'artifacts' && <ArtifactsStudio />}
        {activeTab === 'reports' && <ReportsStudio />}
        {activeTab === 'academic' && <AcademicStudio onNavigate={(tab) => setActiveTab(tab)} />}
      </main>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        artifacts={artifacts}
      />

      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px 32px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#64748B',
        background: '#070A11',
        marginTop: '40px'
      }}>
        CodePulse — Intelligent Software Analysis &amp; Engineering Intelligence Platform &copy; 2026. Built with React 18, TypeScript &amp; FastAPI.
      </footer>
    </div>
  );
};

export default App;
