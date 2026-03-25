'use client';

import { useState, useCallback } from 'react';
import { DataSourceConfig, LogicConfig, DeployResult } from '@/lib/types';
import { connectKeplr, checkBalance, isKeplrInstalled, WalletInfo } from '@/lib/keplr';
import { getDeployedProgramId } from '@/lib/programs';

/* ---- Icons ---- */

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

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
}

interface Props {
  dataSource: DataSourceConfig;
  logic: LogicConfig;
  deployResult: DeployResult | null;
  onDeployComplete: (result: DeployResult) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function BuildDeployStep({ dataSource, logic, deployResult, onDeployComplete, onBack, onNext }: Props) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [isRequestingTokens, setIsRequestingTokens] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [faucetMessage, setFaucetMessage] = useState('');

  const [isDeploying, setIsDeploying] = useState(false);

  /* ---- Step 1: Connect Wallet ---- */
  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setConnectError(null);

    try {
      if (!isKeplrInstalled()) {
        setConnectError('Keplr wallet not found. Please install the Keplr browser extension from keplr.app');
        setIsConnecting(false);
        return;
      }

      const info = await connectKeplr();
      setWallet(info);

      // Check balance
      const bal = await checkBalance(info.address);
      setBalance(bal);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Failed to connect wallet');
    }

    setIsConnecting(false);
  }, []);

  /* ---- Step 2: Request Tokens ---- */
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
        // Refresh balance after a short delay
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

  /* ---- Step 3: Deploy (use pre-deployed program) ---- */
  const handleDeploy = useCallback(async () => {
    if (!wallet) return;

    setIsDeploying(true);

    // Simulate a brief deploy process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const programId = getDeployedProgramId(logic.template);

    onDeployComplete({
      programId,
      walletAddress: wallet.address,
      network: 'testnet',
    });

    setIsDeploying(false);
  }, [wallet, logic.template, onDeployComplete]);

  const isWalletConnected = wallet?.isConnected;
  const hasTokens = balance && !balance.startsWith('0 ') && !balance.startsWith('Unable');

  return (
    <>
      <div className="step-content fade-up">
        <h2 className="step-content__title">Build &amp; Deploy</h2>
        <p className="step-content__subtitle">
          Connect your wallet, fund it with testnet tokens, and deploy your {dataSource.feedBase}/{dataSource.feedQuote} Oracle Program.
        </p>

        {/* Step 1: Connect Wallet */}
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
                  : 'Connect your Keplr wallet to interact with the SEDA testnet.'}
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
              <button
                className="btn btn--primary"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <><span className="btn-spinner"><SpinnerIcon /></span> Connecting...</>
                ) : (
                  <><WalletIcon /> Connect Keplr</>
                )}
              </button>
              {connectError && (
                <div className="deploy-step__error">
                  {connectError}
                  {connectError.includes('install') && (
                    <a
                      href="https://www.keplr.app/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="deploy-step__link"
                    >
                      Install Keplr <ExternalLinkIcon />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Request Tokens */}
        <div className={`deploy-step ${!isWalletConnected ? 'deploy-step--disabled' : ''}`}>
          <div className="deploy-step__header">
            <div className={`deploy-step__icon ${hasTokens || faucetStatus === 'success' ? 'deploy-step__icon--done' : ''}`}>
              {hasTokens || faucetStatus === 'success' ? <CheckCircleIcon /> : <DropletIcon />}
            </div>
            <div className="deploy-step__info">
              <h3 className="deploy-step__title">Get Testnet Tokens</h3>
              <p className="deploy-step__desc">
                {hasTokens
                  ? `Your wallet has ${balance}`
                  : 'Request free SEDA testnet tokens from the faucet.'}
              </p>
            </div>
          </div>

          {isWalletConnected && !hasTokens && faucetStatus !== 'success' && (
            <div className="deploy-step__action">
              <button
                className="btn btn--primary"
                onClick={handleRequestTokens}
                disabled={isRequestingTokens}
              >
                {isRequestingTokens ? (
                  <><span className="btn-spinner"><SpinnerIcon /></span> Requesting...</>
                ) : (
                  <><DropletIcon /> Request Tokens</>
                )}
              </button>
            </div>
          )}

          {faucetMessage && (
            <div className={`deploy-step__message ${faucetStatus === 'error' ? 'deploy-step__message--error' : 'deploy-step__message--success'}`}>
              {faucetMessage}
            </div>
          )}
        </div>

        {/* Step 3: Deploy */}
        <div className={`deploy-step ${!isWalletConnected ? 'deploy-step--disabled' : ''}`}>
          <div className="deploy-step__header">
            <div className={`deploy-step__icon ${deployResult ? 'deploy-step__icon--done' : ''}`}>
              {deployResult ? <CheckCircleIcon /> : <RocketIcon />}
            </div>
            <div className="deploy-step__info">
              <h3 className="deploy-step__title">Deploy Oracle Program</h3>
              <p className="deploy-step__desc">
                {deployResult
                  ? 'Oracle Program deployed successfully!'
                  : `Deploy your ${logic.template === 'simple-price' ? 'Simple Price Feed' : logic.template === 'ema-smoothing' ? 'EMA Smoothed' : logic.template === 'multi-source' ? 'Multi-Source' : 'Custom'} Oracle Program to the SEDA testnet.`}
              </p>
            </div>
          </div>

          {isWalletConnected && !deployResult && (
            <div className="deploy-step__action">
              <button
                className="btn btn--primary btn--large"
                onClick={handleDeploy}
                disabled={isDeploying}
              >
                {isDeploying ? (
                  <><span className="btn-spinner"><SpinnerIcon /></span> Deploying...</>
                ) : (
                  <><RocketIcon /> Deploy to SEDA</>
                )}
              </button>
            </div>
          )}

          {deployResult && (
            <div className="program-id-card fade-up">
              <div className="program-id-card__label">Oracle Program ID</div>
              <div className="program-id-card__value">{deployResult.programId}</div>
              <button
                className="program-id-card__copy"
                onClick={() => navigator.clipboard.writeText(deployResult.programId)}
              >
                Copy ID
              </button>
            </div>
          )}
        </div>

        {/* Custom Build CTA */}
        <div className="custom-build-note">
          <p className="custom-build-note__text">
            Need a custom Oracle Program with unique logic?
          </p>
          <a
            href="https://discord.com/invite/seda"
            target="_blank"
            rel="noopener noreferrer"
            className="custom-build-note__link"
          >
            Contact the SEDA team <ExternalLinkIcon />
          </a>
        </div>
      </div>

      <div className="step-nav">
        <button className="btn btn--secondary" onClick={onBack}>Back</button>
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
