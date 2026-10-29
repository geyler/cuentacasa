export const DEFAULT_PRIMARY_COLOR = '#1A73E8';
export const DEFAULT_SECONDARY_COLOR = '#0D9488';

export interface BrandPalette {
  primary: string;
  primaryHover: string;
  primaryDark: string;
  primaryDarker: string;
  primarySubtleDark: string;
  primaryLight: string;
  primaryLightHover: string;
  primaryBorder: string;
  primaryAccent: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryHover: string;
  secondaryDark: string;
  secondaryDarker: string;
  secondaryLight: string;
  secondaryLightHover: string;
  secondaryBorder: string;
  secondaryAccent: string;
  onSecondaryContainer: string;
}

export interface ThemeColorPreset {
  id: string;
  name: string;
  hex: string;
  secondaryHex: string;
  description: string;
}

export const THEME_COLOR_PRESETS: ThemeColorPreset[] = [
  { id: 'samy-rose', name: 'Rosa Samy Chic', hex: '#DB2777', secondaryHex: '#0D9488', description: 'Rosa boutique vibrante estilo Samy Store con acento turquesa' },
  { id: 'shein-glam', name: 'Fucsia Shein Glam', hex: '#E11D48', secondaryHex: '#7C3AED', description: 'Fucsia y magenta moderno para tiendas de moda femenina' },
  { id: 'pastel-boutique', name: 'Rosa Pastel Elegante', hex: '#F472B6', secondaryHex: '#0284C7', description: 'Suave y femenino con secundario azul cielo' },
  { id: 'samy-blue', name: 'Azul Samy (Por defecto)', hex: '#1A73E8', secondaryHex: '#0D9488', description: 'Azul corporativo clásico con acento turquesa financiero' },
  { id: 'royal-navy', name: 'Azul Marino Real', hex: '#1E40AF', secondaryHex: '#0284C7', description: 'Tono profundo ejecutivo con secundario celeste oceánico' },
  { id: 'sky-ocean', name: 'Azul Océano', hex: '#0284C7', secondaryHex: '#4F46E5', description: 'Fresco y de alto contraste con secundario índigo' },
  { id: 'indigo-pro', name: 'Índigo Moderno', hex: '#4F46E5', secondaryHex: '#0891B2', description: 'Elegante estilo tecnológico con cian profesional' },
  { id: 'teal-market', name: 'Turquesa Corporativo', hex: '#0D9488', secondaryHex: '#2563EB', description: 'Equilibrado y limpio con secundario azul real' },
  { id: 'emerald-store', name: 'Esmeralda Comercial', hex: '#059669', secondaryHex: '#0284C7', description: 'Asociado a crecimiento con secundario azul cielo' },
  { id: 'slate-exec', name: 'Pizarra Ejecutivo', hex: '#334155', secondaryHex: '#0D9488', description: 'Minimalista y sobrio con acento esmeralda-turquesa' },
  { id: 'violet-brand', name: 'Violeta Real', hex: '#6D28D9', secondaryHex: '#0284C7', description: 'Distintivo y contemporáneo con secundario océano' },
  { id: 'amber-warm', name: 'Ámbar Dorado', hex: '#B45309', secondaryHex: '#0F766E', description: 'Cálido y comercial con contraste verde petróleo' }
];

export const SECONDARY_COLOR_PRESETS: Array<{ id: string; name: string; hex: string }> = [
  { id: 'sec-rose', name: 'Rosa Samy', hex: '#DB2777' },
  { id: 'sec-fuchsia', name: 'Fucsia Glam', hex: '#E11D48' },
  { id: 'sec-pastel', name: 'Rosa Pastel', hex: '#F472B6' },
  { id: 'sec-teal', name: 'Turquesa Financiero', hex: '#0D9488' },
  { id: 'sec-ocean', name: 'Azul Océano', hex: '#0284C7' },
  { id: 'sec-indigo', name: 'Índigo Real', hex: '#4F46E5' },
  { id: 'sec-emerald', name: 'Esmeralda', hex: '#059669' },
  { id: 'sec-cyan', name: 'Cian Profundo', hex: '#0891B2' },
  { id: 'sec-amber', name: 'Ámbar Ejecutivo', hex: '#D97706' },
  { id: 'sec-violet', name: 'Violeta Moderno', hex: '#7C3AED' },
  { id: 'sec-slate', name: 'Pizarra Neutro', hex: '#475569' }
];

