import { NextResponse } from 'next/server';

const REQUIRED = ['ticketLink', 'productLink', 'occasion', 'agentName'] as const;
type Payload = Record<(typeof REQUIRED)[number], string> & { timestamp?: string };

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as Partial<Payload>;

    // Basic validation
    for (const k of REQUIRED) {
      if (!data[k] || typeof data[k] !== 'string') {
        return NextResponse.json({ ok: false, error: `Missing field: ${k}` }, { status: 400 });
      }
    }

    if (!isValidUrl(data.ticketLink!)) {
      return NextResponse.json({ ok: false, error: 'Invalid ticketLink URL' }, { status: 400 });
    }
    if (!isValidUrl(data.productLink!)) {
      return NextResponse.json({ ok: false, error: 'Invalid productLink URL' }, { status: 400 });
    }

    const GAS_URL = process.env.GOOGLE_APPS_SCRIPT_URL;
    const payload: Payload = {
      ticketLink: data.ticketLink!.trim(),
      productLink: data.productLink!.trim(),
      occasion: data.occasion!.trim(),
      agentName: data.agentName!.trim(),
      timestamp: new Date().toISOString(),
    };

    if (!GAS_URL) {
      // Accept but warn if not configured
      console.warn('GOOGLE_APPS_SCRIPT_URL not set. Payload:', payload);
      return NextResponse.json({ ok: true, queued: true, warning: 'Apps Script URL not configured' }, { status: 202 });
    }

    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // 5s safety timeout via AbortController
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ ok: false, error: 'Apps Script error', detail: text?.slice(0, 500) }, { status: 502 });
    }

    const json = await res.json().catch(() => ({ ok: true }));
    return NextResponse.json({ ok: true, ...json }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 });
  }
}

