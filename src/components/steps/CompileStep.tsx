'use client';

import { useState, useEffect, useCallback } from 'react';
import { AssetSelection, LogicSelection, CompileResult, DeployResult } from '@/lib/types';
import { getProgramConfig } from '@/lib/assets';
import { connectKeplr, checkBalance, isKeplrInstalled, WalletInfo } from '@/lib/keplr';
import CodePreview from '@/components/CodePreview';
import { generateMainCode } from '@/lib/code-templates';

/* ---- Icons ---- */
function CheckCircleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 010-4h14v4" />
      <path d="M3 5v14a2 2 0 002 2h16v-5" />
      <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 007 7z" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

const COMPILE_STAGES = [
  'Initializing build environment...',
  'Fetching Pyth price feed schema...',
  'Generating execution phase...',
  'Generating tally phase...',
  'Compiling to WASM target...',
  'Optimizing binary...',
  'Build complete!',
];

interface Props {
  asset: AssetSelection;
  logic: LogicSelection;
  compileResult: CompileResult | null;
  deployResult: DeployResult | null;
  onCompileComplete: (result: CompileResult) => void;
  onDeployComplete: (result: DeployResult) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function CompileStep({
  asset, logic, compileResult, deployResult,
  onCompileComplete, onDeployComplete, onBack, onNext,
}: Props) {
  const [compileStage, setCompileStage] = useState(-1);
  const [isCompiling, setIsCompiling] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Wallet state
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isRequestingTokens, setIsRequestingTokens] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [faucetMessage, setFaucetMessage] = useState('');

  const generatedCode = generateMainCode(logic.template, {
    provider: 'Pyth Network',
    feedType: asset.category,
    feedBase: asset.asset.symbol,
    feedQuote: 'USD',
    endpointUrl: `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${asset.asset.pythPriceFeedId}`,
    identifier: asset.asset.pythPriceFeedId,
    assetName: asset.asset.name,
  });

  /* ---- Compile animation ---- */
  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    setCompileStage(0);

    for (let i = 0; i < COMPILE_STAGES.length; i++) {
      setCompileStage(i);
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
    }

    const config = getProgramConfig(asset.asset, logic.template);

    onCompileComplete({
      programId: config.programId,
      execInputs: config.execInputs,
    });