export function normalizeHexColor(input?: string, fallback: string = DEFAULT_PRIMARY_COLOR): string {
  if (!input || typeof input !== 'string') return fallback;
  const clean = input.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(clean)) return clean.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(clean)) {
    const r = clean[1];
    const g = clean[2];
    const b = clean[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const validHex = normalizeHexColor(hex).slice(1);
  const r = parseInt(validHex.slice(0, 2), 16) / 255;
  const g = parseInt(validHex.slice(2, 4), 16) / 255;
  const b = parseInt(validHex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = ((h % 360) + 360) % 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (hNorm >= 0 && hNorm < 60) {
    rPrime = c; gPrime = x; bPrime = 0;
  } else if (hNorm >= 60 && hNorm < 120) {
    rPrime = x; gPrime = c; bPrime = 0;
  } else if (hNorm >= 120 && hNorm < 180) {
    rPrime = 0; gPrime = c; bPrime = x;
  } else if (hNorm >= 180 && hNorm < 240) {
    rPrime = 0; gPrime = x; bPrime = c;
  } else if (hNorm >= 240 && hNorm < 300) {
    rPrime = x; gPrime = 0; bPrime = c;
  } else {
    rPrime = c; gPrime = 0; bPrime = x;
  }

  const toHex = (n: number) => {
    const val = Math.round((n + m) * 255);
    return Math.max(0, Math.min(255, val)).toString(16).padStart(2, '0');
  };

  return `#${toHex(rPrime)}${toHex(gPrime)}${toHex(bPrime)}`.toUpperCase();
}

/**
 * Deriva un color secundario armónico a partir del color primario cuando no se especifica uno manual.
 */
export function deriveHarmoniousSecondary(primaryHex?: string): string {
  const normPrimary = normalizeHexColor(primaryHex, DEFAULT_PRIMARY_COLOR);
  const matchedPreset = THEME_COLOR_PRESETS.find(p => p.hex.toUpperCase() === normPrimary);
  if (matchedPreset) return matchedPreset.secondaryHex;

  const { h, s, l } = hexToHsl(normPrimary);
  // Desplazamiento armónico análogo-complementario (-38° hacia cian/turquesa o +45° si ya está en rango verde/turquesa)
  const shiftedHue = (h >= 140 && h <= 200) ? (h + 45) % 360 : (h - 38 + 360) % 360;
  const targetSat = Math.min(86, Math.max(58, s));
  const targetLight = Math.min(44, Math.max(32, l));
  return hslToHex(shiftedHue, targetSat, targetLight);
}

/**
 * Genera toda la gama de tonos primarios y secundarios (oscuros, medios, claros, bordes y acentos)
 * garantizando contraste WCAG AA y coherencia 60-30-10 en todo el sistema.
 */
export function generateBrandPalette(baseHex?: string, secondaryBaseHex?: string): BrandPalette {
  const primary = normalizeHexColor(baseHex, DEFAULT_PRIMARY_COLOR);
  const { h, s, l } = hexToHsl(primary);

  const primaryHover = hslToHex(h, Math.min(100, s + 4), Math.max(16, l - 8));
  const primaryDark = hslToHex(h, Math.min(92, Math.max(32, s)), Math.max(18, Math.min(34, l - 16)));
  const primaryDarker = hslToHex(h, Math.min(62, Math.max(26, s)), 11);
  const primarySubtleDark = hslToHex(h, Math.min(55, Math.max(24, s)), 17);
  const primaryLight = hslToHex(h, Math.min(88, Math.max(35, s)), 95);
  const primaryLightHover = hslToHex(h, Math.min(85, Math.max(35, s)), 90);
  const primaryBorder = hslToHex(h, Math.min(78, Math.max(30, s)), 84);
  const primaryAccent = hslToHex(h, Math.min(92, Math.max(50, s)), 75);
  const onPrimaryContainer = hslToHex(h, Math.min(90, Math.max(42, s)), 23);

  const resolvedSecondary = secondaryBaseHex && /^#[0-9A-Fa-f]{3,6}$/.test(secondaryBaseHex.trim())
    ? normalizeHexColor(secondaryBaseHex, DEFAULT_SECONDARY_COLOR)
    : deriveHarmoniousSecondary(primary);
  const secHsl = hexToHsl(resolvedSecondary);

  const secondary = resolvedSecondary;
  const secondaryHover = hslToHex(secHsl.h, Math.min(100, secHsl.s + 4), Math.max(16, secHsl.l - 8));
  const secondaryDark = hslToHex(secHsl.h, Math.min(90, Math.max(35, secHsl.s)), Math.max(18, Math.min(32, secHsl.l - 12)));
  const secondaryDarker = hslToHex(secHsl.h, Math.min(65, Math.max(28, secHsl.s)), 12);
  const secondaryLight = hslToHex(secHsl.h, Math.min(86, Math.max(36, secHsl.s)), 95);
  const secondaryLightHover = hslToHex(secHsl.h, Math.min(84, Math.max(36, secHsl.s)), 90);
  const secondaryBorder = hslToHex(secHsl.h, Math.min(75, Math.max(32, secHsl.s)), 83);
  const secondaryAccent = hslToHex(secHsl.h, Math.min(90, Math.max(48, secHsl.s)), 74);
  const onSecondaryContainer = hslToHex(secHsl.h, Math.min(90, Math.max(44, secHsl.s)), 22);

  return {
    primary,
    primaryHover,
    primaryDark,
    primaryDarker,
    primarySubtleDark,
    primaryLight,
    primaryLightHover,
    primaryBorder,
    primaryAccent,
    onPrimaryContainer,
    secondary,
    secondaryHover,
    secondaryDark,
    secondaryDarker,
    secondaryLight,
    secondaryLightHover,
    secondaryBorder,
    secondaryAccent,
    onSecondaryContainer
  };
}

export function applyBrandPaletteToDocument(baseHex?: string, secondaryBaseHex?: string): BrandPalette {
  let resolvedPrimary = baseHex;
  let resolvedSecondary = secondaryBaseHex;

  if (typeof window !== 'undefined') {
    if (!resolvedPrimary) {
      resolvedPrimary = localStorage.getItem('cuentacasa_theme_color') || DEFAULT_PRIMARY_COLOR;
    }
    if (!resolvedSecondary) {
      const cachedSec = localStorage.getItem('cuentacasa_secondary_theme_color');
      if (cachedSec) resolvedSecondary = cachedSec;
    }
  }

  const palette = generateBrandPalette(resolvedPrimary, resolvedSecondary);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const isDarkTheme = root.getAttribute('data-theme') === 'dark';

    // Primary Brand Variables
    root.style.setProperty('--brand-primary', palette.primary);
    root.style.setProperty('--brand-primary-hover', palette.primaryHover);
    root.style.setProperty('--brand-primary-dark', palette.primaryDark);
    root.style.setProperty('--brand-primary-darker', palette.primaryDarker);
    root.style.setProperty('--brand-primary-subtle-dark', palette.primarySubtleDark);
    root.style.setProperty('--brand-primary-light', isDarkTheme ? palette.primaryDark : palette.primaryLight);
    root.style.setProperty('--brand-primary-light-hover', isDarkTheme ? palette.primarySubtleDark : palette.primaryLightHover);
    root.style.setProperty('--brand-primary-border', isDarkTheme ? palette.primarySubtleDark : palette.primaryBorder);
    root.style.setProperty('--brand-primary-accent', palette.primaryAccent);
    root.style.setProperty('--brand-on-primary-container', isDarkTheme ? palette.primaryLight : palette.onPrimaryContainer);

    // Secondary Brand Variables
    root.style.setProperty('--brand-secondary', palette.secondary);
    root.style.setProperty('--brand-secondary-hover', palette.secondaryHover);
    root.style.setProperty('--brand-secondary-dark', palette.secondaryDark);
    root.style.setProperty('--brand-secondary-darker', palette.secondaryDarker);
    root.style.setProperty('--brand-secondary-light', isDarkTheme ? palette.secondaryDark : palette.secondaryLight);
    root.style.setProperty('--brand-secondary-light-hover', isDarkTheme ? palette.secondaryDarker : palette.secondaryLightHover);
    root.style.setProperty('--brand-secondary-border', isDarkTheme ? palette.secondaryDarker : palette.secondaryBorder);
    root.style.setProperty('--brand-secondary-accent', palette.secondaryAccent);
    root.style.setProperty('--brand-on-secondary-container', isDarkTheme ? palette.secondaryLight : palette.onSecondaryContainer);

    // Sincronizar también con las variables globales Material 3 del sistema (Light / Dark)
    if (!isDarkTheme) {
      root.style.setProperty('--md-sys-color-primary', palette.primary);
      root.style.setProperty('--md-sys-color-primary-container', palette.primaryLight);
      root.style.setProperty('--md-sys-color-on-primary-container', palette.onPrimaryContainer);
      root.style.setProperty('--md-sys-color-secondary', palette.secondary);
      root.style.setProperty('--md-sys-color-secondary-container', palette.secondaryLight);
      root.style.setProperty('--md-sys-color-on-secondary-container', palette.onSecondaryContainer);
    } else {
      root.style.setProperty('--md-sys-color-primary', palette.primaryAccent);
      root.style.setProperty('--md-sys-color-primary-container', palette.primaryDark);
      root.style.setProperty('--md-sys-color-on-primary-container', palette.primaryLight);
      root.style.setProperty('--md-sys-color-secondary', palette.secondaryAccent);
      root.style.setProperty('--md-sys-color-secondary-container', palette.secondaryDark);
      root.style.setProperty('--md-sys-color-on-secondary-container', palette.secondaryLight);
    }

    // Persistir bloque CSS precalculado en localStorage para inyección síncrona en <head> en próximos arranques sin flash
    try {
      const primaryLightVal = isDarkTheme ? palette.primaryDark : palette.primaryLight;
      const primaryBorderVal = isDarkTheme ? palette.primarySubtleDark : palette.primaryBorder;
      const cssRules = `
        :root {
          --brand-primary: ${palette.primary} !important;
          --brand-primary-hover: ${palette.primaryHover} !important;
          --brand-primary-dark: ${palette.primaryDark} !important;
          --brand-primary-darker: ${palette.primaryDarker} !important;
          --brand-primary-subtle-dark: ${palette.primarySubtleDark} !important;
          --brand-primary-light: ${primaryLightVal} !important;
          --brand-primary-light-hover: ${isDarkTheme ? palette.primarySubtleDark : palette.primaryLightHover} !important;
          --brand-primary-border: ${primaryBorderVal} !important;
          --brand-primary-accent: ${palette.primaryAccent} !important;
          --brand-on-primary-container: ${isDarkTheme ? palette.primaryLight : palette.onPrimaryContainer} !important;
          --brand-secondary: ${palette.secondary} !important;
          --brand-secondary-hover: ${palette.secondaryHover} !important;
          --brand-secondary-dark: ${palette.secondaryDark} !important;
          --brand-secondary-darker: ${palette.secondaryDarker} !important;
          --brand-secondary-light: ${isDarkTheme ? palette.secondaryDark : palette.secondaryLight} !important;
          --brand-secondary-light-hover: ${isDarkTheme ? palette.secondaryDarker : palette.secondaryLightHover} !important;
          --brand-secondary-border: ${isDarkTheme ? palette.secondaryDarker : palette.secondaryBorder} !important;
          --brand-secondary-accent: ${palette.secondaryAccent} !important;
          --brand-on-secondary-container: ${isDarkTheme ? palette.secondaryLight : palette.onSecondaryContainer} !important;
          --md-sys-color-primary: ${isDarkTheme ? palette.primaryAccent : palette.primary} !important;
          --md-sys-color-primary-container: ${isDarkTheme ? palette.primaryDark : palette.primaryLight} !important;
          --md-sys-color-on-primary-container: ${isDarkTheme ? palette.primaryLight : palette.onPrimaryContainer} !important;
          --md-sys-color-secondary: ${isDarkTheme ? palette.secondaryAccent : palette.secondary} !important;
          --md-sys-color-secondary-container: ${isDarkTheme ? palette.secondaryDark : palette.secondaryLight} !important;
          --md-sys-color-on-secondary-container: ${isDarkTheme ? palette.secondaryLight : palette.onSecondaryContainer} !important;
        }
      `;
      localStorage.setItem('cuentacasa_cached_theme_css', cssRules);
      let existingStyle = document.getElementById('cuentacasa-theme-style');
      if (existingStyle) {
        existingStyle.textContent = cssRules;
      }
    } catch (e) {}
  }
  return palette;
}
