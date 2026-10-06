import React, { useEffect, useState } from 'react';
import { GraduationCap, CheckCircle2, BookOpen, Layers } from 'lucide-react';
import { fetchAcademicMapping } from '../services/api';

export const AcademicStudio: React.FC = () => {
  const [labs, setLabs] = useState<any[]>([]);

  useEffect(() => {
    fetchAcademicMapping().then((res) => {
      if (res && res.academic_laboratories) {
        setLabs(res.academic_laboratories);
      }
    });
  }, []);

  return (
    <div>
      {/* Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(99, 102, 241, 0.2))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: '#6366F1', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={26} color="#FFF" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Academic Laboratory Mapping & Pedagogical Matrix</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '2px' }}>
              Structured breakdown mapping CodePulse engineering capabilities directly to university computer science laboratory curricula.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {labs.map((lab, idx) => (
          <div key={idx} className="glass-panel">
            <span className="panel-title" style={{ color: '#6366F1' }}>
              <BookOpen size={18} />
              {lab.domain}
            </span>

            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Academic Curriculum Concepts
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {lab.laboratory_concepts.map((concept: string, cIdx: number) => (
                  <li key={cIdx} style={{ fontSize: '0.84rem', color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} color="#10B981" />
                    {concept}
                  </li>
                ))}
              </ul>

              <h4 style={{ fontSize: '0.85rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Corresponding Platform Features
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
        ))}
      </div>
    </div>
  );
};
