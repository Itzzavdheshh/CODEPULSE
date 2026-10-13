import React from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface ErrorCardProps {
  title?: string;
  message: string;
  recommendation?: string;
  onRetry?: () => void;
  rawDetails?: string;
  engineerMode?: boolean;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title = 'Analysis Request Failed',
  message,
  recommendation,
  onRetry,
  rawDetails,
  engineerMode = false
}) => {
  return (
    <div style={{
      background: 'var(--color-rose-light)',
      border: '1px solid rgba(220, 38, 38, 0.3)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      margin: '20px 0'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'rgba(220, 38, 38, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-rose)',
          flexShrink: 0
        }}>
          <AlertTriangle size={20} />
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#991B1B', marginBottom: '4px' }}>
            {title}
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#7F1D1D', marginBottom: '8px' }}>
            {message}
          </p>

          {recommendation && (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: '0.82rem',
              color: '#374151',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              marginBottom: '12px'
            }}>
              <strong>Recommended Action:</strong> {recommendation}
            </div>
          )}

          {engineerMode && rawDetails && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Terminal size={12} /> RAW DIAGNOSTIC EXCEPTION:
              </span>
              <pre style={{
                background: '#0F172A',
                color: '#F8FAFC',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                overflowX: 'auto',
                marginTop: '4px',
                fontFamily: 'var(--font-mono)'
              }}>
                {rawDetails}
              </pre>
            </div>
          )}

          {onRetry && (
            <button onClick={onRetry} className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
              <RefreshCw size={14} /> Retry Operation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
