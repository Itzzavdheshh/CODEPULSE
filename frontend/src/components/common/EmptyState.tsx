import React from 'react';
import { Sparkles, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  featuresList?: string[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = Sparkles,
  featuresList
}) => {
  return (
    <div className="cp-empty-state">
      <div className="cp-empty-icon">
        <Icon size={24} />
      </div>
      <h3 className="cp-empty-title">{title}</h3>
      <p className="cp-empty-desc">{description}</p>

      {featuresList && featuresList.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px',
          maxWidth: '520px',
          margin: '0 auto 20px auto'
        }}>
          {featuresList.map((f, i) => (
            <span key={i} style={{
              fontSize: '0.75rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              padding: '4px 10px',
              borderRadius: '16px',
              color: 'var(--text-secondary)'
            }}>
              ✓ {f}
            </span>
          ))}
        </div>
      )}

      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
};
