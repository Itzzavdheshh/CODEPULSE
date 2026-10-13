import React, { useState, useMemo } from 'react';
import { GrowthSample, GrowthFit } from '../../types';

interface GrowthChartProps {
  samples: GrowthSample[];
  fit?: GrowthFit;
  rawSamples?: GrowthSample[];
  variant?: 'raw' | 'optimized' | 'both';
}

export const GrowthChart: React.FC<GrowthChartProps> = ({
  samples,
  fit,
  rawSamples,
  variant = 'optimized'
}) => {
  const [scaleMode, setScaleMode] = useState<'linear' | 'loglog'>('linear');
  const [hoveredPoint, setHoveredPoint] = useState<{
    n: number;
    steps: number;
    x: number;
    y: number;
    isRaw?: boolean;
  } | null>(null);

  const validSamples = useMemo(() => samples.filter((s) => s.status === 'ok'), [samples]);
  const validRaw = useMemo(() => (rawSamples || []).filter((s) => s.status === 'ok'), [rawSamples]);

  // Dimensions
  const svgWidth = 760;
  const svgHeight = 360;
  const padding = { top: 24, right: 40, bottom: 54, left: 80 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Extents
  const { minN, maxN, minSteps, maxSteps } = useMemo(() => {
    const all = [...validSamples, ...(variant === 'both' ? validRaw : [])];
    if (all.length === 0) return { minN: 1, maxN: 100, minSteps: 0, maxSteps: 100 };
    const ns = all.map((s) => s.n);
    const steps = all.map((s) => s.steps);
    return {
      minN: Math.min(...ns),
      maxN: Math.max(...ns),
      minSteps: Math.min(...steps),
      maxSteps: Math.max(...steps)
    };
  }, [validSamples, validRaw, variant]);

  // Coordinate transforms
  const getX = (n: number) => {
    if (scaleMode === 'loglog') {
      const logMin = Math.log2(Math.max(1, minN));
      const logMax = Math.log2(Math.max(2, maxN));
      const val = Math.log2(Math.max(1, n));
      const ratio = logMax > logMin ? (val - logMin) / (logMax - logMin) : 0.5;
      return padding.left + ratio * plotWidth;
    } else {
      const ratio = maxN > minN ? (n - minN) / (maxN - minN) : 0.5;
      return padding.left + ratio * plotWidth;
    }
  };

  const getY = (steps: number) => {
    if (scaleMode === 'loglog') {
      const logMin = Math.log2(Math.max(1, minSteps));
      const logMax = Math.log2(Math.max(2, maxSteps));
      const val = Math.log2(Math.max(1, steps));
      const ratio = logMax > logMin ? (val - logMin) / (logMax - logMin) : 0.5;
      return padding.top + plotHeight - ratio * plotHeight;
    } else {
      const yMax = maxSteps * 1.08;
      const ratio = yMax > 0 ? steps / yMax : 0;
      return padding.top + plotHeight - ratio * plotHeight;
    }
  };

  // Generate Reference Curves scaled to data range
  const referenceCurves = useMemo(() => {
    if (validSamples.length < 2) return null;
    const numPoints = 35;
    const nPts: number[] = [];
    for (let i = 0; i <= numPoints; i++) {
      nPts.push(minN + (i / numPoints) * (maxN - minN));
    }

    const nRefMax = maxN;
    const yRefMax = maxSteps;

    // Linear ref O(n)
    const linearPts = nPts.map((n) => {
      const val = (n / nRefMax) * yRefMax;
      return `${getX(n)},${getY(val)}`;
    }).join(' ');

    // n log n ref
    const nlognMaxVal = nRefMax * Math.log2(Math.max(2, nRefMax));
    const nlognPts = nPts.map((n) => {
      const val = ((n * Math.log2(Math.max(2, n))) / nlognMaxVal) * yRefMax;
      return `${getX(n)},${getY(val)}`;
    }).join(' ');

    // n^2 ref
    const n2Pts = nPts.map((n) => {
      const val = (Math.pow(n, 2) / Math.pow(nRefMax, 2)) * yRefMax;
      return `${getX(n)},${getY(val)}`;
    }).join(' ');

    return { linearPts, nlognPts, n2Pts };
  }, [validSamples, minN, maxN, maxSteps, scaleMode]);

  // Generate Fitted Curve Path
  const fittedPath = useMemo(() => {
    if (!fit || validSamples.length < 2 || fit.classification === 'INSUFFICIENT DATA') return '';
    const winner = fit.candidates.find((c) => c.basis === fit.classification);
    if (!winner) return '';

    const numPoints = 45;
    const pts: string[] = [];
    const basis = winner.basis;
    const a = winner.a;
    const b = winner.b;

    for (let i = 0; i <= numPoints; i++) {
      const n = minN + (i / numPoints) * (maxN - minN);
      let g = 0;
      if (basis === 'O(1)') g = 0;
      else if (basis === 'O(log n)') g = Math.log2(Math.max(1, n));
      else if (basis === 'O(sqrt n)') g = Math.sqrt(Math.max(0, n));
      else if (basis === 'O(n)') g = n;
      else if (basis === 'O(n log n)') g = n * Math.log2(Math.max(1, n));
      else if (basis === 'O(n^2)') g = Math.pow(n, 2);
      else if (basis === 'O(n^3)') g = Math.pow(n, 3);
      else if (basis === 'O(2^n)') g = Math.pow(2, Math.min(n, 30));

      const pred = Math.max(0, a * g + b);
      pts.push(`${getX(n)},${getY(pred)}`);
    }

    return pts.join(' ');
  }, [fit, validSamples, minN, maxN, scaleMode]);

  // Axis Ticks
  const xTicks = useMemo(() => {
    if (scaleMode === 'loglog') {
      const powers: number[] = [];
      let p = Math.ceil(Math.log2(Math.max(1, minN)));
      const maxP = Math.floor(Math.log2(Math.max(1, maxN)));
      while (p <= maxP) {
        powers.push(Math.pow(2, p));
        p += Math.max(1, Math.floor((maxP - p) / 5) || 1);
      }
      return Array.from(new Set([minN, ...powers, maxN]));
    } else {
      const count = 5;
      const ticks = [];
      for (let i = 0; i <= count; i++) {
        ticks.push(Math.round(minN + (i / count) * (maxN - minN)));
      }
      return ticks;
    }
  }, [minN, maxN, scaleMode]);

  const yTicks = useMemo(() => {
    const count = 5;
    const ticks = [];
    if (scaleMode === 'loglog') {
      const logMin = Math.ceil(Math.log2(Math.max(1, minSteps)));
      const logMax = Math.floor(Math.log2(Math.max(2, maxSteps)));
      for (let p = logMin; p <= logMax; p += Math.max(1, Math.floor((logMax - logMin) / count) || 1)) {
        ticks.push(Math.pow(2, p));
      }
    } else {
      const yMax = maxSteps * 1.08;
      for (let i = 0; i <= count; i++) {
        ticks.push(Math.round((i / count) * yMax));
      }
    }
    return Array.from(new Set(ticks));
  }, [minSteps, maxSteps, scaleMode]);

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
      {/* Header with Title and Mode Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
            Growth Curve &amp; Reference Scaling
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748B)' }}>
            Hand-crafted SVG • Cost metric: <strong style={{ color: 'var(--text-primary, #0F172A)' }}>abstract cost (TAC steps)</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #475569)', fontWeight: 500 }}>Axis Scale:</span>
          <div style={{
            display: 'inline-flex',
            borderRadius: '8px',
            border: '1px solid var(--border-light, #CBD5E1)',
            background: 'var(--bg-inset, #F1F5F9)',
            padding: '3px'
          }}>
            <button
              onClick={() => setScaleMode('linear')}
              style={{
                background: scaleMode === 'linear' ? 'var(--brand-primary, #4F46E5)' : 'transparent',
                color: scaleMode === 'linear' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Linear
            </button>
            <button
              onClick={() => setScaleMode('loglog')}
              style={{
                background: scaleMode === 'loglog' ? 'var(--brand-primary, #4F46E5)' : 'transparent',
                color: scaleMode === 'loglog' ? '#FFFFFF' : 'var(--text-secondary, #475569)',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Log-Log
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Plot Canvas */}
      <div style={{
        position: 'relative',
        width: '100%',
        background: '#FAFAFA',
        borderRadius: '8px',
        border: '1px solid var(--border-light, #E2E8F0)',
        overflow: 'hidden',
        padding: '8px'
      }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '420px' }}
        >
          {/* Subtle Grid lines */}
          {yTicks.map((tickVal, idx) => {
            const y = getY(tickVal);
            return (
              <g key={`y-grid-${idx}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748B"
                  fontFamily="monospace"
                  fontWeight="500"
                >
                  {tickVal >= 10000 ? `${(tickVal / 1000).toFixed(0)}k` : tickVal}
                </text>
              </g>
            );
          })}

          {xTicks.map((tickVal, idx) => {
            const x = getX(tickVal);
            return (
              <g key={`x-grid-${idx}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + plotHeight}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={padding.top + plotHeight + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748B"
                  fontFamily="monospace"
                  fontWeight="500"
                >
                  {tickVal >= 1000 ? `${(tickVal / 1000).toFixed(0)}k` : tickVal}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke="#94A3B8"
            strokeWidth="1.5"
          />

          {/* Faint Reference Curves */}
          {referenceCurves && (
            <>
              {/* O(n) Ref */}
              <polyline
                points={referenceCurves.linearPts}
                fill="none"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              {/* O(n log n) Ref */}
              <polyline
                points={referenceCurves.nlognPts}
                fill="none"
                stroke="#0284C7"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              {/* O(n^2) Ref */}
              <polyline
                points={referenceCurves.n2Pts}
                fill="none"
                stroke="#9333EA"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
            </>
          )}

          {/* Fitted Curve */}
          {fittedPath && (
            <polyline
              points={fittedPath}
              fill="none"
              stroke="#0284C7"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Raw Samples (if variant === 'both') */}
          {variant === 'both' &&
            validRaw.map((s, idx) => {
              const cx = getX(s.n);
              const cy = getY(s.steps);
              return (
                <circle
                  key={`raw-pt-${idx}`}
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="#E11D48"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                  onMouseEnter={() => setHoveredPoint({ n: s.n, steps: s.steps, x: cx, y: cy, isRaw: true })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

          {/* Measured Points (Optimized or Standard) */}
          {validSamples.map((s, idx) => {
            const cx = getX(s.n);
            const cy = getY(s.steps);
            const isHovered = hoveredPoint && hoveredPoint.n === s.n && !hoveredPoint.isRaw;
            return (
              <g key={`opt-pt-${idx}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? '8' : '6'}
                  fill="#4F46E5"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={() => setHoveredPoint({ n: s.n, steps: s.steps, x: cx, y: cy, isRaw: false })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={padding.top + plotHeight + 42}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill="#334155"
          >
            input size n
          </text>

          <text
            x={- (padding.top + plotHeight / 2)}
            y={padding.left - 50}
            transform="rotate(-90)"
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill="#334155"
          >
            abstract steps (TAC instructions)
          </text>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / svgWidth) * 100}%`,
            top: `${(hoveredPoint.y / svgHeight) * 100}%`,
            transform: 'translate(-50%, -120%)',
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '0.75rem',
            color: '#0F172A',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10
          }}>
            <div><strong>n:</strong> {hoveredPoint.n.toLocaleString()}</div>
            <div><strong>Steps:</strong> <span style={{ color: '#0284C7', fontWeight: 700 }}>{hoveredPoint.steps.toLocaleString()}</span> TAC quads</div>
            {hoveredPoint.isRaw && <div style={{ color: '#E11D48', fontWeight: 600 }}>Raw TAC (Unoptimized)</div>}
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        fontSize: '0.78rem',
        color: 'var(--text-secondary, #475569)',
        borderTop: '1px solid var(--border-light, #E2E8F0)',
        paddingTop: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4F46E5', border: '2px solid #FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
          <span>Measured (Optimized)</span>
        </div>

        {variant === 'both' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#E11D48', border: '2px solid #FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
            <span>Measured (Raw)</span>
          </div>
        )}

        {fit && fit.classification !== 'INSUFFICIENT DATA' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '20px', height: '3px', background: '#0284C7', borderRadius: '2px' }} />
            <span>Fitted Curve ({fit.classification})</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '18px', height: '2px', borderTop: '2px dashed #64748B' }} />
          <span>Ref O(n)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '18px', height: '2px', borderTop: '2px dashed #0284C7' }} />
          <span>Ref O(n log n)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '18px', height: '2px', borderTop: '2px dashed #9333EA' }} />
          <span>Ref O(n²)</span>
        </div>
      </div>
    </div>
  );
};
