import { NextRequest, NextResponse } from 'next/server';

interface RateParseResult {
  usd?: number;
  eur?: number;
  mlc?: number;
  source: string;
}

/**
 * Estrategia 1: API Oficial de elTOQUE (Requiere Token gratuito de https://tasas-token.eltoque.com/)
 */
async function fetchFromOfficialElToqueAPI(token: string): Promise<RateParseResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('https://api.eltoque.com/v1/trmi', {
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json',
        'User-Agent': 'CuentaCasa-ERP/1.7.5 (Cuba)'
      },
      signal: controller.signal,
      next: { revalidate: 300 }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    
    // Soportar variantes de formato de la API de elTOQUE
    // Ej: { USD: 320, EUR: 350, MLC: 265 } o { data: { USD: { mid: 320 } } } o { data: { USD: 320 } }
    let usd: number | undefined;
    let eur: number | undefined;
    let mlc: number | undefined;

    const root = data?.data || data?.rates || data;
    if (root) {
      if (typeof root.USD === 'number') usd = root.USD;
      else if (root.USD && typeof root.USD.mid === 'number') usd = root.USD.mid;
      else if (root.USD && typeof root.USD.buy === 'number') usd = root.USD.buy;

      if (typeof root.EUR === 'number') eur = root.EUR;
      else if (root.EUR && typeof root.EUR.mid === 'number') eur = root.EUR.mid;

      if (typeof root.MLC === 'number') mlc = root.MLC;
      else if (root.MLC && typeof root.MLC.mid === 'number') mlc = root.MLC.mid;
    }

    if (usd && usd > 50 && usd < 3000) {
      return { usd, eur, mlc, source: 'elTOQUE API Oficial (Token Autorizado)' };
    }
  } catch (err) {
    // Falla controlada para pasar al siguiente tier
  }
  return null;
}

/**
 * Estrategia 2: Scraper de datos embebidos __NEXT_DATA__ en la web principal de elTOQUE
 */
async function fetchFromElToqueWebData(): Promise<RateParseResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://eltoque.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal,
      next: { revalidate: 300 }
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const html = await res.text();

    // 1. Extraer bloque __NEXT_DATA__ JSON
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataMatch && nextDataMatch[1]) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const pageProps = nextData?.props?.pageProps;
        const rates = pageProps?.rates || pageProps?.trmi || pageProps?.devisas || pageProps?.initialState?.rates;
        if (rates) {
          const usd = Number(rates.USD?.mid || rates.USD?.buy || rates.USD);
          const eur = Number(rates.EUR?.mid || rates.EUR?.buy || rates.EUR);
          const mlc = Number(rates.MLC?.mid || rates.MLC?.buy || rates.MLC);
          if (usd && usd > 50 && usd < 3000) {
            return { usd, eur: isNaN(eur) ? undefined : eur, mlc: isNaN(mlc) ? undefined : mlc, source: 'elTOQUE Web (JSON Embebido)' };
          }
        }
      } catch {}
    }

    // 2. Patrones regex en el HTML renderizado
    const usdMatch = html.match(/1\s*USD[^\d]*([\d,.]+)\s*CUP/i) || 
                     html.match(/USD[^\d]*([\d,.]+)/i) || 
                     html.match(/"USD":\s*\{[^}]*"mid":\s*([\d.]+)/i);
    if (usdMatch && usdMatch[1]) {
      const parsed = parseFloat(usdMatch[1].replace(',', '.'));
      if (!isNaN(parsed) && parsed > 50 && parsed < 3000) {
        return { usd: parsed, source: 'elTOQUE Web (HTML Regex)' };
      }
    }
  } catch {}
  return null;
}

/**
 * Estrategia 3: Espejo Comunitario Abierto KubaCash / Tasas Informales
 */
async function fetchFromCommunityMirror(): Promise<RateParseResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const res = await fetch(`https://yossthedev.me/kubacash-service/data/${dateStr}/informal.json`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
      next: { revalidate: 600 }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const usd = Number(data.USD?.mid || data.USD?.buy || data.USD);
      const eur = Number(data.EUR?.mid || data.EUR?.buy || data.EUR);
      const mlc = Number(data.MLC?.mid || data.MLC?.buy || data.MLC);
      if (usd && usd > 50 && usd < 3000) {
        return { usd, eur: isNaN(eur) ? undefined : eur, mlc: isNaN(mlc) ? undefined : mlc, source: 'Espejo Abierto KubaCash' };
      }
    }
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const currentRateParam = searchParams.get('current');
  const currentRate = currentRateParam ? parseFloat(currentRateParam) : 320;
  const tokenParam = searchParams.get('token') || process.env.ELTOQUE_API_TOKEN;

  let fetchedRate = currentRate;
  let eurRate: number | undefined = undefined;
  let mlcRate: number | undefined = undefined;
  let fetchedFromRemote = false;
  let sourceUsed = 'Configuración Manual del Sistema';

  // Ejecución en cascada según disponibilidad
  // 1. Si hay token disponible, usar el endpoint oficial
  if (tokenParam && tokenParam.trim()) {
    const resApi = await fetchFromOfficialElToqueAPI(tokenParam.trim());
    if (resApi?.usd) {
      fetchedRate = resApi.usd;
      eurRate = resApi.eur;
      mlcRate = resApi.mlc;
      fetchedFromRemote = true;
      sourceUsed = resApi.source;
    }
  }

  // 2. Si no hubo respuesta o no hay token, intentar web de elTOQUE
  if (!fetchedFromRemote) {
    const resWeb = await fetchFromElToqueWebData();
    if (resWeb?.usd) {
      fetchedRate = resWeb.usd;
      eurRate = resWeb.eur;
      mlcRate = resWeb.mlc;
      fetchedFromRemote = true;
      sourceUsed = resWeb.source;
    }
  }

  // 3. Si aún no hay respuesta, intentar espejo comunitario abierto
  if (!fetchedFromRemote) {
    const resMirror = await fetchFromCommunityMirror();
    if (resMirror?.usd) {
      fetchedRate = resMirror.usd;
      eurRate = resMirror.eur;
      mlcRate = resMirror.mlc;
      fetchedFromRemote = true;
      sourceUsed = resMirror.source;
    }
  }

  // Determinar tendencia con respecto a la tasa guardada actualmente
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
    source: sourceUsed,
    tokenConfigured: Boolean(tokenParam && tokenParam.trim()),
    timestamp: Date.now()
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
  });
}
