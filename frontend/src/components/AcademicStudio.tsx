import React, { useEffect, useState } from 'react';
import { GraduationCap, CheckCircle2, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { fetchAcademicMapping } from '../services/api';

interface AcademicStudioProps {
  onNavigate?: (tab: string) => void;
}

export const AcademicStudio: React.FC<AcademicStudioProps> = ({ onNavigate }) => {
  const [labs, setLabs] = useState<any[]>([]);

  useEffect(() => {
    fetchAcademicMapping().then((res) => {
      if (res && res.academic_laboratories) {
        setLabs(res.academic_laboratories);
      }
    });
  }, []);

  const getTargetTab = (domain: string): string => {
    if (domain.includes('Compiler')) return 'compiler';
    if (domain.includes('Data')) return 'data';
    if (domain.includes('Machine')) return 'ml';
    return 'visualizations';
  };

  return (
    <div>
      {/* Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(99, 102, 241, 0.2))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#6366F1', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={26} color="#FFF" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Academic Laboratory Mapping & Pedagogical Matrix</h2>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginTop: '2px' }}>
                Maps CodePulse engineering architecture directly to University Computer Science lab curricula.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {labs.map((lab, idx) => {
          const targetTab = getTargetTab(lab.domain);
          return (
            <div key={idx} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span className="panel-title" style={{ color: '#6366F1', margin: 0 }}>
                    <BookOpen size={18} />
                    {lab.domain}
                  </span>
                  {onNavigate && (
                    <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => onNavigate(targetTab)}>
                      Open Studio <ArrowRight size={12} />
                    </button>
                  )}
                </div>

                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ fontSize: '0.82rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Syllabus Laboratory Concepts
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                    {lab.laboratory_concepts.map((concept: string, cIdx: number) => (
                      <li key={cIdx} style={{ fontSize: '0.84rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={14} color="#10B981" />
                        {concept}
                      </li>
                    ))}
                  </ul>

                  <h4 style={{ fontSize: '0.82rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Corresponding CodePulse Implementation
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {lab.codepulse_features.map((feat: string, fIdx: number) => (
                      <li key={fIdx} style={{ fontSize: '0.84rem', color: '#A5B4FC', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={14} color="#6366F1" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
