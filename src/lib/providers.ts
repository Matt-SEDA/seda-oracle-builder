export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  dataSourceName: string;
  testnetEndpoint: string;
  mainnetEndpoint: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'pyth',
    name: 'Pyth',
    description: 'Real-time crypto, equity, and forex price feeds powered by Pyth Network.',
    dataSourceName: 'Pyth Core',
    testnetEndpoint: 'https://hermes.pyth.network/v2/updates/price/latest',
    mainnetEndpoint: 'https://hermes.pyth.network/v2/updates/price/latest',
  },
  {
    id: 'dxfeed',
    name: 'dxFeed',
    description: 'Market data covering equities, forex, futures, and options globally.',
    dataSourceName: 'dxFeed',
    testnetEndpoint: 'http://98.84.79.123:5384/proxy',
    mainnetEndpoint: 'http://seda-proxy.dxfeed.com:5384/proxy',
  },
  {
    id: 'nobi',
    name: 'Nobi Labs',
    description: 'Crypto and commodity feeds with broad symbol coverage.',
    dataSourceName: 'Nobi Labs',
    testnetEndpoint: 'http://43.157.108.162:5384/proxy/price',
    mainnetEndpoint: 'https://seda.labs.usenobi.com/proxy/',
  },
  {
    id: 'blocksize',
    name: 'Blocksize',
    description: 'Institutional-grade digital asset pricing and analytics.',
    dataSourceName: 'Blocksize Capital',
    testnetEndpoint: 'https://seda-proxy.blocksize.capital/',
    mainnetEndpoint: 'https://seda-proxy.blocksize.capital/',
  },
  {
    id: 'caplight',
    name: 'Caplight',
    description: 'Private equity and pre-IPO market data.',
    dataSourceName: 'Caplight',
    testnetEndpoint: 'http://104.155.34.32:5384/proxy/projectId',
    mainnetEndpoint: 'http://104.155.34.32:5384/proxy/projectId',
  },
  {
    id: 'polyrouter',
    name: 'PolyRouter',
    description: 'Prediction market data from Polymarket and other sources.',
    dataSourceName: 'PolyRouter',
    testnetEndpoint: 'https://purity-production-f6ee.up.railway.app/proxy/markets',
    mainnetEndpoint: 'https://purity-production-f6ee.up.railway.app/proxy/markets',
  },
];

export const CUSTOM_PROVIDER: ProviderConfig = {
  id: 'custom',
  name: 'Custom API',
  description: 'Connect your own public or private API endpoint.',
  dataSourceName: '',
  testnetEndpoint: '',
  mainnetEndpoint: '',
};

export const FEED_TYPE_ORDER = [
  'All',
  'Crypto',
  'Equities',
  'Forex',
  'ETF',
  'Commodities',
  'Metals',
  'Crypto Redemption Rate',
  'Crypto Index',
  'Crypto NAV',
  'Crypto xStock',
];
