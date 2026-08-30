import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const currentRateParam = searchParams.get('current');
  const currentRate = currentRateParam ? parseFloat(currentRateParam) : 675;

  let fetchedRate = 675; // Default reference rate as of user statement
  let eurRate: number | undefined = 770;
  let mlcRate: number | undefined = 477.65;
  let fetchedFromRemote = false;

  try {
    // Attempt 1: Fetch directly from elTOQUE RSS / API mirror
    const response = await fetch('https://tasas.eltoque.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (response.ok) {
      const html = await response.text();
      // Match USD exchange rate pattern in elTOQUE HTML table
      const usdMatch = html.match(/1\s*USD[^\d]*([\d,.]+)\s*CUP/i) || html.match(/USD[^\d]*([\d,.]+)/i);
      if (usdMatch && usdMatch[1]) {
        const parsed = parseFloat(usdMatch[1].replace(',', '.'));
        if (!isNaN(parsed) && parsed > 50 && parsed < 2000) {
          fetchedRate = parsed;
          fetchedFromRemote = true;
        }
      }

      const eurMatch = html.match(/1\s*EUR[^\d]*([\d,.]+)\s*CUP/i);
      if (eurMatch && eurMatch[1]) {
        const parsed = parseFloat(eurMatch[1].replace(',', '.'));
        if (!isNaN(parsed)) eurRate = parsed;
      }

      const mlcMatch = html.match(/1\s*MLC[^\d]*([\d,.]+)\s*CUP/i);
      if (mlcMatch && mlcMatch[1]) {
        const parsed = parseFloat(mlcMatch[1].replace(',', '.'));
        if (!isNaN(parsed)) mlcRate = parsed;
      }
    }
  } catch (err) {
    // Graceful fallback to default/cached rate when offline
  }

  // Determine rate trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (fetchedRate > currentRate) {
    trend = 'up';
  } else if (fetchedRate < currentRate) {
    trend = 'down';
  }

  return NextResponse.json({
    success: true,
    usd: fetchedRate,
    eur: eurRate,
    mlc: mlcRate,
    trend,
    synced: fetchedFromRemote,
    source: 'elTOQUE (elToque.com)',
    timestamp: Date.now()
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
  });
}
