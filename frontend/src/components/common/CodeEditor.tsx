import React, { useMemo, useRef, useState } from 'react';
import { Play, Copy, Check, FileCode, AlertCircle, AlertTriangle, Save, Search, X } from 'lucide-react';
import { Diagnostic } from '../../types';

interface CodeEditorProps {
  value: string;
  onChange?: (val: string) => void;
  fileName?: string;
  readOnly?: boolean;
  diagnostics?: Diagnostic[];
  onAnalyze?: () => void;
  onSave?: () => void;
  isLoading?: boolean;
  onSelectLine?: (line: number) => void;
  selectedLine?: number | null;
  theme?: 'dark' | 'light';
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  fileName = 'SoftwareRiskAnalyzer.java',
  readOnly = false,
  diagnostics = [],
  onAnalyze,
  onSave,
  isLoading = false,
  onSelectLine,
  selectedLine,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const [copied, setCopied] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [scrollTop, setScrollTop] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const lines = value.split('\n');
  const diagnosticLines = useMemo(() => new Set(diagnostics.map((d) => d.line)), [diagnostics]);

  const updateCursor = (target: HTMLTextAreaElement) => {
    const before = target.value.slice(0, target.selectionStart);
    const line = before.split('\n').length;
    const lastBreak = before.lastIndexOf('\n');
    setCursor({ line, column: before.length - lastBreak });
  };

  const syncScroll = (target: HTMLTextAreaElement) => {
    if (gutterRef.current) gutterRef.current.scrollTop = target.scrollTop;
    setScrollTop(target.scrollTop);
  };

