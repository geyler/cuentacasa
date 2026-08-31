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
  PhoneCall,
  QrCode,
  Lock,
  ArrowRightLeft,
  Sparkles,
  PlayCircle,
  Receipt
} from 'lucide-react';
import { getStoreWhatsappNumber } from '@/lib/storage';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';

interface CubasoftInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CubasoftInfoModal: React.FC<CubasoftInfoModalProps> = ({ isOpen, onClose }) => {
  useLockBodyScroll(isOpen);
  const [activeTab, setActiveTab] = useState<'features' | 'guide' | 'pricing' | 'contact'>('features');

  if (!isOpen) return null;

  const adminPhone = getStoreWhatsappNumber() || '5351234567';
  const cleanPhone = adminPhone.replace(/\D/g, '');
  const formattedWaUrl = cleanPhone.length === 8 ? `https://wa.me/+53${cleanPhone}` : `https://wa.me/+${cleanPhone}`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(12px)',
        zIndex: 2000,
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
          maxWidth: '768px',
          padding: '20px 24px 28px 24px',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.5)',
          borderRadius: '28px 28px 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Material Design Drag Handle */}
        <div style={{
          width: '42px',
          height: '5px',
          borderRadius: '9999px',
          backgroundColor: 'var(--md-sys-color-outline-variant)',
          margin: '0 auto 2px auto',
          opacity: 0.8
        }} />

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(236, 72, 153, 0.35)',
              flexShrink: 0
            }}>
              <Store size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: '1.2' }}>
                  Cubasoft ERP & Samy Store
                </h3>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  backgroundColor: '#DCFCE7',
                  color: '#15803D',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <Sparkles size={11} /> DEMO EN VIVO
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0', fontWeight: 600 }}>
                Plataforma Profesional de Gestión Comercial & Tienda PWA Offline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--md-sys-color-surface-container-high)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              borderRadius: '50%',
              color: 'var(--md-sys-color-on-surface)',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          backgroundColor: 'var(--md-sys-color-surface)',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid var(--md-sys-color-outline-variant)'
        }}>
          <button
            onClick={() => setActiveTab('features')}
            style={{
              padding: '10px 4px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'features' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'features' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Zap size={14} /> Ventajas
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            style={{
              padding: '10px 4px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'guide' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'guide' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <PlayCircle size={14} /> Probar Demo
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            style={{
              padding: '10px 4px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'pricing' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'pricing' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <CreditCard size={14} /> Licencias
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            style={{
              padding: '10px 4px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'contact' ? 'var(--md-sys-color-primary)' : 'transparent',
              color: activeTab === 'contact' ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-on-surface)',
              fontWeight: 800,
              fontSize: '0.76rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <MessageCircle size={14} /> Contacto
          </button>
        </div>

        {/* TAB 1: FEATURES & SYSTEM ARCHITECTURE */}
        {activeTab === 'features' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '14px 16px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              fontSize: '0.86rem',
              fontWeight: 700,
              lineHeight: '1.4'
            }}>
              💡 <strong>Cubasoft ERP</strong> es la solución tecnológica número 1 para negocios, tiendas y pymes en Cuba. Diseñado específicamente para operar en condiciones de conectividad nula o intermitente.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

              <div style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--md-sys-color-outline-variant)', backgroundColor: 'var(--md-sys-color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#BE185D', fontWeight: 900, fontSize: '0.88rem' }}>
                  <QrCode size={18} /> Sincronización QR P2P Offline
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, lineHeight: '1.35' }}>
                  Sincroniza productos, ventas, turnos y dinero entre teléfonos de propietarios y vendedores mediante códigos QR dinámicos sin requerir WiFi ni datos móviles.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--md-sys-color-outline-variant)', backgroundColor: 'var(--md-sys-color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#059669', fontWeight: 900, fontSize: '0.88rem' }}>
                  <Lock size={18} /> Control de Turnos & Arqueo
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, lineHeight: '1.35' }}>
                  Snapshots de inventario al iniciar turno. Notificación inmediata si el dueño añade mercancía durante la jornada y firmas inmutables de entrega al cerrar.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--md-sys-color-outline-variant)', backgroundColor: 'var(--md-sys-color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#25D366', fontWeight: 900, fontSize: '0.88rem' }}>
                  <MessageCircle size={18} /> Catálogo WhatsApp & SEO Local
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, lineHeight: '1.35' }}>
                  Tienda pública PWA instalable como APK. Permite a los clientes pedir por WhatsApp con carrito precargado y posiciona tus productos en Google.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '14px', border: '1px solid var(--md-sys-color-outline-variant)', backgroundColor: 'var(--md-sys-color-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#3B82F6', fontWeight: 900, fontSize: '0.88rem' }}>
                  <ArrowRightLeft size={18} /> Doble Contabilidad Separada
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0, lineHeight: '1.35' }}>
                  Separación estricta entre el Fondo de Reposición del Negocio / Proveedores y las Ganancias Netas de la Casa para asegurar la liquidez del negocio.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: GUIDED DEMO STEPS */}
        {activeTab === 'guide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--md-sys-color-primary)', margin: 0 }}>
              🎯 ¿Qué puedes probar y verificar en esta Demostración?
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', flexShrink: 0 }}>1</span>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface)' }}>Escanear y Vender en Caja Registradora:</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>Prueba el botón "Escanear y Vender", lee un código de barras o escribe el SKU manual con teclado numérico.</p>
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', flexShrink: 0 }}>2</span>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface)' }}>Abrir y Cerrar Turnos de Vendedor:</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>En "Turnos y Caja", abre un turno asignando dinero para vueltos y realiza el conteo final de arqueo.</p>
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', flexShrink: 0 }}>3</span>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface)' }}>Agregar Mercancía Durante el Turno Activo:</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>Edita o crea un producto mientras hay un turno abierto: la app añadirá automáticamente el stock adicional al turno.</p>
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', flexShrink: 0 }}>4</span>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface)' }}>Probar Sincronización QR Offline (SYNC QR):</strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0' }}>Usa "SYNC QR (OFFLINE)" para compartir tus datos locales escaneando la pantalla desde otro celular.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRICING & LICENSES */}
        {activeTab === 'pricing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '18px',
              border: '2px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
                  Licencia Negocio Completa (Sin Cuotas Mensuales)
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, backgroundColor: 'var(--md-sys-color-primary)', color: '#FFF', padding: '3px 10px', borderRadius: '9999px' }}>
                  Pago Único
                </span>
              </div>

              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><CheckCircle2 size={14} style={{ display: 'inline', color: 'var(--md-sys-color-income)', marginRight: '6px' }} /> <strong>Aplicación PWA Multidispositivo:</strong> Funciona en Android, iPhone, Windows y Mac.</li>
                <li><CheckCircle2 size={14} style={{ display: 'inline', color: 'var(--md-sys-color-income)', marginRight: '6px' }} /> <strong>Módulo de Ventas & Código de Barras:</strong> Escáner rápido de cámara y teclado numérico.</li>
                <li><CheckCircle2 size={14} style={{ display: 'inline', color: 'var(--md-sys-color-income)', marginRight: '6px' }} /> <strong>Sincronización Híbrida:</strong> Código QR sin internet + Nube MySQL automática.</li>
                <li><CheckCircle2 size={14} style={{ display: 'inline', color: 'var(--md-sys-color-income)', marginRight: '6px' }} /> <strong>Soporte Técnico Local:</strong> Asistencia directa en Las Tunas e instalación personalizada.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: CONTACT & OFFICIAL LINKS */}
        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>Cubasoft Development Team</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)' }}>Las Tunas, Cuba • Desarrollo de Software Comercial</span>
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
                    padding: '14px 16px',
                    fontSize: '0.92rem',
                    fontWeight: 900,
                    textDecoration: 'none',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <MessageCircle size={20} />
                  <span>Contactar Asesor Comercial por WhatsApp</span>
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
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Globe size={18} />
                  <span>Sitio Web Oficial Cubasoft.net</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: '14px', display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            className="md-btn md-btn-primary"
            style={{
              flex: 1.5,
              padding: '14px',
              fontSize: '0.92rem',
              fontWeight: 900,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={18} />
            <span>Probar la Demo en Vivo</span>
          </button>

          <a
            href={formattedWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="md-btn"
            style={{
              flex: 1,
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              padding: '14px',
              fontSize: '0.88rem',
              fontWeight: 800,
              textDecoration: 'none',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <PhoneCall size={16} />
            <span>Adquirir</span>
          </a>
        </div>

      </div>
    </div>
  );
};
