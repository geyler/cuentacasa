import React from 'react';
import type { Metadata } from 'next';
import { INITIAL_SEED_PRODUCTS, formatPhotoUrl } from '@/lib/storage';
import { getServerProductById } from '@/lib/db';
import { StoreProduct } from '@/types';
import { ProductDetailClient } from './ProductDetailClient';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return INITIAL_SEED_PRODUCTS.map(p => ({ id: p.id }));
}

export const dynamicParams = true;

async function getProductByIdOrBarcode(idOrBarcode: string): Promise<StoreProduct | undefined> {
  const clean = decodeURIComponent(idOrBarcode);
  const fromDb = await getServerProductById(clean);
  if (fromDb) return fromDb;
  return INITIAL_SEED_PRODUCTS.find(p => p.id === clean || p.barcode === clean.padStart(4, '0') || p.barcode === clean);
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductByIdOrBarcode(id);

  if (!product) {
    return {
      title: 'Catálogo de Productos - Samy Store Cuba',
      description: 'Explora todos los productos y ofertas disponibles en Samy Store Cuba.'
    };
  }

  const currLabel = product.currency === 'USD' ? 'USD' : 'CUP';
  const roundedPrice = product.currency === 'USD' ? Number(product.price.toFixed(2)) : Math.round(product.price);
  const title = `${product.name} - $${roundedPrice} ${currLabel} | Samy Store Cuba`;
  const description = product.description || `Compra ${product.name} en Samy Store Cuba por $${roundedPrice} ${currLabel}. Envíos directos y pedidos por WhatsApp.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/producto/${encodeURIComponent(id)}`
    },
    openGraph: {
      title,
      description,
      url: `/producto/${encodeURIComponent(id)}`,
      type: 'website',
      images: [
        {
          url: formatPhotoUrl(product.photoUrl) || '/icons/icon-192.png',
          width: 400,
          height: 400,
          alt: product.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [formatPhotoUrl(product.photoUrl) || '/icons/icon-192.png']
    }
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductByIdOrBarcode(id);

  return <ProductDetailClient id={id} initialProduct={product} />;
}
