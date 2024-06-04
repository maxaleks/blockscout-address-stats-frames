/* eslint-disable react/jsx-key */
import { frames } from '../../frames';
import { Button } from 'frames.js/next';
import { NextRequest } from 'next/server';

const handleRequest = async (
  req: NextRequest,
  { params: { address } }: { params: { address: string } }
) => {
  return await frames(async (ctx) => {
    return {
      image: <div tw='flex'>Stats for {address}</div>,
      buttons: [
        <Button action='post' target='/'>
          Share
        </Button>,
      ],
    };
  })(req);
};

export const GET = handleRequest;
export const POST = handleRequest;
