'use client';

import { useState } from 'react';
import { AssetSelection } from '@/lib/types';
import { ASSET_CATEGORIES, Asset } from '@/lib/assets';

interface Props {
  selection: AssetSelection | null;
  onComplete: (selection: AssetSelection) => void;
}

export default function AssetStep({ selection, onComplete }: Props) {
  const [activeCategory, setActiveCategory] = useState(selection?.category || 'crypto');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(selection?.asset || null);

  const currentCategory = ASSET_CATEGORIES.find((c) => c.id === activeCategory);

  const handleNext = () => {
    if (selectedAsset && activeCategory) {
      onComplete({ category: activeCategory, asset: selectedAsset });
    }
  };

  return (
    <>
      <div className="step-content fade-up">
        <h2 className="step-content__title">Select Asset</h2>
        <p className="step-content__subtitle">
          Choose the asset your Oracle Program will deliver price data for. All feeds are powered by Pyth Network.
        </p>

        {/* Category Tabs */}
        <div className="step-section">
          <div className="step-section__label">Asset Category</div>
          <div className="category-tabs">
            {ASSET_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`category-tab ${activeCategory === cat.id ? 'category-tab--active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedAsset(null);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Grid */}
        <div className="step-section">
          <div className="step-section__label">Select {currentCategory?.label} Asset</div>
          <div className="asset-grid">
            {currentCategory?.assets.map((asset) => {
              const isSelected = selectedAsset?.symbol === asset.symbol;
              return (
                <button
                  key={asset.symbol}
                  className={`asset-card ${isSelected ? 'asset-card--selected' : ''}`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <span className="asset-card__symbol">{asset.symbol}</span>
                  <span className="asset-card__name">{asset.name}</span>
                  <span className="asset-card__pair">{asset.symbol}/USD</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selection Summary */}
        {selectedAsset && (
          <div className="selection-summary fade-up">
            <span className="selection-summary__label">Selected:</span>
            <span className="selection-summary__value">
              {selectedAsset.symbol}/USD — {selectedAsset.name} via Pyth Network
            </span>
          </div>
        )}
      </div>

      <div className="step-nav">
        <div className="step-nav__spacer" />
        <button className="btn btn--primary" disabled={!selectedAsset} onClick={handleNext}>
          Next: Select Logic
        </button>
      </div>
    </>
  );
}
