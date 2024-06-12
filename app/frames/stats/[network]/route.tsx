import { NextRequest } from 'next/server';
import { GET as defaultGET } from '@/app/frames/route';
import { NETWORKS } from '@/app/constants';

// for backward compatibility
const handleRequest = (req: NextRequest, { params: urlParams }: { params: any }) =>
  defaultGET(req, { params: { address: urlParams.network, network: Object.keys(NETWORKS)[0] } });

export const GET = handleRequest;
export const POST = handleRequest;
