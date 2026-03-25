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
  onBack: () => void;
}

export default function ConnectStep({ deployResult, onBack }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<CodeTab>('curl');
  const [copied, setCopied] = useState(false);

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
      setTestResult(typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2));
    } else {
      setTestError(result.error || 'Unknown error');
    }
    setIsTesting(false);
  };

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(deployResult.programId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeExamples: Record<CodeTab, { code: string; lang: string }> = {
    curl: { code: generateCurlExample(deployResult.programId), lang: 'bash' },
    javascript: { code: generateJsExample(deployResult.programId), lang: 'javascript' },
    python: { code: generatePythonExample(deployResult.programId), lang: 'python' },
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
            <input
              className="test-panel__input"
              type="text"
              placeholder="fast_main_xxxxxxxxxxxxxxxx..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button className="btn btn--success" onClick={handleTest} disabled={!apiKey.trim() || isTesting}>
              {isTesting ? 'Executing...' : 'Execute'}
            </button>
          </div>
          {testResult && <div className="test-panel__result">{testResult}</div>}
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
