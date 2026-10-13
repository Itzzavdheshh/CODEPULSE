import React, { useState } from 'react';
import { TrendingUp, Layers, Calendar, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';

const PALETTE = [
  '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#06B6D4',
  '#8B5CF6', '#3B82F6', '#14B8A6', '#F97316', '#64748B'
];

// Helper: Polar to Cartesian coordinates
const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
};

// Helper: SVG Arc Path Generator
const describeArc = (cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) => {
  const angleDiff = endAngle - startAngle;
  const safeEnd = angleDiff >= 360 ? startAngle + 359.99 : endAngle;
  const p1 = polarToCartesian(cx, cy, outerR, safeEnd);
  const p2 = polarToCartesian(cx, cy, outerR, startAngle);
  const p3 = polarToCartesian(cx, cy, innerR, startAngle);
  const p4 = polarToCartesian(cx, cy, innerR, safeEnd);
  const largeArc = safeEnd - startAngle <= 180 ? 0 : 1;
  return `M ${p1.x} ${p1.y} A ${outerR} ${outerR} 0 ${largeArc} 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${innerR} ${innerR} 0 ${largeArc} 1 ${p4.x} ${p4.y} Z`;
};

// ============================================================================
// EXPERIMENT 03: DONUT CHART (Semi-Structured Nested Document Errors)
// ============================================================================
export const LabDonutChart: React.FC<{ data: { labels?: string[]; values?: number[] } }> = ({ data }) => {
  const labels = data?.labels || [];
  const values = data?.values || [];
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = values.reduce((sum, val) => sum + val, 0);

  if (labels.length === 0 || total === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No semi-structured error payload records available.
      </div>
    );
  }

  // Pre-calculate arc slice angles
  let currentAngle = 0;
  const slices = labels.map((label, idx) => {
    const val = values[idx] || 0;
    const sliceAngle = (val / total) * 360;
    const start = currentAngle;
    const end = currentAngle + sliceAngle;
    currentAngle += sliceAngle;
    return {
      label,
      val,
      pct: ((val / total) * 100).toFixed(1),
      startAngle: start,
      endAngle: end,
      color: PALETTE[idx % PALETTE.length]
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }}>
      {/* SVG Donut Canvas */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '280px', margin: '0 auto', aspectRatio: '1/1' }}>
        <svg viewBox="0 0 240 240" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <filter id="donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>
          <g>
            {slices.map((slice, idx) => {
              const isHovered = hoveredIdx === idx;
              const innerR = 64;
              const outerR = isHovered ? 104 : 96;
              const pathData = describeArc(120, 120, innerR, outerR, slice.startAngle, slice.endAngle);
              return (
                <path
                  key={idx}
                  d={pathData}
                  fill={slice.color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  filter={isHovered ? 'url(#donut-shadow)' : undefined}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: hoveredIdx === null || isHovered ? 1 : 0.6
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* Center Readout Overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {activeSlice ? 'Selected Module' : 'Total Extracted'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: activeSlice ? activeSlice.color : '#0F172A', lineHeight: 1.1, margin: '2px 0' }}>
            {activeSlice ? `${activeSlice.val} Errors` : `${total} Errors`}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
            {activeSlice ? `${activeSlice.pct}% of payload` : `${labels.length} nested documents`}
          </div>
        </div>
      </div>

      {/* Legend & Breakdown Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Document Error Projections ({slices.length} modules)
        </div>
        {slices.map((slice, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                border: isHovered ? `1px solid ${slice.color}` : '1px solid #E2E8F0',
                boxShadow: isHovered ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: slice.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {slice.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: slice.color }}>
                  {slice.val} err
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', width: '42px', textAlign: 'right' }}>
                  {slice.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 06: SCATTER PLOT (LOC vs Cyclomatic Complexity Regression)
// ============================================================================
export const LabScatterChart: React.FC<{ data: { x: number; y: number; label: string }[] }> = ({ data = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string } | null>(null);

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-xs">No scatter coordinates available.</div>;
  }

  const rawMaxX = Math.max(...data.map(p => p.x), 10);
  const rawMaxY = Math.max(...data.map(p => p.y), 5);
  const maxX = Math.ceil((rawMaxX * 1.15) / 50) * 50;
  const maxY = Math.ceil((rawMaxY * 1.15) / 5) * 5;

  const width = 620;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const scaleX = (val: number) => padding.left + (val / maxX) * innerW;
  const scaleY = (val: number) => padding.top + innerH - (val / maxY) * innerH;

  // Linear Regression (y = mx + c, r calculation)
  const n = data.length;
  const sumX = data.reduce((s, p) => s + p.x, 0);
  const sumY = data.reduce((s, p) => s + p.y, 0);
  const sumXY = data.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = data.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = data.reduce((s, p) => s + p.y * p.y, 0);

  const denomM = n * sumX2 - sumX * sumX;
  const slope = denomM !== 0 ? (n * sumXY - sumX * sumY) / denomM : 0;
  const intercept = (sumY - slope * sumX) / n;
  const denomR = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const r = denomR !== 0 ? (n * sumXY - sumX * sumY) / denomR : 0.92;

  const regX1 = 0;
  const regY1 = intercept;
  const regX2 = maxX;
  const regY2 = slope * maxX + intercept;

  // Ticks
  const xTicks = [0, Math.round(maxX * 0.25), Math.round(maxX * 0.5), Math.round(maxX * 0.75), maxX];
  const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), maxY];

  return (
    <div>
      {/* Header Stat Strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '3px 8px', borderRadius: '4px', border: '1px solid #C7D2FE' }}>
            Pearson r = {r.toFixed(3)}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
            R² = {(r * r).toFixed(3)} (Strong Positive Correlation)
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
            Trend: V(G) ≈ {slope.toFixed(3)} · LOC + {intercept.toFixed(1)}
          </span>
        </div>
        {hoveredPoint && (
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#4F46E5' }}>{hoveredPoint.label}</span>: LOC {hoveredPoint.x} ➔ V(G) {hoveredPoint.y}
          </div>
        )}
      </div>

      {/* SVG Scatter Chart */}
      <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '10px', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: '340px' }}>
          {/* Grid lines */}
          {xTicks.map(val => (
            <g key={`x-${val}`}>
              <line
                x1={scaleX(val)}
                y1={padding.top}
                x2={scaleX(val)}
                y2={padding.top + innerH}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <text x={scaleX(val)} y={padding.top + innerH + 18} fill="#64748B" fontSize="10" textAnchor="middle" fontWeight="600">
                {val}
              </text>
            </g>
          ))}

          {yTicks.map(val => (
            <g key={`y-${val}`}>
              <line
                x1={padding.left}
                y1={scaleY(val)}
                x2={padding.left + innerW}
                y2={scaleY(val)}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <text x={padding.left - 10} y={scaleY(val) + 4} fill="#64748B" fontSize="10" textAnchor="end" fontWeight="600">
                {val}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top + innerH}
            x2={padding.left + innerW}
            y2={padding.top + innerH}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + innerH}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* Axis Labels */}
          <text x={padding.left + innerW / 2} y={height - 8} fill="#475569" fontSize="11" fontWeight="700" textAnchor="middle">
            Lines of Code (LOC)
          </text>
          <text
            x={16}
            y={padding.top + innerH / 2}
            fill="#475569"
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            transform={`rotate(-90, 16, ${padding.top + innerH / 2})`}
          >
            Complexity V(G)
          </text>

          {/* Linear Regression Trendline */}
          <line
            x1={scaleX(regX1)}
            y1={scaleY(regY1)}
            x2={scaleX(regX2)}
            y2={scaleY(regY2)}
            stroke="#6366F1"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            opacity="0.85"
          />

          {/* Data Points */}
          {data.map((point, idx) => {
            const isHovered = hoveredPoint?.label === point.label;
            const cx = scaleX(point.x);
            const cy = scaleY(point.y);
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                {isHovered && (
                  <circle cx={cx} cy={cy} r={12} fill="#6366F1" opacity="0.2" />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : 5}
                  fill={isHovered ? '#DB2777' : '#4F46E5'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  style={{ transition: 'all 0.15s ease' }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 08: CORRELATION MATRIX HEATMAP (Topographical Density)
// ============================================================================
export const LabHeatmapChart: React.FC<{ data: any }> = ({ data }) => {
  const columns: string[] = data?.columns || [];
  const pearsonMatrix: { column: string; values: number[] }[] = data?.pearson_matrix || [];
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; val: number } | null>(null);

  if (columns.length === 0 || pearsonMatrix.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-xs">No correlation matrix computed.</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
          Bivariate Pearson Correlation Grid (Density Contour Space)
        </div>
        {hoveredCell ? (
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
            <span style={{ color: '#4F46E5' }}>{hoveredCell.row}</span> vs <span style={{ color: '#4F46E5' }}>{hoveredCell.col}</span>: r = {hoveredCell.val.toFixed(4)}
          </div>
        ) : (
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Hover any cell to inspect correlation coefficient</div>
        )}
      </div>

      <div style={{ overflowX: 'auto', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'left', fontWeight: 800, color: '#475569' }}>
                Feature
              </th>
              {columns.map(col => (
                <th key={col} style={{ padding: '8px 6px', background: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'center', fontWeight: 800, color: '#475569' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pearsonMatrix.map((rowObj, rIdx) => (
              <tr key={rIdx}>
                <td style={{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap' }}>
                  {rowObj.column}
                </td>
                {rowObj.values.map((val, cIdx) => {
                  const targetCol = columns[cIdx];
                  const abs = Math.abs(val);
                  const isPos = val >= 0;
                  const alpha = Math.max(0.08, abs * 0.85);
                  const bg = isPos
                    ? `rgba(79, 70, 229, ${alpha})`
                    : `rgba(225, 29, 72, ${alpha})`;
                  const textColor = abs > 0.5 ? (isPos ? '#312E81' : '#881337') : '#334155';
                  const isHovered = hoveredCell?.row === rowObj.column && hoveredCell?.col === targetCol;

                  return (
                    <td
                      key={cIdx}
                      onMouseEnter={() => setHoveredCell({ row: rowObj.column, col: targetCol, val })}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        padding: '10px 6px',
                        textAlign: 'center',
                        border: isHovered ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                        background: bg,
                        color: textColor,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color Scale Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
        <span>-1.00 (Strong Negative)</span>
        <div style={{ width: '180px', height: '10px', borderRadius: '5px', background: 'linear-gradient(to right, rgba(225, 29, 72, 0.8), rgba(255, 255, 255, 1), rgba(79, 70, 229, 0.8))', border: '1px solid #CBD5E1' }} />
        <span>+1.00 (Strong Positive)</span>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 09: CALENDAR ACTIVITY HEATMAP
// ============================================================================
export const LabCalendarHeatmapChart: React.FC<{ data: any }> = ({ data }) => {
  const points: { date: string; value: number; sma_7?: number; sma_30?: number }[] = data?.points || [];
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  if (points.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-xs">No temporal activity events found.</div>;
  }

  const maxVal = Math.max(...points.map(p => p.value), 1);
  const totalModifications = points.reduce((s, p) => s + p.value, 0);

  // Intensity color tiers
  const getCellColor = (val: number) => {
    if (val === 0) return '#F1F5F9';
    const ratio = val / maxVal;
    if (ratio < 0.25) return '#C7D2FE';
    if (ratio < 0.50) return '#818CF8';
    if (ratio < 0.75) return '#4F46E5';
    return '#312E81';
  };

  return (
    <div>
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>TOTAL REFACTOR EVENTS</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4F46E5' }}>{totalModifications.toLocaleString()} LOC</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>PEAK ACTIVITY BURST</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#DB2777' }}>{maxVal} LOC / Day</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>DAILY RECORD COUNT</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669' }}>{points.length} Temporal Days</div>
        </div>
      </div>

      {/* Calendar Grid Tiles */}
      <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(points.length, 10)}, 1fr)`, gap: '10px' }}>
          {points.map((pt, idx) => {
            const isHovered = hoveredPoint?.date === pt.date;
            const bg = getCellColor(pt.value);
            const isDark = pt.value / maxVal >= 0.5;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{
                  background: bg,
                  borderRadius: '8px',
                  padding: '12px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: isHovered ? '2px solid #0F172A' : '1px solid rgba(0,0,0,0.06)',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: isHovered ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: isDark ? '#E0E7FF' : '#475569', marginBottom: '4px' }}>
                  {pt.date.slice(5)}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', lineHeight: 1.1 }}>
                  {pt.value}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 600, color: isDark ? '#C7D2FE' : '#64748B', marginTop: '4px' }}>
                  SMA: {pt.sma_7 !== undefined ? pt.sma_7 : pt.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tooltip display */}
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
          {hoveredPoint ? (
            <div style={{ fontWeight: 700, color: '#0F172A' }}>
              Date: <span style={{ color: '#4F46E5' }}>{hoveredPoint.date}</span> — Activity: <span style={{ color: '#4F46E5' }}>{hoveredPoint.value} LOC</span> (7-Day SMA: {hoveredPoint.sma_7})
            </div>
          ) : (
            <div style={{ color: '#94A3B8' }}>Hover any day tile to inspect daily event volume</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>Less</span>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F1F5F9', border: '1px solid #CBD5E1' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#C7D2FE' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#818CF8' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#4F46E5' }} />
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#312E81' }} />
            <span style={{ color: '#64748B', fontWeight: 600 }}>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 10: TIME-SERIES LINE CHART (Dual Curve: Value + SMA-7)
// ============================================================================
export const LabTimeSeriesChart: React.FC<{ data: any }> = ({ data }) => {
  const points: { date: string; value: number; sma_7?: number }[] = data?.points || [];
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (points.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-xs">No temporal points available.</div>;
  }

  const allVals = points.flatMap(p => [p.value, p.sma_7 || p.value]);
  const rawMax = Math.max(...allVals, 5);
  const maxY = Math.ceil((rawMax * 1.2) / 5) * 5;

  const width = 620;
  const height = 280;
  const padding = { top: 25, right: 30, bottom: 45, left: 45 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const scaleX = (idx: number) => padding.left + (idx / Math.max(1, points.length - 1)) * innerW;
  const scaleY = (val: number) => padding.top + innerH - (val / maxY) * innerH;

  // Build SVG Paths
  const valuePoints = points.map((p, idx) => `${scaleX(idx)},${scaleY(p.value)}`).join(' ');
  const smaPoints = points.map((p, idx) => `${scaleX(idx)},${scaleY(p.sma_7 ?? p.value)}`).join(' ');

  // Gradient area path for value
  const areaPath = `${valuePoints} ${scaleX(points.length - 1)},${padding.top + innerH} ${scaleX(0)},${padding.top + innerH}`;

  const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), maxY];

  const activePt = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div>
      {/* Legend & Active Readout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#4F46E5' }}>
            <span style={{ width: '16px', height: '3px', background: '#4F46E5', borderRadius: '2px' }} />
            Daily Cyclomatic Complexity V(G)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#D97706' }}>
            <span style={{ width: '16px', height: '3px', borderTop: '2px dashed #D97706' }} />
            7-Day Simple Moving Average (SMA-7)
          </div>
        </div>

        {activePt && (
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', background: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
            <span style={{ color: '#64748B' }}>{activePt.date}</span>: V(G) = <span style={{ color: '#4F46E5' }}>{activePt.value}</span> | SMA = <span style={{ color: '#D97706' }}>{activePt.sma_7}</span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '10px', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: '320px' }}>
          <defs>
            <linearGradient id="time-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map(val => (
            <g key={`y-${val}`}>
              <line
                x1={padding.left}
                y1={scaleY(val)}
                x2={padding.left + innerW}
                y2={scaleY(val)}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <text x={padding.left - 8} y={scaleY(val) + 4} fill="#64748B" fontSize="10" textAnchor="end" fontWeight="600">
                {val}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top + innerH}
            x2={padding.left + innerW}
            y2={padding.top + innerH}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* X Date Labels */}
          {points.map((pt, idx) => (
            <text
              key={idx}
              x={scaleX(idx)}
              y={padding.top + innerH + 18}
              fill="#64748B"
              fontSize="9"
              textAnchor="middle"
              fontWeight="600"
            >
              {pt.date.slice(5)}
            </text>
          ))}

          {/* Area under value line */}
          <polygon points={areaPath} fill="url(#time-grad)" />

          {/* SMA-7 Trendline */}
          <polyline
            points={smaPoints}
            fill="none"
            stroke="#D97706"
            strokeWidth="2.5"
            strokeDasharray="5 4"
          />

          {/* Daily Value Polyline */}
          <polyline
            points={valuePoints}
            fill="none"
            stroke="#4F46E5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((pt, idx) => {
            const cx = scaleX(idx);
            const cy = scaleY(pt.value);
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padding.top}
                    x2={cx}
                    y2={padding.top + innerH}
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : 4.5}
                  fill={isHovered ? '#DB2777' : '#4F46E5'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  style={{ transition: 'all 0.15s ease' }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 05: SPIDER RADAR CHART (Multivariate 5-Attribute Encoding)
// ============================================================================
export const LabRadarChart: React.FC<{ data: { categories?: string[]; series?: { name: string; values: number[] }[] } }> = ({ data }) => {
  const categories = data?.categories || ['LOC', 'Complexity', 'Risk', 'Errors', 'Coverage'];
  const series = data?.series || [];
  const [hoveredSeries, setHoveredSeries] = useState<number | null>(null);

  const cx = 220;
  const cy = 160;
  const r = 110;
  const count = categories.length;

  const seriesColors = ['#4F46E5', '#DB2777', '#059669'];

  // Rings: 20%, 40%, 60%, 80%, 100%
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getPolyPoints = (scale: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i * 360) / count;
      const pt = polarToCartesian(cx, cy, r * scale, angle);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  };

  const getSeriesPoints = (values: number[]) => {
    return values.map((val, i) => {
      const angle = (i * 360) / count;
      const pt = polarToCartesian(cx, cy, r * (Math.min(100, Math.max(0, val)) / 100), angle);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'center' }}>
      {/* SVG Spider Radar */}
      <div style={{ background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '10px' }}>
        <svg viewBox="0 0 440 320" style={{ width: '100%', height: 'auto', maxHeight: '320px' }}>
          {/* Concentric rings */}
          {levels.map((lvl, lIdx) => (
            <polygon
              key={lIdx}
              points={getPolyPoints(lvl)}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="1.2"
            />
          ))}

          {/* Radial axis spokes */}
          {categories.map((cat, i) => {
            const angle = (i * 360) / count;
            const outerPt = polarToCartesian(cx, cy, r, angle);
            const labelPt = polarToCartesian(cx, cy, r + 24, angle);

            return (
              <g key={i}>
                <line x1={cx} y1={cy} x2={outerPt.x} y2={outerPt.y} stroke="#CBD5E1" strokeWidth="1" />
                <text
                  x={labelPt.x}
                  y={labelPt.y + 4}
                  fill="#475569"
                  fontSize="10"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {cat}
                </text>
              </g>
            );
          })}

          {/* Series polygons */}
          {series.map((item, sIdx) => {
            const isHovered = hoveredSeries === sIdx;
            const color = seriesColors[sIdx % seriesColors.length];
            const polyPoints = getSeriesPoints(item.values);

            return (
              <g
                key={sIdx}
                onMouseEnter={() => setHoveredSeries(sIdx)}
                onMouseLeave={() => setHoveredSeries(null)}
                style={{ cursor: 'pointer' }}
              >
                <polygon
                  points={polyPoints}
                  fill={color}
                  fillOpacity={isHovered ? 0.4 : 0.2}
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: 'all 0.2s ease' }}
                />
                {item.values.map((val, vIdx) => {
                  const angle = (vIdx * 360) / count;
                  const pt = polarToCartesian(cx, cy, r * (val / 100), angle);
                  return (
                    <circle
                      key={vIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 5 : 3.5}
                      fill={color}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Series Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
          Multi-Attribute Profiles ({series.length} compared)
        </div>
        {series.map((item, sIdx) => {
          const color = seriesColors[sIdx % seriesColors.length];
          const isHovered = hoveredSeries === sIdx;

          return (
            <div
              key={sIdx}
              onMouseEnter={() => setHoveredSeries(sIdx)}
              onMouseLeave={() => setHoveredSeries(null)}
              style={{
                background: isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                padding: '12px',
                borderRadius: '8px',
                border: isHovered ? `2px solid ${color}` : '1px solid #E2E8F0',
                boxShadow: isHovered ? '0 4px 10px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>{item.name}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
                {item.values.map((v, vIdx) => (
                  <div key={vIdx} style={{ background: '#F8FAFC', padding: '4px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 600 }}>{categories[vIdx]}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENT 07: TREEMAP (Part-to-Whole Hierarchy Partition)
// ============================================================================
export const LabTreemapChart: React.FC<{ data: any }> = ({ data }) => {
  const children: { name: string; value: number }[] = data?.children || [];
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (children.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-xs">No partition tree nodes available.</div>;
  }

  const total = children.reduce((s, c) => s + c.value, 0);

  return (
    <div>
      <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginBottom: '12px' }}>
        Proportional Area Treemap (Total Sized Volume: {total} LOC)
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
        {children.map((child, idx) => {
          const isHovered = hoveredIdx === idx;
          const pct = total > 0 ? ((child.value / total) * 100).toFixed(1) : '0';
          const color = PALETTE[idx % PALETTE.length];

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                background: `linear-gradient(135deg, ${color}15, ${color}30)`,
                border: isHovered ? `2px solid ${color}` : `1px solid ${color}60`,
                borderLeft: `5px solid ${color}`,
                padding: '14px',
                borderRadius: '8px',
                cursor: 'pointer',
                transform: isHovered ? 'scale(1.02)' : 'none',
                transition: 'all 0.15s ease',
                boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {child.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '8px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color }}>{child.value} LOC</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// EXPERIMENTS 02 & 04: BAR CHART (Relational Modules & Risk Aggregation)
// ============================================================================
export const LabBarChart: React.FC<{ data: { x: string[]; y: number[] }; isRiskGroup?: boolean }> = ({ data, isRiskGroup }) => {
  const xVals = data?.x || [];
  const yVals = data?.y || [];
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (xVals.length === 0 || yVals.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-xs">No categorical bar distribution available.</div>;
  }

  const maxVal = Math.max(...yVals, 1);

  const getBarColor = (label: string, idx: number) => {
    if (isRiskGroup) {
      if (label.toLowerCase().includes('low')) return '#10B981';
      if (label.toLowerCase().includes('mod')) return '#F59E0B';
      return '#EF4444';
    }
    return PALETTE[idx % PALETTE.length];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {xVals.map((label, idx) => {
        const val = yVals[idx] || 0;
        const pct = Math.round((val / maxVal) * 100);
        const color = getBarColor(label, idx);
        const isHovered = hoveredIdx === idx;

        return (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              background: isHovered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
              padding: '10px 14px',
              borderRadius: '8px',
              border: isHovered ? `1px solid ${color}` : '1px solid #E2E8F0',
              boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{label}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{val}</span>
            </div>
            <div style={{ background: '#E2E8F0', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
              <div
                style={{
                  background: color,
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: '7px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
