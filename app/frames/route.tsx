/* eslint-disable react/jsx-key */
import { Button } from 'frames.js/next';
import BigNumber from 'bignumber.js';
import { NextRequest } from 'next/server';
import { format } from 'date-fns';
import { isAddress } from 'ethers';

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

const getIntermediateFrame = (text: string, iconName = 'no-results') => (
  <Layout>
    <img src={`${BASE_URL}/${iconName}.svg`} height='350px' width='450px' tw='mb-5' />
    {text.split('\n').map((line, index) => (
      <span key={index} tw='text-3xl font-medium text-[#5353D3] mb-12'>
        {line}
      </span>
    ))}
  </Layout>
);

const handleRequest = async (
  req: NextRequest,
  { params: urlParams }: { params: any }
) => {
  return await frames(async (ctx) => {
    if (ctx.searchParams.action === 'search') {
      return {
        textInput: 'Enter an EOA address',
        image: getIntermediateFrame(`Enter 0x... address or ENS to find stats\n about a user's wallet`, 'search'),
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
          image: getIntermediateFrame('No address linked to your account.'),
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
          image: getIntermediateFrame(`Couldn't find any information.\n Please, try again.`),
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
      if (!isAddress(address)) {
        const searchData = await fetchData(`${BLOCKSCOUT_API_URL}/search?q=${address}`);
        address = searchData.items.find((item: any) => item.type === 'ens_domain')?.address;
        if (!address) {
          throw new Error('No address found');
        }
      }
      stats = await getStats(address);
    } catch (e) {
      console.error(e);
      return {
        image: getIntermediateFrame(`Couldn't find any information.\n Please, try again.`),
        buttons: [
          <Button action='post' target={{ query: { action: 'show_my_stats' } }}>
            My stats
          </Button>,
          <Button action='post' target={{ query: { action: 'search' } }}>
            Find by address
          </Button>,
        ],
      };;
    }

    return {
      image: (
        <Layout>
          <div tw='flex flex-col w-full'>
            <div tw='flex items-center mb-10 w-full'>
              <img src={`${BASE_URL}/logo.svg`} height='100px' width='100px' tw='mr-5' />
              {stats.ens ? (
                <div tw='flex flex-col h-full justify-between'>
                  <span tw='text-6xl font-bold'>{stats.ens}</span>
                  <span tw='text-2xl'>{address}</span>
                </div>
              ) : (
                <span tw='text-6xl font-bold truncate'>
                  {address.slice(0, 16)}...{address.slice(-4)}
                </span>
              )}
            </div>
            <div tw='flex justify-between text-2xl text-[#5353D3] mb-6'>
              <div tw='flex items-center'>
                Address stats on
                <div tw='flex items-center ml-3 mr-4 font-medium'>
                  <img src={`${BASE_URL}/network-logo.svg`} height='30px' width='30px' tw='mr-1' />
                  Base,
                </div>
                {format(Date(), 'MMM d, yyyy')}
              </div>
              <div tw='flex items-center'>
                Go to
                <img src={`${BASE_URL}/logo-with-text.svg`} height='30px' tw='mx-3 mt--1' />
                to get more details
              </div>
            </div>
            <div tw='flex w-full'>
              <div tw='flex flex-col flex-3 mr-4'>
                <div tw='flex flex-col px-10 py-6 bg-white rounded-xl mb-4'>
                  <span tw='text-2xl font-medium mb-2'>Net worth</span>
                  <span tw='text-4xl font-semibold'>$ {stats.netWorth}</span>
                </div>
                <div tw='flex flex-col px-10 py-6 bg-white rounded-xl'>
                  <span tw='text-2xl font-medium mb-2'>ETH balance</span>
                  <span tw='text-4xl font-semibold'>{stats.nativeBalance} ETH</span>
                </div>
              </div>
              <div tw='flex flex-col flex-2'>
                <div tw='flex flex-col px-10 py-6 bg-white rounded-xl mb-4'>
                  <span tw='text-2xl font-medium mb-2'>Transactions</span>
                  <span tw='text-4xl font-semibold'>{stats.txsCount}</span>
                </div>
                <div tw='flex flex-1'>
                  <div tw='flex flex-col flex-1 px-10 py-6 bg-white rounded-xl mr-4'>
                    <span tw='text-2xl font-medium mb-2'>Tokens</span>
                    <span tw='text-4xl font-semibold'>{stats.tokensCount}</span>
                  </div>
                  <div tw='flex flex-col flex-1 px-10 py-6 bg-white rounded-xl'>
                    <span tw='text-2xl font-medium mb-2'>NFTs</span>
                    <span tw='text-4xl font-semibold'>{stats.nftsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      ),
      buttons: [
        <Button action='post' target={{ query: { action: 'show_my_stats' } }}>
          My stats
        </Button>,
        <Button action='post' target={{ query: { action: 'search' } }}>
          Find by EOA
        </Button>,
        <Button
          action='link'
          target={`https://warpcast.com/~/compose?${new URLSearchParams({
            'text': `Check this address stats on Blockscout!\n\n${BLOCKSCOUT_URL}/address/${address}`,
            'embeds[]': `${BASE_URL}/frames/stats/${address}`,
          }).toString()}`}
        >
          Share
        </Button>,
        <Button action='link' target={`${BLOCKSCOUT_URL}/address/${address}`}>
          Open
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
