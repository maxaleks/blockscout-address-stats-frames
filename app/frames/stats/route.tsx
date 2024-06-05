/* eslint-disable react/jsx-key */
import { Button } from 'frames.js/next';
import BigNumber from 'bignumber.js';

import { frames } from '@/app/frames/frames';
import { BASE_URL } from '@/app/constants';
import getFonts from '@/app/fonts';

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
  const [addressCounters, addressData, tokenBalancesData] = await Promise.all([
    fetchData(`${BLOCKCHAIN_API_URL}/addresses/${address}/counters`),
    fetchData(`${BLOCKCHAIN_API_URL}/addresses/${address}`),
    fetchData(`${BLOCKCHAIN_API_URL}/addresses/${address}/token-balances`),
  ]);

  const txsCount = addressCounters.transactions_count;
  const ens = addressData.ens_domain_name;
  const netWorth = Number(Number(calculateNetWorth(addressData, tokenBalancesData)).toFixed(2));
  const nativeBalance = Number(Number(BigNumber(addressData.coin_balance).div(BigNumber(10 ** 18)).toString()).toFixed(6));
  const tokensCount = tokenBalancesData.filter(({ token }: { token: any }) => token.type === 'ERC-20').length;
  const nftsCount = tokenBalancesData.filter(({ token }: { token: any }) => token.type === 'ERC-721').length;

  return { ens, txsCount, netWorth, nativeBalance, tokensCount, nftsCount };
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
      <div
        tw='flex w-full h-full justify-center items-center'
        style={{ background: 'linear-gradient(261.97deg, #E6EAFD 10.26%, #F2E9FE 27.54%, #F7EDFF 74.64%, #D3E4FF 99.73%)' }}
      >
        <div tw='flex flex-col w-[630px]'>
          <div tw='flex items-center mb-6 w-full'>
            <img src={`${BASE_URL}/logo.svg`} height='80px' width='80px' tw='mr-5' />
            {stats.ens ? (
              <div tw='flex flex-col h-full justify-between'>
                <span tw='text-5xl font-bold'>{stats.ens}</span>
                <span tw='text-xl'>{address}</span>
              </div>
            ) : (
              <span tw='text-5xl font-bold truncate'>
                {address.slice(0, 10)}...{address.slice(-4)}
              </span>
            )}
          </div>
          <div tw='flex w-full'>
            <div tw='flex flex-col flex-3 mr-2'>
              <div tw='flex flex-col px-5 py-3 bg-white rounded-lg mb-2'>
                <span tw='text-sm font-medium mb-1'>Net worth</span>
                <span tw='text-xl font-semibold'>$ {stats.netWorth}</span>
              </div>
              <div tw='flex flex-col px-5 py-3 bg-white rounded-lg'>
                <span tw='text-sm font-medium mb-1'>ETH balance</span>
                <span tw='text-xl font-semibold'>{stats.nativeBalance} ETH</span>
              </div>
            </div>
            <div tw='flex flex-col flex-2'>
              <div tw='flex flex-col px-5 py-3 bg-white rounded-lg mb-2'>
                <span tw='text-sm font-medium mb-1'>Transactions</span>
                <span tw='text-xl font-semibold'>{stats.txsCount}</span>
              </div>
              <div tw='flex flex-1'>
                <div tw='flex flex-col flex-1 px-5 py-3 bg-white rounded-lg mr-2'>
                  <span tw='text-sm font-medium mb-1'>Tokens</span>
                  <span tw='text-xl font-semibold'>{stats.tokensCount}</span>
                </div>
                <div tw='flex flex-col flex-1 px-5 py-3 bg-white rounded-lg'>
                  <span tw='text-sm font-medium mb-1'>NFTs</span>
                  <span tw='text-xl font-semibold'>{stats.nftsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    buttons: [
      <Button action='post' target='/'>
        Share
      </Button>,
    ],
    imageOptions: {
      fonts: await getFonts(),
    },
  };
});