  const jumpToLine = (lineNum: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const starts = value.split('\n').slice(0, Math.max(0, lineNum - 1)).join('\n').length;
    const pos = lineNum <= 1 ? 0 : starts + 1;
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = pos;
    updateCursor(textarea);
    onSelectLine?.(lineNum);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveInternal = () => {
    if (onSave) onSave();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Tab key handling -> insert 4 spaces instead of blurring focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      if (onChange) onChange(newValue);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }

    // 2. Ctrl/Cmd + Enter -> Run Analysis
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onAnalyze && !isLoading) onAnalyze();
    }

    // 3. Ctrl/Cmd + S -> Save source
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveInternal();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setSearchOpen(true);
    }
  };

  const getDiagnosticsForLine = (lineNum: number) => {
    return diagnostics.filter((d) => d.line === lineNum);
  };

  return (
    <div style={{
      border: isLight ? '1px solid var(--border-light, #CBD5E1)' : '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg, 12px)',
      background: isLight ? '#FFFFFF' : '#0F172A',
      color: isLight ? '#0F172A' : '#F8FAFC',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isLight ? 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))' : 'var(--shadow-md)'
    }}>
      {/* Editor Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: isLight ? 'var(--bg-inset, #F8FAFC)' : '#1E293B',
        borderBottom: isLight ? '1px solid var(--border-light, #E2E8F0)' : '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={16} color={isLight ? '#4F46E5' : '#818CF8'} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isLight ? '#0F172A' : '#F8FAFC', fontFamily: 'var(--font-mono)' }}>
            {fileName}
          </span>
          <span style={{
            fontSize: '0.72rem',
            background: isLight ? '#E2E8F0' : '#334155',
            color: isLight ? '#475569' : '#94A3B8',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 600
          }}>
            {lines.length} LOC
          </span>
          {saveToast && (
            <span style={{
              fontSize: '0.72rem',
              color: '#059669',
              background: isLight ? '#ECFDF5' : 'rgba(52, 211, 153, 0.15)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600
            }}>
              ✓ Saved
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onSave && (
            <button
              onClick={handleSaveInternal}
              className="btn btn-secondary btn-sm"
              style={{
                background: isLight ? '#FFFFFF' : '#334155',
                color: isLight ? '#334155' : '#F8FAFC',
                border: isLight ? '1px solid #CBD5E1' : 'none',
                boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
              title="Save Source (Ctrl+S)"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            style={{
              background: isLight ? '#FFFFFF' : '#334155',
              color: isLight ? '#334155' : '#F8FAFC',
              border: isLight ? '1px solid #CBD5E1' : 'none',
              boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
            title="Copy Source"
          >
            {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onAnalyze && (
            <button
              onClick={onAnalyze}
              disabled={isLoading}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 14px' }}
              title="Run Analysis (Ctrl+Enter)"
            >
              <Play size={14} />
              <span>{isLoading ? 'Analyzing...' : 'Run Analysis (⌘↵)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Body Area */}
      {readOnly ? (
        <div style={{
          overflowX: 'auto',
          maxHeight: '480px',
          padding: '12px 0',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          lineHeight: '1.6'
        }}>
          {lines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const lineDiags = getDiagnosticsForLine(lineNum);
            const isSelected = selectedLine === lineNum;
            const hasError = lineDiags.some((d) => d.severity === 'error');
            const hasWarning = lineDiags.some((d) => d.severity === 'warning');

            return (
              <React.Fragment key={lineNum}>
                <div
                  onClick={() => onSelectLine && onSelectLine(lineNum)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    background: isSelected
                      ? 'rgba(99, 102, 241, 0.2)'
                      : hasError
                      ? 'rgba(239, 68, 68, 0.15)'
                      : hasWarning
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'transparent',
                    borderLeft: isSelected
                      ? '3px solid #6366F1'
                      : hasError
                      ? '3px solid #EF4444'
                      : hasWarning
                      ? '3px solid #F59E0B'
                      : '3px solid transparent',
                    cursor: onSelectLine ? 'pointer' : 'default'
                  }}
                >
                  <span style={{
                    width: '36px',
                    color: '#64748B',
                    textAlign: 'right',
                    paddingRight: '16px',
                    userSelect: 'none',
                    fontSize: '0.78rem'
                  }}>
                    {lineNum}
                  </span>

                  <span style={{ flex: 1, whiteSpace: 'pre', color: '#E2E8F0' }}>
                    {lineText || ' '}
                  </span>

                  {lineDiags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {hasError && <AlertCircle size={14} color="#EF4444" />}
                      {hasWarning && <AlertTriangle size={14} color="#F59E0B" />}
                    </div>
                  )}
                </div>

                {lineDiags.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      margin: '4px 16px 4px 52px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: d.severity === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: d.severity === 'error' ? '#FCA5A5' : '#FDE047',
                      border: `1px solid ${d.severity === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                    }}
                  >
                    {d.severity === 'error' ? <AlertCircle size={12} /> : <AlertTriangle size={12} />}
                    <span>
                      [{d.phase}] {d.message} (col {d.column})
                    </span>
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '64px minmax(0, 1fr)',
          minHeight: '420px',
          background: isLight ? '#FFFFFF' : '#0F172A'
        }}>
          {searchOpen && (
            <div style={{
              position: 'absolute',
              right: 12,
              top: 12,
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isLight ? '#FFFFFF' : '#111827',
              border: isLight ? '1px solid #CBD5E1' : '1px solid #334155',
              borderRadius: 6,
              padding: '6px 8px',
              boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
            }}>
              <Search size={14} color={isLight ? '#64748B' : '#94A3B8'} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find"
                autoFocus
                style={{
                  width: 160,
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  color: isLight ? '#0F172A' : '#E2E8F0',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem'
                }}
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                style={{ background: 'transparent', border: 0, color: isLight ? '#64748B' : '#94A3B8', cursor: 'pointer', display: 'flex' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Active Line Highlight overlay box */}
          <div
            style={{
              position: 'absolute',
              top: `${16 + (cursor.line - 1) * 22.4 - scrollTop}px`,
              left: 0,
              right: 0,
              height: '22.4px',
              background: isLight ? 'rgba(79, 70, 229, 0.05)' : 'rgba(255, 255, 255, 0.04)',
              borderTop: isLight ? '1px solid rgba(79, 70, 229, 0.15)' : '1px solid rgba(255, 255, 255, 0.12)',
              borderBottom: isLight ? '1px solid rgba(79, 70, 229, 0.15)' : '1px solid rgba(255, 255, 255, 0.12)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          <div
            ref={gutterRef}
            aria-hidden="true"
            style={{
              overflow: 'hidden',
              borderRight: isLight ? '1px solid #E2E8F0' : '1px solid #1E293B',
              padding: '16px 0',
              background: isLight ? '#F8FAFC' : '#0B1020',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              color: isLight ? '#94A3B8' : '#64748B',
              userSelect: 'none',
              position: 'relative',
              zIndex: 2
            }}
          >
            {lines.map((_, idx) => {
              const lineNum = idx + 1;
              const isSelected = selectedLine === lineNum || cursor.line === lineNum;
              const hasDiag = diagnosticLines.has(lineNum);
              return (
                <div
                  key={lineNum}
                  onClick={() => jumpToLine(lineNum)}
                  style={{
                    height: '1.6em',
                    lineHeight: '1.6',
                    padding: '0 10px',
                    textAlign: 'right',
                    borderLeft: hasDiag ? '3px solid #EF4444' : isSelected ? '3px solid #4F46E5' : '3px solid transparent',
                    background: isSelected ? (isLight ? 'rgba(79, 70, 229, 0.1)' : 'rgba(99, 102, 241, 0.14)') : 'transparent',
                    color: isSelected ? (isLight ? '#4338CA' : '#F8FAFC') : (isLight ? '#94A3B8' : '#64748B'),
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange?.(e.target.value);
              updateCursor(e.target);
            }}
            onKeyDown={handleKeyDown}
            onSelect={(e) => updateCursor(e.currentTarget)}
            onClick={(e) => updateCursor(e.currentTarget)}
            onScroll={(e) => syncScroll(e.currentTarget)}
            spellCheck={false}
            className="code-area"
            style={{
              minHeight: '420px',
              maxHeight: '620px',
              borderRadius: 0,
              border: 'none',
              outline: 'none',
              lineHeight: '1.6',
              resize: 'vertical',
              whiteSpace: 'pre',
              overflow: 'auto',
              tabSize: 4,
              background: isLight ? '#FFFFFF' : 'transparent',
              color: isLight ? '#0F172A' : '#F8FAFC',
              caretColor: isLight ? '#4338CA' : '#818cf8',
              position: 'relative',
              zIndex: 2
            }}
            placeholder="Write or paste source code here..."
          />
        </div>
      )}

      {/* Editor Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 16px',
        background: isLight ? '#F8FAFC' : '#070A11',
        borderTop: isLight ? '1px solid #E2E8F0' : '1px solid #1E293B',
        fontSize: '0.75rem',
        color: isLight ? '#64748B' : '#64748B',
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Java-like Source</span>
          <span>{lines.length} lines</span>
          <span>Ln {cursor.line}, Col {cursor.column}</span>
          <span>{diagnostics.length} diagnostics</span>
          <span>UTF-8</span>
        </div>
        <div>
          <span>Shortcuts: ⌘↵ Analyze | ⌘S Save | Tab Indent</span>
        </div>
      </div>
    </div>
  );
};
