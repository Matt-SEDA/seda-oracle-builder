'use client';

import { useState, useMemo } from 'react';
import { DataSourceConfig, LogicConfig, LogicTemplate } from '@/lib/types';
import { generateMainCode } from '@/lib/code-templates';
import CodePreview from '@/components/CodePreview';

interface TemplateOption {
  id: LogicTemplate;
  name: string;
  description: string;
  badge?: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'simple-price',
    name: 'Simple Price Feed',
    description: 'Fetch the price from your data source and forward it as-is. Best for straightforward price oracle use cases.',
    badge: 'Recommended',
  },
  {
    id: 'ema-smoothing',
    name: 'EMA Smoothing',
    description: 'Apply Exponential Moving Average to smooth price volatility. Configurable window size.',
  },
  {
    id: 'multi-source',
    name: 'Multi-Source Blending',
    description: 'Aggregate prices from multiple data sources and compute the median for higher reliability.',
  },
  {
    id: 'custom',
    name: 'Custom Logic',
    description: 'Write your own Rust execution logic from scratch. Full control over data fetching and processing.',
  },
];

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

interface Props {
  dataSource: DataSourceConfig;
  config: LogicConfig | null;
  onComplete: (config: LogicConfig) => void;
  onBack: () => void;
}

export default function LogicStep({ dataSource, config, onComplete, onBack }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<LogicTemplate>(config?.template || 'simple-price');
  const [emaWindow, setEmaWindow] = useState(config?.emaWindow || 14);
  const [customCode, setCustomCode] = useState(config?.customCode || '');

  const generatedCode = useMemo(
    () => generateMainCode(selectedTemplate, dataSource),
    [selectedTemplate, dataSource]
  );

  const displayCode = selectedTemplate === 'custom' && customCode
    ? customCode
    : generatedCode;

  const handleNext = () => {
    onComplete({
      template: selectedTemplate,
      emaWindow: selectedTemplate === 'ema-smoothing' ? emaWindow : undefined,
      customCode: selectedTemplate === 'custom' ? (customCode || generatedCode) : undefined,
      generatedExecCode: displayCode,
      generatedTallyCode: '', // included in main code
    });
  };

  return (
    <>
      <div className="step-content fade-up">
        <h2 className="step-content__title">Configure Logic</h2>
        <p className="step-content__subtitle">
          Choose how your Oracle Program processes data for {dataSource.feedBase}/{dataSource.feedQuote}.
        </p>

        {/* Template Selection */}
        <div className="step-section">
          <div className="step-section__label">Logic Template</div>
          <div className="template-grid">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                className={`template-card ${selectedTemplate === t.id ? 'template-card--selected' : ''}`}
                onClick={() => setSelectedTemplate(t.id)}
              >
                <div className="template-card__header">
                  <span className="template-card__name">{t.name}</span>
                  {t.badge && <span className="template-card__badge">{t.badge}</span>}
                </div>
                <div className="template-card__desc">{t.description}</div>
              </div>
            ))}
          </div>

          {/* EMA window config */}
          {selectedTemplate === 'ema-smoothing' && (
            <div className="ema-config fade-up">
              <span className="ema-config__label">EMA Window:</span>
              <input
                className="ema-config__input"
                type="number"
                min={2}
                max={200}
                value={emaWindow}
                onChange={(e) => setEmaWindow(Number(e.target.value) || 14)}
              />
              <span className="ema-config__label">periods</span>
            </div>
          )}
        </div>

        {/* Code Preview */}
        <div className="step-section">
          <div className="step-section__label">Generated Oracle Program</div>

          {selectedTemplate === 'custom' ? (
            <textarea
              className="code-editor"
              value={customCode || generatedCode}
              onChange={(e) => setCustomCode(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <CodePreview code={generatedCode} />
          )}

          <div className="info-note">
            <span className="info-note__icon"><InfoIcon /></span>
            <span className="info-note__text">
              Tally phase is auto-configured for SEDA Fast — single executor, JSON encoding. The same program works on SEDA Core with minimal changes.
            </span>
          </div>
        </div>
      </div>

      <div className="step-nav">
        <button className="btn btn--secondary" onClick={onBack}>Back</button>
        <button className="btn btn--primary" onClick={handleNext}>
          Next: Build &amp; Deploy
        </button>
      </div>
    </>
  );
}
