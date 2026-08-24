import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { INITIAL_SEED_PRODUCTS, formatPhotoUrl } from '@/lib/storage';
import { StoreProduct } from '@/types';
import Link from 'next/link';
import { 
  ShoppingBag, 
  ArrowLeft, 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  Tag, 
  Store, 
  Sparkles,
  Share2,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { STORE_SEO_CONFIG, getProductSeoMeta } from '@/lib/seoHelper';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Get product by ID or Barcode
function getProductByIdOrBarcode(idOrBarcode: string): StoreProduct | undefined {
  const clean = decodeURIComponent(idOrBarcode);
  return INITIAL_SEED_PRODUCTS.find(p => p.id === clean || p.barcode === clean.padStart(4, '0') || p.barcode === clean);
}

// Generate Dynamic SEO Metadata (OpenGraph, Title, Description, Twitter)
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProductByIdOrBarcode(id);

  if (!product) {
    return {
      title: 'Producto No Encontrado - Samy Store Cuba',
      description: 'El producto solicitado no está disponible en Samy Store.'
    };
  }

  const roundedPrice = Math.round(product.price);
  const title = `${product.name} - $${roundedPrice} CUP | Samy Store Cuba`;
  const description = product.description || `Compra ${product.name} en Samy Store Cuba por $${roundedPrice} CUP. Envíos directos y pedidos por WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: formatPhotoUrl(product.photoUrl) || '/icons/icon-192.svg',
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
      images: [formatPhotoUrl(product.photoUrl) || '/icons/icon-192.svg']
    }
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProductByIdOrBarcode(id);

  if (!product) {
    notFound();
  }

  const roundedPrice = Math.round(product.price);
  const seoMeta = getProductSeoMeta(product.barcode, product.price);

  // Related products in the same category
  const relatedProducts = INITIAL_SEED_PRODUCTS.filter(p => 
    p.category === product.category && p.id !== product.id && p.published
  );

  const whatsappMessage = `🛒 *CONSULTA / PEDIDO EN SAMY STORE*\n\nHola! Me interesa comprar el producto:\n*${product.name}*\n• Código: #${product.barcode}\n• Precio: $${roundedPrice} CUP\n• Categoría: ${product.category}\n\n¿Tienen disponibilidad para entrega o envío?`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  // JSON-LD Structured Data Schema for Google Product SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: formatPhotoUrl(product.photoUrl),
    description: product.description || `${product.name} disponible en Samy Store Cuba.`,
    sku: product.barcode,
    offers: {
      '@type': 'Offer',
      price: roundedPrice,
      priceCurrency: 'CUP',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://cuentacasa.app/producto/${product.id}`
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: seoMeta.ratingValue,
      reviewCount: seoMeta.reviewCount
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--md-sys-color-surface)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Inject Product JSON-LD SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Bar */}
      <header style={{
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 80
      }}>
        <div style={{
          maxWidth: '1024px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#EC4899',
              fontWeight: 800,
              fontSize: '0.9rem',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={18} />
            <span>Volver a Samy Store</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={18} />
            </div>
            <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#FFFFFF' }}>
              Samy Store
            </span>
          </div>
        </div>
      </header>

      {/* Main Product SEO Page Layout (5XL Enforced) */}
      <main style={{ maxWidth: '1024px', width: '100%', margin: '0 auto', padding: '24px 16px 100px 16px', flex: 1 }}>
        
        <div className="md-card" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--md-sys-color-surface-container)' }}>
          
          {/* Category Tag & Barcode */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              backgroundColor: '#FCE7F3',
              color: '#831843',
              padding: '4px 12px',
              borderRadius: '9999px'
            }}>
              {product.category}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 800, fontFamily: 'monospace' }}>
              Código #{product.barcode}
            </span>
          </div>

          {/* Product Image Showcase */}
          <div style={{
            width: '100%',
            height: '360px',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            position: 'relative'
          }}>
            <img 
              src={formatPhotoUrl(product.photoUrl) || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">SAMY STORE</text></svg>`} 
              alt={product.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />

            <span style={{
              position: 'absolute',
              bottom: '14px',
              right: '14px',
              backgroundColor: product.stock > 0 ? '#00875A' : 'var(--md-sys-color-expense)',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 800,
              padding: '4px 14px',
              borderRadius: '9999px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {product.stock > 0 ? `Stock Disponible (${product.stock}u)` : 'Agotado'}
            </span>
          </div>

          {/* Title & Price */}
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.25', marginBottom: '8px' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                ${roundedPrice}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#EC4899', fontWeight: 800, backgroundColor: '#FCE7F3', padding: '2px 8px', borderRadius: '6px' }}>
                CUP
              </span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              padding: '16px',
              borderRadius: '16px'
            }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                DESCRIPCIÓN DETALLADA DEL PRODUCTO
              </span>
              <p style={{ fontSize: '0.95rem', color: 'var(--md-sys-color-on-surface)', lineHeight: '1.5', margin: 0 }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Direct WhatsApp CTA Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              width: '100%',
              padding: '16px',
              fontSize: '1.05rem',
              fontWeight: 800,
              textDecoration: 'none',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)'
            }}
          >
            <MessageCircle size={24} />
            <span>Hacer Pedido Inmediato por WhatsApp</span>
          </a>

          {/* Trust Guarantees Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            borderTop: '1px solid var(--md-sys-color-surface-variant)',
            paddingTop: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#00875A" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                Calidad Garantizada
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} color="#EC4899" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                Envío Rápido a Domicilio
              </span>
            </div>
          </div>

        </div>

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={20} style={{ color: '#EC4899' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                Más productos en {product.category}
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '14px'
            }}>
              {relatedProducts.map(rel => (
                <Link
                  key={rel.id}
                  href={`/producto/${rel.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="md-card"
                    style={{
                      padding: '12px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--md-sys-color-surface-container-high)'
                    }}>
                      <img 
                        src={formatPhotoUrl(rel.photoUrl) || '/icons/icon-192.svg'} 
                        alt={rel.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rel.name}
                    </h3>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                      ${Math.round(rel.price)} CUP
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
