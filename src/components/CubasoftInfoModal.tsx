'use client';

import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  MessageCircle, 
  Globe, 
  CheckCircle2, 
  Star, 
  CreditCard,
  Building2,
  PhoneCall
} from 'lucide-react';
import { STORE_SEO_CONFIG } from '@/lib/seoHelper';
import { getStoreWhatsappNumber } from '@/lib/storage';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';

interface CubasoftInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CubasoftInfoModal: React.FC<CubasoftInfoModalProps> = ({ isOpen, onClose }) => {
  useLockBodyScroll(isOpen);
  const [activeTab, setActiveTab] = useState<'features' | 'pricing' | 'contact'>('features');

  
  if (!isOpen) return null;

  const adminPhone = getStoreWhatsappNumber() || '5351234567';
  const cleanPhone = adminPhone.replace(/\D/g, '');
  const formattedWaUrl = cleanPhone.length === 8 ? `https://wa.me/+53${cleanPhone}` : `https://wa.me/+${cleanPhone}`;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0'
      }}
      className="no-print"
      onClick={onClose}
    >
      <div 
        className="bottom-sheet-modal"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '620px',
          padding: '20px 24px 28px 24px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.4)',
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Material Design Drag Handle */}
        <div style={{
          width: '38px',
          height: '4px',
          borderRadius: '9999px',
          backgroundColor: 'var(--md-sys-color-outline-variant)',
          margin: '0 auto 2px auto',
          opacity: 0.8
        }} />

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900
            }}>
              <Store size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, lineHeight: '1.2' }}>
                Cubasoft ERP & Store
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                Sistema Completo de Gestión Comercial & Tienda PWA
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '6px',
          backgroundColor: 'var(--md-sys-color-surface)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--md-sys-color-outline-variant)'
        }}>
          <button
            onClick={() => setActiveTab('features')}
            style={{
              padding: '10px 6px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'features' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'features' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Zap size={14} /> Funciones
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            style={{
              padding: '10px 6px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'pricing' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'pricing' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <CreditCard size={14} /> Adquirir / Precios
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            style={{
              padding: '10px 6px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'contact' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'contact' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <MessageCircle size={14} /> Contacto Demo
          </button>
        </div>

        {/* TAB 1: FEATURES */}
        {activeTab === 'features' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              fontSize: '0.85rem',
              fontWeight: 700,
              lineHeight: '1.4'
            }}>
              ✨ <strong>Cubasoft ERP</strong> es la solución integral diseñada para negocios, tiendas y pymes en Cuba. Combina punto de venta (POS), catálogo web PWA y sincronización offline-first.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)', backgroundColor: 'var(--md-sys-color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--md-sys-color-primary)', fontWeight: 800, fontSize: '0.85rem' }}>
                  <Smartphone size={16} /> Tienda PWA Offline
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
                  Instalable como APK en Android e iOS. Funciona sin internet y sincroniza con MySQL al reconectarse.
                </p>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)', backgroundColor: 'var(--md-sys-color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#25D366', fontWeight: 800, fontSize: '0.85rem' }}>
                  <MessageCircle size={16} /> Pedidos por WhatsApp
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
                  Genera pedidos automáticos con enlace directo para cobrar en POS o compartir entre clientes.
                </p>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)', backgroundColor: 'var(--md-sys-color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--md-sys-color-income)', fontWeight: 800, fontSize: '0.85rem' }}>
                  <ShieldCheck size={16} /> Control de Fondos
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
                  Separación estricta entre Cuenta Casa, Fondo Tienda y Cuentas por Pagar a Proveedores.
                </p>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)', backgroundColor: 'var(--md-sys-color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#EAB308', fontWeight: 800, fontSize: '0.85rem' }}>
                  <Star size={16} /> SEO Local Automatizado
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
                  Indexación en Google con Rich Snippets, ratings automáticos y descripciones optimizadas para Las Tunas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRICING */}
        {activeTab === 'pricing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '14px 16px',
              borderRadius: '16px',
              border: '2px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
                  Plan Negocio / Tienda PWA + ERP POS
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'var(--md-sys-color-primary)', color: '#FFF', padding: '2px 8px', borderRadius: '6px' }}>
                  Licencia De Por Vida
                </span>
              </div>

              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><CheckCircle2 size={13} style={{ display: 'inline', color: 'var(--md-sys-color-income)', marginRight: '4px' }} /> Sistema de Punto de Venta (POS) con Lector de Barras.</li>
                <li><CheckCircle2 size={13} style={{ display: 'inline', color: 'var(--md-sys-color-income)', marginRight: '4px' }} /> Tienda Pública Online optimizada para SEO en Las Tunas.</li>
                <li><CheckCircle2 size={13} style={{ display: 'inline', color: 'var(--md-sys-color-income)', marginRight: '4px' }} /> Pedidos por WhatsApp con autocarga de carrito.</li>
                <li><CheckCircle2 size={13} style={{ display: 'inline', color: 'var(--md-sys-color-income)', marginRight: '4px' }} /> Sincronización automática con MySQL / Hostinger.</li>
                <li><CheckCircle2 size={13} style={{ display: 'inline', color: 'var(--md-sys-color-income)', marginRight: '4px' }} /> Instalación y capacitación personalizada por desarrolladores.</li>
              </ul>
            </div>

            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
                ¿Quieres una demostración personalizada o un módulo a la medida para tu negocio?
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: CONTACT */}
        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '14px 16px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={20} color="var(--md-sys-color-primary)" />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Cubasoft Development Team</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)' }}>Las Tunas, Cuba</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <a 
                  href={formattedWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="md-btn"
                  style={{
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    padding: '12px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>Contactar Ventas por WhatsApp ({adminPhone})</span>
                </a>

                <a 
                  href="https://cubasoft.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="md-btn md-btn-secondary"
                  style={{
                    padding: '12px 16px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Globe size={18} />
                  <span>Visitar Sitio Oficial Cubasoft.net</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer Contact Action */}
        <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '12px', display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            className="md-btn md-btn-secondary"
            style={{ flex: 1, padding: '12px', fontSize: '0.88rem' }}
          >
            Cerrar Vista
          </button>

          <a 
            href={formattedWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="md-btn"
            style={{
              flex: 1.5,
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              padding: '12px',
              fontSize: '0.88rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <PhoneCall size={16} />
            <span>Adquirir Sistema</span>
          </a>
        </div>

      </div>
    </div>
  );
};
