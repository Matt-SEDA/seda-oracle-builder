'use client';

import { useState } from 'react';
import { DeployResult } from '@/lib/types';
import { callFastApi } from '@/lib/mcp-client';
import {
  generateCurlExample,
  generateJsExample,
  generatePythonExample,
} from '@/lib/code-templates';
import CodePreview from '@/components/CodePreview';

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
}

type CodeTab = 'curl' | 'javascript' | 'python';

interface Props {
  deployResult: DeployResult;
  assetSymbol: string;
  onBack: () => void;
}

/**
 * Convert a hex string (big-endian u128) to a USD price.
 * The tally phase outputs price scaled to 6 decimal places.
 */
function hexToPrice(hex: string): number | null {
  try {
    const clean = hex.replace(/^0x/i, '');
    if (!clean || !/^[0-9a-fA-F]+$/.test(clean)) return null;
    const value = BigInt('0x' + clean);
    if (value === BigInt(0)) return null;
    const price = Number(value) / 1_000_000;
    if (price < 0.0001 || price > 1_000_000_000) return null;
    return price;
  } catch {
    return null;
  }
}

/**
 * Extract human-readable USD price from the SEDA Fast API response.
 *
 * Real response shape (with encoding=json):
 * {
 *   data: {
 *     dataResult: { result: "00000000000000000000000080dc0310", exitCode: 0 },
 *     execute: { stdout: "...scaled_result=2161902352\n", exitCode: 0 },
 *     tally: { stdout: "Received price: 2161902352\n", exitCode: 0 }
 *   }
 * }
 *
 * dataResult.result is the big-endian hex u128 scaled to 6 decimals.
 */
function parsePrice(rawResult: string): number | null {
  try {
    const data = JSON.parse(rawResult);

    // Primary path: data.dataResult.result (hex-encoded big-endian u128)
    const drResult = data?.data?.dataResult?.result;
    if (typeof drResult === 'string' && /^[0-9a-fA-F]+$/.test(drResult)) {
      const price = hexToPrice(drResult);
      if (price !== null) return price;
    }

    // Fallback: parse scaled_result from execute stdout
    const execStdout = data?.data?.execute?.stdout;
    if (typeof execStdout === 'string') {
      const match = execStdout.match(/scaled_result=(\d+)/);
      if (match) {
        const val = Number(BigInt(match[1])) / 1_000_000;
        if (val > 0.0001 && val < 1_000_000_000) return val;
      }
    }

    // Fallback: parse "Received price:" from tally stdout
    const tallyStdout = data?.data?.tally?.stdout;
    if (typeof tallyStdout === 'string') {
      const match = tallyStdout.match(/Received price:\s*(\d+)/);
      if (match) {
        const val = Number(BigInt(match[1])) / 1_000_000;
        if (val > 0.0001 && val < 1_000_000_000) return val;
      }
    }

    // Fallback: top-level result hex (older response shapes)
    if (typeof data?.result === 'string' && /^(0x)?[0-9a-fA-F]+$/.test(data.result)) {
      const price = hexToPrice(data.result);
      if (price !== null) return price;
    }

    return null;
  } catch {
    return null;
  }
}

export default function ConnectStep({ deployResult, assetSymbol, onBack }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<CodeTab>('curl');
  const [copied, setCopied] = useState(false);
  const [parsedPrice, setParsedPrice] = useState<number | null>(null);
  const [showKey, setShowKey] = useState(false);

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    const result = await callFastApi(
      deployResult.programId,
      apiKey.trim(),
      deployResult.execInputs,
    );

    if (result.success) {
      const raw = typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2);
      setTestResult(raw);
      setParsedPrice(parsePrice(raw));
    } else {
      setTestError(result.error || 'Unknown error');
      setParsedPrice(null);
    }
    setIsTesting(false);
  };

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(deployResult.programId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeExamples: Record<CodeTab, { code: string; lang: string }> = {
    curl: { code: generateCurlExample(deployResult.programId, deployResult.execInputs), lang: 'bash' },
    javascript: { code: generateJsExample(deployResult.programId, deployResult.execInputs), lang: 'javascript' },
    python: { code: generatePythonExample(deployResult.programId, deployResult.execInputs), lang: 'python' },
  };

  return (
    <>
      <div className="step-content fade-up">
        <h2 className="step-content__title">Connect via SEDA Fast</h2>
        <p className="step-content__subtitle">
          Your Oracle Program is deployed. Connect it to your application using SEDA Fast for sub-50ms latency.
        </p>

        <div className="program-id-card">
          <div className="program-id-card__label">Your Oracle Program ID</div>
          <div className="program-id-card__value">{deployResult.programId}</div>
          <button className="program-id-card__copy" onClick={handleCopyId}>
            <CopyIcon />
            {copied ? 'Copied' : 'Copy Program ID'}
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section fade-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="cta-section__title">Get Your SEDA Fast API Key</h3>
        <p className="cta-section__text">
          Execute your Oracle Program via SEDA Fast with sub-50ms latency. Start with a free 7-day trial.
        </p>
        <a href="https://seda.xyz/dev" target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--large">
          Get API Key <ExternalLinkIcon />
        </a>
      </div>

      {/* Test Panel */}
      <div className="step-content fade-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="step-content__title" style={{ fontSize: '1.6rem' }}>Live Test</h3>
        <p className="step-content__subtitle">
          Enter your API key to test your Oracle Program in real-time.
        </p>

        <div className="test-panel">
          <div className="test-panel__row">
            <div className="test-panel__input-wrap">
              <input
                className="test-panel__input"
                type={showKey ? 'text' : 'password'}
                placeholder="fast_main_xxxxxxxxxxxxxxxx..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
              {apiKey && (
                <button
                  className="test-panel__toggle"
                  onClick={() => setShowKey(!showKey)}
                  type="button"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            <button className="btn btn--success" onClick={handleTest} disabled={!apiKey.trim() || isTesting}>
              {isTesting ? 'Executing...' : 'Execute'}
            </button>
          </div>
          {testResult && (
            <div className="price-result fade-up">
              <div className="price-result__pair">{assetSymbol}/USD</div>
              {parsedPrice !== null ? (
                <div className="price-result__value">
                  ${parsedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </div>
              ) : (
                <div className="price-result__value price-result__value--raw">
                  Executed successfully
                </div>
              )}
              <div className="price-result__source">via SEDA Oracle Program</div>
            </div>
          )}
          {testResult && (
            <details className="test-panel__details">
              <summary className="test-panel__summary">Raw API Response</summary>
              <div className="test-panel__result">{testResult}</div>
            </details>
          )}
          {testError && <div className="test-panel__result test-panel__error">{testError}</div>}
        </div>
      </div>

      {/* Code Examples */}
      <div className="step-content fade-up" style={{ animationDelay: '0.3s' }}>
        <h3 className="step-content__title" style={{ fontSize: '1.6rem' }}>Integration Examples</h3>
        <div className="code-tabs">
          <div className="code-tabs__bar">
            {(['curl', 'javascript', 'python'] as CodeTab[]).map((tab) => (
              <button key={tab} className={`code-tab ${activeTab === tab ? 'code-tab--active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'curl' ? 'cURL' : tab === 'javascript' ? 'JavaScript' : 'Python'}
              </button>
            ))}
          </div>
        </div>
        <CodePreview code={codeExamples[activeTab].code} language={codeExamples[activeTab].lang} />
      </div>

      <div className="step-nav">
        <button className="btn btn--secondary" onClick={onBack}>Back</button>
        <div />
      </div>
    </>
  );
}
