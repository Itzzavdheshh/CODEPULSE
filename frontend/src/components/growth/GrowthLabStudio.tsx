import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LineChart,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Bookmark,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Compass,
  Code2,
  Sliders,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CodeEditor } from '../common/CodeEditor';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';
import { ErrorCard } from '../common/ErrorCard';
import { BigOBadge } from './BigOBadge';
import { GrowthChart } from './GrowthChart';
import { SamplesTable } from './SamplesTable';
import { CompareBars } from './CompareBars';
import { inspectGrowthSource, runGrowthAnalysis } from '../../services/api';
import {
  GrowthInspectResponse,
  GrowthLabResponse,
  GrowthMethodInfo
} from '../../types';

interface PresetItem {
  id: string;
  label: string;
  category: string;
  code: string;
  defaultMethod: string;
  defaultSizeParam: string;
  customSizes?: string;
}

const PRESETS: PresetItem[] = [
  {
    id: 'constant',
    label: 'Constant Time O(1)',
    category: 'O(1)',
    code: `public class ConstantTime {
    public static int compute(int n) {
        int a = 42;
        int b = a * 2;
        return b;
    }
}`,
    defaultMethod: 'compute',
    defaultSizeParam: 'n'
  },
  {
    id: 'a1',
    label: 'Single Loop Sum (A1) O(n)',
    category: 'O(n)',
    code: `public class SingleLoopSum {
    public static int sumLoop(int n) {
        int s = 0;
        for (int i = 0; i < n; i = i + 1) {
            s = s + i;
        }
        return s;
    }
}`,
    defaultMethod: 'sumLoop',
    defaultSizeParam: 'n'
  },
  {
    id: 'while_loop',
    label: 'While Loop O(n)',
    category: 'O(n)',
    code: `public class WhileSum {
    public static int sumWhile(int n) {
        int s = 0;
        int i = 0;
        while (i < n) {
            s = s + i;
            i = i + 1;
        }
        return s;
    }
}`,
    defaultMethod: 'sumWhile',
    defaultSizeParam: 'n'
  },
  {
    id: 'nested',
    label: 'Nested Loops (n × n) O(n²)',
    category: 'O(n²)',
    code: `public class NestedLoops {
    public static int countNested(int n) {
        int c = 0;
        for (int i = 0; i < n; i = i + 1) {
            for (int j = 0; j < n; j = j + 1) {
                c = c + 1;
            }
        }
        return c;
    }
}`,
    defaultMethod: 'countNested',
    defaultSizeParam: 'n'
  },
  {
    id: 'triple_nested',
    label: 'Triple Nested Loops O(n³)',
    category: 'O(n³)',
    code: `public class TripleNested {
    public static int triple(int n) {
        int c = 0;
        for (int i = 0; i < n; i = i + 1) {
            for (int j = 0; j < n; j = j + 1) {
                for (int k = 0; k < n; k = k + 1) {
                    c = c + 1;
                }
            }
        }
        return c;
    }
}`,
    defaultMethod: 'triple',
    defaultSizeParam: 'n'
  },
  {
    id: 'logarithmic',
    label: 'Logarithmic Loop O(log n)',
    category: 'O(log n)',
    code: `public class Logarithmic {
    public static int logLoop(int n) {
        int c = 0;
        int i = 1;
        while (i < n) {
            c = c + 1;
            i = i * 2;
        }
        return c;
    }
}`,
    defaultMethod: 'logLoop',
    defaultSizeParam: 'n'
  },
  {
    id: 'n_log_n',
    label: 'N-Log-N Loop O(n log n)',
    category: 'O(n log n)',
    code: `public class NLogN {
    public static int nLogN(int n) {
        int c = 0;
        for (int i = 0; i < n; i = i + 1) {
            int j = 1;
            while (j < n) {
                c = c + 1;
                j = j * 2;
            }
        }
        return c;
    }
}`,
    defaultMethod: 'nLogN',
    defaultSizeParam: 'n'
  },
  {
    id: 'square_root',
    label: 'Square Root Loop O(√n)',
    category: 'O(√n)',
    code: `public class SquareRoot {
    public static int sqrtLoop(int n) {
        int c = 0;
        int i = 0;
        while (i * i < n) {
            c = c + 1;
            i = i + 1;
        }
        return c;
    }
}`,
    defaultMethod: 'sqrtLoop',
    defaultSizeParam: 'n'
  },
  {
    id: 'factorial',
    label: 'Factorial (Recursion) O(n)',
    category: 'O(n)',
    code: `public class Factorial {
    public static int fact(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * fact(n - 1);
    }
}`,
    defaultMethod: 'fact',
    defaultSizeParam: 'n'
  },
  {
    id: 'fibonacci',
    label: 'Fibonacci (Exponential) O(2ⁿ)',
    category: 'O(2ⁿ)',
    code: `public class Fibonacci {
    public static int fib(int n) {
        if (n <= 1) {
            return n;
        }
        return fib(n - 1) + fib(n - 2);
    }
}`,
    defaultMethod: 'fib',
    defaultSizeParam: 'n',
    customSizes: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18'
  }
];

