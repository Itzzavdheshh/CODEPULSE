import React, { useState } from 'react';
import { Layers, Play, FileCode, CheckCircle, Network } from 'lucide-react';
import { analyzeProject } from '../services/api';

export const MultiFileProjectModal: React.FC = () => {
  const [projectData, setProjectData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const sampleFiles = [
    {
      file_name: "Main.java",
      source_code: `public class Main {
    public static void main(String[] args) {
        int val = PaymentService.processPayment(150);
        System.out.println(val);
    }
}`
    },
    {
      file_name: "PaymentService.java",
      source_code: `public class PaymentService {
        public static int processPayment(int amount) {
            if (amount > 100) {
                return amount - 10;
            }
            return amount;
        }
}`
    }
  ];

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await analyzeProject(sampleFiles);
      setProjectData(res);
    } catch (err) {
      alert('Multi-file project analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#0F172A', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span className="panel-title" style={{ margin: 0, color: '#38BDF8' }}>
          <Layers size={18} />
          Multi-File Project Analysis & Cross-File Dependencies
        </span>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading} style={{ background: 'linear-gradient(135deg, #0284C7, #0369A1)' }}>
          <Play size={14} />
          {loading ? 'Analyzing Project...' : 'Run Project-Level Analysis'}
        </button>
      </div>

      {projectData && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total Files</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFF' }}>{projectData.files_count}</div>
            </div>
            <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total LOC</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38BDF8' }}>{projectData.total_loc}</div>
            </div>
            <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Max V(G)</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F59E0B' }}>{projectData.max_cyclomatic_complexity}</div>
            </div>
            <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Project Risk</span>
              <div style={{ marginTop: '2px' }}><span className={`badge badge-${projectData.project_risk_level.toLowerCase()}`}>{projectData.project_risk_level}</span></div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.85rem', color: '#FFF', marginBottom: '8px' }}>Cross-File Dependency Graph</h4>
          <div style={{ background: '#0B0F19', padding: '12px', borderRadius: '8px', fontSize: '0.82rem' }}>
            {projectData.dependencies.map((dep: any, idx: number) => (
              <div key={idx} style={{ color: '#A5B4FC', marginBottom: '4px' }}>
                <code>{dep.from_file}</code> → references class <strong style={{ color: '#38BDF8' }}>{dep.uses_class}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
