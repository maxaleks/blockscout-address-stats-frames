/* eslint-disable react/jsx-key */
import { Button } from 'frames.js/next';
import BigNumber from 'bignumber.js';
import { NextRequest } from 'next/server';

import { frames } from '@/app/frames/frames';
import { BASE_URL } from '@/app/constants';
import getFonts from '@/app/fonts';
import Layout from '@/app/components/layout';
import { BLOCKSCOUT_API_URL, BLOCKSCOUT_URL } from '@/app/constants';

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
    fetchData(`${BLOCKSCOUT_API_URL}/addresses/${address}/counters`),
    fetchData(`${BLOCKSCOUT_API_URL}/addresses/${address}`),
    fetchData(`${BLOCKSCOUT_API_URL}/addresses/${address}/token-balances`),
  ]);

  const txsCount = addressCounters.transactions_count;
  const ens = addressData.ens_domain_name;
  const netWorth = Number(Number(calculateNetWorth(addressData, tokenBalancesData)).toFixed(2));
  const nativeBalance = Number(Number(BigNumber(addressData.coin_balance).div(BigNumber(10 ** 18)).toString()).toFixed(6));
  const tokensCount = tokenBalancesData.filter(({ token }: { token: any }) => token.type === 'ERC-20').length;
  const nftsCount = tokenBalancesData.filter(({ token }: { token: any }) => token.type === 'ERC-721').length;

  return { ens, txsCount, netWorth, nativeBalance, tokensCount, nftsCount };
}

const handleRequest = async (
  req: NextRequest,
  { params: urlParams }: { params: any }
) => {
  return await frames(async (ctx) => {
    if (ctx.searchParams.action === 'search') {
      return {
        textInput: 'Enter an EOA address',
        image: (
          <Layout>
            <img src={`${BASE_URL}/search.svg`} height='300px' width='390px' tw='mb-5' />
            <span tw='text-xl font-medium text-[#5353D3]'>
              Enter 0x... address or ENS to find stats
            </span>
            <span tw='text-xl font-medium text-[#5353D3]'>
              about a user's wallet
            </span>
          </Layout>
        ),
        buttons: [
          <Button action='post' target={{ query: { action: 'show_address_stats' } }}>
            Get stats
          </Button>,
          <Button action='post'>Go back</Button>,
        ],
        imageOptions: {
          fonts: await getFonts(),
        },
      };
    }

    let address = null;

    if (ctx.searchParams.action === 'show_my_stats') {
      address = ctx.message?.requesterVerifiedAddresses?.[0];
      if (!address) {
        return {
          textInput: 'Enter an EOA address',
          image: (
            <Layout>
              <img src={`${BASE_URL}/no-results.svg`} height='300px' width='390px' tw='mb-5' />
              <span tw='text-xl font-medium text-[#5353D3]'>
                No address linked to your account.
              </span>
            </Layout>
          ),
          buttons: [
            <Button action='post'>Go back</Button>,
          ],
        };
      }
    } else if (ctx.searchParams.action === 'show_address_stats') {
      address = ctx.message?.inputText;
      if (!address) {
        return {
          textInput: 'Enter an EOA address',
          image: (
            <Layout>
              <img src={`${BASE_URL}/no-results.svg`} height='300px' width='390px' tw='mb-5' />
              <span tw='text-xl font-medium text-[#5353D3]'>
                Couldn't find any information.
              </span>
              <span tw='text-xl font-medium text-[#5353D3]'>
                Please, try again.
              </span>
            </Layout>
          ),
          buttons: [
            <Button action='post' target={{ query: { action: 'show_address_stats' } }}>
              Get stats
            </Button>,
            <Button action='post'>Go back</Button>,
          ],
        };
      }
    }

    address = address || urlParams?.address;

    let stats = null;
    try {
      if (!address) {
        throw new Error('No address provided');
      }
      stats = await getStats(address);
    } catch (e) {
      console.error(e);
      return {
        image: (
          <Layout>
            <img src={`${BASE_URL}/no-results.svg`} height='300px' width='390px' tw='mb-5' />
            <span tw='text-xl font-medium text-[#5353D3]'>
              Failed to fetch stats.
            </span>
          </Layout>
        ),
        buttons: [
          <Button action='post' target={{ query: { action: 'show_my_stats' } }}>
            Show my stats
          </Button>,
          <Button action='post' target={{ query: { action: 'search' } }}>
            Search by address
          </Button>,
        ],
      };;
    }

    return {
      image: (
        <Layout>
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
        </Layout>
      ),
      buttons: [
        <Button action='post' target={{ query: { action: 'show_my_stats' } }}>
          Show my stats
        </Button>,
        <Button action='post' target={{ query: { action: 'search' } }}>
          Search by address
        </Button>,
        <Button
          action='link'
          target={`https://warpcast.com/~/compose?${new URLSearchParams({
            'text': `Check this address stats on Blockscout!\n\n${BLOCKSCOUT_URL}/address/${address}`,
            'embeds[]': BASE_URL+'/frames'
          }).toString()}`}
        >
          Share
        </Button>,
        <Button action='link' target={`${BLOCKSCOUT_URL}/address/${address}`}>
          Open on Blockscout
        </Button>,
      ],
      imageOptions: {
        fonts: await getFonts(),
      },
    };
  })(req);
};

export const GET = handleRequest;
export const POST = handleRequest;
