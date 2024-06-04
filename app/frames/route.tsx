import { frames } from './frames';
import { Button } from 'frames.js/next';

export const GET = frames(async (ctx) => {
  return {
    image: <div tw='flex'>Stats</div>,
    buttons: [
      <Button action='post' target='/search'>Search by address</Button>,
      <Button action='post' target={{ pathname: '/stats', query: { self: true } }}>Show my stats</Button>,
    ],
  };
});
