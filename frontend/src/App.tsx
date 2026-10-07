import React, { useState } from 'react';
import { Header } from './components/Header';
import { CompilerStudio } from './components/CompilerStudio';
import { DataStudio } from './components/DataStudio';
import { MLStudio } from './components/MLStudio';
import { VisualizationsStudio } from './components/VisualizationsStudio';
import { ArtifactsStudio } from './components/ArtifactsStudio';
import { ReportsStudio } from './components/ReportsStudio';
import { AcademicStudio } from './components/AcademicStudio';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('compiler');
  // Cross-engine bridge: DataStudio → MLStudio
  const [mlPrefillCsv, setMlPrefillCsv] = useState<string | undefined>(undefined);
  const [mlPrefillName, setMlPrefillName] = useState<string | undefined>(undefined);

  const handleSendToML = (csvText: string, datasetName: string) => {
    setMlPrefillCsv(csvText);
    setMlPrefillName(datasetName);
    setActiveTab('ml');
  };

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
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
        {activeTab === 'academic' && <AcademicStudio />}
      </main>

      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px 32px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#64748B',
        background: '#070A11',
        marginTop: '40px'
      }}>
        CodePulse — Intelligent Software Analysis &amp; Engineering Intelligence Platform &copy; 2026. Built with React, TypeScript &amp; FastAPI.
      </footer>
    </div>
  );
};

export default App;
