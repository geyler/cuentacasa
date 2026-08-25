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

  // Genera entre 1 y 9 valoraciones iniciales al publicar un producto
  const reviewCount = 1 + (absHash % 9);

  // Genera entre 3.5 y 5.0 estrellas iniciales
  const ratingValue = Number((3.5 + ((absHash % 16) / 10)).toFixed(1));

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
