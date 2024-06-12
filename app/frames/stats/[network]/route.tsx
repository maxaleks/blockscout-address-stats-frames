import { NextRequest } from 'next/server';
import { GET as defaultGET } from '@/app/frames/route';

// for backward compatibility
const handleRequest = (req: NextRequest, { params: urlParams }: { params: any }) =>
  defaultGET(req, { params: { address: urlParams.network, network: '8453' } });

export const GET = handleRequest;
export const POST = handleRequest;
