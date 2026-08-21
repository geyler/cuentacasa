import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { INITIAL_SEED_PRODUCTS } from '@/lib/storage';
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
  Share2
} from 'lucide-react';

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
      title: 'Producto No Encontrado - Tienda Casa',
      description: 'El producto solicitado no está disponible en la Tienda Casa.'
    };
  }

  const roundedPrice = Math.round(product.price);
  const title = `${product.name} - $${roundedPrice} | Tienda Casa`;
  const description = product.description || `Compra ${product.name} en la Tienda Casa por $${roundedPrice}. Envíos directos y pedidos por WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: product.photoUrl || '/icons/icon-192.svg',
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
      images: [product.photoUrl || '/icons/icon-192.svg']
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

  // Related products in the same category
  const relatedProducts = INITIAL_SEED_PRODUCTS.filter(p => 
    p.category === product.category && p.id !== product.id && p.published
  );

  const whatsappMessage = `🛒 *CONSULTA / PEDIDO EN TIENDA CASA*\n\nHola! Me interesa comprar el producto:\n*${product.name}*\n• Código: #${product.barcode}\n• Precio: $${roundedPrice}\n• Categoría: ${product.category}\n\n¿Tienen disponibilidad para entrega o envío?`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  // JSON-LD Structured Data Schema for Google Product SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.photoUrl,
    description: product.description || `${product.name} disponible en Tienda Casa.`,
    sku: product.barcode,
    offers: {
      '@type': 'Offer',
      price: roundedPrice,
      priceCurrency: 'CUP',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://cuentacasa.app/producto/${product.id}`
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
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderBottom: '1px solid var(--md-sys-color-surface-variant)',
        padding: '14px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 80
      }}>
        <div style={{
          maxWidth: '800px',
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
              color: 'var(--md-sys-color-primary)',
              fontWeight: 800,
              fontSize: '0.9rem',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={18} />
            <span>Volver a la Tienda</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Store size={20} color="var(--md-sys-color-primary)" />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--md-sys-color-on-surface)' }}>
              Tienda Casa
            </span>
          </div>
        </div>
      </header>

      {/* Main Product SEO Page Layout */}
      <main style={{ maxWidth: '800px', width: '100%', margin: '0 auto', padding: '24px 16px 100px 16px', flex: 1 }}>
        
        <div className="md-card" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Category Tag & Barcode */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              padding: '4px 12px',
              borderRadius: '9999px'
            }}>
              {product.category}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 800, fontFamily: 'monospace' }}>
              Código #{product.barcode}
            </span>
          </div>

          {/* Product Image Showcase */}
          <div style={{
            width: '100%',
            height: '320px',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            position: 'relative'
          }}>
            <img 
              src={product.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">TIENDA CASA</text></svg>`} 
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: '1.25', marginBottom: '8px' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                ${roundedPrice}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                (Precio final sin decimales)
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
                DESCRIPCIÓN DEL PRODUCTO
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
            className="md-btn"
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              width: '100%',
              padding: '16px',
              fontSize: '1.05rem',
              fontWeight: 800,
              textDecoration: 'none',
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
              <Truck size={20} color="var(--md-sys-color-primary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface)' }}>
                Envío Rápido Directo
              </span>
            </div>
          </div>

        </div>

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                Más productos en {product.category}
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
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
                      padding: '10px',
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
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={rel.photoUrl || '/icons/icon-192.svg'} 
                        alt={rel.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {rel.name}
                    </h3>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                      ${Math.round(rel.price)}
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
