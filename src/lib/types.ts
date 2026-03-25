/* ---- Feed types (reused from feeds-explorer) ---- */

export interface FeedIdentifier {
  kind: 'symbol' | 'endpoint';
  id: string;
  quote: string;
  data_source: string;
}

export interface FeedEntry {
  feed_type: string;
  base: string;
  asset_name: string;
  identifiers: FeedIdentifier[];
  endpoints: FeedIdentifier[];
  symbols: FeedIdentifier[];
}

/* ---- Wizard types ---- */

export type WizardStep = 1 | 2 | 3 | 4;

export interface DataSourceConfig {
  provider: string;
  feedType: string;
  feedBase: string;
  feedQuote: string;
  endpointUrl: string;
  identifier: string;
  assetName: string;
}

export type LogicTemplate = 'simple-price' | 'ema-smoothing' | 'multi-source' | 'custom';

export interface LogicConfig {
  template: LogicTemplate;
  emaWindow?: number;
  customCode?: string;
  generatedExecCode: string;
  generatedTallyCode: string;
}

export type SubStepStatus = 'pending' | 'running' | 'success' | 'error';

export interface BuildSubStep {
  id: string;
  label: string;
  status: SubStepStatus;
  detail?: string;
}

export interface DeployResult {
  programId: string;
  walletAddress: string;
  network: 'testnet' | 'mainnet';
}

export interface WizardState {
  currentStep: WizardStep;
  dataSource: DataSourceConfig | null;
  logic: LogicConfig | null;
  buildSteps: BuildSubStep[];
  deployResult: DeployResult | null;
  fastApiKey: string;
  fastTestResult: string | null;
}

export type WizardAction =
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_DATA_SOURCE'; config: DataSourceConfig }
  | { type: 'SET_LOGIC'; config: LogicConfig }
  | { type: 'UPDATE_BUILD_STEPS'; steps: BuildSubStep[] }
  | { type: 'SET_DEPLOY_RESULT'; result: DeployResult }
  | { type: 'SET_FAST_API_KEY'; key: string }
  | { type: 'SET_FAST_RESULT'; result: string | null }
  | { type: 'GO_BACK' };

/* ---- MCP proxy types ---- */

export interface McpRequest {
  tool: string;
  args: Record<string, unknown>;
}

export interface McpResponse {
  success: boolean;
  result?: string;
  error?: string;
}
