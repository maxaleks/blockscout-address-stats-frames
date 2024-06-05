import { fetchMetadata } from 'frames.js/next';
import { Metadata } from 'next';

import { BASE_URL } from '@/app/constants';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Frames Next.js Example',
    other: {
      ...(await fetchMetadata(
        new URL('/', BASE_URL)
      )),
    },
  };
}

export default async function Home() {
  return <div>GM user data example.</div>;
}
