/* eslint-disable react/jsx-key */
import { Button } from 'frames.js/next';

import { frames } from '@/app/frames/frames';
import Layout from '@/app/components/layout';
import { BASE_URL } from '@/app/constants';
import getFonts from '@/app/fonts';

const handleRequest = frames(async () => {
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
      <Button action='post' target='/stats'>
        Show stats
      </Button>,
    ],
    imageOptions: {
      fonts: await getFonts(),
    },
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
