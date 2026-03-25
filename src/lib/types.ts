import { Asset } from './assets';

/* ---- Wizard types ---- */

export type WizardStep = 1 | 2 | 3 | 4;

export type LogicTemplate = 'simple-price' | 'ema-smoothing' | 'multi-source' | 'custom';

export interface AssetSelection {
  category: string;
  asset: Asset;
}

export interface LogicSelection {
  template: LogicTemplate;
}

export interface CompileResult {
  programId: string;
  execInputs: Record<string, unknown>;
}

export interface DeployResult {
  programId: string;
  execInputs: Record<string, unknown>;
  walletAddress: string;
  network: 'testnet' | 'mainnet';
}

export interface WizardState {
  currentStep: WizardStep;
  asset: AssetSelection | null;
  logic: LogicSelection | null;
  compileResult: CompileResult | null;
  deployResult: DeployResult | null;
}

export type WizardAction =
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_ASSET'; selection: AssetSelection }
  | { type: 'SET_LOGIC'; selection: LogicSelection }
  | { type: 'SET_COMPILE_RESULT'; result: CompileResult }
  | { type: 'SET_DEPLOY_RESULT'; result: DeployResult }
  | { type: 'GO_BACK' };

/* ---- API types ---- */

export interface McpResponse {
  success: boolean;
  result?: string;
  error?: string;
}
