import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, Play, FileCode, CheckCircle2, Network, X, Upload, 
  Archive, FolderUp, FileText, ArrowRight, AlertTriangle, 
  ExternalLink, Trash2, Eye, ShieldAlert, Cpu
} from 'lucide-react';
import { analyzeProject, uploadProjectZip } from '../services/api';

export interface ProjectSourceFile {
  file_name: string;
  relative_path: string;
  source_code: string;
}

interface MultiFileProjectModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAnalyzeProject?: (projectData: any) => void;
  onLoadFileIntoStudio?: (sourceCode: string, fileName: string) => void;
  initialProjectData?: any;
}

const SAMPLE_PROJECT_FILES: ProjectSourceFile[] = [
  {
    file_name: "Main.java",
    relative_path: "src/com/codepulse/Main.java",
    source_code: `package com.codepulse;

public class Main {
    public static void main(String[] args) {
        int orderAmount = 250;
        int discounted = PaymentService.processPayment(orderAmount);
        boolean logged = AuditLogger.logTransaction(discounted);
        System.out.println(discounted);
    }
}`
  },
  {
    file_name: "PaymentService.java",
    relative_path: "src/com/codepulse/PaymentService.java",
    source_code: `package com.codepulse;

public class PaymentService {
    public static int processPayment(int amount) {
        if (amount > 100) {
            return amount - 25;
        } else if (amount > 50) {
            return amount - 5;
        }
        return amount;
    }
}`
  },
  {
    file_name: "AuditLogger.java",
    relative_path: "src/com/codepulse/AuditLogger.java",
    source_code: `package com.codepulse;

public class AuditLogger {
    public static boolean logTransaction(int recordId) {
        if (recordId <= 0) {
            return false;
        }
        int status = 1;
        return true;
    }
}`
  }
];

