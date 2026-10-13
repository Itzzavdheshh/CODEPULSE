import React, { useState } from 'react';
import { Brain, Play, Award, BarChart, CheckCircle2, AlertCircle, ShieldAlert, Layers, Download, ArrowRight, Table2, Sigma, RefreshCw, Zap, Sliders } from 'lucide-react';
import { MLResult, CodePulseArtifact } from '../types';
import { trainMLModel, predictMLInstance, getMLExportZipUrl } from '../services/api';
import { SAMPLE_CSV_SOFTWARE_METRICS, SAMPLE_CSV_IRIS } from '../utils/samples';
import { MetricCard } from './common/MetricCard';
import { EmptyState } from './common/EmptyState';
import { LoadingState } from './common/LoadingState';
import { ErrorCard } from './common/ErrorCard';

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
  { value: 'mean_shift', label: 'Mean-Shift Clustering' },
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

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header Card */}
      <div className="cp-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-info">ML INTELLIGENCE ENGINE</span>
              {result && (
                <span className="badge badge-low">
                  MODEL: {result.model_name?.toUpperCase()}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Machine Learning Studio &amp; Risk Intelligence
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Train predictive models, prevent data leakage, evaluate precision/recall, and generate live defect predictions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setCsvText(SAMPLE_CSV_SOFTWARE_METRICS); setTargetColumn('risk_level'); setTaskType('classification'); }}>
              Sample: Software Defect Metrics
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setCsvText(SAMPLE_CSV_IRIS); setTargetColumn('species'); setTaskType('classification'); }}>
              Sample: Iris Classification
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Config Left vs Results Right */}
      <div className="grid-2" style={{ alignItems: 'start', marginBottom: '24px' }}>
        {/* Left Column: Configuration & Training */}
        <div className="cp-card">
          <h2 className="panel-title">
            <Layers size={18} color="var(--brand-primary)" />
            Model Setup &amp; Training Pipeline
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Task Type</label>
              <select
                value={taskType}
                onChange={(e) => {
                  setTaskType(e.target.value);
                  if (e.target.value === 'clustering') setModelName('kmeans');
                  else setModelName('random_forest');
                }}
                className="cp-select"
                style={{ width: '100%' }}
              >
                <option value="classification">Supervised Classification</option>
                <option value="regression">Supervised Regression</option>
                <option value="clustering">Unsupervised Clustering (K-Means)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Algorithm Architecture</label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="cp-select"
                style={{ width: '100%' }}
              >
                {availableModels.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            {taskType !== 'clustering' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Attribute Column</label>
                <input
                  type="text"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="cp-input"
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Training Dataset (CSV)</label>
              <textarea
                className="code-area"
                rows={10}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV training dataset..."
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleTrain} disabled={loading} style={{ width: '100%' }}>
            <Play size={16} />
            {loading ? 'Training & Evaluating Models...' : 'Train Model & Evaluate Risk'}
          </button>
        </div>

        {/* Right Column: ML Results Workspace */}
        <div>
          {loading && (
            <LoadingState
              title="Training ML Models & Validating Feature Schemas..."
              steps={[
                { label: 'Validating Dataset & Target Column', status: 'completed' },
                { label: 'Fitting Scaler on Training Fold (Leakage-Safe)', status: 'running' },
                { label: 'Training Random Forest & SVM Models', status: 'pending' },
                { label: 'Evaluating F1, ROC-AUC & Confusion Matrix', status: 'pending' }
              ]}
            />
          )}

          {errorMsg && (
            <ErrorCard
              title="ML Model Training Error"
              message={errorMsg}
              recommendation="Ensure target column exists, target classes have enough samples (>2 per split), and feature columns are numeric."
              onRetry={handleTrain}
            />
          )}

          {!loading && !errorMsg && !result && (
            <EmptyState
              title="No ML Model Evaluation Yet"
              description="Select target column and click 'Train Model' to train leakage-safe classifier models and predict risk levels."
              actionText="Train Model Now"
              onAction={handleTrain}
              icon={Brain}
              featuresList={['Leakage-Safe Scaler', 'Multi-Model Comparison', 'Feature Importance', 'Confusion Matrix', 'Live Prediction Panel']}
            />
          )}

          {!loading && result && (
            <div>
              {/* Summary KPIs */}
              <div className="grid-3" style={{ marginBottom: '16px' }}>
                {result.task_type === 'clustering' ? (
                  <>
                    <MetricCard
                      title="Silhouette Score"
                      value={result.evaluation?.silhouette_score !== undefined ? Number(result.evaluation.silhouette_score).toFixed(3) : 'N/A'}
                      badgeText="SPATIAL"
                      badgeType="low"
                      description={`Algorithm: ${result.model_name.toUpperCase()}`}
                    />
                    <MetricCard
                      title="Cluster Count"
                      value={String(result.evaluation?.n_clusters ?? 'N/A')}
                      badgeText="Partitions"
                      badgeType="info"
                      description="Estimated clusters / groupings"
                    />
                    <MetricCard
                      title="Dataset Size"
                      value={`${result.dataset_size ?? 0} Samples`}
                      badgeText="Unsupervised"
                      badgeType="low"
                      description={`Features: ${result.features?.length || 0}`}
                    />
                  </>
                ) : result.task_type === 'regression' ? (
                  <>
                    <MetricCard
                      title="R² Score"
                      value={result.evaluation?.r2_score !== undefined ? Number(result.evaluation.r2_score).toFixed(3) : 'N/A'}
                      badgeText="BEST MODEL"
                      badgeType="low"
                      description={`Algorithm: ${result.model_name.toUpperCase()}`}
                    />
                    <MetricCard
                      title="MAE"
                      value={result.evaluation?.mae !== undefined ? Number(result.evaluation.mae).toFixed(3) : 'N/A'}
                      badgeText="Error"
                      badgeType="info"
                      description="Mean Absolute Error"
                    />
                    <MetricCard
                      title="RMSE"
                      value={result.evaluation?.rmse !== undefined ? Number(result.evaluation.rmse).toFixed(3) : 'N/A'}
                      badgeText="Root Error"
                      badgeType="low"
                      description="Root Mean Squared Error"
                    />
                  </>
                ) : (
                  <>
                    <MetricCard
                      title="Model Accuracy"
                      value={result.evaluation?.accuracy !== undefined ? `${(Number(result.evaluation.accuracy) * 100).toFixed(1)}%` : 'N/A'}
                      badgeText="BEST MODEL"
                      badgeType="low"
                      description={`Algorithm: ${result.model_name.toUpperCase()}`}
                    />
                    <MetricCard
                      title="F1 Score"
                      value={result.evaluation?.f1_score !== undefined ? Number(result.evaluation.f1_score).toFixed(3) : 'N/A'}
                      badgeText="Balanced"
                      badgeType="info"
                      description="Harmonic mean of precision & recall"
                    />
                    <MetricCard
                      title="CV Mean Score"
                      value={result.evaluation?.cv_mean_accuracy !== undefined ? Number(result.evaluation.cv_mean_accuracy).toFixed(3) : 'N/A'}
                      badgeText={`±${(result.evaluation?.cv_std || 0).toFixed(3)}`}
                      badgeType="low"
                      description="K-Fold Cross-Validation Accuracy"
                    />
                  </>
                )}
              </div>

              {/* Subtabs */}
              <div className="cp-tabs">
                <button className={`cp-tab-btn ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
                  Metrics &amp; Matrix
                </button>
                <button className={`cp-tab-btn ${activeTab === 'comparison' ? 'active' : ''}`} onClick={() => setActiveTab('comparison')}>
                  Model Comparison
                </button>
                <button className={`cp-tab-btn ${activeTab === 'importance' ? 'active' : ''}`} onClick={() => setActiveTab('importance')}>
                  Feature Importance
                </button>
                <button className={`cp-tab-btn ${activeTab === 'predict' ? 'active' : ''}`} onClick={() => setActiveTab('predict')}>
                  Live Prediction
                </button>
              </div>

              {/* Tab 1: Confusion Matrix */}
              {activeTab === 'results' && (
                <div className="cp-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Interactive Confusion Matrix</h3>
                    {artifact && (
                      <a href={getMLExportZipUrl(artifact.artifact_id)} download target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                        <Download size={14} /> Export Bundle Zip
                      </a>
                    )}
                  </div>

                  {result.evaluation?.confusion_matrix && (
                    <div className="data-table-container" style={{ padding: '12px' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Actual \ Predicted</th>
                            {result.evaluation.confusion_matrix.labels.map((lbl: string, idx: number) => (
                              <th key={idx} style={{ textAlign: 'center' }}>{lbl}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.evaluation.confusion_matrix.matrix.map((row: number[], i: number) => (
                            <tr key={i}>
                              <td><strong>{result.evaluation.confusion_matrix.labels[i]}</strong></td>
                              {row.map((count: number, j: number) => (
                                <td
                                  key={j}
                                  style={{
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    background: i === j ? 'var(--color-emerald-light)' : 'var(--color-rose-light)',
                                    color: i === j ? 'var(--color-emerald)' : 'var(--color-rose)'
                                  }}
                                >
                                  {count}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Model Comparison */}
              {activeTab === 'comparison' && (
                <div className="cp-card">
                  <h3 className="panel-title">Multi-Model Performance Comparison</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Algorithm</th>
                          <th>Accuracy / R²</th>
                          <th>Precision / MAE</th>
                          <th>Recall / RMSE</th>
                          <th>F1 Score</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result.model_comparison || []).map((comp: any, idx: number) => {
                          const isWinner = comp.model_name === result.model_name;
                          const m = comp.metrics || {};
                          return (
                            <tr key={idx}>
                              <td><strong>{comp.model_name.toUpperCase()}</strong></td>
                              <td>{m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : m.r2_score?.toFixed(4)}</td>
                              <td>{m.precision ? m.precision.toFixed(3) : m.mae?.toFixed(4)}</td>
                              <td>{m.recall ? m.recall.toFixed(3) : m.rmse?.toFixed(4)}</td>
                              <td><strong>{m.f1_score ? m.f1_score.toFixed(3) : '-'}</strong></td>
                              <td>{isWinner ? <span className="badge badge-low">SELECTED BEST</span> : <span className="badge badge-info">EVALUATED</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Feature Importance */}
              {activeTab === 'importance' && (
                <div className="cp-card">
                  <h3 className="panel-title">Feature Importance Rankings</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(result.feature_importances || []).map((item: any, idx: number) => (
                      <div key={idx} style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                          <span><strong>#{idx + 1}</strong> {item.feature_name}</span>
                          <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{(item.importance * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ background: 'var(--border-light)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(item.importance * 100, 100)}%`, height: '100%', background: 'var(--brand-primary)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Live Prediction */}
              {activeTab === 'predict' && (
                <div className="cp-card">
                  <h3 className="panel-title">Live Instance Prediction Panel</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    {(result.features || []).map((feat: string) => (
                      <div key={feat}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>{feat}</label>
                        <input
                          type="text"
                          value={predictInputs[feat] || ''}
                          onChange={(e) => setPredictInputs({ ...predictInputs, [feat]: e.target.value })}
                          className="cp-input"
                        />
                      </div>
                    ))}
                  </div>

                  <button className="btn btn-primary" onClick={handlePredict} disabled={predictLoading} style={{ width: '100%' }}>
                    <Play size={14} /> {predictLoading ? 'Predicting...' : result?.task_type === 'regression' ? 'Predict Target Value' : result?.task_type === 'clustering' ? 'Assign Cluster' : 'Predict Software Defect Risk'}
                  </button>

                  {predictResult && (
                    <div style={{ marginTop: '16px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary-light)', border: '1px solid var(--brand-primary)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {result?.task_type === 'regression' ? 'Predicted Value:' : result?.task_type === 'clustering' ? 'Assigned Cluster:' : 'Predicted Classification:'}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '2px' }}>
                        {String(predictResult.predicted_class ?? predictResult.prediction ?? predictResult.cluster_id ?? predictResult.value ?? 'N/A')}
                      </div>
                      {predictResult.probabilities && (
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Calibrated Probabilities: {JSON.stringify(predictResult.probabilities)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
