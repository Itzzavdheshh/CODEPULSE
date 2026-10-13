import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  Upload, 
  Sparkles, 
  ArrowRight, 
  FileCode, 
  Layers, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Activity,
  FileText
} from 'lucide-react';
import { analyzeCompilerSource, fetchArtifacts } from '../../services/api';
import { LoadingState } from '../common/LoadingState';

export const FileComparisonView: React.FC = () => {
  const [sourceMode, setSourceMode] = useState<'upload' | 'artifacts' | 'demo'>('upload');
  
  // File A state
  const [fileNameA, setFileNameA] = useState<string>('SoftwareRiskAnalyzer.java');
  const [codeA, setCodeA] = useState<string>('');
  const [analysisA, setAnalysisA] = useState<any | null>(null);

  // File B state
  const [fileNameB, setFileNameB] = useState<string>('PaymentProcessor.java');
  const [codeB, setCodeB] = useState<string>('');
  const [analysisB, setAnalysisB] = useState<any | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [artifactsList, setArtifactsList] = useState<any[]>([]);
  const [selectedArtifactA, setSelectedArtifactA] = useState<string>('');
  const [selectedArtifactB, setSelectedArtifactB] = useState<string>('');

  useEffect(() => {
    fetchArtifacts().then((arts) => {
      const compArts = (arts || []).filter((a: any) => a.artifact_type === 'compiler_analysis');
      setArtifactsList(compArts);
      if (compArts.length >= 2) {
        setSelectedArtifactA(compArts[0].artifact_id);
        setSelectedArtifactB(compArts[1].artifact_id);
      }
    }).catch(() => {});
  }, []);

  const handleLoadDemo = async () => {
    setLoading(true);
    setSourceMode('demo');
    const demoA = `public class SoftwareRiskAnalyzer {
    public static int calculateRisk(int complexity, int errors) {
        int baseRisk = complexity * 2 + errors * 5;
        int adjustedRisk = baseRisk + 10 - 10;
        if (complexity > 10) {
            adjustedRisk = adjustedRisk + 20;
        } else {
            adjustedRisk = adjustedRisk - 5;
        }
        return adjustedRisk;
    }

    public static int analyzeIterations(int complexity) {
        int iterations = 0;
        int score = 0;
        while (iterations < 5) {
            score = score + complexity;
            iterations = iterations + 1;
        }
        for (int i = 0; i < 3; i = i + 1) {
            if (i > 1) {
                score = score + 10;
            } else {
                score = score + 2;
            }
        }
        return score;
    }

    public static void main(String[] args) {
        int loc = 120;
        int complexity = 12;
        int errors = 2;
        int constantValue = 10 + 20 - 20;
        int riskScore = calculateRisk(complexity, errors);
        int iterationScore = analyzeIterations(complexity);
        if (riskScore > 50) {
            System.out.println("High software risk detected!");
            if (errors > 0) {
                riskScore = riskScore + errors;
            } else {
                riskScore = riskScore - 1;
            }
        } else {
            System.out.println("Software risk is acceptable.");
        }
        int finalScore = riskScore + iterationScore + constantValue;
        System.out.println(finalScore);
    }
}`;

    const demoB = `public class PaymentProcessor {
    public static boolean validateCard(String number, int expMonth, int expYear) {
        if (number == null || number.length() < 16) {
            return false;
        }
        if (expYear < 2026) {
            return false;
        }
        if (expMonth < 1 || expMonth > 12) {
            return false;
        }
        return true;
    }
    public static double processBatch(double[] amounts, double fee) {
        double total = 0.0;
        for (int i = 0; i < amounts.length; i++) {
            if (amounts[i] > 1000.0) {
                total = total + amounts[i] * (1.0 - fee);
            } else if (amounts[i] > 0) {
                total = total + amounts[i];
            }
        }
        return total;
    }
    public static void main(String[] args) {
        boolean ok = validateCard("4111222233334444", 12, 2028);
    }
}`;

    setFileNameA('SoftwareRiskAnalyzer.java');
    setCodeA(demoA);
    setFileNameB('PaymentProcessor.java');
    setCodeB(demoB);

    try {
      const resA = await analyzeCompilerSource(demoA, 'SoftwareRiskAnalyzer.java');
      const resB = await analyzeCompilerSource(demoB, 'PaymentProcessor.java');
      setAnalysisA(resA.analysis || resA);
      setAnalysisB(resB.analysis || resB);
    } catch (e) {
      console.error('Failed to analyze demo files', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!codeA.trim() || !codeB.trim()) return;
    setLoading(true);
    try {
      const resA = await analyzeCompilerSource(codeA, fileNameA);
      const resB = await analyzeCompilerSource(codeB, fileNameB);
      setAnalysisA(resA.analysis || resA);
      setAnalysisB(resB.analysis || resB);
    } catch (e) {
      console.error('Failed to compare uploaded files', e);
    } finally {
      setLoading(false);
    }
  };

  const handleArtifactSelect = (artId: string, target: 'A' | 'B') => {
    const art = artifactsList.find(a => a.artifact_id === artId);
    if (!art) return;
    const payload = art.payload || art;
    if (target === 'A') {
      setSelectedArtifactA(artId);
      setFileNameA(art.source_name || art.title || 'Artifact A');
      setAnalysisA(payload);
    } else {
      setSelectedArtifactB(artId);
      setFileNameB(art.source_name || art.title || 'Artifact B');
      setAnalysisB(payload);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        if (target === 'A') {
          setFileNameA(file.name);
          setCodeA(text);
        } else {
          setFileNameB(file.name);
          setCodeB(text);
        }
      }
    };
    reader.readAsText(file);
  };

  // Extract comparative metrics
  const metricsA = analysisA?.metrics || {};
  const metricsB = analysisB?.metrics || {};
  const statsA = analysisA?.stats || {};
  const statsB = analysisB?.stats || {};
  const cfgA = analysisA?.cfg || {};
  const cfgB = analysisB?.cfg || {};

  const locA = statsA.lines || statsA.loc || 0;
  const locB = statsB.lines || statsB.loc || 0;
  const vga = metricsA.cyclomatic_complexity || cfgA.program_aggregate?.program_aggregate_cyclomatic_complexity || 0;
  const vgb = metricsB.cyclomatic_complexity || cfgB.program_aggregate?.program_aggregate_cyclomatic_complexity || 0;
  const nodesA = (cfgA.nodes || []).length;
  const nodesB = (cfgB.nodes || []).length;
  const edgesA = (cfgA.edges || []).length;
  const edgesB = (cfgB.edges || []).length;
  const tokensA = statsA.tokens_count || 0;
  const tokensB = statsB.tokens_count || 0;
  const astA = statsA.ast_nodes_count || 0;
  const astB = statsB.ast_nodes_count || 0;
  const diagA = (analysisA?.diagnostics || []).length;
  const diagB = (analysisB?.diagnostics || []).length;

  const riskA = metricsA.risk_level || (vga <= 5 ? 'LOW' : vga <= 10 ? 'MODERATE' : vga <= 20 ? 'HIGH' : 'CRITICAL');
  const riskB = metricsB.risk_level || (vgb <= 5 ? 'LOW' : vgb <= 10 ? 'MODERATE' : vgb <= 20 ? 'HIGH' : 'CRITICAL');

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                COMPILATION INTELLIGENCE • FIRST-CLASS COMPARISON
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sourceMode === 'demo' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                {sourceMode === 'demo' ? 'DEMO DATASET' : 'REAL COMPILER PIPELINE'}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Differential Software Topology &amp; Complexity Comparison
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Compare two source modules or compiler artifacts side-by-side. Inspect Cyclomatic Complexity V(G), CFG branching topology, AST volume, and static risk deltas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadDemo}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-300 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Try Example Comparison
            </button>
            {artifactsList.length >= 2 && (
              <button
                onClick={() => setSourceMode('artifacts')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  sourceMode === 'artifacts' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                Use Stored Artifacts ({artifactsList.length})
              </button>
            )}
          </div>
        </div>

        {/* Source Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-200">
          {/* File A Box */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-indigo-700 uppercase">Module A (Baseline)</span>
              <label className="text-[11px] text-indigo-600 hover:underline cursor-pointer font-bold flex items-center gap-1">
                <Upload className="w-3 h-3" /> Upload File A
                <input type="file" accept=".java,.py,.c,.cpp" onChange={(e) => handleFileUpload(e, 'A')} style={{ display: 'none' }} />
              </label>
            </div>
            {sourceMode === 'artifacts' && artifactsList.length > 0 ? (
              <select 
                value={selectedArtifactA} 
                onChange={(e) => handleArtifactSelect(e.target.value, 'A')}
                className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg bg-white"
              >
                {artifactsList.map(a => (
                  <option key={a.artifact_id} value={a.artifact_id}>
                    {a.source_name || a.title} ({a.artifact_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={fileNameA}
                onChange={(e) => setFileNameA(e.target.value)}
                placeholder="Filename A (e.g. AuthService.java)"
                className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg bg-white"
              />
            )}
            <textarea
              value={codeA}
              onChange={(e) => setCodeA(e.target.value)}
              placeholder="Paste source code for Module A here..."
              rows={4}
              className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800"
            />
          </div>

          {/* File B Box */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-700 uppercase">Module B (Target / Revision)</span>
              <label className="text-[11px] text-purple-600 hover:underline cursor-pointer font-bold flex items-center gap-1">
                <Upload className="w-3 h-3" /> Upload File B
                <input type="file" accept=".java,.py,.c,.cpp" onChange={(e) => handleFileUpload(e, 'B')} style={{ display: 'none' }} />
              </label>
            </div>
            {sourceMode === 'artifacts' && artifactsList.length > 0 ? (
              <select 
                value={selectedArtifactB} 
                onChange={(e) => handleArtifactSelect(e.target.value, 'B')}
                className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg bg-white"
              >
                {artifactsList.map(a => (
                  <option key={a.artifact_id} value={a.artifact_id}>
                    {a.source_name || a.title} ({a.artifact_id.slice(0, 8)})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={fileNameB}
                onChange={(e) => setFileNameB(e.target.value)}
                placeholder="Filename B (e.g. PaymentProcessor.java)"
                className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg bg-white"
              />
            )}
            <textarea
              value={codeB}
              onChange={(e) => setCodeB(e.target.value)}
              placeholder="Paste source code for Module B here..."
              rows={4}
              className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800"
            />
          </div>
        </div>

        {codeA && codeB && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCompare}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" /> Execute Comparative Analysis
            </button>
          </div>
        )}
      </div>

      {loading && <LoadingState title="Executing Multi-Module Compiler Intelligence Pipeline..." />}

      {/* COMPARISON RESULTS */}
      {analysisA && analysisB && !loading && (
        <div className="space-y-6">
          {/* Key Delta Badges Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Cyclomatic Complexity Delta */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Cyclomatic Complexity V(G)</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-indigo-700">{vga} → {vgb}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  vgb > vga ? 'bg-rose-100 text-rose-800' : vgb < vga ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {vgb > vga ? `+${vgb - vga} HIGHER` : vgb < vga ? `${vgb - vga} LOWER` : 'IDENTICAL'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Formula: E - N + 2P</div>
            </div>

            {/* Lines of Code Delta */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Source Lines (LOC)</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-slate-900">{locA} → {locB}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  locB > locA ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {locB >= locA ? `+${locB - locA} lines` : `${locB - locA} lines`}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Physical Source Lines</div>
            </div>

            {/* CFG Topology Delta */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-[10px] font-mono text-slate-500 uppercase">CFG Basic Blocks / Edges</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-purple-700">{nodesA}/{edgesA} → {nodesB}/{edgesB}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {nodesB - nodesA >= 0 ? `+${nodesB - nodesA}` : `${nodesB - nodesA}`} Blocks
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Control Flow Graph Topology</div>
            </div>

            {/* Risk Classification Delta */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Static Risk Rating</div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-black font-mono text-slate-900">{riskA} → {riskB}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  riskB === 'CRITICAL' || riskB === 'HIGH' ? 'bg-rose-100 text-rose-800' : riskB === 'MODERATE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {riskB}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Authoritative CC Thresholds</div>
            </div>
          </div>

          {/* Side-by-Side Detailed Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Side-by-Side Structural Metric Comparison</span>
              <span className="text-xs text-slate-500 font-mono">Source A: {fileNameA} vs Source B: {fileNameB}</span>
            </h3>

            <table className="w-full border-collapse text-xs font-mono text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="p-3">Analytical Metric</th>
                  <th className="p-3 text-indigo-700 font-bold">{fileNameA} (A)</th>
                  <th className="p-3 text-purple-700 font-bold">{fileNameB} (B)</th>
                  <th className="p-3 text-slate-900 font-bold">Delta (B - A)</th>
                  <th className="p-3">Significance / Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Cyclomatic Complexity V(G)</td>
                  <td className="p-3 font-bold text-indigo-700">{vga}</td>
                  <td className="p-3 font-bold text-purple-700">{vgb}</td>
                  <td className={`p-3 font-bold ${vgb > vga ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {vgb - vga >= 0 ? `+${vgb - vga}` : `${vgb - vga}`}
                  </td>
                  <td className="p-3 text-slate-600">
                    {vgb > vga ? 'Module B has more independent execution paths.' : 'Module B has equal or simpler branching.'}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Lines of Code (LOC)</td>
                  <td className="p-3 text-slate-900">{locA}</td>
                  <td className="p-3 text-slate-900">{locB}</td>
                  <td className="p-3 font-bold text-slate-700">{locB - locA >= 0 ? `+${locB - locA}` : `${locB - locA}`}</td>
                  <td className="p-3 text-slate-600">Overall codebase footprint difference.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">CFG Basic Blocks (N)</td>
                  <td className="p-3 text-slate-900">{nodesA}</td>
                  <td className="p-3 text-slate-900">{nodesB}</td>
                  <td className="p-3 font-bold text-slate-700">{nodesB - nodesA >= 0 ? `+${nodesB - nodesA}` : `${nodesB - nodesA}`}</td>
                  <td className="p-3 text-slate-600">Basic block instruction partitions.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">CFG Control Flow Edges (E)</td>
                  <td className="p-3 text-slate-900">{edgesA}</td>
                  <td className="p-3 text-slate-900">{edgesB}</td>
                  <td className="p-3 font-bold text-slate-700">{edgesB - edgesA >= 0 ? `+${edgesB - edgesA}` : `${edgesB - edgesA}`}</td>
                  <td className="p-3 text-slate-600">Directed jump and branching transitions.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Token Count</td>
                  <td className="p-3 text-slate-900">{tokensA}</td>
                  <td className="p-3 text-slate-900">{tokensB}</td>
                  <td className="p-3 font-bold text-slate-700">{tokensB - tokensA >= 0 ? `+${tokensB - tokensA}` : `${tokensB - tokensA}`}</td>
                  <td className="p-3 text-slate-600">Lexical token density.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">AST Structural Nodes</td>
                  <td className="p-3 text-slate-900">{astA}</td>
                  <td className="p-3 text-slate-900">{astB}</td>
                  <td className="p-3 font-bold text-slate-700">{astB - astA >= 0 ? `+${astB - astA}` : `${astB - astA}`}</td>
                  <td className="p-3 text-slate-600">Grammar syntax hierarchy complexity.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Diagnostics / Warnings</td>
                  <td className="p-3 text-slate-900">{diagA}</td>
                  <td className="p-3 text-slate-900">{diagB}</td>
                  <td className="p-3 font-bold text-slate-700">{diagB - diagA >= 0 ? `+${diagB - diagA}` : `${diagB - diagA}`}</td>
                  <td className="p-3 text-slate-600">Semantic analyzer diagnostics detected.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysisA && !analysisB && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <GitCompare className="w-12 h-12 text-indigo-600 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No Files Compared Yet</h3>
          <p className="text-xs text-slate-600 mb-5 leading-relaxed">
            Upload two source code files above or click "Try Example Comparison" to compare control flow graphs, lines of code, AST depth, and complexity deltas.
          </p>
          <button
            onClick={handleLoadDemo}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Try Example Comparison
          </button>
        </div>
      )}
    </div>
  );
};
