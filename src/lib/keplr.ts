/**
 * Keplr wallet integration for SEDA network.
 * Handles wallet connection via the Keplr browser extension.
 */

export interface WalletInfo {
  address: string;
  name: string;
  isConnected: boolean;
}

// SEDA testnet chain configuration for Keplr
const SEDA_TESTNET_CHAIN_ID = 'seda-1-testnet';

const SEDA_TESTNET_CHAIN_INFO = {
  chainId: SEDA_TESTNET_CHAIN_ID,
  chainName: 'SEDA Testnet',
  rpc: 'https://rpc.testnet.seda.xyz',
  rest: 'https://lcd.testnet.seda.xyz',
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: 'seda',
    bech32PrefixAccPub: 'sedapub',
    bech32PrefixValAddr: 'sedavaloper',
    bech32PrefixValPub: 'sedavaloperpub',
    bech32PrefixConsAddr: 'sedavalcons',
    bech32PrefixConsPub: 'sedavalconspub',
  },
  currencies: [
    {
      coinDenom: 'SEDA',
      coinMinimalDenom: 'aseda',
      coinDecimals: 18,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'SEDA',
      coinMinimalDenom: 'aseda',
      coinDecimals: 18,
      gasPriceStep: {
        low: 10000000000,
        average: 25000000000,
        high: 40000000000,
      },
    },
  ],
  stakeCurrency: {
    coinDenom: 'SEDA',
    coinMinimalDenom: 'aseda',
    coinDecimals: 18,
  },
};

function getKeplr(): unknown | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).keplr || null;
}

export function isKeplrInstalled(): boolean {
  return getKeplr() !== null;
}

export async function connectKeplr(): Promise<WalletInfo> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const keplr = getKeplr() as any;

  if (!keplr) {
    throw new Error('Keplr wallet extension not found. Please install it from keplr.app');
  }

  try {
    // Suggest the SEDA testnet chain to Keplr (in case it's not natively supported)
    await keplr.experimentalSuggestChain(SEDA_TESTNET_CHAIN_INFO);
  } catch {
    // Chain might already be added, continue
  }

  // Enable the chain
  await keplr.enable(SEDA_TESTNET_CHAIN_ID);

  // Get the key/account info
  const key = await keplr.getKey(SEDA_TESTNET_CHAIN_ID);

  return {
    address: key.bech32Address,
    name: key.name,
    isConnected: true,
  };
}

export async function disconnectKeplr(): Promise<void> {
  // Keplr doesn't have a formal disconnect — we just clear local state
}

/**
 * Check the SEDA balance for an address via LCD endpoint.
 */
export async function checkBalance(address: string): Promise<string> {
  try {
    const res = await fetch(
      `https://lcd.testnet.seda.xyz/cosmos/bank/v1beta1/balances/${address}`
    );
    const data = await res.json();
    const sedaBalance = data.balances?.find(
      (b: { denom: string; amount: string }) => b.denom === 'aseda'
    );
    if (sedaBalance) {
      // Convert from aseda (10^18) to SEDA
      const amount = BigInt(sedaBalance.amount);
      const whole = amount / BigInt(10 ** 18);
      const frac = amount % BigInt(10 ** 18);
      const fracStr = frac.toString().padStart(18, '0').slice(0, 4);
      return `${whole}.${fracStr} SEDA`;
    }
    return '0 SEDA';
  } catch {
    return 'Unable to fetch';
  }
}