    setIsCompiling(false);
  }, [asset, logic, onCompileComplete]);

  // Auto-compile on mount if not already compiled
  useEffect(() => {
    if (!compileResult && !isCompiling) {
      handleCompile();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Wallet ---- */
  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setConnectError(null);

    try {
      if (!isKeplrInstalled()) {
        setConnectError('Keplr wallet not found. Install from keplr.app');
        setIsConnecting(false);
        return;
      }
      const info = await connectKeplr();
      setWallet(info);
      const bal = await checkBalance(info.address);
      setBalance(bal);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Failed to connect');
    }
    setIsConnecting(false);
  }, []);

  /* ---- Faucet ---- */
  const handleRequestTokens = useCallback(async () => {
    if (!wallet) return;
    setIsRequestingTokens(true);
    setFaucetStatus('idle');

    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: wallet.address }),
      });
      const data = await res.json();

      if (data.success) {
        setFaucetStatus('success');
        setFaucetMessage('Testnet tokens sent! They may take a few seconds to arrive.');
        setTimeout(async () => {
          const bal = await checkBalance(wallet.address);
          setBalance(bal);
        }, 5000);
      } else {
        setFaucetStatus('error');
        setFaucetMessage(data.error || 'Faucet request failed');
      }
    } catch {
      setFaucetStatus('error');
      setFaucetMessage('Failed to request tokens');
    }
    setIsRequestingTokens(false);
  }, [wallet]);

  /* ---- Deploy ---- */
  const handleDeploy = useCallback(() => {
    if (!wallet || !compileResult) return;
    onDeployComplete({
      ...compileResult,
      walletAddress: wallet.address,
      network: 'testnet',
    });
  }, [wallet, compileResult, onDeployComplete]);

  const isWalletConnected = wallet?.isConnected;
  const hasTokens = balance && !balance.startsWith('0 ') && !balance.startsWith('Unable');

  return (
    <>
      {/* Compile Section */}
      <div className="step-content fade-up">
        <h2 className="step-content__title">Compile &amp; Deploy</h2>
        <p className="step-content__subtitle">
          Building your {asset.asset.symbol}/USD Oracle Program with {logic.template === 'simple-price' ? 'Simple Price Feed' : logic.template === 'ema-smoothing' ? 'EMA Smoothing' : 'Multi-Source Blending'} logic.
        </p>

        {/* Compile Progress */}
        <div className="compile-progress">
          <div className="compile-progress__icon">
            {compileResult ? (
              <div className="compile-progress__done"><CheckCircleIcon /></div>
            ) : (
              <div className="compile-progress__spinning"><GearIcon /></div>
            )}
          </div>

          <div className="compile-progress__stages">
            {COMPILE_STAGES.map((stage, i) => (
              <div
                key={i}
                className={`compile-stage ${
                  compileStage > i ? 'compile-stage--done' :
                  compileStage === i ? 'compile-stage--active' :
                  'compile-stage--pending'
                }`}
              >
                {stage}
              </div>
            ))}
          </div>
        </div>

        {/* Program ID result */}
        {compileResult && (
          <div className="program-id-card fade-up">
            <div className="program-id-card__label">Oracle Program ID</div>
            <div className="program-id-card__value">{compileResult.programId}</div>
            <button
              className="program-id-card__copy"
              onClick={() => navigator.clipboard.writeText(compileResult.programId)}
            >
              Copy ID
            </button>
          </div>
        )}

        {/* View Code Toggle */}
        {compileResult && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <button
              className="btn btn--secondary"
              onClick={() => setShowCode(!showCode)}
              style={{ width: '100%' }}
            >
              {showCode ? 'Hide' : 'View'} Generated Code
            </button>
            {showCode && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <CodePreview code={generatedCode} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wallet & Deploy Section */}
      {compileResult && (
        <div className="step-content fade-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="step-content__title" style={{ fontSize: '1.6rem' }}>Deploy to SEDA Testnet</h3>
          <p className="step-content__subtitle">
            Connect your wallet and deploy your compiled Oracle Program.
          </p>

          {/* Connect Wallet */}
          <div className="deploy-step">
            <div className="deploy-step__header">
              <div className={`deploy-step__icon ${isWalletConnected ? 'deploy-step__icon--done' : ''}`}>
                {isWalletConnected ? <CheckCircleIcon /> : <WalletIcon />}
              </div>
              <div className="deploy-step__info">
                <h3 className="deploy-step__title">Connect Wallet</h3>
                <p className="deploy-step__desc">
                  {isWalletConnected
                    ? `Connected as ${wallet.name}`
                    : 'Connect your Keplr wallet to the SEDA testnet.'}
                </p>
              </div>
            </div>

            {isWalletConnected ? (
              <div className="deploy-step__result">
                <div className="wallet-info">
                  <div className="wallet-info__row">
                    <span className="wallet-info__label">Address</span>
                    <span className="wallet-info__value wallet-info__value--mono">
                      {wallet.address.slice(0, 14)}...{wallet.address.slice(-8)}
                    </span>
                  </div>
                  <div className="wallet-info__row">
                    <span className="wallet-info__label">Balance</span>
                    <span className="wallet-info__value">{balance || 'Loading...'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="deploy-step__action">
                <button className="btn btn--primary" onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? <><span className="btn-spinner"><SpinnerIcon /></span> Connecting...</> : <><WalletIcon /> Connect Keplr</>}
                </button>
                {connectError && (
                  <div className="deploy-step__error">
                    {connectError}
                    {connectError.includes('install') && (
                      <a href="https://www.keplr.app/download" target="_blank" rel="noopener noreferrer" className="deploy-step__link">
                        Install Keplr <ExternalLinkIcon />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Get Tokens */}
          <div className={`deploy-step ${!isWalletConnected ? 'deploy-step--disabled' : ''}`}>
            <div className="deploy-step__header">
              <div className={`deploy-step__icon ${hasTokens || faucetStatus === 'success' ? 'deploy-step__icon--done' : ''}`}>
                {hasTokens || faucetStatus === 'success' ? <CheckCircleIcon /> : <DropletIcon />}
              </div>
              <div className="deploy-step__info">
                <h3 className="deploy-step__title">Get Testnet Tokens</h3>
                <p className="deploy-step__desc">
                  {hasTokens ? `Your wallet has ${balance}` : 'Request free SEDA testnet tokens from the faucet.'}
                </p>
              </div>
            </div>

            {isWalletConnected && !hasTokens && faucetStatus !== 'success' && (
              <div className="deploy-step__action">
                <button className="btn btn--primary" onClick={handleRequestTokens} disabled={isRequestingTokens}>
                  {isRequestingTokens ? <><span className="btn-spinner"><SpinnerIcon /></span> Requesting...</> : <><DropletIcon /> Request Tokens</>}
                </button>
              </div>
            )}
            {faucetMessage && (
              <div className={`deploy-step__message ${faucetStatus === 'error' ? 'deploy-step__message--error' : 'deploy-step__message--success'}`}>
                {faucetMessage}
              </div>
            )}
          </div>

          {/* Deploy */}
          <div className={`deploy-step ${!isWalletConnected ? 'deploy-step--disabled' : ''}`}>
            <div className="deploy-step__header">
              <div className={`deploy-step__icon ${deployResult ? 'deploy-step__icon--done' : ''}`}>
                {deployResult ? <CheckCircleIcon /> : <RocketIcon />}
              </div>
              <div className="deploy-step__info">
                <h3 className="deploy-step__title">Deploy Oracle Program</h3>
                <p className="deploy-step__desc">
                  {deployResult ? 'Oracle Program deployed to SEDA testnet!' : 'Deploy your compiled program to the SEDA network.'}
                </p>
              </div>
            </div>

            {isWalletConnected && !deployResult && (
              <div className="deploy-step__action">
                <button className="btn btn--primary btn--large" onClick={handleDeploy}>
                  <RocketIcon /> Deploy to SEDA
                </button>
              </div>
            )}
          </div>

          {/* Custom CTA */}
          <div className="custom-build-note">
            <p className="custom-build-note__text">Need a custom Oracle Program with unique logic?</p>
            <a href="https://discord.com/invite/seda" target="_blank" rel="noopener noreferrer" className="custom-build-note__link">
              Contact the SEDA team <ExternalLinkIcon />
            </a>
          </div>
        </div>
      )}

      <div className="step-nav">
        <button className="btn btn--secondary" onClick={onBack} disabled={isCompiling}>Back</button>
        {deployResult ? (
          <button className="btn btn--primary" onClick={onNext}>
            Next: Connect via SEDA Fast
          </button>
        ) : (
          <div />
        )}
      </div>
    </>
  );
}
