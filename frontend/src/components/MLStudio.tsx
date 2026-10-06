import React, { useState } from 'react';
import { Brain, Play, Award, BarChart, CheckCircle2, AlertCircle } from 'lucide-react';
import { MLResult } from '../types';
import { trainMLModel } from '../services/api';
import { SAMPLE_CSV_SOFTWARE_METRICS } from '../utils/samples';

export const MLStudio: React.FC = () => {
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV_SOFTWARE_METRICS);
  const [targetColumn, setTargetColumn] = useState<string>('risk_level');
  const [modelName, setModelName] = useState<string>('random_forest');
  const [taskType, setTaskType] = useState<string>('classification');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<MLResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleTrain = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await trainMLModel(csvText, targetColumn, modelName, taskType);
      setResult(res.ml_result);
    } catch (err: any) {
      setErrorMsg(err.message || 'ML Model training failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Banner */}
      <div className="glass-panel" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(16, 185, 129, 0.15))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFF' }}>Machine Learning Intelligence Studio</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Supervised classification/regression & unsupervised K-Means clustering with rigorous evaluation metrics (Precision, Recall, F1, ROC-AUC, Confusion Matrix) and feature importance explainability.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => setCsvText(SAMPLE_CSV_SOFTWARE_METRICS)}>
            Use Software Metrics Dataset
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Model Configuration */}
        <div className="glass-panel">
          <span className="panel-title">
            <Brain size={18} color="#10B981" />
            Model Configuration & Training Setup
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '4px' }}>Task Category</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
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
                <option value="random_forest">Random Forest Classifier / Regressor</option>
                <option value="decision_tree">Decision Tree</option>
                <option value="logistic_regression">Logistic / Linear Regression</option>
                <option value="naive_bayes">Naive Bayes Classifier</option>
                <option value="kmeans">K-Means Clustering</option>
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
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94A3B8', marginBottom: '4px' }}>Training Dataset CSV</label>
              <textarea
                className="code-area"
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleTrain} disabled={loading} style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <Play size={16} />
            {loading ? 'Training & Evaluating Model...' : 'Train Model & Compute Metrics'}
          </button>

          {errorMsg && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '0.85rem' }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Right Column: Model Performance Results */}
        <div className="glass-panel">
          {!result ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <Award size={48} color="#334155" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#94A3B8', fontWeight: 600 }}>No ML Results Evaluated</h3>
              <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>Configure your model and click "Train Model & Compute Metrics" to generate real evaluation scores and feature importance rankings.</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="panel-title" style={{ margin: 0 }}>
                  <Award size={18} color="#10B981" />
                  Performance Evaluation Results
                </span>
                <span className="badge badge-low">{result.model_name.toUpperCase()}</span>
              </div>

              {/* Evaluation Metrics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Accuracy / Score</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10B981' }}>
                    {((result.evaluation.accuracy || result.evaluation.silhouette_score || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>F1 Score</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38BDF8' }}>
                    {result.evaluation.f1_score ? result.evaluation.f1_score.toFixed(3) : 'N/A'}
                  </div>
                </div>
                <div style={{ background: '#0F172A', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>ROC-AUC Score</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#A5B4FC' }}>
                    {result.evaluation.roc_auc ? result.evaluation.roc_auc.toFixed(3) : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Confusion Matrix Table */}
              {result.evaluation.confusion_matrix && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '8px' }}>Confusion Matrix</h4>
                  <div style={{ background: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th style={{ color: '#94A3B8', padding: '6px' }}>Actual / Pred</th>
                          {result.evaluation.confusion_matrix.labels.map((lbl, idx) => (
                            <th key={idx} style={{ color: '#10B981', padding: '6px' }}>{lbl}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.evaluation.confusion_matrix.matrix.map((row, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600, color: '#10B981', padding: '6px' }}>
                              {result.evaluation.confusion_matrix?.labels[i]}
                            </td>
                            {row.map((count, j) => (
                              <td key={j} style={{
                                padding: '10px',
                                textAlign: 'center',
                                background: i === j ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.15)',
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

              {/* Feature Importance Ranking */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#FFF', marginBottom: '10px' }}>Feature Importance Ranking</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.feature_importances.map((item, idx) => (
                    <div key={idx} style={{ background: '#0F172A', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#FFF' }}>{item.feature_name}</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>{(item.importance * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ background: '#1E293B', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ background: 'linear-gradient(90deg, #10B981, #06B6D4)', height: '100%', width: `${item.importance * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
