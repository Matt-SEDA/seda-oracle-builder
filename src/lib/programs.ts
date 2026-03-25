import { LogicTemplate } from './types';

/**
 * Pre-deployed Oracle Program IDs on SEDA testnet.
 * These are real programs that can be executed via SEDA Fast.
 * Users can use these to test the full flow without compiling.
 */
export interface DeployedProgram {
  programId: string;
  name: string;
  description: string;
  templates: LogicTemplate[];
}

export const DEPLOYED_PROGRAMS: DeployedProgram[] = [
  {
    programId: '8cf7808cdb5d16e9fb328007968d31727f8e67ac3c83b655aa61c4ccd4077125',
    name: 'Crypto Price Feed',
    description: 'Standard crypto price feed — supports ETH, BTC, SOL and 1,500+ crypto pairs via Pyth.',
    templates: ['simple-price'],
  },
  {
    programId: '8cf7808cdb5d16e9fb328007968d31727f8e67ac3c83b655aa61c4ccd4077125',
    name: 'Multi-Asset Price Feed',
    description: 'Supports equities, forex, metals, and commodities via dxFeed and Nobi Labs.',
    templates: ['simple-price', 'ema-smoothing', 'multi-source'],
  },
];

/**
 * Get the best matching pre-deployed program ID for a given template.
 */
export function getDeployedProgramId(template: LogicTemplate): string {
  const match = DEPLOYED_PROGRAMS.find((p) => p.templates.includes(template));
  return match?.programId || DEPLOYED_PROGRAMS[0].programId;
}

/**
 * Example execInputs for testing pre-deployed programs.
 */
export function getExampleExecInputs(feedBase: string): Record<string, unknown> {
  // The Pyth-based program accepts pyth_assets as input
  const PYTH_PRICE_IDS: Record<string, string> = {
    ETH: '0x61c4ca...ff9305',
    BTC: '0xe62df6...c70d2e',
    SOL: '0xef0d8b...6b4b5b',
  };

  if (PYTH_PRICE_IDS[feedBase]) {
    return { pyth_assets: [PYTH_PRICE_IDS[feedBase]] };
  }

  return {};
}
