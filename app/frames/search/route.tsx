/* eslint-disable react/jsx-key */
import { frames } from '../frames';
import { Button } from 'frames.js/next';

const handleRequest = frames(async () => {
  return {
    textInput: 'Enter an address',
    image: <div tw='flex'>Provide an address</div>,
    buttons: [
      <Button action='post' target='/stats'>
        Show stats
      </Button>,
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
