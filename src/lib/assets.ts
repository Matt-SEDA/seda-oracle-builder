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
      { symbol: 'XRP', name: 'Ripple', pythPriceFeedId: 'ec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8' },
      { symbol: 'SEDA', name: 'SEDA', pythPriceFeedId: '6abf75211b819e5933e96466760b0ae8c326c7057d8a681d229430347b0825f6' },
      { symbol: 'HYPE', name: 'Hyperliquid', pythPriceFeedId: '4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b' },
    ],
  },
  {
    id: 'equities',
    label: 'Equities',
    assets: [
      { symbol: 'AAPL', name: 'Apple Inc.', pythPriceFeedId: '49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688' },
      { symbol: 'TSLA', name: 'Tesla Inc.', pythPriceFeedId: '16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', pythPriceFeedId: 'b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593' },
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
      { symbol: 'WTI', name: 'Crude Oil (WTI)', pythPriceFeedId: '40d9903bd7a727ad128c89fca177d77d0175de6ea5c789a81473bf17bad64b39' },
      { symbol: 'XCU', name: 'Copper', pythPriceFeedId: '636bedafa14a37912993f265eda22431a2be363ad41a10276424bbe1b7f508c4' },
      { symbol: 'NG', name: 'Natural Gas', pythPriceFeedId: 'cbbe4de47ffd7681b33db9ebdf22eeb899046cbe566be06e875bf088324787ce' },
    ],
  },
  {
    id: 'etfs',
    label: 'ETFs',
    assets: [
      { symbol: 'SPY', name: 'S&P 500 ETF', pythPriceFeedId: '19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5' },
      { symbol: 'QQQ', name: 'Nasdaq-100 ETF', pythPriceFeedId: '9695e2b96ea7b3859da9ed25b7a46a920a776e2fdae19a7bcfdf2b219230452d' },
      { symbol: 'IWM', name: 'Russell 2000 ETF', pythPriceFeedId: 'eff690a187797aa225723345d4612abec0bf0cec1ae62347c0e7b1905d730879' },
      { symbol: 'GLD', name: 'Gold ETF', pythPriceFeedId: 'e190f467043db04548200354889dfe0d9d314c08b8d4e62fabf4d5a3140fecca' },
      { symbol: 'TLT', name: '20+ Year Treasury ETF', pythPriceFeedId: '9f383d612ac09c7e6ffda24deca1502fce72e0ba58ff473fea411d9727401cc1' },
    ],
  },
];

/**
 * Pre-deployed Oracle Program IDs on SEDA testnet, keyed by logic template.
 * Each program accepts Pyth price feed IDs as execInputs.
 */
export const PROGRAM_IDS: Record<LogicTemplate, string> = {
  'simple-price': 'b2aec3ccfa64af1cdd218e933e31d824dde36bef1cf8954cb495c1fa47c7b96f',
  'ema-smoothing': '992083e1b5c1bba144f0fb41c75586b9c656f68cd9200acf4521d9991fb0f95c',
  'multi-source': '92af5af2581368c8ed0d969727e94e833c4c911291240f2af6c5089aabd026b5',
  'custom': 'b2aec3ccfa64af1cdd218e933e31d824dde36bef1cf8954cb495c1fa47c7b96f',
};

/**
 * Get the program ID and execInputs for a given asset + logic combination.
 */
export function getProgramConfig(asset: Asset, template: LogicTemplate) {
  return {
    programId: PROGRAM_IDS[template],
    execInputs: asset.pythPriceFeedId,
  };
}