export const MultiFileProjectModal: React.FC<MultiFileProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onAnalyzeProject,
  onLoadFileIntoStudio,
  initialProjectData
}) => {
  const [files, setFiles] = useState<ProjectSourceFile[]>(SAMPLE_PROJECT_FILES);
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [projectData, setProjectData] = useState<any | null>(initialProjectData || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'files' | 'dependencies' | 'metrics'>('files');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const zipInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const multiFilesInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialProjectData) {
      setProjectData(initialProjectData);
      setActiveTab('dependencies');
    }
  }, [initialProjectData]);

  if (isOpen === false) return null;

  const supportedExtensions = ['.java', '.c', '.cpp', '.h', '.hpp', '.js', '.ts', '.txt', '.py'];

  // Handle ZIP File Upload
  const handleZipUpload = async (file: File) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string) || '';
          const res = await uploadProjectZip(base64, file.name);
          if (res.files && res.files.length > 0) {
            setFiles(res.files);
            setSelectedFileIdx(0);
          }
          if (res.analysis) {
            setProjectData(res.analysis);
            setActiveTab('dependencies');
            if (onAnalyzeProject) onAnalyzeProject(res.analysis);
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to process ZIP archive');
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read ZIP file');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading ZIP');
      setLoading(false);
    }
  };

  // Handle Multiple Source Files or Folder
  const handleSourceFilesUpload = async (rawFiles: FileList | File[]) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const fileList = Array.from(rawFiles);
      const matched = fileList.filter((f) => {
        const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
        return supportedExtensions.includes(ext);
      });

      if (matched.length === 0) {
        setErrorMsg(`No supported source code files found. Supported: ${supportedExtensions.join(', ')}`);
        setLoading(false);
        return;
      }

      const readPromises = matched.map(async (file) => {
        const text = await file.text();
        const relPath = (file as any).webkitRelativePath || file.name;
        return {
          file_name: file.name,
          relative_path: relPath,
          source_code: text
        };
      });

      const loaded = await Promise.all(readPromises);
      setFiles(loaded);
      setSelectedFileIdx(0);
      setProjectData(null); // Reset until analyze is clicked
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to read uploaded source files');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    const zip = droppedFiles.find(f => f.name.toLowerCase().endsWith('.zip') || f.name.toLowerCase().endsWith('.jar'));
    if (zip) {
      await handleZipUpload(zip);
    } else {
      await handleSourceFilesUpload(droppedFiles);
    }
  };

  // Analyze Project Request
  const handleAnalyze = async () => {
    if (files.length === 0) {
      setErrorMsg('Please upload or select at least one source file first.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = files.map(f => ({
        file_name: f.file_name,
        relative_path: f.relative_path,
        source_code: f.source_code
      }));
      const res = await analyzeProject(payload);
      setProjectData(res);
      setActiveTab('dependencies');
      if (onAnalyzeProject) onAnalyzeProject(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Multi-file project analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (idx: number) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    if (selectedFileIdx >= updated.length) {
      setSelectedFileIdx(Math.max(0, updated.length - 1));
    }
  };

  const currentFile = files[selectedFileIdx] || files[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(6px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div 
        className="cp-card" 
        style={{ 
          width: '100%', 
          maxWidth: '1120px', 
          maxHeight: '92vh', 
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          padding: 0
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
            }}>
              <Layers size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Multi-File Project &amp; ZIP Archive Analyzer
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Ingest complete repositories, .zip archives, or directories to map cross-file class dependencies.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleAnalyze} 
              disabled={loading || files.length === 0}
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={14} />
              {loading ? 'Analyzing Project...' : `Analyze Complete Project (${files.length} Files)`}
            </button>
            {onClose && (
              <button 
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0f172a'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input 
          ref={zipInputRef} 
          type="file" 
          accept=".zip,.jar" 
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleZipUpload(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />
        <input 
          ref={folderInputRef} 
          type="file" 
          // @ts-ignore
          webkitdirectory="" 
          directory="" 
          multiple 
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleSourceFilesUpload(e.target.files);
              e.target.value = '';
            }
          }}
        />
        <input 
          ref={multiFilesInputRef} 
          type="file" 
          accept=".java,.c,.cpp,.h,.hpp,.js,.ts,.txt,.py" 
          multiple 
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleSourceFilesUpload(e.target.files);
              e.target.value = '';
            }
          }}
        />

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} />
              {errorMsg}
            </div>
          )}

          {/* Ingestion Action Strip & Drag-and-Drop Area */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: isDragOver ? '2px dashed #6366f1' : '1.5px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '18px 24px',
              background: isDragOver ? 'rgba(99, 102, 241, 0.05)' : '#f8fafc',
              marginBottom: '20px',
              transition: 'all 0.2s ease',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#e0e7ff', color: '#4f46e5',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Upload size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                  Drag &amp; drop your Project <code style={{ color: '#4f46e5' }}>.ZIP</code> archive or source files here
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Supports ZIP bundles, folder hierarchies, and multi-file Java / C / C++ / TypeScript codebases.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => zipInputRef.current?.click()}
                disabled={loading}
                style={{ background: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Archive size={14} color="#6366f1" /> Upload .ZIP Archive
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => folderInputRef.current?.click()}
                disabled={loading}
                style={{ background: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FolderUp size={14} color="#059669" /> Select Folder
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => multiFilesInputRef.current?.click()}
                disabled={loading}
                style={{ background: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileCode size={14} color="#d97706" /> Choose Source Files
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFiles(SAMPLE_PROJECT_FILES);
                  setSelectedFileIdx(0);
                  setProjectData(null);
                }}
                disabled={loading}
                style={{ background: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                💡 Load Sample Files
              </button>
            </div>
          </div>

          {/* Project Summary Banner (When Analyzed) */}
          {projectData && (
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    Project Analysis Complete — {projectData.project_name || 'MultiFileJavaProject'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: projectData.project_risk_level === 'CRITICAL' ? '#fee2e2' :
                                projectData.project_risk_level === 'HIGH' ? '#ffedd5' :
                                projectData.project_risk_level === 'MODERATE' ? '#fef3c7' : '#d1fae5',
                    color: projectData.project_risk_level === 'CRITICAL' ? '#b91c1c' :
                           projectData.project_risk_level === 'HIGH' ? '#c2410c' :
                           projectData.project_risk_level === 'MODERATE' ? '#b45309' : '#047857'
                  }}>
                    PROJECT RISK: {projectData.project_risk_level}
                  </span>
                </div>
              </div>

              {/* Metric KPI Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>FILES ANALYZED</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {projectData.files_analyzed || projectData.files_count}
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TOTAL LOC</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5', marginTop: '2px' }}>
                    {projectData.total_loc}
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>TOTAL TOKENS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {projectData.total_tokens}
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>MAX V(G)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: projectData.max_cyclomatic_complexity > 10 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
                    {projectData.max_cyclomatic_complexity}
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>DIAGNOSTICS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: projectData.total_diagnostics > 0 ? '#f59e0b' : '#10b981', marginTop: '2px' }}>
                    {projectData.total_diagnostics}
                  </div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>DEPENDENCIES</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b5cf6', marginTop: '2px' }}>
                    {projectData.dependencies?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Subtabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <button
              onClick={() => setActiveTab('files')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: activeTab === 'files' ? '#4f46e5' : '#64748b',
                borderBottom: activeTab === 'files' ? '2px solid #4f46e5' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              📁 Project Files ({files.length})
            </button>
            {projectData && (
              <>
                <button
                  onClick={() => setActiveTab('dependencies')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: activeTab === 'dependencies' ? '#4f46e5' : '#64748b',
                    borderBottom: activeTab === 'dependencies' ? '2px solid #4f46e5' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  🔗 Cross-File Class Dependencies ({projectData.dependencies?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('metrics')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'transparent',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: activeTab === 'metrics' ? '#4f46e5' : '#64748b',
                    borderBottom: activeTab === 'metrics' ? '2px solid #4f46e5' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  📊 File-by-File Compiler Breakdown
                </button>
              </>
            )}
          </div>

          {/* TAB 1: FILES LIST & CODE PREVIEW */}
          {activeTab === 'files' && (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', minHeight: '340px' }}>
              {/* File List Column */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                maxHeight: '380px',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', padding: '4px 8px', textTransform: 'uppercase' }}>
                  Project Manifest ({files.length} Files)
                </div>
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedFileIdx(idx)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: selectedFileIdx === idx ? '#e0e7ff' : '#ffffff',
                      border: selectedFileIdx === idx ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FileCode size={15} color={selectedFileIdx === idx ? '#4f46e5' : '#64748b'} />
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                          {file.file_name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {file.source_code.split('\n').length} lines
                        </div>
                      </div>
                    </div>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Code Preview Column */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '10px 14px',
                  background: '#f1f5f9',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={14} color="#6366f1" />
                    Preview: <code>{currentFile?.relative_path || currentFile?.file_name}</code>
                  </div>
                  {onLoadFileIntoStudio && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => onLoadFileIntoStudio(currentFile.source_code, currentFile.file_name)}
                    >
                      <ExternalLink size={12} /> Open File in Studio
                    </button>
                  )}
                </div>
                <pre style={{
                  margin: 0,
                  padding: '14px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  background: '#f8fafc',
                  color: '#0f172a',
                  flex: 1,
                  maxHeight: '330px',
                  overflowY: 'auto'
                }}>
                  {currentFile?.source_code}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: CROSS-FILE DEPENDENCIES */}
          {activeTab === 'dependencies' && projectData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Declared Classes Section */}
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  DECLARED CLASSES ACROSS PROJECT ({projectData.declared_classes?.length || 0})
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {projectData.declared_classes?.map((cls: string, i: number) => (
                    <span 
                      key={i}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: '#e0e7ff',
                        color: '#4338ca',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: '1px solid #c7d2fe'
                      }}
                    >
                      class {cls}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cross-file dependencies list */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  Cross-File Class Invocations &amp; Import Graph
                </h4>
                {(!projectData.dependencies || projectData.dependencies.length === 0) ? (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    fontSize: '0.85rem'
                  }}>
                    No external cross-file class references detected between files in this project.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
                    {projectData.dependencies.map((dep: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>
                            {dep.from_file}
                          </span>
                          <ArrowRight size={14} color="#8b5cf6" />
                          <span style={{
                            background: '#f3e8ff',
                            color: '#7e22ce',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}>
                            {dep.uses_class}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                          Resolved ✓
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FILE-BY-FILE METRICS BREAKDOWN */}
          {activeTab === 'metrics' && projectData && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '10px 14px' }}>FILE NAME</th>
                    <th style={{ padding: '10px 14px' }}>LINES</th>
                    <th style={{ padding: '10px 14px' }}>TOKENS</th>
                    <th style={{ padding: '10px 14px' }}>V(G) COMPLEXITY</th>
                    <th style={{ padding: '10px 14px' }}>DIAGNOSTICS</th>
                    <th style={{ padding: '10px 14px' }}>RISK</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {projectData.file_analyses?.map((fileAnalysis: any, i: number) => {
                    const metrics = fileAnalysis.metrics || {};
                    const stats = fileAnalysis.stats || {};
                    const risk = metrics.risk_level || 'LOW';
                    return (
                      <tr 
                        key={i}
                        style={{ 
                          borderBottom: i < projectData.file_analyses.length - 1 ? '1px solid #f1f5f9' : 'none',
                          background: i % 2 === 0 ? '#ffffff' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                          {fileAnalysis.relative_path || fileAnalysis.file_name}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>
                          {stats.lines || 0}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>
                          {stats.tokens_count || 0}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: (metrics.cyclomatic_complexity || 1) > 10 ? '#ef4444' : '#10b981' }}>
                          {metrics.cyclomatic_complexity || 1}
                        </td>
                        <td style={{ padding: '10px 14px', color: stats.diagnostics_count > 0 ? '#f59e0b' : '#10b981' }}>
                          {stats.diagnostics_count || 0}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: risk === 'CRITICAL' ? '#fee2e2' : risk === 'HIGH' ? '#ffedd5' : risk === 'MODERATE' ? '#fef3c7' : '#d1fae5',
                            color: risk === 'CRITICAL' ? '#b91c1c' : risk === 'HIGH' ? '#c2410c' : risk === 'MODERATE' ? '#b45309' : '#047857'
                          }}>
                            {risk}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          {onLoadFileIntoStudio && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                              onClick={() => {
                                onLoadFileIntoStudio(fileAnalysis.source_code, fileAnalysis.file_name);
                                if (onClose) onClose();
                              }}
                            >
                              Open in Studio
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Multi-file static analysis parses individual ASTs, extracts symbol definitions, and detects cross-file class linkage.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onClose && (
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
