import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  AlertTriangle, 
  Activity, 
  Layers, 
  Search, 
  Filter, 
  BarChart2, 
  Sliders, 
  TrendingUp, 
  ArrowUpRight,
  Maximize2
} from 'lucide-react';
import { 
  getCorrelationMatrix, 
  getAnomalies 
} from '../../services/api';

interface AdvancedAnalyticsStudioProps {
  dataset: Record<string, any>[];
  numericColumns: string[];
}

export const AdvancedAnalyticsStudio: React.FC<AdvancedAnalyticsStudioProps> = ({ dataset, numericColumns }) => {
  const [activeTab, setActiveTab] = useState<'correlation' | 'anomalies' | 'parallel' | 'linked'>('correlation');

  // Correlation state
  const [correlationData, setCorrelationData] = useState<any>(null);
  const [selectedCorrCell, setSelectedCorrCell] = useState<{ col1: string; col2: string; val: number } | null>(null);
  const [loadingCorr, setLoadingCorr] = useState<boolean>(false);

  // Anomalies state
  const [anomalyData, setAnomalyData] = useState<any>(null);
  const [selectedAnomalyRow, setSelectedAnomalyRow] = useState<any>(null);
  const [loadingAnomalies, setLoadingAnomalies] = useState<boolean>(false);

  // Linked views state
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<number>>(new Set());
  const [linkedXCol, setLinkedXCol] = useState<string>(numericColumns[0] || '');
  const [linkedYCol, setLinkedYCol] = useState<string>(numericColumns[1] || numericColumns[0] || '');

  useEffect(() => {
    if (dataset.length > 0 && numericColumns.length > 0) {
      fetchCorrelation();
      fetchAnomalies();
    }
  }, [dataset, numericColumns]);

  const fetchCorrelation = async () => {
    setLoadingCorr(true);
    try {
      const res = await getCorrelationMatrix(dataset, numericColumns);
      if (res && !res.error) {
        setCorrelationData(res);
      }
    } catch (err) {
      console.error("Failed to load correlation matrix", err);
    } finally {
      setLoadingCorr(false);
    }
  };

  const fetchAnomalies = async () => {
    setLoadingAnomalies(true);
    try {
      const res = await getAnomalies(dataset, numericColumns);
      if (res && !res.error) {
        setAnomalyData(res);
      }
    } catch (err) {
      console.error("Failed to load anomalies", err);
    } finally {
      setLoadingAnomalies(false);
    }
  };

  // Cross-filtering selection handler
  const handleScatterPointClick = (idx: number) => {
    setSelectedRecordIds(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const clearBrushing = () => {
    setSelectedRecordIds(new Set());
  };

  if (dataset.length === 0) {
    return (
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
        <Activity className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Active Dataset Loaded</h3>
        <p className="text-sm text-slate-600">
          Upload a dataset in the Visual Analytics Studio to run Advanced Correlation Intelligence, Anomaly Detection, Parallel Coordinates, and 4-Quadrant Linked Views.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation (Light Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Advanced Analytics Studio
          </h2>
          <p className="text-xs text-slate-600">
            Multivariate Correlation, Statistical Outliers, Parallel Axis Exploration &amp; Interactive Cross-Filtering
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('correlation')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'correlation' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Correlation Matrix
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'anomalies' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Visual Anomalies ({anomalyData?.total_anomalies || 0})
          </button>
          <button
            onClick={() => setActiveTab('parallel')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'parallel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Parallel Coordinates
          </button>
          <button
            onClick={() => setActiveTab('linked')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'linked' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Linked Views Workspace
          </button>
        </div>
      </div>

      {/* TAB 1: CORRELATION MATRIX */}
      {activeTab === 'correlation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Pearson Correlation Heatmap</span>
              <span className="text-xs text-slate-500 font-normal">Click cell to inspect bivariate scatter</span>
            </h3>

            {loadingCorr ? (
              <div className="p-12 text-center text-slate-500 text-xs">Computing correlation matrix...</div>
            ) : correlationData?.matrix ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs font-mono">
                  <thead>
                    <tr>
                      <th className="p-2 border border-slate-200 bg-slate-100 text-slate-700 text-left font-bold">Feature</th>
                      {correlationData.columns.map((col: string) => (
                        <th key={col} className="p-2 border border-slate-200 bg-slate-100 text-slate-700 font-bold text-center max-w-[90px] truncate" title={col}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {correlationData.columns.map((rowCol: string) => (
                      <tr key={rowCol}>
                        <td className="p-2 border border-slate-200 bg-slate-100 text-slate-800 font-bold max-w-[120px] truncate" title={rowCol}>
                          {rowCol}
                        </td>
                        {correlationData.columns.map((colCol: string) => {
                          const val = correlationData.matrix[rowCol]?.[colCol] ?? 0;
                          const absVal = Math.abs(val);
                          // Color scale: red for negative, blue for positive
                          const isPos = val >= 0;
                          const bgAlpha = Math.max(0.1, absVal);
                          const isSelected = selectedCorrCell?.col1 === rowCol && selectedCorrCell?.col2 === colCol;

                          return (
                            <td
                              key={colCol}
                              onClick={() => setSelectedCorrCell({ col1: rowCol, col2: colCol, val })}
                              className={`p-3 text-center border border-slate-200 cursor-pointer font-bold transition-all hover:scale-105 hover:z-10 ${
                                isSelected ? 'ring-2 ring-indigo-600 z-20' : ''
                              }`}
                              style={{
                                backgroundColor: isPos
                                  ? `rgba(79, 70, 229, ${bgAlpha * 0.4})`
                                  : `rgba(225, 29, 72, ${bgAlpha * 0.4})`,
                                color: absVal > 0.4 ? '#0f172a' : '#334155'
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
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">No numeric columns available for correlation analysis.</div>
            )}
          </div>

          {/* Cell Inspector Drawer / Mini Scatter */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Bivariate Inspector
              </h3>

              {selectedCorrCell ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Relationship Pair:</div>
                    <div className="text-xs font-mono font-bold text-indigo-700">
                      {selectedCorrCell.col1} <span className="text-slate-400">vs</span> {selectedCorrCell.col2}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600">Correlation (r):</span>
                      <span className={`font-bold ${selectedCorrCell.val >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                        {selectedCorrCell.val.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    <span className="text-slate-800 font-bold block mb-1">Interpretation:</span>
                    {Math.abs(selectedCorrCell.val) > 0.7 ? (
                      <span className="text-emerald-700 font-semibold">Strong linear relationship detected. Variations in {selectedCorrCell.col1} closely track {selectedCorrCell.col2}.</span>
                    ) : Math.abs(selectedCorrCell.val) > 0.3 ? (
                      <span className="text-indigo-700 font-semibold">Moderate correlation detected between these attributes.</span>
                    ) : (
                      <span className="text-slate-600">Weak or zero linear correlation observed.</span>
                    )}
                  </div>

                  {/* Scatter preview */}
                  <div className="h-44 bg-slate-50 rounded-xl border border-slate-200 p-2 relative flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 200 120">
                      {dataset.slice(0, 50).map((row, idx) => {
                        const valX = Number(row[selectedCorrCell.col1]) || 0;
                        const valY = Number(row[selectedCorrCell.col2]) || 0;
                        // normalize
                        const cx = 20 + (valX % 100) * 1.6;
                        const cy = 100 - (valY % 100) * 0.8;
                        return (
                          <circle
                            key={idx}
                            cx={cx}
                            cy={cy}
                            r="3.5"
                            fill="#4f46e5"
                            opacity="0.8"
                          />
                        );
                      })}
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-xs italic py-16 text-center">
                  Click any cell in the correlation matrix to inspect bivariate relationship strength and point distribution.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANOMALY DETECTOR */}
      {activeTab === 'anomalies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>IQR &amp; Z-Score Detected Outliers</span>
              <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono font-bold">
                {anomalyData?.total_anomalies || 0} Outliers Detected
              </span>
            </h3>

            {loadingAnomalies ? (
              <div className="p-12 text-center text-slate-500 text-xs">Scanning dataset for statistical anomalies...</div>
            ) : anomalyData?.anomalies?.length > 0 ? (
              <div className="overflow-x-auto max-h-[480px]">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Feature</th>
                      <th className="p-2.5">Value</th>
                      <th className="p-2.5">Expected Range</th>
                      <th className="p-2.5">Deviation</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {anomalyData.anomalies.map((anom: any, idx: number) => (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedAnomalyRow(anom)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          selectedAnomalyRow === anom ? 'bg-indigo-50/80' : ''
                        }`}
                      >
                        <td className="p-2.5 text-slate-900 font-bold">#{anom.row_index}</td>
                        <td className="p-2.5 text-indigo-700 font-bold">{anom.column}</td>
                        <td className="p-2.5 text-rose-700 font-bold">{anom.value}</td>
                        <td className="p-2.5 text-slate-600">{anom.expected_min} - {anom.expected_max}</td>
                        <td className="p-2.5 text-amber-700 font-bold">{anom.deviation_factor}x IQR</td>
                        <td className="p-2.5 text-right">
                          <button className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold">
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                No statistical outliers detected under IQR 1.5x threshold.
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Anomaly Root Cause Details
            </h3>

            {selectedAnomalyRow ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-slate-600">Dataset Record Index: <span className="text-slate-900 font-bold">#{selectedAnomalyRow.row_index}</span></div>
                  <div className="text-slate-600">Target Attribute: <span className="text-indigo-700 font-bold">{selectedAnomalyRow.column}</span></div>
                  <div className="text-slate-600">Observed Value: <span className="text-rose-700 font-bold">{selectedAnomalyRow.value}</span></div>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 leading-relaxed font-sans text-xs font-medium">
                  <span className="font-bold block mb-1">Statistical Rationale:</span>
                  The observed value violates normal distribution boundaries calculated from the Interquartile Range (Q3 + 1.5 * IQR).
                </div>

                <div className="pt-2">
                  <span className="text-slate-600 block mb-2 font-sans font-bold">Full Row Record:</span>
                  <pre className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-800 overflow-x-auto max-h-48">
                    {JSON.stringify(dataset[selectedAnomalyRow.row_index] || {}, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs italic py-16 text-center">
                Select an anomaly row from the table to inspect full feature record and deviation reason.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PARALLEL COORDINATES */}
      {activeTab === 'parallel' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Multivariate Parallel Coordinates Axis Explorer</h3>
          <p className="text-xs text-slate-600 mb-6">Each line represents a single dataset record mapped across numeric feature axes.</p>

          <div className="h-96 bg-slate-50 rounded-xl border border-slate-200 p-6 relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 800 300">
              {/* Draw Vertical Axes */}
              {numericColumns.slice(0, 6).map((col, idx, arr) => {
                const x = 60 + idx * ((800 - 120) / Math.max(1, arr.length - 1));
                return (
                  <g key={col}>
                    <line x1={x} y1="30" x2={x} y2="250" stroke="#cbd5e1" strokeWidth="2" />
                    <text x={x} y="20" fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{col}</text>
                  </g>
                );
              })}

              {/* Draw Record Polyline Paths */}
              {dataset.slice(0, 30).map((row, rIdx) => {
                const points = numericColumns.slice(0, 6).map((col, cIdx, arr) => {
                  const x = 60 + cIdx * ((800 - 120) / Math.max(1, arr.length - 1));
                  const val = Number(row[col]) || 0;
                  const y = 240 - (val % 100) * 1.8;
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <polyline
                    key={rIdx}
                    points={points}
                    fill="none"
                    stroke={rIdx % 2 === 0 ? '#4f46e5' : '#7c3aed'}
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="hover:opacity-100 hover:stroke-amber-500 hover:stroke-[3px] transition-all cursor-pointer"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* TAB 4: 4-QUADRANT LINKED VIEWS WORKSPACE */}
      {activeTab === 'linked' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-4 text-xs">
              <span className="text-slate-600 font-bold">X Axis:</span>
              <select 
                value={linkedXCol} 
                onChange={(e) => setLinkedXCol(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <span className="text-slate-600 font-bold">Y Axis:</span>
              <select 
                value={linkedYCol} 
                onChange={(e) => setLinkedYCol(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-indigo-700 font-mono font-bold">
                Selected Records: {selectedRecordIds.size} / {dataset.length}
              </span>
              {selectedRecordIds.size > 0 && (
                <button 
                  onClick={clearBrushing}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-bold"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quadrant 1: Interactive Scatter Plot Brushing */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 h-72 flex flex-col">
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                <span>1. Scatter Brushing ({linkedXCol} vs {linkedYCol})</span>
                <span className="text-[10px] text-slate-500">Click points to cross-filter views</span>
              </h4>
              <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-2 relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 300 180">
                  {dataset.map((row, idx) => {
                    const vx = Number(row[linkedXCol]) || 0;
                    const vy = Number(row[linkedYCol]) || 0;
                    const cx = 30 + (vx % 100) * 2.4;
                    const cy = 150 - (vy % 100) * 1.3;
                    const isSelected = selectedRecordIds.has(idx);

                    return (
                      <circle
                        key={idx}
                        cx={cx}
                        cy={cy}
                        r={isSelected ? '6' : '3.5'}
                        fill={isSelected ? '#d97706' : '#4f46e5'}
                        stroke={isSelected ? '#ffffff' : 'none'}
                        strokeWidth="1.5"
                        opacity={selectedRecordIds.size === 0 || isSelected ? 0.9 : 0.25}
                        onClick={() => handleScatterPointClick(idx)}
                        className="cursor-pointer hover:scale-125 transition-transform"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Quadrant 2: Linked Distribution Bar Chart */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 h-72 flex flex-col">
              <h4 className="text-xs font-bold text-slate-900 mb-2">2. Linked Feature Distribution</h4>
              <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-end justify-between gap-1">
                {dataset.slice(0, 15).map((row, idx) => {
                  const val = Number(row[linkedYCol]) || 10;
                  const isSelected = selectedRecordIds.has(idx);
                  const hPct = Math.min(100, Math.max(15, (val % 100)));

                  return (
                    <div 
                      key={idx} 
                      className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
                      onClick={() => handleScatterPointClick(idx)}
                    >
                      <div 
                        className={`w-full rounded-t transition-all ${
                          isSelected ? 'bg-amber-500' : 'bg-indigo-600/70'
                        }`}
                        style={{ height: `${hPct}%` }}
                      />
                      <span className="text-[9px] font-mono text-slate-500">#{idx}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quadrant 3: Module / Category Hierarchy List */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 h-72 flex flex-col">
              <h4 className="text-xs font-bold text-slate-900 mb-2">3. Hierarchy &amp; Category Filter</h4>
              <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-3 overflow-y-auto space-y-1.5 font-mono text-xs">
                {dataset.slice(0, 20).map((row, idx) => {
                  const isSelected = selectedRecordIds.has(idx);
                  return (
                    <div 
                      key={idx} 
                      onClick={() => handleScatterPointClick(idx)}
                      className={`p-2 rounded cursor-pointer flex items-center justify-between ${
                        isSelected ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Record #{idx}</span>
                      <span className="text-slate-500 text-[10px]">{row[linkedXCol] ?? 'N/A'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quadrant 4: Selected Records Table */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 h-72 flex flex-col">
              <h4 className="text-xs font-bold text-slate-900 mb-2">4. Selected Record Details Table</h4>
              <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-3 overflow-auto">
                {selectedRecordIds.size > 0 ? (
                  <table className="w-full text-left font-mono text-[11px] text-slate-800 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-1">#</th>
                        <th className="p-1">{linkedXCol}</th>
                        <th className="p-1">{linkedYCol}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(selectedRecordIds).map((id) => (
                        <tr key={id} className="border-b border-slate-200">
                          <td className="p-1 text-amber-700 font-bold">#{id}</td>
                          <td className="p-1">{dataset[id]?.[linkedXCol]}</td>
                          <td className="p-1">{dataset[id]?.[linkedYCol]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-slate-500 text-xs italic text-center py-16">
                    No points brushed. Click points on the scatter or bar charts to filter this record table.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
