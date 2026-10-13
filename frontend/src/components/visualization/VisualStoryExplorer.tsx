import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Search, 
  Lightbulb, 
  BarChart2, 
  FileText,
  ArrowRight,
  Inbox,
  AlertCircle,
  Table,
  CheckCircle2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  getVisualStory, 
  queryVisualization,
  getCompilerArtifact
} from '../../services/api';
import {
  LabBarChart,
  LabScatterChart,
  LabTimeSeriesChart,
  LabHeatmapChart
} from './LabChartRenderers';

interface VisualStoryExplorerProps {
  dataset: Record<string, any>[];
  numericColumns: string[];
  compilerArtifact?: any;
}

export const VisualStoryExplorer: React.FC<VisualStoryExplorerProps> = ({ 
  dataset, 
  numericColumns,
  compilerArtifact 
}) => {
  const [activeTab, setActiveTab] = useState<'story' | 'query'>('story');
  
  // Active compiler artifact fallback
  const [activeCompArt, setActiveCompArt] = useState<any | null>(compilerArtifact || null);

  // Story state
  const [storySteps, setStorySteps] = useState<any[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [loadingStory, setLoadingStory] = useState<boolean>(false);

  // Query state
  const [queryInput, setQueryInput] = useState<string>('');
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [loadingQuery, setLoadingQuery] = useState<boolean>(false);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  useEffect(() => {
    if (compilerArtifact) {
      setActiveCompArt(compilerArtifact);
    } else {
      getCompilerArtifact().then(art => {
        if (art) setActiveCompArt(art);
      }).catch(() => {});
    }
  }, [compilerArtifact]);

  useEffect(() => {
    fetchStory();
  }, [dataset, activeCompArt]);

  const fetchStory = async () => {
    setLoadingStory(true);
    try {
      const res = await getVisualStory(dataset, numericColumns, activeCompArt?.payload);
      if (res && res.steps) {
        setStorySteps(res.steps);
      }
    } catch (err) {
      console.error("Failed to generate visual story", err);
    } finally {
      setLoadingStory(false);
    }
  };

  const handleRunQuery = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : queryInput).trim();
    if (!q) {
      setQueryError("Please enter an analytical question or choose a query preset.");
      return;
    }

    setLoadingQuery(true);
    setQueryError(null);
    try {
      const res = await queryVisualization(dataset, q, numericColumns, activeCompArt);
      setQueryResult(res);
    } catch (err: any) {
      console.error("Failed to execute visual query", err);
      setQueryError(err.message || "Failed to execute visual query. Please try again.");
      setQueryResult(null);
    } finally {
      setLoadingQuery(false);
    }
  };

  const currentStep = storySteps[currentStepIdx];

  // Helper: Determine chart type and data availability
  const chartType = (queryResult?.chart_type || queryResult?.intent?.chart_type || 'bar').toLowerCase();
  const hasRows = Array.isArray(queryResult?.rows) && queryResult.rows.length > 0;
  const hasData = (
    (queryResult?.data?.x && queryResult.data.x.length > 0) ||
    (Array.isArray(queryResult?.data) && queryResult.data.length > 0) ||
    (queryResult?.data?.points && queryResult.data.points.length > 0) ||
    (queryResult?.data?.columns && queryResult.data.columns.length > 0)
  );
  const isDataAvailable = hasRows || hasData;

  // Chart data normalization
  const getBarData = () => {
    if (queryResult?.data?.x && queryResult?.data?.y) {
      return queryResult.data;
    }
    const rows = queryResult?.rows || [];
    return {
      x: rows.map((r: any) => String(r.method || r.risk_bracket || r.bracket || r.label || r[queryResult?.x_column] || 'Item')),
      y: rows.map((r: any) => Number(r.cyclomatic_complexity ?? r.count ?? r.value ?? r[queryResult?.y_column] ?? 0))
    };
  };

  const getScatterData = () => {
    if (Array.isArray(queryResult?.data) && queryResult.data.length > 0) {
      return queryResult.data;
    }
    const rows = queryResult?.rows || [];
    return rows.map((r: any) => ({
      x: Number(r.x ?? r.loc ?? 0),
      y: Number(r.y ?? r.cyclomatic_complexity ?? 0),
      label: String(r.label ?? r.method ?? r.name ?? 'Item')
    }));
  };

  const getLineData = () => {
    if (queryResult?.data?.points) {
      return queryResult.data;
    }
    const rows = queryResult?.rows || [];
    return {
      points: rows.map((r: any) => ({
        date: String(r.date || r.label || 'Point'),
        value: Number(r.value ?? r.cyclomatic_complexity ?? 0),
        sma_7: Number(r.sma_7 ?? r.value ?? 0)
      }))
    };
  };

  return (
    <div className="space-y-6">
      {/* Tab Header (Pure Light Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Visual Intelligence Storyteller &amp; Query Engine
          </h2>
          <p className="text-xs text-slate-600">
            Interactive Analytical Data Narratives &amp; Natural Language Visual Query Workbench
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('story')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'story' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Analytical Story ({storySteps.length || 0} Steps)
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'query' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Ask Your Data (Visual Query)
          </button>
        </div>
      </div>

      {/* TAB 1: VISUAL STORY */}
      {activeTab === 'story' && (
        <div className="space-y-6">
          {loadingStory ? (
            <div className="p-16 text-center text-slate-500 text-xs">Generating analytical data story...</div>
          ) : storySteps.length > 0 && currentStep ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Slide / Story View */}
              <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between min-h-[460px]">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                    <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">
                      Step {currentStepIdx + 1} of {storySteps.length}: {currentStep.title}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-semibold">
                      Narrative Stage {currentStepIdx + 1}
                    </span>
                  </div>

                  {/* Visual Preview Card */}
                  <div className="h-56 bg-slate-50 rounded-xl border border-slate-200 p-6 flex items-center justify-center relative overflow-hidden mb-6">
                    <div className="text-center space-y-3 max-w-lg">
                      <Activity className="w-10 h-10 text-indigo-600 mx-auto" />
                      <div className="text-base font-black text-slate-900">{currentStep.title}</div>
                      <div className="text-xs text-slate-600 leading-relaxed font-sans">{currentStep.what}</div>
                    </div>
                  </div>
                </div>

                {/* Step Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    disabled={currentStepIdx === 0}
                    onClick={() => setCurrentStepIdx(prev => prev - 1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex items-center space-x-1.5">
                    {storySteps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentStepIdx(i)}
                        className={`h-2.5 rounded-full transition-all ${
                          i === currentStepIdx ? 'bg-indigo-600 w-6' : 'bg-slate-300 hover:bg-slate-400 w-2.5'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    disabled={currentStepIdx === storySteps.length - 1}
                    onClick={() => setCurrentStepIdx(prev => prev + 1)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Story Analytical Explanation (What / Why / So What) */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  Analytical Explanation
                </h3>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">WHAT</span>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans">{currentStep?.what}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">WHY</span>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans">{currentStep?.why}</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">SO WHAT</span>
                  <p className="text-xs text-amber-950 leading-relaxed font-sans font-medium">{currentStep?.so_what}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center text-slate-500 text-xs">
              No dataset or compiler artifact loaded. Run compiler analysis or upload a dataset to generate analytical stories.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASK YOUR DATA */}
      {activeTab === 'query' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Natural Language Visual Query Studio</h3>
            <p className="text-xs text-slate-600 mb-4">
              Enter analytical queries in plain text. Deterministic intent parsing maps your query directly into active compiler analysis or dataset metrics.
            </p>

            <div className="flex items-center space-x-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Show top 10 most complex methods, or compare LOC and cyclomatic complexity..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>
              <button
                onClick={() => handleRunQuery()}
                disabled={loadingQuery}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Run Query
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                "Show top 10 most complex methods",
                "Show complexity distribution",
                "Compare LOC and cyclomatic complexity",
                "Show feature correlation matrix",
                "Show metric trend over time"
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => { setQueryInput(preset); handleRunQuery(preset); }}
                  className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {queryError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Visual Query Error</span>
                <span>{queryError}</span>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loadingQuery && (
            <div className="p-12 text-center text-slate-500 text-xs bg-white border border-slate-200 rounded-2xl">
              Processing visual query intent and executing analytical calculations...
            </div>
          )}

          {/* Visual Query Result Area */}
          {!loadingQuery && queryResult && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-5">
              {/* Query Metadata Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {chartType.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {queryResult.title || queryResult.intent?.title || 'Visual Query Result'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-sans">
                    {queryResult.explanation}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  {queryResult.x_column && (
                    <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      X: <strong className="text-indigo-600">{queryResult.x_column}</strong>
                    </span>
                  )}
                  {queryResult.y_column && (
                    <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      Y: <strong className="text-purple-600">{queryResult.y_column}</strong>
                    </span>
                  )}
                  <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    Rows: <strong className="text-emerald-700">{queryResult.total_records ?? queryResult.rows?.length ?? 0}</strong>
                  </span>
                </div>
              </div>

              {/* Chart Renderer Container */}
              {!isDataAvailable ? (
                <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                  <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">No Data Available</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {queryResult.explanation || "No matching data rows found in the active workspace. Run compiler analysis or load a dataset with method metrics."}
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  {chartType === 'bar' && (
                    <LabBarChart data={getBarData()} />
                  )}

                  {chartType === 'scatter' && (
                    <LabScatterChart data={getScatterData()} />
                  )}

                  {chartType === 'line' && (
                    <LabTimeSeriesChart data={getLineData()} />
                  )}

                  {(chartType === 'heatmap' || chartType === 'correlation_matrix') && (
                    <LabHeatmapChart data={queryResult.data} />
                  )}

                  {!['bar', 'scatter', 'line', 'heatmap', 'correlation_matrix'].includes(chartType) && (
                    <LabBarChart data={getBarData()} />
                  )}
                </div>
              )}

              {/* Data Table Inspector Toggle */}
              {hasRows && (
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <button
                      type="button"
                      onClick={() => setShowDataTable(prev => !prev)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
                    >
                      <Table className="w-3.5 h-3.5" />
                      {showDataTable ? "Hide Result Rows" : `Inspect Result Rows (${queryResult.rows.length})`}
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Intent: {queryResult.intent?.name || queryResult.intent || 'query_matched'}
                    </span>
                  </div>

                  {showDataTable && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mt-2">
                      <div className="max-h-56 overflow-y-auto">
                        <table className="w-full text-xs font-mono text-left border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                            <tr>
                              {Object.keys(queryResult.rows[0]).map(col => (
                                <th key={col} className="p-2 border-r border-slate-200 last:border-r-0">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.rows.map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50 last:border-b-0">
                                {Object.keys(queryResult.rows[0]).map(col => (
                                  <td key={col} className="p-2 text-slate-800 border-r border-slate-100 last:border-r-0">
                                    {String(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
