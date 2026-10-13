import React from 'react';
import { GrowthVariants } from '../../types';
import { Zap, Check, AlertTriangle } from 'lucide-react';

interface CompareBarsProps {
  variants?: GrowthVariants;
}

export const CompareBars: React.FC<CompareBarsProps> = ({ variants }) => {
  if (!variants) return null;

  const { raw, optimized, comparison } = variants;
  const largestN = comparison.largest_n;
  const rawSample = raw.samples.find((s) => s.n === largestN && s.status === 'ok');
  const optSample = optimized.samples.find((s) => s.n === largestN && s.status === 'ok');

  const rawSteps = rawSample ? rawSample.steps : 0;
  const optSteps = optSample ? optSample.steps : 0;
  const maxVal = Math.max(rawSteps, optSteps, 1);

  const rawPct = (rawSteps / maxVal) * 100;
  const optPct = (optSteps / maxVal) * 100;

  const rawClass = raw.fit.classification;
  const optClass = optimized.fit.classification;
  const classesMatch = comparison.classes_match;
  const stepsSaved = comparison.steps_saved_at_largest_n;
  const savedPct = comparison.steps_saved_pct;

  return (
    <div style={{
      background: 'var(--bg-surface, #FFFFFF)',
      border: '1px solid var(--border-light, #E2E8F0)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '22px 26px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))'
    }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} color="#D97706" />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
            Raw TAC vs Optimized TAC (at n = {largestN.toLocaleString()})
          </h4>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '0.74rem',
          fontWeight: 600,
          background: classesMatch ? '#ECFDF5' : '#FFFBEB',
          border: `1px solid ${classesMatch ? '#A7F3D0' : '#FDE68A'}`,
          color: classesMatch ? '#065F46' : '#92400E'
        }}>
          {classesMatch ? (
            <>
              <Check size={13} />
              <span>Complexity Classes Match: {optClass}</span>
            </>
          ) : (
            <>
              <AlertTriangle size={13} />
              <span>Complexity Classes Differ: {rawClass} ➔ {optClass}</span>
            </>
          )}
        </div>
      </div>

      {/* Comparison Progress Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Raw Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
            <span style={{ color: '#E11D48', fontWeight: 600 }}>Raw TAC (Unoptimized Execution)</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #0F172A)', fontWeight: 600 }}>
              {rawSteps.toLocaleString()} steps ({rawClass})
            </span>
          </div>
          <div style={{
            height: '14px',
            borderRadius: '6px',
            background: 'var(--bg-inset, #F1F5F9)',
            overflow: 'hidden',
            border: '1px solid var(--border-light, #CBD5E1)'
          }}>
            <div style={{
              width: `${rawPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #E11D48, #F43F5E)',
              borderRadius: '6px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Optimized Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
            <span style={{ color: '#059669', fontWeight: 600 }}>Optimized TAC (Constant-Folded &amp; DCE)</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary, #0F172A)', fontWeight: 600 }}>
              {optSteps.toLocaleString()} steps ({optClass})
            </span>
          </div>
          <div style={{
            height: '14px',
            borderRadius: '6px',
            background: 'var(--bg-inset, #F1F5F9)',
            overflow: 'hidden',
            border: '1px solid var(--border-light, #CBD5E1)'
          }}>
            <div style={{
              width: `${optPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #059669, #10B981)',
              borderRadius: '6px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Summary Stat */}
      <div style={{
        background: 'var(--bg-inset, #F8FAFC)',
        border: '1px solid var(--border-light, #E2E8F0)',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '0.8rem',
        color: 'var(--text-secondary, #334155)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          {stepsSaved === 0 ? (
            <span style={{ fontStyle: 'italic', color: 'var(--text-muted, #64748B)' }}>
              optimizer made no change here (0 steps saved)
            </span>
          ) : (
            <span>
              Instructions eliminated: <strong>{stepsSaved.toLocaleString()} abstract TAC steps</strong> ({savedPct.toFixed(1)}% reduction).
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748B)' }}>
          TAC variant comparison
        </div>
      </div>
    </div>
  );
};
