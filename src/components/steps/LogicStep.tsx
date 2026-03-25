'use client';

import { useState } from 'react';
import { LogicTemplate, LogicSelection, AssetSelection } from '@/lib/types';

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
    description: 'Fetch the latest price and forward it directly. Best for straightforward oracle use cases.',
    badge: 'Recommended',
  },
  {
    id: 'ema-smoothing',
    name: 'EMA Smoothing',
    description: 'Apply Exponential Moving Average to smooth price volatility over a configurable window.',
  },
  {
    id: 'multi-source',
    name: 'Multi-Source Blending',
    description: 'Aggregate prices from multiple data sources and compute the median for higher reliability.',
  },
];

interface Props {
  asset: AssetSelection;
  selection: LogicSelection | null;
  onComplete: (selection: LogicSelection) => void;
  onBack: () => void;
}

export default function LogicStep({ asset, selection, onComplete, onBack }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<LogicTemplate>(selection?.template || 'simple-price');

  const handleNext = () => {
    onComplete({ template: selectedTemplate });
  };

  return (
    <>
      <div className="step-content fade-up">
        <h2 className="step-content__title">Select Logic</h2>
        <p className="step-content__subtitle">
          Choose how your Oracle Program processes {asset.asset.symbol}/USD price data.
        </p>

        <div className="step-section">
          <div className="step-section__label">Logic Template</div>
          <div className="template-list">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                className={`logic-option ${selectedTemplate === t.id ? 'logic-option--selected' : ''}`}
                onClick={() => setSelectedTemplate(t.id)}
              >
                <div className="logic-option__radio">
                  <div className="logic-option__radio-dot" />
                </div>
                <div className="logic-option__content">
                  <div className="logic-option__header">
                    <span className="logic-option__name">{t.name}</span>
                    {t.badge && <span className="logic-option__badge">{t.badge}</span>}
                  </div>
                  <p className="logic-option__desc">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info about what will happen */}
        <div className="info-note">
          <span className="info-note__icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </span>
          <span className="info-note__text">
            Your Oracle Program will be compiled using the <strong>{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</strong> template
            for <strong>{asset.asset.symbol}/USD</strong> via Pyth Network, optimized for SEDA Fast execution.
          </span>
        </div>
      </div>

      <div className="step-nav">
        <button className="btn btn--secondary" onClick={onBack}>Back</button>
        <button className="btn btn--primary" onClick={handleNext}>
          Compile Program
        </button>
      </div>
    </>
  );
}
