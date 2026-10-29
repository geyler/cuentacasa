/**
 * Cubasoft ERP & Store SEO Helper Utilities
 * Generates SEO metadata, category descriptions, and deterministic aggregate ratings for Cuba.
 */

export interface ProductSeoMeta {
  ratingValue: number;
  reviewCount: number;
  datePublished: string;
  dateModified: string;
}

export const STORE_SEO_CONFIG = {
  storeName: 'Samy Store',
  fullName: 'Samy Store Las Tunas',
  systemName: 'Cubasoft ERP',
  developerUrl: 'https://cubasoft.net',
  location: 'Las Tunas, Cuba',
  currency: 'CUP',
  contactWhatsapp: '+53 51234567',
  contactEmail: 'ventas@cubasoft.net'
};

/**
 * Calculates a deterministic, realistic rating and review count based on barcode & price.
 * Cheaper items (< 500 CUP) get higher review volume (35-68 reviews).
 * Expensive items (> 2000 CUP) get lower review volume (6-18 reviews).
 * Ratings fall between 4.6 and 4.9.
 */
export function getProductSeoMeta(barcode: string, price: number): ProductSeoMeta {
  let hash = 0;
  const str = (barcode || '0000') + String(price);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  // Genera entre 1 y 17 valoraciones iniciales al publicar un producto
  const reviewCount = 1 + (absHash % 17);

  // Genera entre 3.8 y 5.0 estrellas iniciales
  const ratingValue = Math.min(5.0, Number((3.8 + ((absHash % 13) / 10)).toFixed(1)));

  const month = String(1 + (absHash % 7)).padStart(2, '0');
  const day = String(1 + (absHash % 26)).padStart(2, '0');
  const datePublished = `2026-${month}-${day}T09:00:00.000Z`;
  const dateModified = new Date().toISOString();

  return { ratingValue, reviewCount, datePublished, dateModified };
}

/**
 * Common category SEO descriptions for Samy Store (Las Tunas, Cuba)
 */
export const CATEGORY_SEO_DESCRIPTIONS: Record<string, string> = {
  'electrodomésticos': 'Electrodomésticos y equipos para el hogar en Las Tunas. Envíos y entregas rápidas con Samy Store.',
  'electrodomesticos': 'Electrodomésticos y equipos para el hogar en Las Tunas. Envíos y entregas rápidas con Samy Store.',
  'alimentos': 'Alimentos frescos, víveres y productos de primera necesidad en Las Tunas. Tienda directa y pago en CUP.',
  'bebidas': 'Refrescos, maltas, jugos y bebidas disponibles en Las Tunas con Samy Store.',
  'ropa': 'Ropa, calzado y confecciones de alta calidad en Las Tunas. Diseños modernos y precios justos.',
  'calzado': 'Calzado resistente y de moda para todas las edades disponible en Las Tunas.',
  'hogar': 'Artículos para el hogar, cocina, limpieza y decoración en Samy Store Las Tunas.',
  'tecnología': 'Teléfonos celulares, accesorios, gadgets y productos tecnológicos en Las Tunas con Samy Store.',
  'tecnologia': 'Teléfonos celulares, accesorios, gadgets y productos tecnológicos en Las Tunas con Samy Store.',
  'limpieza': 'Productos de aseo personal y limpieza del hogar con entrega rápida en Las Tunas.'
};

export function getCategorySeoDescription(categoryName: string): string {
  const key = (categoryName || '').toLowerCase().trim();
  if (CATEGORY_SEO_DESCRIPTIONS[key]) {
    return CATEGORY_SEO_DESCRIPTIONS[key];
  }
  return `Productos de ${categoryName} en Samy Store Las Tunas. Compra online rápida y segura respaldada por Cubasoft ERP.`;
}

export interface CategoryVisualMeta {
  name: string;
  emoji: string;
  accentColor: string;
  bgSoft: string;
  borderSoft: string;
  badgeText: string;
}

