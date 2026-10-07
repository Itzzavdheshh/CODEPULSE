import React, { useState } from 'react';
import {
  Brain, Play, Award, BarChart, CheckCircle2, AlertCircle,
  ShieldAlert, Layers, Download, ArrowRight, Table2, Sigma, RefreshCw
} from 'lucide-react';
import { MLResult, CodePulseArtifact } from '../types';
import { trainMLModel, getMLExportZipUrl } from '../services/api';
import { SAMPLE_CSV_SOFTWARE_METRICS, SAMPLE_CSV_IRIS } from '../utils/samples';

type MLTab = 'config' | 'results' | 'comparison' | 'importance' | 'guard' | 'cv';

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
  const [activeTab, setActiveTab] = useState<MLTab>('config');

  const availableModels = taskType === 'classification' ? CLASSIFICATION_MODELS
    : taskType === 'regression' ? REGRESSION_MODELS
    : CLUSTERING_MODELS;

  const handleTrain = async () => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    try {
      const res = await trainMLModel(csvText, targetColumn, modelName, taskType);
      setResult(res.ml_result);
      if (res.artifact) setArtifact(res.artifact);
      setActiveTab('results');
    } catch (err: any) {
      setErrorMsg(err.message || 'ML Model training failed.');
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, badge }: { id: MLTab; label: string; badge?: number }) => (
    <button
      className={`btn ${activeTab === id ? 'btn-primary' : 'btn-secondary'}`}
      onClick={() => setActiveTab(id)}
      style={{ fontSize: '0.78rem', padding: '6px 12px', position: 'relative' }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{ marginLeft: '5px', background: '#F59E0B', color: '#000', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>
          {badge}
        </span>
      )}
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
              Leakage-free preprocessing · Supervised Classification/Regression · K-Means Clustering · K-Fold CV ·
              Multi-Model Comparison · Feature Importance · Feature Schema Compatibility Guard.
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
            Model Configuration & Training Setup
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            {/* Task Type */}
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

            {/* Algorithm */}
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

            {/* Target Column (only for non-clustering) */}
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

            {/* CSV Dataset Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '4px' }}>Training Dataset (CSV)</label>
              <textarea
                className="code-area"
                rows={10}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV data here, or choose a sample above..."
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleTrain} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #10B981, #059669)', padding: '12px' }}>
            <Play size={16} />
            {loading ? 'Training & Evaluating All Models...' : 'Train Model & Run Full Evaluation'}
          </button>

          {errorMsg && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '0.85rem' }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}

          {/* Pipeline Architecture Info Box */}
          <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.78rem', color: '#94A3B8' }}>
            <div style={{ fontWeight: 700, color: '#10B981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldAlert size={14} /> Leakage-Free Pipeline Architecture
            </div>
            <ul style={{ paddingLeft: '14px', margin: 0, lineHeight: 1.7 }}>
              <li>StandardScaler fitted <strong>only on X_train</strong>, applied via <code>.transform()</code> to X_test</li>
              <li>LabelEncoder fitted <strong>only on training split</strong> — never on full dataset</li>
              <li>Stratified train/test split with class imbalance detection</li>
              <li>Feature schema compatibility validated <strong>before</strong> prediction</li>
            </ul>
          </div>
        </div>

        {/* RIGHT: Results Workspace */}
        <div className="glass-panel">
          {!result ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
              <Award size={56} color="#334155" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#94A3B8', fontWeight: 600 }}>ML Intelligence Workspace Idle</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>
                Configure your dataset, task type, and algorithm, then click "Train Model & Run Full Evaluation" to generate real evaluation metrics, model comparison table, and feature importance rankings.
              </p>
            </div>
          ) : (
            <div>
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px', overflowX: 'auto', flexWrap: 'wrap' }}>
                <TabButton id="results" label="Evaluation Metrics" />
                <TabButton id="comparison" label={`Model Comparison (${(result.model_comparison || []).length})`} />
                <TabButton id="importance" label={`Feature Importance (${(result.feature_importances || []).length})`} />
                <TabButton id="cv" label="Cross-Validation" />
                <TabButton id="guard" label="Schema Guard" />
              </div>

              {/* Imbalance Warning */}
              {result.imbalance_warning && (
                <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', color: '#F59E0B', fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{result.imbalance_warning}</span>
                </div>
              )}

              {/* ---- TAB: Evaluation Metrics ---- */}
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

                  {/* Metrics Cards */}
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
                      <MetricCard label="MSE" value={(result.evaluation?.mse ?? 0).toFixed(4)} color="#94A3B8" />
                      <MetricCard label="CV Mean R²" value={(result.evaluation?.cv_mean_r2 ?? 0).toFixed(3)} color="#38BDF8" />
                    </div>
                  )}

                  {result.task_type === 'clustering' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                      <MetricCard label="Silhouette Score" value={(result.evaluation?.silhouette_score || 0).toFixed(4)} color="#10B981" />
                      <MetricCard label="Clusters (k)" value={result.evaluation?.n_clusters || 0} color="#38BDF8" />
                    </div>
                  )}

                  {/* Confusion Matrix */}
                  {result.evaluation?.confusion_matrix && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '8px' }}>Confusion Matrix</h4>
                      <div style={{ background: '#0F172A', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
                                {row.map((count: number, j: number) => (
                                  <td key={j} style={{
                                    padding: '10px',
                                    textAlign: 'center',
                                    background: i === j ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.15)',
                                    color: '#FFF',
                                    fontWeight: 700,
                                    borderRadius: '4px'
                                  }}>
                                    {count}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Model Selection Rationale */}
                  {result.selected_model_rationale && (
                    <div style={{ padding: '10px 14px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '0.82rem', color: '#C7D2FE', marginTop: '4px' }}>
                      <strong style={{ color: '#A5B4FC' }}>Model Selection Rationale: </strong>
                      {result.selected_model_rationale}
                    </div>
                  )}
                </div>
              )}

              {/* ---- TAB: Multi-Model Comparison ---- */}
              {activeTab === 'comparison' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Table2 size={18} color="#38BDF8" /> Multi-Model Comparison Table
                  </h4>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Model</th>
                          {result.task_type === 'classification' ? (
                            <>
                              <th>Accuracy</th>
                              <th>Precision</th>
                              <th>Recall</th>
                              <th>F1</th>
                              <th>ROC-AUC</th>
                              <th>CV Mean</th>
                            </>
                          ) : (
                            <>
                              <th>R²</th>
                              <th>MAE</th>
                              <th>RMSE</th>
                              <th>CV Mean R²</th>
                            </>
                          )}
                          <th>Rank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result.model_comparison || []).map((comp: any, idx: number) => {
                          const isWinner = comp.model_name === result.model_name;
                          const m = comp.metrics || {};
                          return (
                            <tr key={idx} style={{ background: isWinner ? 'rgba(16, 185, 129, 0.08)' : undefined }}>
                              <td style={{ fontWeight: 700, color: isWinner ? '#10B981' : '#FFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {isWinner && <Award size={14} color="#10B981" />}
                                {comp.model_name.toUpperCase()}
                              </td>
                              {result.task_type === 'classification' ? (
                                <>
                                  <td style={{ fontFamily: 'var(--font-mono)', color: '#34D399' }}>{((m.accuracy || 0) * 100).toFixed(1)}%</td>
                                  <td style={{ fontFamily: 'var(--font-mono)' }}>{(m.precision || 0).toFixed(3)}</td>
                                  <td style={{ fontFamily: 'var(--font-mono)' }}>{(m.recall || 0).toFixed(3)}</td>
                                  <td style={{ fontFamily: 'var(--font-mono)', color: '#FBBF24' }}>{(m.f1_score || 0).toFixed(3)}</td>
                                  <td style={{ fontFamily: 'var(--font-mono)' }}>{(m.roc_auc || 0).toFixed(3)}</td>
                                  <td style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>{(m.cv_mean_accuracy || 0).toFixed(3)}</td>
                                </>
                              ) : (
                                <>
                                  <td style={{ fontFamily: 'var(--font-mono)', color: '#10B981' }}>{(m.r2_score || 0).toFixed(4)}</td>
                                  <td style={{ fontFamily: 'var(--font-mono)' }}>{(m.mae || 0).toFixed(4)}</td>
                                  <td style={{ fontFamily: 'var(--font-mono)' }}>{(m.rmse || 0).toFixed(4)}</td>
                                  <td style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>{(m.cv_mean_r2 || 0).toFixed(3)}</td>
                                </>
                              )}
                              <td><span className={`badge ${isWinner ? 'badge-low' : 'badge-info'}`}>{isWinner ? '★ Best' : `#${idx + 1}`}</span></td>
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
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart size={18} color="#FBBF24" /> Feature Contribution Ranking
                  </h4>
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
                            background: `linear-gradient(90deg, #10B981, #06B6D4)`,
                            height: '100%',
                            width: `${Math.min(item.importance * 100, 100)}%`,
                            transition: 'width 0.6s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                    {(result.feature_importances || []).length === 0 && (
                      <p style={{ color: '#64748B', fontSize: '0.85rem' }}>Feature importances are not available for this model type.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ---- TAB: Cross-Validation ---- */}
              {activeTab === 'cv' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sigma size={18} color="#A5B4FC" /> K-Fold Cross-Validation Summary
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ background: '#0F172A', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>CV Mean Accuracy / Score</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#A5B4FC', marginTop: '6px' }}>
                        {(result.evaluation?.cv_mean_accuracy || result.evaluation?.cv_mean_r2 || 0).toFixed(4)}
                      </div>
                    </div>
                    <div style={{ background: '#0F172A', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>CV Std Dev (Stability)</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: (result.evaluation?.cv_std || 0) > 0.05 ? '#F59E0B' : '#10B981', marginTop: '6px' }}>
                        ± {(result.evaluation?.cv_std || 0).toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', background: 'rgba(165, 180, 252, 0.08)', borderRadius: '8px', border: '1px solid rgba(165, 180, 252, 0.2)', fontSize: '0.82rem', color: '#C7D2FE' }}>
                    <strong style={{ color: '#A5B4FC' }}>Interpretation: </strong>
                    {(result.evaluation?.cv_std || 0) > 0.05
                      ? 'High standard deviation detected — model performance is unstable across folds. Consider regularization or more training data.'
                      : 'Low standard deviation indicates the model generalizes consistently across K-Fold splits — reliable generalization performance.'}
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '0.8rem', color: '#64748B' }}>
                    <p>Cross-validation was performed with K=min(5, floor(n_train/2)) folds to handle small datasets gracefully. The scaler was re-fitted inside each fold to prevent data leakage.</p>
                  </div>
                </div>
              )}

              {/* ---- TAB: Feature Schema Compatibility Guard ---- */}
              {activeTab === 'guard' && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={18} color="#F59E0B" /> Feature Schema Compatibility Guard
                  </h4>
                  <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '14px' }}>
                    <div style={{ fontWeight: 700, color: '#10B981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} /> Model Schema Validated
                    </div>
                    <p style={{ color: '#CBD5E1', fontSize: '0.82rem' }}>
                      This trained model requires the following feature schema to be present before any prediction is executed.
                      If any feature is missing, the prediction endpoint will return a <code>prediction_available: false</code> response
                      with diagnostic details — <strong>no partial predictions are ever produced</strong>.
                    </p>
                  </div>

                  <h5 style={{ color: '#94A3B8', fontSize: '0.82rem', marginBottom: '8px' }}>REQUIRED FEATURES ({(result.features || []).length}):</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {(result.features || []).map((f: string, idx: number) => (
                      <span key={idx} className="badge badge-info" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '4px 10px' }}>
                        ✓ {f}
                      </span>
                    ))}
                  </div>

                  <h5 style={{ color: '#94A3B8', fontSize: '0.82rem', marginBottom: '8px' }}>TARGET COLUMN:</h5>
                  <span className="badge badge-low" style={{ fontFamily: 'var(--font-mono)', padding: '4px 12px' }}>
                    → {result.target_column || 'N/A (Clustering)'}
                  </span>

                  <div style={{ marginTop: '16px', padding: '10px 14px', background: '#0F172A', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: '#F59E0B' }}>{'// Prediction API Guard (Credibility Rules #33 & #56)'}</span><br/>
                    <span>{'if (missing_features.length > 0) {'}</span><br/>
                    <span style={{ paddingLeft: '16px' }}>{'return { prediction_available: false, error: "Schema mismatch" };'}</span><br/>
                    <span>{'}'}</span>
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
