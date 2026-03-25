'use client';

import { useState, useCallback } from 'react';
import { DataSourceConfig, LogicConfig, BuildSubStep, DeployResult, SubStepStatus } from '@/lib/types';
import { callMcp } from '@/lib/mcp-client';

function PendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
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

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

function StatusIcon({ status }: { status: SubStepStatus }) {
  switch (status) {
    case 'running': return <div className="build-step__icon build-step__icon--running"><SpinnerIcon /></div>;
    case 'success': return <div className="build-step__icon build-step__icon--success"><CheckIcon /></div>;
    case 'error': return <div className="build-step__icon build-step__icon--error"><ErrorIcon /></div>;
    default: return <div className="build-step__icon build-step__icon--pending"><PendingIcon /></div>;
  }
}

const INITIAL_STEPS: BuildSubStep[] = [
  { id: 'env_check', label: 'Check Environment', status: 'pending' },
  { id: 'wallet', label: 'Setup Wallet', status: 'pending' },
  { id: 'faucet', label: 'Fund Wallet (Testnet)', status: 'pending' },
  { id: 'clone', label: 'Clone Starter Kit', status: 'pending' },
  { id: 'build', label: 'Build WASM', status: 'pending' },
  { id: 'deploy', label: 'Deploy to SEDA Network', status: 'pending' },
];

interface Props {
  dataSource: DataSourceConfig;
  logic: LogicConfig;
  deployResult: DeployResult | null;
  onDeployComplete: (result: DeployResult) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function BuildDeployStep({ dataSource, logic, deployResult, onDeployComplete, onBack, onNext }: Props) {
  const [steps, setSteps] = useState<BuildSubStep[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const updateStep = useCallback((id: string, updates: Partial<BuildSubStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const runBuild = useCallback(async () => {
    setIsRunning(true);
    setHasStarted(true);
    setSteps(INITIAL_STEPS);

    // Step 1: Environment check
    updateStep('env_check', { status: 'running' });
    const envResult = await callMcp('env_check');
    if (!envResult.success) {
      updateStep('env_check', { status: 'error', detail: envResult.error });
      setIsRunning(false);
      return;
    }
    updateStep('env_check', { status: 'success', detail: 'Toolchain verified' });

    // Step 2: Wallet setup
    updateStep('wallet', { status: 'running' });
    const listResult = await callMcp('seda_wallet_list');
    let walletAddress = '';

    if (listResult.success && listResult.result?.includes('seda1')) {
      // Activate existing wallet
      const activateResult = await callMcp('seda_wallet_activate');
      if (activateResult.success) {
        const addressMatch = activateResult.result?.match(/seda1[a-z0-9]+/);
        walletAddress = addressMatch ? addressMatch[0] : '';
        updateStep('wallet', { status: 'success', detail: `Activated: ${walletAddress.slice(0, 16)}...` });
      } else {
        updateStep('wallet', { status: 'error', detail: activateResult.error });
        setIsRunning(false);
        return;
      }
    } else {
      // Create new wallet
      const createResult = await callMcp('seda_wallet_create_cosmjs');
      if (!createResult.success) {
        updateStep('wallet', { status: 'error', detail: createResult.error });
        setIsRunning(false);
        return;
      }
      const addressMatch = createResult.result?.match(/seda1[a-z0-9]+/);
      walletAddress = addressMatch ? addressMatch[0] : '';
      updateStep('wallet', { status: 'success', detail: `Created: ${walletAddress.slice(0, 16)}...` });
    }

    // Step 3: Fund wallet
    updateStep('faucet', { status: 'running' });
    if (walletAddress) {
      // Check balance first
      const balResult = await callMcp('seda_wallet_balance', { address: walletAddress });
      const hasBalance = balResult.success && balResult.result && !balResult.result.includes('"amount":"0"');

      if (hasBalance) {
        updateStep('faucet', { status: 'success', detail: 'Wallet already funded' });
      } else {
        const faucetResult = await callMcp('seda_faucet_request', { address: walletAddress });
        if (!faucetResult.success) {
          updateStep('faucet', { status: 'error', detail: faucetResult.error });
          setIsRunning(false);
          return;
        }
        updateStep('faucet', { status: 'success', detail: 'Tokens received' });
      }
    } else {
      updateStep('faucet', { status: 'error', detail: 'No wallet address available' });
      setIsRunning(false);
      return;
    }

    // Step 4: Clone starter kit
    updateStep('clone', { status: 'running' });
    const cloneResult = await callMcp('seda_clone_or_update');
    if (!cloneResult.success) {
      updateStep('clone', { status: 'error', detail: cloneResult.error });
      setIsRunning(false);
      return;
    }
    updateStep('clone', { status: 'success', detail: 'Starter kit ready' });

    // Step 5: Build WASM
    updateStep('build', { status: 'running' });
    const buildResult = await callMcp('seda_build');
    if (!buildResult.success) {
      updateStep('build', { status: 'error', detail: buildResult.error });
      setIsRunning(false);
      return;
    }
    updateStep('build', { status: 'success', detail: 'WASM compiled successfully' });

    // Step 6: Deploy
    updateStep('deploy', { status: 'running' });
    const deployMcpResult = await callMcp('seda_deploy');
    if (!deployMcpResult.success) {
      updateStep('deploy', { status: 'error', detail: deployMcpResult.error });
      setIsRunning(false);
      return;
    }

    // Extract program ID from deploy output
    const programIdMatch = deployMcpResult.result?.match(/[a-f0-9]{64}/);
    const programId = programIdMatch ? programIdMatch[0] : 'unknown';

    updateStep('deploy', { status: 'success', detail: `Program ID: ${programId.slice(0, 16)}...` });

    onDeployComplete({
      programId,
      walletAddress,
      network: 'testnet',
    });

    setIsRunning(false);
  }, [updateStep, onDeployComplete]);

  const hasError = steps.some((s) => s.status === 'error');

  return (
    <>
      <div className="step-content fade-up">
        <h2 className="step-content__title">Build &amp; Deploy</h2>
        <p className="step-content__subtitle">
          Compile your {dataSource.feedBase}/{dataSource.feedQuote} Oracle Program and deploy it to the SEDA network.
        </p>

        <div className="build-progress">
          {steps.map((step) => (
            <div key={step.id} className={`build-step ${step.status === 'pending' ? 'build-step--pending' : ''}`}>
              <StatusIcon status={step.status} />
              <div className="build-step__content">
                <div className="build-step__label">{step.label}</div>
                {step.detail && (
                  <div className={`build-step__detail ${step.status === 'error' ? 'build-step__detail--error' : ''}`}>
                    {step.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!hasStarted && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <button className="btn btn--primary btn--large" onClick={runBuild}>
              Start Build
            </button>
            <p style={{ marginTop: 'var(--space-3)', fontSize: '1.2rem', color: 'var(--background-on-background-quaternary)' }}>
              This requires the MCP server running on localhost:3333
            </p>
          </div>
        )}

        {hasError && !isRunning && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <button className="btn btn--primary" onClick={runBuild}>
              Retry Build
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

      <div className="step-nav">
        <button className="btn btn--secondary" onClick={onBack} disabled={isRunning}>Back</button>
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