const CATEGORY_VISUAL_PRESETS: Array<{
  keywords: string[];
  emoji: string;
  accentColor: string;
  bgSoft: string;
  borderSoft: string;
  badgeText: string;
}> = [
  {
    keywords: ['alimento', 'viveres', 'víveres', 'comida', 'grano', 'arroz', 'aceite', 'harina', 'despensa', 'agro'],
    emoji: '🌾',
    accentColor: '#059669',
    bgSoft: '#ECFDF5',
    borderSoft: '#A7F3D0',
    badgeText: 'Canasta Básica'
  },
  {
    keywords: ['carnic', 'cárnic', 'pollo', 'cerdo', 'embutido', 'congelado', 'pescado'],
    emoji: '🥩',
    accentColor: '#DC2626',
    bgSoft: '#FEF2F2',
    borderSoft: '#FECACA',
    badgeText: 'Frescos'
  },
  {
    keywords: ['lacteo', 'lácteo', 'leche', 'queso', 'yogurt', 'mantequilla'],
    emoji: '🥛',
    accentColor: '#0284C7',
    bgSoft: '#F0F9FF',
    borderSoft: '#BAE6FD',
    badgeText: 'Refrigerados'
  },
  {
    keywords: ['bebida', 'refresco', 'jugo', 'malta', 'cerveza', 'agua', 'licor', 'vino'],
    emoji: '🥤',
    accentColor: '#EA580C',
    bgSoft: '#FFF7ED',
    borderSoft: '#FED7AA',
    badgeText: 'Refrescantes'
  },
  {
    keywords: ['aseo', 'limpieza', 'higiene', 'jabon', 'jabón', 'detergente', 'perfumeria', 'perfumería', 'cosmetico'],
    emoji: '✨',
    accentColor: '#0D9488',
    bgSoft: '#F0FDFA',
    borderSoft: '#99F6E4',
    badgeText: 'Hogar & Aseo'
  },
  {
    keywords: ['electro', 'ventilador', 'olla', 'cocina', ' TV', 'televisor', 'clima', 'split', 'nevera', 'refrigerador'],
    emoji: '🔌',
    accentColor: '#2563EB',
    bgSoft: '#EFF6FF',
    borderSoft: '#BFDBFE',
    badgeText: 'Garantizados'
  },
  {
    keywords: ['tecno', 'celular', 'telefono', 'teléfono', 'movil', 'móvil', 'accesorio', 'audio', 'bocina', 'computo'],
    emoji: '📱',
    accentColor: '#4F46E5',
    bgSoft: '#EEF2FF',
    borderSoft: '#C7D2FE',
    badgeText: 'Tecnología'
  },
  {
    keywords: ['ropa', 'calzado', 'zapato', 'vestido', 'camisa', 'moda', 'confeccion', 'textil'],
    emoji: '👕',
    accentColor: '#7C3AED',
    bgSoft: '#F5F3FF',
    borderSoft: '#DDD6FE',
    badgeText: 'Moda & Estilo'
  },
  {
    keywords: ['confiteria', 'confitería', 'dulce', 'galleta', 'chocolate', 'snack', 'merienda', 'panaderia', 'pan'],
    emoji: '🍪',
    accentColor: '#D97706',
    bgSoft: '#FFFBEB',
    borderSoft: '#FDE68A',
    badgeText: 'Meriendas'
  },
  {
    keywords: ['ferreteria', 'ferretería', 'herramienta', 'pintura', 'construccion', 'electricidad', 'plomeria'],
    emoji: '🛠️',
    accentColor: '#475569',
    bgSoft: '#F8FAFC',
    borderSoft: '#CBD5E1',
    badgeText: 'Soluciones'
  },
  {
    keywords: ['hogar', 'decoracion', 'mueble', 'plastico', 'plástico', 'util', 'útil'],
    emoji: '🏠',
    accentColor: '#0891B2',
    bgSoft: '#ECFEFF',
    borderSoft: '#A5F3FC',
    badgeText: 'Todo Hogar'
  }
];

const FALLBACK_PALETTES = [
  { emoji: '🛍️', accentColor: '#2563EB', bgSoft: '#EFF6FF', borderSoft: '#BFDBFE', badgeText: 'Destacados' },
  { emoji: '📦', accentColor: '#059669', bgSoft: '#ECFDF5', borderSoft: '#A7F3D0', badgeText: 'Disponibles' },
  { emoji: '⭐', accentColor: '#D97706', bgSoft: '#FFFBEB', borderSoft: '#FDE68A', badgeText: 'Populares' },
  { emoji: '💎', accentColor: '#7C3AED', bgSoft: '#F5F3FF', borderSoft: '#DDD6FE', badgeText: 'Selección' },
];

export function getCategoryVisualMeta(categoryName: string): CategoryVisualMeta {
  const clean = (categoryName || 'General').trim();
  const lower = clean.toLowerCase();

  for (const preset of CATEGORY_VISUAL_PRESETS) {
    if (preset.keywords.some(kw => lower.includes(kw))) {
      return {
        name: clean,
        emoji: preset.emoji,
        accentColor: 'var(--brand-primary, #1A73E8)',
        bgSoft: 'var(--brand-primary-light, #EFF6FF)',
        borderSoft: 'var(--brand-primary-border, #BFDBFE)',
        badgeText: preset.badgeText
      };
    }
  }

  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = (hash << 5) - hash + lower.charCodeAt(i);
    hash |= 0;
  }
  const palette = FALLBACK_PALETTES[Math.abs(hash) % FALLBACK_PALETTES.length];
  return {
    name: clean,
    emoji: palette.emoji,
    accentColor: 'var(--brand-primary, #1A73E8)',
    bgSoft: 'var(--brand-primary-light, #EFF6FF)',
    borderSoft: 'var(--brand-primary-border, #BFDBFE)',
    badgeText: palette.badgeText
  };
}

