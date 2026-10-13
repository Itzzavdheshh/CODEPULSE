import React, { useState } from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  badgeText?: string;
  badgeType?: 'low' | 'moderate' | 'high' | 'critical' | 'info' | 'success';
  description?: string;
  subtext?: string;
  explanation?: string;
  icon?: LucideIcon;
  accentColor?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  badgeText,
  badgeType = 'info',
  description,
  subtext,
  explanation,
  icon: Icon,
  accentColor = '#6366f1',
  onClick,
  interactive = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'low':
      case 'success':
        return { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' };
      case 'moderate':
        return { bg: '#fffbeeb', border: '#fde68a', text: '#b45309' };
      case 'high':
      case 'critical':
        return { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' };
      case 'info':
      default:
        return { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' };
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowExplanation(false); }}
      className="cp-card"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '18px 20px',
        borderRadius: '16px',
        background: '#ffffff',
        border: `1px solid ${isHovered ? accentColor : 'var(--border-light)'}`,
        borderTop: `4px solid ${accentColor}`,
        boxShadow: isHovered
          ? `0 12px 28px -6px ${accentColor}25, 0 4px 12px rgba(0,0,0,0.03)`
          : '0 2px 8px rgba(0,0,0,0.02)',
        transform: isHovered && interactive ? 'translateY(-3px)' : 'none',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden'
      }}
    >
      <div>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {title}
            </span>
            {explanation && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowExplanation(!showExplanation); }}
                title="Click for compiler explanation"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: showExplanation ? accentColor : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Info size={13} />
              </button>
            )}
          </div>

          {Icon && (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: `${accentColor}14`,
              border: `1px solid ${accentColor}28`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon size={18} color={accentColor} />
            </div>
          )}
        </div>

        {/* Value & Badge Row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {value}
          </span>
          {badgeText && (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: '9999px',
              background: badgeStyle.bg,
              border: `1px solid ${badgeStyle.border}`,
              color: badgeStyle.text,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Compiler Explanation Callout or Description */}
      {showExplanation && explanation ? (
        <div style={{
          marginTop: '10px',
          padding: '9px 12px',
          borderRadius: '10px',
          background: `${accentColor}0a`,
          border: `1px solid ${accentColor}30`,
          fontSize: '0.75rem',
          color: 'var(--text-primary)',
          lineHeight: 1.45,
          animation: 'fadeIn 0.2s ease'
        }}>
          <strong style={{ color: accentColor, display: 'block', marginBottom: '2px', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            💡 Compiler Definition
          </strong>
          {explanation}
        </div>
      ) : (
        (description || subtext) && (
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '10px' }}>
            {description && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: 0, fontWeight: 500 }}>
                {description}
              </p>
            )}
            {subtext && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                {subtext}
              </span>
            )}
          </div>
        )
      )}
    </div>
  );
};
