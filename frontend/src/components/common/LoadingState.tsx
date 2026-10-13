import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface LoadingStep {
  label: string;
  status: 'completed' | 'running' | 'pending';
  detail?: string;
}

interface LoadingStateProps {
  title?: string;
  steps?: LoadingStep[];
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Processing Engine Request...',
  steps
}) => {
  return (
    <div className="cp-card" style={{ textAlign: 'center', padding: '40px 24px', maxWidth: '560px', margin: '30px auto' }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'var(--brand-primary-light)',
        color: 'var(--brand-primary)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <Loader2 size={24} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title}
      </h3>

      {steps && steps.length > 0 && (
        <div style={{
          textAlign: 'left',
          marginTop: '20px',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          border: '1px solid var(--border-light)'
        }}>
          {steps.map((s, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {s.status === 'completed' && <CheckCircle2 size={16} color="var(--color-emerald)" />}
                {s.status === 'running' && <Loader2 size={16} color="var(--brand-primary)" style={{ animation: 'spin 1s linear infinite' }} />}
                {s.status === 'pending' && <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border-subtle)' }} />}

                <span style={{
                  color: s.status === 'pending' ? 'var(--text-dim)' : 'var(--text-primary)',
                  fontWeight: s.status === 'running' ? 600 : 400
                }}>
                  {s.label}
                </span>
              </div>
              {s.detail && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.detail}</span>}
            </div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
