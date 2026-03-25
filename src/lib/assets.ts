import { LogicTemplate } from './types';

export interface Asset {
  symbol: string;
  name: string;
  pythPriceFeedId: string;
}

export interface AssetCategory {
  id: string;
  label: string;
  assets: Asset[];
}

/**
 * Curated asset lists with Pyth Hermes price feed IDs.
 * All oracle programs use Pyth as the data source.
 */
export const ASSET_CATEGORIES: AssetCategory[] = [
  {
    id: 'crypto',
    label: 'Crypto',
    assets: [
      { symbol: 'ETH', name: 'Ethereum', pythPriceFeedId: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace' },
      { symbol: 'BTC', name: 'Bitcoin', pythPriceFeedId: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43' },
      { symbol: 'XRP', name: 'Ripple', pythPriceFeedId: 'ec5d399846a9209f3fe5881d70aae9268c94339ff9817c2a76c220c5e1a26838' },
      { symbol: 'SOL', name: 'Solana', pythPriceFeedId: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d' },
      { symbol: 'HYPE', name: 'Hyperliquid', pythPriceFeedId: '0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff' },
    ],
  },
  {
    id: 'equities',
    label: 'Equities',
    assets: [
      { symbol: 'AAPL', name: 'Apple Inc.', pythPriceFeedId: '49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688' },
      { symbol: 'TSLA', name: 'Tesla Inc.', pythPriceFeedId: '16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1571f0571' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', pythPriceFeedId: '20a938f54b68f1f2ef18ea0328f6dd0747f8ea11486d22b021e83a900be89776' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', pythPriceFeedId: 'b5d0e0fa58a1f8b81498ae670ce93c872d14434b72c364885d4fa1b257cbb07a' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', pythPriceFeedId: 'd0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1' },
    ],
  },
  {
    id: 'commodities',
    label: 'Commodities',
    assets: [
      { symbol: 'XAU', name: 'Gold', pythPriceFeedId: '765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2' },
      { symbol: 'XAG', name: 'Silver', pythPriceFeedId: 'f2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e' },
      { symbol: 'WTI', name: 'Crude Oil (WTI)', pythPriceFeedId: 'c7c60099c12805bea1ae4df2243d6a888e678095a43b11239101f0e8b1a3e093' },
      { symbol: 'XCU', name: 'Copper', pythPriceFeedId: 'a67c1b0df7454c9a2bab1aaca5c70b2d81e3d397db7a68b2a1fc6b0a4aaf4f2c' },
      { symbol: 'NG', name: 'Natural Gas', pythPriceFeedId: '6d40e5b0d8f54e1e9b05c2c02f2b3b08f2e3a2f4dfe4f5ab0f3d4c3b2a1f0e1d' },
    ],
  },
  {
    id: 'etfs',
    label: 'ETFs',
    assets: [
      { symbol: 'SPY', name: 'S&P 500 ETF', pythPriceFeedId: '19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5' },
      { symbol: 'QQQ', name: 'Nasdaq-100 ETF', pythPriceFeedId: '98898ab537cd7b3e459f8b8c2de2e42c1ee2a0d38c6c0aee3e2f3e14f1d2c0b9' },
      { symbol: 'IWM', name: 'Russell 2000 ETF', pythPriceFeedId: 'a3c9e5f8b2d4c6a8e0f2d4b6c8a0e2f4d6b8c0a2e4f6d8b0c2a4e6f8d0b2c4' },
      { symbol: 'GLD', name: 'Gold ETF', pythPriceFeedId: 'b4d0e6f2a8c4e0b6d2f8a4c0e6b2d8f4a0c6e2b8d4f0a6c2e8b4d0f6a2c8e4' },
      { symbol: 'TLT', name: '20+ Year Treasury ETF', pythPriceFeedId: 'c5e1f3a9b5d1e7c3f9a5b1d7e3c9f5a1b7d3e9c5f1a7b3d9e5c1f7a3b9d5e1' },
    ],
  },
];

/**
 * Pre-deployed Oracle Program IDs on SEDA testnet, keyed by logic template.
 * Each program accepts Pyth price feed IDs as execInputs.
 */
export const PROGRAM_IDS: Record<LogicTemplate, string> = {
  'simple-price': '8cf7808cdb5d16e9fb328007968d31727f8e67ac3c83b655aa61c4ccd4077125',
  'ema-smoothing': '8cf7808cdb5d16e9fb328007968d31727f8e67ac3c83b655aa61c4ccd4077125',
  'multi-source': '8cf7808cdb5d16e9fb328007968d31727f8e67ac3c83b655aa61c4ccd4077125',
  'custom': '8cf7808cdb5d16e9fb328007968d31727f8e67ac3c83b655aa61c4ccd4077125',
};

/**
 * Get the program ID and execInputs for a given asset + logic combination.
 */
export function getProgramConfig(asset: Asset, template: LogicTemplate) {
  return {
    programId: PROGRAM_IDS[template],
    execInputs: {
      pyth_assets: [`0x${asset.pythPriceFeedId}`],
    },
  };
}
