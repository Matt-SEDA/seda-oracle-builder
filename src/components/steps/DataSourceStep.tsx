'use client';

import { useState, useMemo } from 'react';
import { FeedEntry, DataSourceConfig } from '@/lib/types';
import { PROVIDERS, CUSTOM_PROVIDER, FEED_TYPE_ORDER } from '@/lib/providers';

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

interface Props {
  feeds: FeedEntry[];
  config: DataSourceConfig | null;
  onComplete: (config: DataSourceConfig) => void;
}

export default function DataSourceStep({ feeds, config, onComplete }: Props) {
  const [selectedProvider, setSelectedProvider] = useState<string>(config?.provider || '');
  const [selectedType, setSelectedType] = useState(config?.feedType || 'All');
  const [search, setSearch] = useState('');
  const [selectedFeed, setSelectedFeed] = useState<{
    base: string;
    assetName: string;
    quote: string;
    identifier: string;
    feedType: string;
  } | null>(
    config
      ? {
          base: config.feedBase,
          assetName: config.assetName,
          quote: config.feedQuote,
          identifier: config.identifier,
          feedType: config.feedType,
        }
      : null
  );

  // Custom endpoint state
  const [customEndpoint, setCustomEndpoint] = useState(config?.endpointUrl || '');
  const [customBase, setCustomBase] = useState(config?.feedBase || '');
  const [customQuote, setCustomQuote] = useState(config?.feedQuote || '');

  const isCustom = selectedProvider === 'custom';

  // Get selected provider config
  const providerConfig = useMemo(
    () => [...PROVIDERS, CUSTOM_PROVIDER].find((p) => p.id === selectedProvider),
    [selectedProvider]
  );

  // Filter feeds by selected provider's data_source name
  const filteredFeeds = useMemo(() => {
    if (!providerConfig || isCustom) return [];

    let result = feeds.filter((f) =>
      f.identifiers.some((id) => id.data_source === providerConfig.dataSourceName)
    );

    if (selectedType !== 'All') {
      result = result.filter((f) => f.feed_type === selectedType);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.base.toLowerCase().includes(q) ||
          f.asset_name.toLowerCase().includes(q)
      );
    }

    return result.slice(0, 100); // limit for performance
  }, [feeds, providerConfig, isCustom, selectedType, search]);

  // Available types for selected provider
  const availableTypes = useMemo(() => {
    if (!providerConfig || isCustom) return [];
    const types = new Set<string>();
    for (const f of feeds) {
      if (f.identifiers.some((id) => id.data_source === providerConfig.dataSourceName)) {
        types.add(f.feed_type);
      }
    }
    return FEED_TYPE_ORDER.filter((t) => t === 'All' || types.has(t));
  }, [feeds, providerConfig, isCustom]);

  const handleSelectFeed = (feed: FeedEntry) => {
    const identifier = feed.identifiers.find(
      (id) => id.data_source === providerConfig?.dataSourceName
    );
    if (!identifier) return;

    setSelectedFeed({
      base: feed.base,
      assetName: feed.asset_name,
      quote: identifier.quote,
      identifier: identifier.id,
      feedType: feed.feed_type,
    });
  };

  const canProceed = isCustom
    ? customEndpoint.trim() && customBase.trim() && customQuote.trim()
    : selectedFeed !== null;

  const handleNext = () => {
    if (isCustom) {
      onComplete({
        provider: 'Custom API',
        feedType: 'Custom',
        feedBase: customBase.trim(),
        feedQuote: customQuote.trim(),
        endpointUrl: customEndpoint.trim(),
        identifier: customEndpoint.trim(),
        assetName: `${customBase.trim()}/${customQuote.trim()}`,
      });
    } else if (selectedFeed && providerConfig) {
      onComplete({
        provider: providerConfig.name,
        feedType: selectedFeed.feedType,
        feedBase: selectedFeed.base,
        feedQuote: selectedFeed.quote,
        endpointUrl: providerConfig.testnetEndpoint,
        identifier: selectedFeed.identifier,
        assetName: selectedFeed.assetName,
      });
    }
  };

  return (
    <>
      <div className="step-content fade-up">
        <h2 className="step-content__title">Select Data Source</h2>
        <p className="step-content__subtitle">
          Choose a data provider and select the feed you want your Oracle Program to deliver.
        </p>

        {/* Provider Selection */}
        <div className="step-section">
          <div className="step-section__label">Data Provider</div>
          <div className="provider-grid">
            {PROVIDERS.map((p) => (
              <div
                key={p.id}
                className={`provider-card ${selectedProvider === p.id ? 'provider-card--selected' : ''}`}
                onClick={() => {
                  setSelectedProvider(p.id);
                  setSelectedFeed(null);
                  setSelectedType('All');
                  setSearch('');
                }}
              >
                <div className="provider-card__name">{p.name}</div>
                <div className="provider-card__desc">{p.description}</div>
              </div>
            ))}
            <div
              className={`provider-card ${isCustom ? 'provider-card--selected' : ''}`}
              onClick={() => {
                setSelectedProvider('custom');
                setSelectedFeed(null);
              }}
            >
              <div className="provider-card__name">{CUSTOM_PROVIDER.name}</div>
              <div className="provider-card__desc">{CUSTOM_PROVIDER.description}</div>
            </div>
          </div>
        </div>

        {/* Custom endpoint inputs */}
        {isCustom && (
          <div className="step-section fade-up">
            <div className="step-section__label">Custom API Configuration</div>
            <div className="input-group">
              <label className="input-group__label">API Endpoint URL</label>
              <input
                className="input-group__input"
                type="text"
                placeholder="https://api.example.com/price"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-group__label">Base Asset</label>
                <input
                  className="input-group__input"
                  type="text"
                  placeholder="ETH"
                  value={customBase}
                  onChange={(e) => setCustomBase(e.target.value)}
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-group__label">Quote Currency</label>
                <input
                  className="input-group__input"
                  type="text"
                  placeholder="USD"
                  value={customQuote}
                  onChange={(e) => setCustomQuote(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Feed Type Filter + Feed Selection */}
        {selectedProvider && !isCustom && (
          <div className="step-section fade-up">
            <div className="step-section__label">Select Feed</div>

            {availableTypes.length > 1 && (
              <div className="filter-pills">
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    className={`filter-pill ${selectedType === type ? 'active' : ''}`}
                    onClick={() => { setSelectedType(type); setSelectedFeed(null); }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            <div className="feed-search-wrap">
              <span className="feed-search-wrap__icon"><SearchIcon /></span>
              <input
                className="feed-search"
                type="text"
                placeholder="Search by symbol or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="feed-list">
              {filteredFeeds.length === 0 ? (
                <div className="feed-list__empty">No feeds found for this provider.</div>
              ) : (
                filteredFeeds.map((feed) => {
                  const identifier = feed.identifiers.find(
                    (id) => id.data_source === providerConfig?.dataSourceName
                  );
                  const isSelected = selectedFeed?.base === feed.base && selectedFeed?.identifier === identifier?.id;
                  return (
                    <div
                      key={`${feed.base}-${identifier?.id}`}
                      className={`feed-list__item ${isSelected ? 'feed-list__item--selected' : ''}`}
                      onClick={() => handleSelectFeed(feed)}
                    >
                      <span className="feed-list__symbol">{feed.base}</span>
                      <span className="feed-list__name">{feed.asset_name}</span>
                      <span className="feed-list__quote">{identifier?.quote}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {canProceed && (
          <div className="selection-summary fade-up">
            <span className="selection-summary__label">Selected:</span>
            <span className="selection-summary__value">
              {isCustom
                ? `${customBase}/${customQuote} via Custom API`
                : `${selectedFeed?.base}/${selectedFeed?.quote} via ${providerConfig?.name}`}
            </span>
          </div>
        )}
      </div>

      <div className="step-nav">
        <div className="step-nav__spacer" />
        <button className="btn btn--primary" disabled={!canProceed} onClick={handleNext}>
          Next: Configure Logic
        </button>
      </div>
    </>
  );
}
