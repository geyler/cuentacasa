import type { Metadata } from 'next';
import { PublicStoreLanding } from '@/components/PublicStoreLanding';
import { getServerPublishedProducts } from '@/lib/db';
import { INITIAL_SEED_PRODUCTS } from '@/lib/storage';

export const metadata: Metadata = {
  title: 'Samy Store Cuba - Catálogo y Pedidos Directos',
  description: 'Explora el catálogo oficial de Samy Store Las Tunas. Prendas exclusivas, accesorios, calzado y víveres con precios actualizados en CUP y USD. Pedidos directos por WhatsApp.',
  keywords: ['tienda cuba', 'samy store', 'las tunas', 'ropa cuba', 'pedidos whatsapp', 'compras online cuba'],
  openGraph: {
    title: 'Samy Store Cuba - Catálogo Oficial',
    description: 'Catálogo de productos exclusivos con entregas y pedidos directos en Cuba.',
    type: 'website',
    locale: 'es_CU',
    siteName: 'Samy Store Cuba'
  },
  alternates: {
    canonical: '/'
  }
};

export default async function HomePage() {
  let products = await getServerPublishedProducts();
  if (!products || products.length === 0) {
    products = INITIAL_SEED_PRODUCTS.filter(p => p.published !== false);
  }

  return <PublicStoreLanding initialProducts={products} />;
}
