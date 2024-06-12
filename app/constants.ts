export const BASE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000';

export const NETWORKS: { [key: string]: { name: string; tokenSymbol: string; explorerUrl: string } } = {
  '8453': {
    name: 'Base',
    tokenSymbol: 'ETH',
    explorerUrl: 'https://base.blockscout.com',
  },
  '666666666': {
    name: 'Degen',
    tokenSymbol: 'DEGEN',
    explorerUrl: 'https://explorer.degen.tips',
  },
};
