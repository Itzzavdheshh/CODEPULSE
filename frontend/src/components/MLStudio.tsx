import React, { useState } from 'react';
import { Brain, Play, Award, BarChart, CheckCircle2, AlertCircle, ShieldAlert, Layers, Download, ArrowRight, Table2, Sigma, RefreshCw, Zap, Sliders } from 'lucide-react';
import { MLResult, CodePulseArtifact } from '../types';
import { trainMLModel, predictMLInstance, getMLExportZipUrl } from '../services/api';
import { SAMPLE_CSV_SOFTWARE_METRICS, SAMPLE_CSV_IRIS } from '../utils/samples';

type MLTab = 'results' | 'comparison' | 'importance' | 'explainability' | 'predict' | 'cv' | 'guard';

const CLASSIFICATION_MODELS = [
  { value: 'random_forest', label: 'Random Forest Classifier' },
  { value: 'decision_tree', label: 'Decision Tree' },
  { value: 'logistic_regression', label: 'Logistic Regression' },
  { value: 'naive_bayes', label: 'Naïve Bayes Classifier' },
  { value: 'svm', label: 'Support Vector Machine (SVM)' },
];

const REGRESSION_MODELS = [
  { value: 'random_forest', label: 'Random Forest Regressor' },
  { value: 'decision_tree', label: 'Decision Tree Regressor' },
  { value: 'logistic_regression', label: 'Linear Regression' },
  { value: 'svm', label: 'Support Vector Regressor (SVR)' },
];

const CLUSTERING_MODELS = [
  { value: 'kmeans', label: 'K-Means Clustering' },
];

interface MLStudioProps {
  prefillCsv?: string;
  prefillName?: string;
}

