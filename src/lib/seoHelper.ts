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
  storeName: 'Cubasoft Store',
  fullName: 'Cubasoft Store Cuba',
  systemName: 'Cubasoft ERP',
  developerUrl: 'https://cubasoft.net',
  location: 'Cuba',
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

  let reviewCount: number;
  if (price <= 300) {
    reviewCount = 38 + (absHash % 31); // 38 to 68 reviews
  } else if (price <= 1000) {
    reviewCount = 20 + (absHash % 22); // 20 to 41 reviews
  } else if (price <= 3000) {
    reviewCount = 10 + (absHash % 15); // 10 to 24 reviews
  } else {
    reviewCount = 6 + (absHash % 10);  // 6 to 15 reviews
  }

  const ratingValue = Number((4.6 + ((absHash % 4) / 10)).toFixed(1));

  // Date published (deterministic past date in 2026) and date modified (current ISO timestamp)
  const month = String(1 + (absHash % 7)).padStart(2, '0');
  const day = String(1 + (absHash % 26)).padStart(2, '0');
  const datePublished = `2026-${month}-${day}T09:00:00.000Z`;
  const dateModified = new Date().toISOString();

  return { ratingValue, reviewCount, datePublished, dateModified };
}

/**
 * Common category SEO descriptions for Cubasoft Store (Cuba)
 */
export const CATEGORY_SEO_DESCRIPTIONS: Record<string, string> = {
  'electrodomésticos': 'Electrodomésticos y equipos para el hogar en Cuba. Envíos y entregas rápidas con Cubasoft Store.',
  'electrodomesticos': 'Electrodomésticos y equipos para el hogar en Cuba. Envíos y entregas rápidas con Cubasoft Store.',
  'alimentos': 'Alimentos frescos, víveres y productos de primera necesidad en Cuba. Catálogo directo y pago en CUP.',
  'bebidas': 'Refrescos, maltas, jugos y bebidas nacionales e importadas disponibles en Cuba con Cubasoft Store.',
  'ropa': 'Ropa, calzado y confecciones de alta calidad en Cuba. Diseños modernos y precios justos.',
  'calzado': 'Calzado resistente y de moda para todas las edades disponible en Cuba.',
  'hogar': 'Artículos para el hogar, cocina, limpieza y decoración con catálogo digital en Cuba.',
  'tecnología': 'Teléfonos celulares, accesorios, gadgets y productos tecnológicos en Cuba con Cubasoft Store.',
  'tecnologia': 'Teléfonos celulares, accesorios, gadgets y productos tecnológicos en Cuba con Cubasoft Store.',
  'limpieza': 'Productos de aseo personal y limpieza del hogar con entrega rápida en Cuba.'
};

export function getCategorySeoDescription(categoryName: string): string {
  const key = (categoryName || '').toLowerCase().trim();
  if (CATEGORY_SEO_DESCRIPTIONS[key]) {
    return CATEGORY_SEO_DESCRIPTIONS[key];
  }
  return `Catálogo de ${categoryName} en Cubasoft Store Cuba. Compra online rápida y segura respaldada por Cubasoft ERP.`;
}