export const GrowthLabStudio: React.FC = () => {
  // Source & Presets
  const [selectedPresetId, setSelectedPresetId] = useState<string>('a1');
  const [sourceCode, setSourceCode] = useState<string>(PRESETS[1].code);

  // Inspection state
  const [inspection, setInspection] = useState<GrowthInspectResponse | null>(null);
  const [isInspectLoading, setIsInspectLoading] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('sumLoop');
  const [selectedSizeParam, setSelectedSizeParam] = useState<string>('n');
  const [fixedArgs, setFixedArgs] = useState<Record<string, string>>({});
  const [customSizesInput, setCustomSizesInput] = useState<string>('');
  const [variant, setVariant] = useState<'optimized' | 'raw' | 'both'>('optimized');
  const [autoRun, setAutoRun] = useState<boolean>(false);

  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Execution state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [growthResult, setGrowthResult] = useState<GrowthLabResponse | null>(null);
  const [prevClassification, setPrevClassification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedArtifactId, setSavedArtifactId] = useState<string | null>(null);
  const [isSavingArtifact, setIsSavingArtifact] = useState<boolean>(false);

  // Abort controller refs for cancelling in-flight requests
  const inspectAbortRef = useRef<AbortController | null>(null);
  const runAbortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Inspect Source Code whenever code changes
  const runInspect = useCallback(async (codeToInspect: string) => {
    if (inspectAbortRef.current) {
      inspectAbortRef.current.abort();
    }
    inspectAbortRef.current = new AbortController();

    setIsInspectLoading(true);
    try {
      const data = await inspectGrowthSource(codeToInspect, inspectAbortRef.current.signal);
      setInspection(data);

      if (data.ok && data.methods.length > 0) {
        const currentMethodExists = data.methods.some((m) => m.name === selectedMethod);
        const targetM = currentMethodExists
          ? data.methods.find((m) => m.name === selectedMethod)!
          : data.methods[0];

        setSelectedMethod(targetM.name);

        const paramNames = targetM.params.map((p) => p.name);
        if (!paramNames.includes(selectedSizeParam) && paramNames.length > 0) {
          setSelectedSizeParam(paramNames[0]);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Inspection failed:', err);
      }
    } finally {
      setIsInspectLoading(false);
    }
  }, [selectedMethod, selectedSizeParam]);

  // Initial inspect on mount
  useEffect(() => {
    runInspect(sourceCode);
  }, []);

  // Preset Selection Handler
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setSourceCode(preset.code);
    setSelectedMethod(preset.defaultMethod);
    setSelectedSizeParam(preset.defaultSizeParam);
    setCustomSizesInput(preset.customSizes || '');
    setFixedArgs({});
    setFormErrors({});
    setGrowthResult(null);
    setErrorMessage(null);
    setSavedArtifactId(null);
    runInspect(preset.code);
  };

  // Validate form fields before sending
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedMethod) {
      errors.method = 'Please select a method to measure.';
    }

    if (!selectedSizeParam) {
      errors.sizeParam = 'Please select a size parameter.';
    }

    const methodObj = inspection?.methods.find((m) => m.name === selectedMethod);
    if (methodObj) {
      methodObj.params.forEach((param) => {
        if (param.name !== selectedSizeParam) {
          const valStr = fixedArgs[param.name];
          if (valStr !== undefined && valStr.trim() !== '') {
            const numVal = Number(valStr);
            if (isNaN(numVal) || !isFinite(numVal)) {
              errors[param.name] = `Parameter '${param.name}' must be a finite number.`;
            } else if (param.type === 'int' && !Number.isInteger(numVal)) {
              errors[param.name] = `Parameter '${param.name}' of type int must be an integer.`;
            }
          }
        }
      });
    }

    if (customSizesInput.trim()) {
      const parts = customSizesInput.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length > 40) {
        errors.sizes = 'At most 40 sizes allowed in ladder.';
      }
      for (const p of parts) {
        const num = Number(p);
        if (!/^\d+$/.test(p) || isNaN(num) || num <= 0 || num > 100000) {
          errors.sizes = `Invalid size '${p}': must be positive integers <= 100000.`;
          break;
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [inspection, selectedMethod, selectedSizeParam, fixedArgs, customSizesInput]);

  // Execute Growth Lab Analysis
  const handleRunAnalysis = useCallback(async () => {
    if (!validateForm()) return;
    if (inspection && !inspection.ok) return;

    if (runAbortRef.current) {
      runAbortRef.current.abort();
    }
    runAbortRef.current = new AbortController();

    setIsLoading(true);
    setErrorMessage(null);
    setSavedArtifactId(null);

    try {
      let parsedSizes: number[] | undefined = undefined;
      if (customSizesInput.trim()) {
        parsedSizes = customSizesInput
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n) && n > 0 && n <= 100000);
      }

      const parsedFixed: Record<string, number> = {};
      const methodObj = inspection?.methods.find((m) => m.name === selectedMethod);
      if (methodObj) {
        methodObj.params.forEach((param) => {
          if (param.name !== selectedSizeParam) {
            const rawVal = fixedArgs[param.name];
            if (rawVal !== undefined && rawVal.trim() !== '') {
              parsedFixed[param.name] = Number(rawVal);
            }
          }
        });
      }

      const res = await runGrowthAnalysis(
        {
          source_code: sourceCode,
          method: selectedMethod,
          size_param: selectedSizeParam,
          fixed_args: Object.keys(parsedFixed).length > 0 ? parsedFixed : undefined,
          sizes: parsedSizes,
          variant: variant,
          save_artifact: false
        },
        runAbortRef.current.signal
      );

      if (growthResult?.fit?.classification) {
        setPrevClassification(growthResult.fit.classification);
      }
      setGrowthResult(res);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'Growth analysis execution failed.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    sourceCode,
    selectedMethod,
    selectedSizeParam,
    fixedArgs,
    customSizesInput,
    variant,
    inspection,
    growthResult,
    validateForm
  ]);

  // Handle Code Changes with optional Auto-Run debounce
  const handleCodeChange = (newCode: string) => {
    setSourceCode(newCode);
    setSavedArtifactId(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runInspect(newCode);
      if (autoRun) {
        handleRunAnalysis();
      }
    }, 700);
  };

  // Save Artifact Handler
  const handleSaveArtifact = async () => {
    if (!growthResult || isSavingArtifact) return;
    setIsSavingArtifact(true);
    try {
      let parsedSizes: number[] | undefined = undefined;
      if (customSizesInput.trim()) {
        parsedSizes = customSizesInput
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n) && n > 0);
      }

      const res = await runGrowthAnalysis({
        source_code: sourceCode,
        method: selectedMethod,
        size_param: selectedSizeParam,
        sizes: parsedSizes,
        variant: variant,
        save_artifact: true
      });

      if (res.artifact?.artifact_id) {
        setSavedArtifactId(res.artifact.artifact_id);
      }
    } catch (err: any) {
      setErrorMessage(`Failed to save artifact: ${err.message}`);
    } finally {
      setIsSavingArtifact(false);
    }
  };

  const activeMethodParams = inspection?.methods.find((m) => m.name === selectedMethod)?.params || [];
  const nonSizeParams = activeMethodParams.filter((p) => p.name !== selectedSizeParam);
  const hasErrors = Boolean(inspection && !inspection.ok);

  const staticHint = growthResult?.static_hint;
  const measuredClass = growthResult?.fit?.classification;
  const isAgreement = staticHint && measuredClass
    ? (staticHint.has_recursion ? 'recursion' : staticHint.hint_class.toLowerCase()) === measuredClass.toLowerCase()
    : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Top Banner & Control Bar */}
      <div style={{
        background: 'var(--bg-surface, #FFFFFF)',
        border: '1px solid var(--border-light, #E2E8F0)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '18px 26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4F46E5, #0284C7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 2px 10px rgba(79, 70, 229, 0.3)'
          }}>
            <LineChart size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)', margin: 0, letterSpacing: '-0.01em' }}>
              Growth Lab Studio
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #475569)', marginTop: '2px' }}>
              Empirical Algorithmic Complexity • TAC Step Decomposition • Cost metric: <strong style={{ color: 'var(--text-primary, #0F172A)' }}>abstract cost (TAC steps), not physical time</strong>
            </div>
          </div>
        </div>

        {/* Global Controls & Run Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #475569)', fontWeight: 600 }}>Preset:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              style={{
                background: 'var(--bg-surface, #FFFFFF)',
                border: '1px solid var(--border-light, #CBD5E1)',
                color: 'var(--text-primary, #0F172A)',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* TAC Variant */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #475569)', fontWeight: 600 }}>Variant:</span>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value as any)}
              style={{
                background: 'var(--bg-surface, #FFFFFF)',
                border: '1px solid var(--border-light, #CBD5E1)',
                color: 'var(--text-primary, #0F172A)',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              <option value="optimized">Optimized TAC</option>
              <option value="raw">Raw TAC</option>
              <option value="both">Both (Compare)</option>
            </select>
          </div>

          {/* Auto-Run Toggle */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'var(--text-secondary, #475569)',
            fontWeight: 500,
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
              style={{ cursor: 'pointer', width: '15px', height: '15px' }}
            />
            Auto-run while typing
          </label>

          {/* Run Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={isLoading || hasErrors}
            style={{
              background: hasErrors ? '#94A3B8' : 'linear-gradient(135deg, #4F46E5, #4338CA)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: hasErrors || isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: hasErrors ? 'none' : '0 2px 10px rgba(79, 70, 229, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <Play size={15} />
            {isLoading ? 'Measuring Ladder...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* TOP SECTION: Code Editor Expanded to Complete Left + Configuration Panel on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.5fr) minmax(350px, 1fr)',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* Left: Code Editor (Expanded to Complete Left, Pure Light Theme) */}
        <CodeEditor
          value={sourceCode}
          onChange={handleCodeChange}
          fileName="GrowthSource.java"
          diagnostics={inspection?.diagnostics as any}
          isLoading={isInspectLoading}
          theme="light"
        />

        {/* Right: Dynamic Measurement Configuration Card */}
        <div style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-light, #E2E8F0)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light, #E2E8F0)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--brand-primary, #4F46E5)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
                Measurement Configuration
              </h3>
            </div>
            {inspection?.ok && (
              <div style={{ fontSize: '0.74rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <CheckCircle size={14} />
                Inspection Verified
              </div>
            )}
          </div>

          {hasErrors ? (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '0.78rem',
              color: '#991B1B'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Compiler Diagnostics (Resolve before execution):</div>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                {inspection?.diagnostics.map((d, i) => (
                  <li key={i}>
                    Line {d.line}:{d.column} — {d.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Method Selector */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #334155)', display: 'block', marginBottom: '5px' }}>
                  Method to Measure:
                </label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface, #FFFFFF)',
                    border: '1px solid var(--border-light, #CBD5E1)',
                    color: 'var(--text-primary, #0F172A)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  {inspection?.methods.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}({m.params.map((p) => `${p.type} ${p.name}`).join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Size Parameter Selector */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #334155)', display: 'block', marginBottom: '5px' }}>
                  Size Parameter (Grows along ladder):
                </label>
                <select
                  value={selectedSizeParam}
                  onChange={(e) => setSelectedSizeParam(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface, #FFFFFF)',
                    border: '1px solid var(--border-light, #CBD5E1)',
                    color: 'var(--text-primary, #0F172A)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}
                >
                  {activeMethodParams.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Remaining Fixed Parameters */}
              {nonSizeParams.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #334155)' }}>
                    Fixed Parameters (default 0 for int, 0.0 for double):
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    {nonSizeParams.map((p) => (
                      <div key={p.name}>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)', display: 'block', marginBottom: '3px' }}>
                          {p.name} ({p.type}):
                        </label>
                        <input
                          type="text"
                          placeholder="0"
                          value={fixedArgs[p.name] ?? ''}
                          onChange={(e) => {
                            setFixedArgs({ ...fixedArgs, [p.name]: e.target.value });
                            setFormErrors({ ...formErrors, [p.name]: '' });
                          }}
                          style={{
                            width: '100%',
                            background: 'var(--bg-surface, #FFFFFF)',
                            border: formErrors[p.name] ? '1px solid #DC2626' : '1px solid var(--border-light, #CBD5E1)',
                            color: 'var(--text-primary, #0F172A)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-mono, monospace)'
                          }}
                        />
                        {formErrors[p.name] && (
                          <span style={{ fontSize: '0.7rem', color: '#DC2626' }}>{formErrors[p.name]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ladder Override Input */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #334155)', display: 'block', marginBottom: '5px' }}>
                  Custom Sizes Ladder (Optional, comma-separated integers, max 40):
                </label>
                <input
                  type="text"
                  placeholder="1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096"
                  value={customSizesInput}
                  onChange={(e) => {
                    setCustomSizesInput(e.target.value);
                    setFormErrors({ ...formErrors, sizes: '' });
                  }}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface, #FFFFFF)',
                    border: formErrors.sizes ? '1px solid #DC2626' : '1px solid var(--border-light, #CBD5E1)',
                    color: 'var(--text-primary, #0F172A)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}
                />
                {formErrors.sizes && (
                  <span style={{ fontSize: '0.7rem', color: '#DC2626', display: 'block', marginTop: '3px' }}>{formErrors.sizes}</span>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)', display: 'block', marginTop: '4px' }}>
                  Default ladder: 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LOWER SECTION: "Detected Complexity Class" and Analysis Results Moved Down in Page */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {errorMessage && (
          <ErrorCard
            title="Execution Error"
            message={errorMessage}
            onRetry={handleRunAnalysis}
          />
        )}

        {isLoading ? (
          <LoadingState
            title="Measuring VM Execution Steps across Input Sizes..."
            steps={[
              { label: 'Compiling Java AST and partition TAC instructions', status: 'completed' },
              { label: `Interpreting ladder steps for ${selectedMethod}()`, status: 'running' },
              { label: 'NumPy least-squares polynomial decomposition & hint verification', status: 'pending' },
            ]}
          />
        ) : !growthResult ? (
          <EmptyState
            title="Complexity Analysis Not Executed Yet"
            description="Configure your Java method above and click 'Run Analysis' to execute the ladder in the TAC interpreter, generate empirical step counts, fit polynomial curves, and view the Big-O class."
            actionText="Run Analysis Now"
            onAction={handleRunAnalysis}
            icon={Compass}
            featuresList={[
              'Deterministic TAC Step Counter (Zero fake data)',
              'Hand-crafted SVG Linear & Log-Log Scaling',
              'Raw vs Optimized Instruction Reduction',
              'Break-It Live Complexity Transition'
            ]}
          />
        ) : (
          <>
            {/* Section Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderBottom: '2px solid var(--border-light, #E2E8F0)',
              paddingBottom: '10px',
              marginTop: '8px'
            }}>
              <Layers size={20} color="var(--brand-primary, #4F46E5)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #0F172A)', margin: 0 }}>
                Complexity Analysis Results
              </h3>
            </div>

            {/* Row 1: Detected Complexity Class (BigOBadge) & Static Hint vs Measured */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
              gap: '20px',
              alignItems: 'stretch'
            }}>
              {/* Big-O Badge Card */}
              <BigOBadge
                classification={growthResult.fit.classification}
                prevClassification={prevClassification}
                confidence={growthResult.fit.confidence}
                r2={growthResult.fit.r2}
                formula={growthResult.fit.formula}
                costModel={growthResult.cost_model}
                validPointsCount={growthResult.fit.valid_points_count}
              />

              {/* Static Hint vs Measured Card */}
              {staticHint && (
                <div style={{
                  background: 'var(--bg-surface, #FFFFFF)',
                  border: '1px solid var(--border-light, #E2E8F0)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  padding: '22px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HelpCircle size={18} color="var(--brand-primary, #4F46E5)" />
                        <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--text-muted, #64748B)' }}>
                          Static AST Structure Hint
                        </span>
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: isAgreement ? '#ECFDF5' : '#FFFBEB',
                        border: `1px solid ${isAgreement ? '#A7F3D0' : '#FDE68A'}`,
                        color: isAgreement ? '#065F46' : '#92400E'
                      }}>
                        {isAgreement ? 'Static Hint Matched' : 'Diverges from Syntax'}
                      </span>
                    </div>

                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                      Syntactic Guess vs Measured:&nbsp;
                      <span style={{ color: isAgreement ? '#059669' : '#D97706', fontWeight: 800 }}>
                        {isAgreement ? 'AGREES' : 'DISAGREES'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #475569)', marginTop: '8px', lineHeight: 1.6 }}>
                      • Syntactic Loop Depth: <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{staticHint.loop_depth}</strong><br />
                      • Recursion Flagged: <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{staticHint.has_recursion ? 'Yes' : 'No'}</strong><br />
                      • Structural Guess: <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{staticHint.hint_class}</strong>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted, #64748B)',
                    fontStyle: 'italic',
                    borderTop: '1px solid var(--border-light, #E2E8F0)',
                    paddingTop: '10px'
                  }}>
                    Label: Static code structure hint based on backward jumps, not mathematical proof.
                  </div>
                </div>
              )}
            </div>

            {/* Row 2: Hand-written SVG Growth Chart Spanning Full Width */}
            <GrowthChart
              samples={growthResult.samples}
              fit={growthResult.fit}
              rawSamples={growthResult.variants?.raw.samples}
              variant={variant}
            />

            {/* Row 3: Raw vs Optimized Comparison Bars (if variant === 'both') */}
            {variant === 'both' && growthResult.variants && (
              <CompareBars variants={growthResult.variants} />
            )}

            {/* Row 4: Empirical Evidence & Samples Table Spanning Full Width */}
            <SamplesTable
              samples={growthResult.samples}
              fit={growthResult.fit}
              truncatedReason={growthResult.truncated_reason}
            />

            {/* Row 5: Save as Artifact Export Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              background: 'var(--bg-surface, #FFFFFF)',
              border: '1px solid var(--border-light, #E2E8F0)',
              borderRadius: 'var(--radius-lg, 12px)',
              boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                  Export to Repository Provenance
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #475569)' }}>
                  Persist as immutable <code>growth_analysis</code> artifact for audit lineage and cross-engine analysis
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {savedArtifactId && (
                  <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    Saved Artifact ID: {savedArtifactId.slice(0, 8)}...
                  </span>
                )}
                <button
                  onClick={handleSaveArtifact}
                  disabled={isSavingArtifact}
                  style={{
                    background: savedArtifactId ? '#ECFDF5' : 'var(--bg-inset, #F1F5F9)',
                    border: `1px solid ${savedArtifactId ? '#059669' : 'var(--border-light, #CBD5E1)'}`,
                    color: savedArtifactId ? '#065F46' : 'var(--text-primary, #0F172A)',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: isSavingArtifact ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Bookmark size={15} />
                  {isSavingArtifact ? 'Saving...' : (savedArtifactId ? 'Saved to Repository' : 'Save as Artifact')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