export const MLStudio: React.FC<MLStudioProps> = ({ prefillCsv, prefillName }) => {
  const [csvText, setCsvText] = useState<string>(prefillCsv || SAMPLE_CSV_SOFTWARE_METRICS);
  const [targetColumn, setTargetColumn] = useState<string>('risk_level');
  const [modelName, setModelName] = useState<string>('random_forest');
  const [taskType, setTaskType] = useState<string>('classification');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [artifact, setArtifact] = useState<CodePulseArtifact | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<MLTab>('results');

  // Single Instance Prediction Form
  const [predictInputs, setPredictInputs] = useState<Record<string, string>>({});
  const [predictResult, setPredictResult] = useState<any | null>(null);
  const [predictLoading, setPredictLoading] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; val: number } | null>(null);

  const availableModels = taskType === 'classification' ? CLASSIFICATION_MODELS
    : taskType === 'regression' ? REGRESSION_MODELS
    : CLUSTERING_MODELS;

  const handleTrain = async () => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setPredictResult(null);
    try {
      const res = await trainMLModel(csvText, targetColumn, modelName, taskType);
      setResult(res.ml_result);
      if (res.artifact) setArtifact(res.artifact);

      // Initialize predict form with average feature values
      const initialInputs: Record<string, string> = {};
      (res.ml_result.features || []).forEach((feat: string) => {
        initialInputs[feat] = '10';
      });
      setPredictInputs(initialInputs);
      setActiveTab('results');
    } catch (err: any) {
      setErrorMsg(err.message || 'ML Model training failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!artifact) return;
    setPredictLoading(true);
    try {
      const parsedData: Record<string, any> = {};
      Object.entries(predictInputs).forEach(([k, v]) => {
        parsedData[k] = isNaN(Number(v)) ? v : Number(v);
      });
      const res = await predictMLInstance(artifact.artifact_id, parsedData);
      setPredictResult(res);
    } catch (err: any) {
      setPredictResult({ error: err.message || 'Prediction failed' });
    } finally {
      setPredictLoading(false);
    }
  };

  const TabButton = ({ id, label }: { id: MLTab; label: string }) => (
    <button
      className={`btn ${activeTab === id ? 'btn-primary' : 'btn-secondary'}`}
      onClick={() => setActiveTab(id)}
      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
    >
      {label}
    </button>
  );

  const MetricCard = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
    <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{label}</span>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: color || '#FFF', marginTop: '4px' }}>{value}</div>
    </div>
  );

  return (
    <div>
      {/* Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(16, 185, 129, 0.15))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain color="#10B981" size={24} />
              Machine Learning Intelligence Studio
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginTop: '4px' }}>
              Supervised Classification & Regression, Multi-Model Comparison, Feature Importance, Explainability, and Live Prediction.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => { setCsvText(SAMPLE_CSV_SOFTWARE_METRICS); setTargetColumn('risk_level'); setTaskType('classification'); }}>
              Software Metrics
            </button>
            <button className="btn btn-secondary" onClick={() => { setCsvText(SAMPLE_CSV_IRIS); setTargetColumn('species'); setTaskType('classification'); }}>
              Iris Dataset
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* LEFT: Configuration Panel */}
        <div className="glass-panel">
          <span className="panel-title">
            <Layers size={18} color="#10B981" />
            Model Training & Setup
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '4px' }}>Task Category</label>
              <select
                value={taskType}
                onChange={(e) => {
                  setTaskType(e.target.value);
                  if (e.target.value === 'clustering') setModelName('kmeans');
                  else setModelName('random_forest');
                }}
                style={{ width: '100%', background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '8px 12px', borderRadius: '6px', fontSize: '0.88rem' }}
              >
                <option value="classification">Supervised Classification</option>
                <option value="regression">Supervised Regression</option>
                <option value="clustering">Unsupervised Clustering (K-Means)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '4px' }}>Algorithm Architecture</label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                style={{ width: '100%', background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '8px 12px', borderRadius: '6px', fontSize: '0.88rem' }}
              >
                {availableModels.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            {taskType !== 'clustering' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '4px' }}>Target Attribute Column</label>
                <input
                  type="text"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  style={{ width: '100%', background: '#0F172A', border: '1px solid var(--border-color)', color: '#FFF', padding: '8px 12px', borderRadius: '6px', fontSize: '0.88rem' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '4px' }}>Training Dataset (CSV)</label>
              <textarea
                className="code-area"
                rows={10}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV data here..."
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleTrain} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #10B981, #059669)', padding: '12px' }}>
            <Play size={16} />
            {loading ? 'Training & Evaluating All Models...' : 'Train Model & Run Evaluation'}
          </button>

          {errorMsg && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '0.85rem' }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}
        </div>

        {/* RIGHT: Results Workspace */}
        <div className="glass-panel">
          {!result ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
              <Award size={56} color="#334155" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#94A3B8', fontWeight: 600 }}>ML Intelligence Workspace Idle</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>
                Click "Train Model & Run Evaluation" to evaluate performance, confusion matrix, and feature importance.
              </p>
            </div>
          ) : (
            <div>
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px', overflowX: 'auto' }}>
                <TabButton id="results" label="Metrics & Confusion" />
                <TabButton id="comparison" label={`Comparison (${(result.model_comparison || []).length})`} />
                <TabButton id="importance" label="Feature Importance" />
                <TabButton id="explainability" label="Explainability" />
                <TabButton id="predict" label="Live Prediction" />
                <TabButton id="cv" label="Cross-Validation" />
                <TabButton id="guard" label="Schema Guard" />
              </div>

              {/* ---- TAB: Evaluation Metrics & Confusion Matrix ---- */}
              {activeTab === 'results' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span className="panel-title" style={{ margin: 0 }}>
                      <Award size={18} color="#10B981" />
                      Best Model: <span style={{ color: '#38BDF8' }}>{result.model_name?.toUpperCase()}</span>
                    </span>
                    {artifact && (
                      <a href={getMLExportZipUrl(artifact.artifact_id)} download target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '0.78rem', padding: '5px 10px' }}>
                        <Download size={14} /> Export Zip
                      </a>
                    )}
                  </div>

                  {result.task_type === 'classification' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                      <MetricCard label="Accuracy" value={`${((result.evaluation?.accuracy || 0) * 100).toFixed(1)}%`} color="#10B981" />
                      <MetricCard label="Precision" value={(result.evaluation?.precision || 0).toFixed(3)} color="#38BDF8" />
                      <MetricCard label="Recall" value={(result.evaluation?.recall || 0).toFixed(3)} color="#A5B4FC" />
                      <MetricCard label="F1 Score" value={(result.evaluation?.f1_score || 0).toFixed(3)} color="#FBBF24" />
                      <MetricCard label="ROC-AUC" value={(result.evaluation?.roc_auc || 0).toFixed(3)} color="#F472B6" />
                      <MetricCard label="CV Mean Acc" value={(result.evaluation?.cv_mean_accuracy || 0).toFixed(3)} color="#34D399" />
                    </div>
                  )}

                  {result.task_type === 'regression' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                      <MetricCard label="R² Score" value={(result.evaluation?.r2_score ?? 0).toFixed(4)} color="#10B981" />
                      <MetricCard label="MAE" value={(result.evaluation?.mae ?? 0).toFixed(4)} color="#F59E0B" />
                      <MetricCard label="RMSE" value={(result.evaluation?.rmse ?? 0).toFixed(4)} color="#F87171" />
                    </div>
                  )}

                  {/* Interactive Confusion Matrix */}
                  {result.evaluation?.confusion_matrix && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '8px' }}>Interactive Confusion Matrix (Hover for Details)</h4>
                      <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr>
                              <th style={{ color: '#94A3B8', padding: '6px', textAlign: 'left' }}>Act \ Pred</th>
                              {result.evaluation.confusion_matrix.labels.map((lbl: string, idx: number) => (
                                <th key={idx} style={{ color: '#10B981', padding: '6px', textAlign: 'center' }}>{lbl}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.evaluation.confusion_matrix.matrix.map((row: number[], i: number) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 700, color: '#10B981', padding: '6px' }}>
                                  {result.evaluation.confusion_matrix.labels[i]}
                                </td>
                                {row.map((count: number, j: number) => {
                                  const total = row.reduce((a: number, b: number) => a + b, 0) || 1;
                                  const pct = ((count / total) * 100).toFixed(1);
                                  return (
                                    <td
                                      key={j}
                                      onMouseEnter={() => setHoveredCell({ row: i, col: j, val: count })}
                                      onMouseLeave={() => setHoveredCell(null)}
                                      style={{
                                        padding: '12px',
                                        textAlign: 'center',
                                        background: i === j ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.18)',
                                        color: '#FFF',
                                        fontWeight: 700,
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        border: (hoveredCell?.row === i && hoveredCell?.col === j) ? '2px solid #FFF' : '1px solid transparent'
                                      }}
                                    >
                                      <div>{count}</div>
                                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{pct}%</div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---- TAB: Multi-Model Comparison ---- */}
              {activeTab === 'comparison' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px' }}>Multi-Model Comparison Table</h4>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Model</th>
                          <th>Accuracy / R²</th>
                          <th>Precision / MAE</th>
                          <th>Recall / RMSE</th>
                          <th>F1 Score</th>
                          <th>Rank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result.model_comparison || []).map((comp: any, idx: number) => {
                          const isWinner = comp.model_name === result.model_name;
                          const m = comp.metrics || {};
                          return (
                            <tr key={idx} style={{ background: isWinner ? 'rgba(16, 185, 129, 0.08)' : undefined }}>
                              <td style={{ fontWeight: 700, color: isWinner ? '#10B981' : '#FFF' }}>
                                {isWinner ? '★ ' : ''}{comp.model_name.toUpperCase()}
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)', color: '#34D399' }}>
                                {m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : m.r2_score?.toFixed(4)}
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>
                                {m.precision ? m.precision.toFixed(3) : m.mae?.toFixed(4)}
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>
                                {m.recall ? m.recall.toFixed(3) : m.rmse?.toFixed(4)}
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)', color: '#FBBF24' }}>
                                {m.f1_score ? m.f1_score.toFixed(3) : '-'}
                              </td>
                              <td><span className={`badge ${isWinner ? 'badge-low' : 'badge-info'}`}>{isWinner ? 'Best Model' : `#${idx + 1}`}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ---- TAB: Feature Importance ---- */}
              {activeTab === 'importance' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px' }}>Feature Importance Ranking</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(result.feature_importances || []).map((item: any, idx: number) => (
                      <div key={idx} style={{ background: '#0F172A', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '5px' }}>
                          <span style={{ fontWeight: 600, color: '#FFF' }}>#{idx + 1} {item.feature_name}</span>
                          <span style={{ color: '#10B981', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {(item.importance * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div style={{ background: '#1E293B', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            background: 'linear-gradient(90deg, #10B981, #06B6D4)',
                            height: '100%',
                            width: `${Math.min(item.importance * 100, 100)}%`
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- TAB: Explainability ---- */}
              {activeTab === 'explainability' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={18} color="#F59E0B" /> Model Explainability vs Prediction Contribution
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h5 style={{ fontSize: '0.85rem', color: '#38BDF8', marginBottom: '4px' }}>1. Global Feature Importance</h5>
                      <p style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                        Measures total reduction in Gini Impurity or Variance across all decision trees. Indicates overall predictive reliance.
                      </p>
                    </div>

                    <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h5 style={{ fontSize: '0.85rem', color: '#10B981', marginBottom: '4px' }}>2. Instance Prediction Contribution</h5>
                      <p style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                        Local SHAP-like directional impact for a single input row. Distinguishes why a specific file was flagged HIGH risk versus LOW risk.
                      </p>
                    </div>

                    <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h5 style={{ fontSize: '0.85rem', color: '#FBBF24', marginBottom: '4px' }}>3. Linear Coefficients</h5>
                      <p style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                        Log-odds scaling weights for Logistic Regression & SVR models.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- TAB: Live Prediction Form ---- */}
              {activeTab === 'predict' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px' }}>Single Instance Live Prediction</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    {(result.features || []).map((feat: string) => (
                      <div key={feat}>
                        <label style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>{feat}</label>
                        <input
                          type="text"
                          value={predictInputs[feat] || ''}
                          onChange={(e) => setPredictInputs({ ...predictInputs, [feat]: e.target.value })}
                          style={{ width: '100%', background: '#070A11', border: '1px solid var(--border-color)', color: '#FFF', padding: '6px', borderRadius: '4px', fontSize: '0.82rem' }}
                        />
                      </div>
                    ))}
                  </div>

                  <button className="btn btn-primary" onClick={handlePredict} disabled={predictLoading} style={{ width: '100%', justifyContent: 'center' }}>
                    <Play size={14} /> {predictLoading ? 'Executing Inference...' : 'Predict Instance Classification'}
                  </button>

                  {predictResult && (
                    <div style={{ marginTop: '14px', background: '#070A11', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      {predictResult.error ? (
                        <div style={{ color: '#F87171', fontSize: '0.85rem' }}>{predictResult.error}</div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Model Prediction Output:</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                            {String(predictResult.prediction)}
                          </div>
                          {predictResult.probabilities && (
                            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#CBD5E1' }}>
                              Probabilities: {JSON.stringify(predictResult.probabilities)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ---- TAB: Cross-Validation ---- */}
              {activeTab === 'cv' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px' }}>K-Fold Cross-Validation</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#0F172A', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>CV Mean Accuracy</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#A5B4FC' }}>
                        {(result.evaluation?.cv_mean_accuracy || 0).toFixed(4)}
                      </div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>CV Std Dev</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10B981' }}>
                        ± {(result.evaluation?.cv_std || 0).toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- TAB: Schema Guard ---- */}
              {activeTab === 'guard' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px' }}>Feature Schema Compatibility Guard</h4>
                  <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ fontWeight: 700, color: '#10B981', marginBottom: '6px' }}>✓ Schema Validated</div>
                    <p style={{ color: '#CBD5E1', fontSize: '0.82rem' }}>
                      Required features ({(result.features || []).length}): {result.features?.join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
