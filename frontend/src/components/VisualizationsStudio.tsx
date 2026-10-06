import React from 'react';
import { Network, BarChart3, PieChart, Activity } from 'lucide-react';

export const VisualizationsStudio: React.FC = () => {
  return (
    <div>
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(99, 102, 241, 0.15))' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Interactive Visual Analytics Studio</h2>
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
          Analytical SVG graph visualizers, Control-Flow Graphs, Pearson Correlation Heatmaps, and Code Risk Radar distributions.
        </p>
      </div>

      <div className="grid-2">
        {/* Visual 1: Control-Flow Graph SVG Diagram */}
        <div className="glass-panel">
          <span className="panel-title">
            <Network size={18} color="#6366F1" />
            Control-Flow Graph (CFG) Interactive Topology
          </span>
          <div style={{ background: '#0B0F19', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width="400" height="260" viewBox="0 0 400 260">
              {/* Nodes */}
              <rect x="150" y="20" width="100" height="40" rx="8" fill="#1E293B" stroke="#6366F1" strokeWidth="2" />
              <text x="200" y="45" textAnchor="middle" fill="#FFF" fontSize="13" fontWeight="600">Block B0 (Entry)</text>

              <rect x="70" y="110" width="100" height="40" rx="8" fill="#1E293B" stroke="#06B6D4" strokeWidth="2" />
              <text x="120" y="135" textAnchor="middle" fill="#FFF" fontSize="13" fontWeight="600">Block B1 (Then)</text>

              <rect x="230" y="110" width="100" height="40" rx="8" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
              <text x="280" y="135" textAnchor="middle" fill="#FFF" fontSize="13" fontWeight="600">Block B2 (Else)</text>

              <rect x="150" y="200" width="100" height="40" rx="8" fill="#1E293B" stroke="#10B981" strokeWidth="2" />
              <text x="200" y="225" textAnchor="middle" fill="#FFF" fontSize="13" fontWeight="600">Block B3 (Exit)</text>

              {/* Edges */}
              <path d="M 170 60 L 120 110" stroke="#6366F1" strokeWidth="2" markerEnd="url(#arrow)" />
              <path d="M 230 60 L 280 110" stroke="#F59E0B" strokeWidth="2" markerEnd="url(#arrow)" />
              <path d="M 120 150 L 170 200" stroke="#06B6D4" strokeWidth="2" />
              <path d="M 280 150 L 230 200" stroke="#10B981" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Visual 2: Risk Profile Distribution Chart */}
        <div className="glass-panel">
          <span className="panel-title">
            <BarChart3 size={18} color="#06B6D4" />
            Module Complexity & Risk Distribution
          </span>
          <div style={{ background: '#0B0F19', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', minHeight: '300px', display: 'flex', flexDirection: 'column', justify: 'center', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#34D399', fontWeight: 600 }}>Low Risk (V(G) ≤ 5)</span>
                <span style={{ color: '#FFF' }}>65% of modules</span>
              </div>
              <div style={{ background: '#1E293B', height: '10px', borderRadius: '5px' }}>
                <div style={{ background: '#10B981', height: '100%', width: '65%', borderRadius: '5px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#FBBF24', fontWeight: 600 }}>Moderate Risk (V(G) 6–10)</span>
                <span style={{ color: '#FFF' }}>20% of modules</span>
              </div>
              <div style={{ background: '#1E293B', height: '10px', borderRadius: '5px' }}>
                <div style={{ background: '#F59E0B', height: '100%', width: '20%', borderRadius: '5px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#F87171', fontWeight: 600 }}>High / Critical Risk (V(G) &gt; 10)</span>
                <span style={{ color: '#FFF' }}>15% of modules</span>
              </div>
              <div style={{ background: '#1E293B', height: '10px', borderRadius: '5px' }}>
                <div style={{ background: '#EF4444', height: '100%', width: '15%', borderRadius: '5px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
