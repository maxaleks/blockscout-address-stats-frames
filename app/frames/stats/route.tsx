/* eslint-disable react/jsx-key */
import { frames } from '../frames';
import { Button } from 'frames.js/next';
import BigNumber from 'bignumber.js';

const BLOCKCHAIN_API_URL = 'https://eth.blockscout.com/api/v2';

const fetchData = async (url: string) => fetch(url).then((res) => res.json());

function calculateUsdValue(value: string, decimals: string, exchange_rate: string) {
  return BigNumber(value || 0).div(BigNumber(10 ** Number(decimals || 18))).multipliedBy(BigNumber(exchange_rate || 0));
}

function calculateNetWorth(nativeToken: any, tokens: any[]) {
  return [
    ...tokens.map(({ token: { decimals, exchange_rate }, value }) => calculateUsdValue(value, decimals, exchange_rate)),
    calculateUsdValue(nativeToken.coin_balance, '18', nativeToken.exchange_rate),
  ].reduce((acc, value) => acc.plus(value), BigNumber(0)).toString();
}

async function getStats(address: string) {
  const [addressStatsData, nativeBalanceData, tokenBalancesData] = await Promise.all([
    fetchData(`${BLOCKCHAIN_API_URL}/addresses/${address}/counters`),
    fetchData(`${BLOCKCHAIN_API_URL}/addresses/${address}`),
    fetchData(`${BLOCKCHAIN_API_URL}/addresses/${address}/token-balances`),
  ]);

  const txsCount = addressStatsData.transactions_count;
  const netWorth = calculateNetWorth(nativeBalanceData, tokenBalancesData);
  const nativeBalance = BigNumber(nativeBalanceData.coin_balance).div(BigNumber(10 ** 18)).toString();
  const tokensCount = tokenBalancesData.filter(({ token }: { token: any }) => token.type === 'ERC-20').length;
  const nftsCount = tokenBalancesData.filter(({ token }: { token: any }) => token.type === 'ERC-721').length;

  return { txsCount, netWorth, nativeBalance, tokensCount, nftsCount };
}

function getErrorState(message: string) {
  return {
    image: <div tw='flex'>{message}</div>,
    buttons: [
      <Button action='post' target='/search'>
        Try again
      </Button>,
    ],
  };
}

export const POST = frames(async (ctx) => {
  let address = null;

  if (ctx.searchParams.self) {
    address = ctx.message?.requesterVerifiedAddresses?.[0];
    if (!address) {
      return getErrorState('No address linked to your account');
    }
  } else {
    address = ctx.message?.inputText;
    if (!address) {
      return getErrorState('Invalid address');
    }
  }

  let stats = null;
  try {
    stats = await getStats(address);
  } catch (e) {
    console.error(e);
    return getErrorState('Failed to fetch stats');
  }

  return {
    image: (
      <div tw='flex flex-col'>
        <span>Stats for {address}:</span>
        <span>Transactions count: {stats.txsCount}</span>
        <span>Net worth: {stats.netWorth}</span>
        <span>Native balance: {stats.nativeBalance}</span>
        <span>Tokens count: {stats.tokensCount}</span>
        <span>NFTs count: {stats.nftsCount}</span>
      </div>
    ),
    buttons: [
      <Button action='post' target='/'>
        Share
      </Button>,
    ],
  };
});
