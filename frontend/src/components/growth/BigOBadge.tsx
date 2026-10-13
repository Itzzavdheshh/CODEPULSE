import React, { useEffect, useState } from 'react';
import { Award, CheckCircle, AlertCircle, Info, Sparkles } from 'lucide-react';

interface BigOBadgeProps {
  classification: string;
  prevClassification: string | null;
  confidence: 'high' | 'medium' | 'low';
  r2: number;
  formula: string;
  costModel?: string;
  validPointsCount?: number;
}

export const BigOBadge: React.FC<BigOBadgeProps> = ({
  classification,
  prevClassification,
  confidence,
  r2,
  formula,
  costModel = 'abstract cost (TAC steps), not physical time',
  validPointsCount = 0
}) => {
  const [showTransition, setShowTransition] = useState<boolean>(false);
  const [transitionText, setTransitionText] = useState<string>('');

  useEffect(() => {
    if (prevClassification && prevClassification !== classification) {
      setTransitionText(`${prevClassification} ➔ ${classification}`);
      setShowTransition(true);
      const timer = setTimeout(() => setShowTransition(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [classification, prevClassification]);

  const getConfidenceBadge = (conf: 'high' | 'medium' | 'low') => {
    switch (conf) {
      case 'high':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          color: '#065F46',
          label: 'High Confidence',
          icon: CheckCircle
        };
      case 'medium':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          color: '#92400E',
          label: 'Medium Confidence',
          icon: Info
        };
      case 'low':
      default:
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          color: '#991B1B',
          label: 'Low Confidence (Empirical Fit)',
          icon: AlertCircle
        };
    }
  };

  const confMeta = getConfidenceBadge(confidence);
  const ConfIcon = confMeta.icon;
  const isInsufficient = classification === 'INSUFFICIENT DATA';

  return (
    <div style={{
      background: 'var(--bg-surface, #FFFFFF)',
      border: '1px solid var(--border-light, #E2E8F0)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '22px 26px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
      position: 'relative'
    }}>
      {/* Top row: Badges and Live Transition Chip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 700,
            color: 'var(--text-muted, #64748B)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Award size={17} color="var(--brand-primary, #4F46E5)" />
            Detected Complexity Class
          </div>

          {!isInsufficient && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 600,
              background: confMeta.bg,
              border: `1px solid ${confMeta.border}`,
              color: confMeta.color
            }}>
              <ConfIcon size={13} />
              {confMeta.label}
            </span>
          )}
        </div>

        {/* Live Break-It Transition Chip */}
        {showTransition && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #FEF2F2, #FFFBEB)',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)',
            animation: 'pulse 1.5s infinite',
            transition: 'all 0.3s ease'
          }}>
            <Sparkles size={14} />
            <span>Complexity Shifted: {transitionText}</span>
          </div>
        )}
      </div>

      {/* Main Display: Giant Big O Class and Formula */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{
            fontSize: '2.75rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '-0.02em',
            color: isInsufficient ? 'var(--text-muted, #64748B)' : '#1E1B4B',
            background: isInsufficient ? 'none' : 'linear-gradient(135deg, #4338CA 0%, #0284C7 100%)',
            WebkitBackgroundClip: isInsufficient ? 'unset' : 'text',
            WebkitTextFillColor: isInsufficient ? 'unset' : 'transparent',
            lineHeight: 1
          }}>
            {classification}
          </div>

          {!isInsufficient && formula && (
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-primary, #0F172A)',
              background: 'var(--bg-inset, #F1F5F9)',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-light, #CBD5E1)'
            }}>
              {formula}
            </div>
          )}
        </div>

        {/* Goodness of Fit (R2) */}
        {!isInsufficient && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '2px'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Goodness of Fit
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              color: r2 >= 0.99 ? '#059669' : (r2 >= 0.95 ? '#D97706' : '#DC2626')
            }}>
              R² = {r2.toFixed(4)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)' }}>
              ({validPointsCount} sample points measured)
            </div>
          </div>
        )}
      </div>

      {/* Cost Model disclaimer footer */}
      <div style={{
        borderTop: '1px solid var(--border-light, #E2E8F0)',
        paddingTop: '12px',
        fontSize: '0.78rem',
        color: 'var(--text-secondary, #475569)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        background: 'var(--bg-subtle, #F8FAFC)',
        margin: '0 -26px -22px -26px',
        padding: '10px 26px',
        borderBottomLeftRadius: 'var(--radius-lg, 12px)',
        borderBottomRightRadius: 'var(--radius-lg, 12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Info size={14} color="var(--brand-primary, #4F46E5)" />
          <span>Cost Metric: <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{costModel}</strong></span>
        </div>
        <div style={{ fontStyle: 'italic', fontSize: '0.74rem', color: 'var(--text-muted, #64748B)' }}>
          Least-squares polynomial &amp; logarithmic basis decomposition
        </div>
      </div>
    </div>
  );
};
