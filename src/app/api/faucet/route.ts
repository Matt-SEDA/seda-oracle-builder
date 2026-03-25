import { NextRequest, NextResponse } from 'next/server';

const FAUCET_URL = 'https://explorer-api.testnet.seda.xyz/main/trpc/faucet.request';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || !address.startsWith('seda1')) {
      return NextResponse.json(
        { success: false, error: 'Invalid SEDA address' },
        { status: 400 }
      );
    }

    const response = await fetch(FAUCET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: { address },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.error?.json?.message || `Faucet returned ${response.status}`;
      return NextResponse.json({ success: false, error: errorMsg });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Faucet request failed',
    });
  }
}
