import { NextRequest, NextResponse } from 'next/server';

export function withCors(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async (req: NextRequest) => {
    const res = await handler(req);
    const origin = req.headers.get('origin');
    const allowed = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (origin && allowed.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Vary', 'Origin');
    }
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    return res;
  };
}

