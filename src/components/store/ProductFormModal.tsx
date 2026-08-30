'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoreProduct, SupplierAccount, SupplierType } from '@/types';
import { compressImageToBase64, getCurrencySettings, getStoreProductByBarcode } from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { AppInput } from '@/components/common/AppInput';
import { Package, X, Camera, Check, Image as ImageIcon } from 'lucide-react';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: StoreProduct | null;
  suppliers: SupplierAccount[];
  existingCategories: string[];
  onClose: () => void;
  onSaveProduct: (productData: any) => void;
  onScanBarcodeClick: () => void;
  currency?: string;
  scannedBarcode?: string | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  editingProduct,
  suppliers,
  existingCategories,
  onClose,
  onSaveProduct,
  onScanBarcodeClick,
  currency = '$',
  scannedBarcode
}) => {
  useLockBodyScroll(isOpen);

  // Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [productCurrency, setProductCurrency] = useState<'CUP' | 'USD'>('CUP');
  const [stock, setStock] = useState<number | ''>('');
  const [unit, setUnit] = useState('u');
  const [isAddingNewUnit, setIsAddingNewUnit] = useState(false);
  const [newUnitInput, setNewUnitInput] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [published, setPublished] = useState(true);

  // Supplier & Funding Source state
  const [fundingSource, setFundingSource] = useState<'negocio' | 'casa' | 'proveedor'>('negocio');
  const [supplierType, setSupplierType] = useState<SupplierType>('propia');
  const [supplierName, setSupplierName] = useState('');
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false);

  // External / Affiliate Product State
  const [isExternal, setIsExternal] = useState(false);
  const [externalType, setExternalType] = useState<'whatsapp' | 'link'>('whatsapp');
  const [externalValue, setExternalValue] = useState('');
  const [description, setDescription] = useState('');

  // Refs for focusing
  const productFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (scannedBarcode) {
      setBarcode(scannedBarcode);
      const existingProduct = getStoreProductByBarcode(scannedBarcode);
      if (existingProduct) {
        setName(existingProduct.name);
        setCategory(existingProduct.category || '');
        setCostPrice(existingProduct.costPrice || '');
        setPrice(existingProduct.price);
        setProductCurrency(existingProduct.currency || 'CUP');
        setStock(existingProduct.stock);
        setUnit(existingProduct.unit || 'u');
        setPhotoUrl(existingProduct.photoUrl || '');
        setPublished(existingProduct.published ?? true);
        if (existingProduct.supplierType === 'proveedor' && existingProduct.supplierName) {
          setFundingSource('proveedor');
          setSupplierType('proveedor');
          setSupplierName(existingProduct.supplierName);
        }
        if (existingProduct.description) {
          setDescription(existingProduct.description);
        }
      }
    }
  }, [scannedBarcode]);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setBarcode(editingProduct.barcode);
      setCategory(editingProduct.category || '');
      setCostPrice(editingProduct.costPrice || '');
      setPrice(editingProduct.price);
      setProductCurrency(editingProduct.currency || 'CUP');
      setStock(editingProduct.stock);
      setUnit(editingProduct.unit || 'u');
      setIsAddingNewUnit(false);
      setNewUnitInput('');
      setPhotoUrl(editingProduct.photoUrl || '');
      setPublished(editingProduct.published ?? true);

      // Restore funding source & supplier logic
      if (editingProduct.supplierType === 'proveedor' && editingProduct.supplierName) {
        setFundingSource('proveedor');
        setSupplierType('proveedor');
        setSupplierName(editingProduct.supplierName);
        setIsAddingNewSupplier(false);
      } else {
        setFundingSource('negocio');
        setSupplierType('propia');
        setSupplierName('');
        setIsAddingNewSupplier(false);
      }

      // External url handling
      if (editingProduct.isExternal && editingProduct.externalUrl) {
        setIsExternal(true);
        if (editingProduct.externalUrl.includes('wa.me') || editingProduct.externalUrl.includes('whatsapp.com')) {
          setExternalType('whatsapp');
          setExternalValue(editingProduct.externalUrl);
        } else {
          setExternalType('link');
          setExternalValue(editingProduct.externalUrl);
        }
      } else {
        setIsExternal(false);
        setExternalType('whatsapp');
        setExternalValue('');
      }
      setDescription(editingProduct.description || '');
    } else {
      setName('');
      setBarcode('');
      setCategory(existingCategories[0] || 'Varios');
      setIsAddingNewCategory(false);
      setNewCategoryInput('');
      setUnit('u');
      setIsAddingNewUnit(false);
      setNewUnitInput('');
      setCostPrice('');
      setPrice('');
      if (editingProduct) {
        setProductCurrency((editingProduct as any).currency === 'USD' ? 'USD' : 'CUP');
      } else {
        setProductCurrency('CUP');
      }

      setIsExternal(false);
      setExternalType('whatsapp');
      setExternalValue('');
      setDescription('');
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressedBase64 = await compressImageToBase64(file, 400);
      setPhotoUrl(compressedBase64);
    } catch (error) {
      console.error('Error al procesar imagen:', error);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddNewCategorySubmit = () => {
    if (newCategoryInput.trim()) {
      const cleanCat = newCategoryInput.trim();
      setCategory(cleanCat);
      setIsAddingNewCategory(false);
    }
  };

  const handleAddNewUnitSubmit = () => {
    if (newUnitInput.trim()) {
      const cleanUnit = newUnitInput.trim();
      setUnit(cleanUnit);
      setIsAddingNewUnit(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '' || Number(price) <= 0) return;

    let finalExternalUrl: string | undefined = undefined;
    if (isExternal && externalValue.trim()) {
      if (externalType === 'whatsapp') {
        const cleanDigits = externalValue.trim().replace(/[^0-9]/g, '');
        const fullNumber = cleanDigits.startsWith('53') ? cleanDigits : `53${cleanDigits}`;
        finalExternalUrl = `https://wa.me/${fullNumber}`;
      } else {
        const rawUrl = externalValue.trim();
        finalExternalUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`;
      }
    }

    const calculatedCost = costPrice !== '' ? Number(costPrice) : Math.round(Number(price) * 0.7);

    const finalCurrency = productCurrency;

    const productPayload = {
      name: name.trim(),
      barcode: barcode.trim() || String(Math.floor(1000 + Math.random() * 9000)),
      category: category.trim() || 'Varios',
      unit: unit.trim() || 'u',
      costPrice: calculatedCost,
      price: Number(price),
      currency: finalCurrency,
      stock: Number(stock) || 0,
      photoUrl: photoUrl || undefined,
      published,
      fundingSource: fundingSource === 'proveedor' ? 'negocio' : fundingSource,
      supplierType: fundingSource === 'proveedor' ? 'proveedor' : 'propia',
      supplierName: fundingSource === 'proveedor' ? supplierName.trim() : undefined,
      isExternal,
      externalUrl: finalExternalUrl,
      description: description.trim() || undefined
    };

    onSaveProduct(productPayload);
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.70)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0'
      }} 
      className="no-print" 
      onClick={onClose}
    >
      <form
        ref={productFormRef}
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bottom-sheet-modal"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          width: '100%',
          maxWidth: '540px',
          height: '100%',
          maxHeight: '100dvh',
          padding: '20px 20px 28px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          boxShadow: 'var(--md-shadow-elevation-4)',
          borderTopLeftRadius: '28px',
          borderTopRightRadius: '28px'
        }}
      >
        {/* Handle Drag Indicator */}
        <div style={{ width: '44px', height: '4px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 2px auto', opacity: 0.8 }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={22} color="var(--md-sys-color-primary)" />
              <span>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</span>
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
              {editingProduct ? 'Modifica los datos del producto seleccionado' : 'Registra un producto en el inventario y punto de venta'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ 
              background: 'var(--md-sys-color-surface-container-high)', 
              border: '1px solid var(--md-sys-color-outline-variant)', 
              borderRadius: '50%',
              color: 'var(--md-sys-color-on-surface)', 
              cursor: 'pointer', 
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Funding Source Selector */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
            Origen del Financiamiento:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setFundingSource('negocio')}
              style={{
                padding: '10px 6px',
                borderRadius: '14px',
                border: fundingSource === 'negocio' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                backgroundColor: fundingSource === 'negocio' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface)',
                color: fundingSource === 'negocio' ? '#FFF' : 'var(--md-sys-color-on-surface)',
                transition: 'all 0.2s ease',
                boxShadow: fundingSource === 'negocio' ? 'var(--md-shadow-elevation-1)' : 'none'
              }}
            >
              🏦 Fondo Negocio
            </button>

            <button
              type="button"
              onClick={() => setFundingSource('casa')}
              style={{
                padding: '10px 6px',
                borderRadius: '14px',
                border: fundingSource === 'casa' ? '2px solid var(--md-sys-color-income)' : '1px solid var(--md-sys-color-outline-variant)',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                backgroundColor: fundingSource === 'casa' ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-surface)',
                color: fundingSource === 'casa' ? '#FFF' : 'var(--md-sys-color-on-surface)',
                transition: 'all 0.2s ease',
                boxShadow: fundingSource === 'casa' ? 'var(--md-shadow-elevation-1)' : 'none'
              }}
            >
              🏡 Cuenta Casa
            </button>

            <button
              type="button"
              onClick={() => {
                setFundingSource('proveedor');
                setSupplierType('proveedor');
              }}
              style={{
                padding: '10px 6px',
                borderRadius: '14px',
                border: fundingSource === 'proveedor' ? '2px solid var(--md-sys-color-expense)' : '1px solid var(--md-sys-color-outline-variant)',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                backgroundColor: fundingSource === 'proveedor' ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-surface)',
                color: fundingSource === 'proveedor' ? '#FFF' : 'var(--md-sys-color-on-surface)',
                transition: 'all 0.2s ease',
                boxShadow: fundingSource === 'proveedor' ? 'var(--md-shadow-elevation-1)' : 'none'
              }}
            >
              🤝 Consignación
            </button>
          </div>
        </div>

        {/* Supplier Selector Dropdown */}
        {fundingSource === 'proveedor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
              Seleccionar Proveedor (Consignación) *
            </label>

            {suppliers.length > 0 && !isAddingNewSupplier ? (
              <select
                value={supplierName}
                onChange={e => {
                  if (e.target.value === '__NEW__') {
                    setIsAddingNewSupplier(true);
                    setSupplierName('');
                  } else {
                    setIsAddingNewSupplier(false);
                    setSupplierName(e.target.value);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.name}>
                    👤 {s.name} (Por liquidar: ${s.pendingPayout})
                  </option>
                ))}
                <option value="__NEW__">➕ Crear Nuevo Proveedor...</option>
              </select>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <AppInput
                    disableBlur
                    hideAceptar
                    label="Nombre del Nuevo Proveedor *"
                    placeholder="Ej. Maikel, Carlos..."
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    required
                  />
                </div>
                {suppliers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewSupplier(false);
                      if (suppliers.length > 0) setSupplierName(suppliers[0].name);
                    }}
                    className="md-btn md-btn-secondary"
                    style={{ padding: '12px', fontSize: '0.78rem', height: '48px', flexShrink: 0 }}
                  >
                    Ver Lista
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Product Name Input */}
        <AppInput
          disableBlur
          hideAceptar
          label="Nombre del Producto *"
          placeholder="Ej. Pan Dulce Casero 5u"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        {/* Barcode / SKU Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Código de Barras / SKU *
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Ej. 0005 o escanea del empaque"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              className="input-spotlight"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1.5px solid var(--md-sys-color-primary)',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)',
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                fontWeight: 800
              }}
            />
            <button
              type="button"
              onClick={onScanBarcodeClick}
              className="md-btn md-btn-secondary"
              style={{
                padding: '10px 14px',
                fontSize: '0.82rem',
                borderColor: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-primary)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Camera size={16} />
              <span>Escanear Código</span>
            </button>
          </div>
        </div>

        {/* Category Select Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Categoría del Producto *
          </label>

          <select
            value={isAddingNewCategory ? '__NEW_CATEGORY__' : category}
            onChange={(e) => {
              if (e.target.value === '__NEW_CATEGORY__') {
                setIsAddingNewCategory(true);
                setCategory('');
              } else {
                setIsAddingNewCategory(false);
                setCategory(e.target.value);
              }
            }}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: category ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
              fontSize: '0.95rem',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <option value="" disabled>-- Seleccionar Categoría --</option>
            {existingCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__NEW_CATEGORY__" style={{ fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
              ➕ Crear Nueva Categoría...
            </option>
          </select>

          {isAddingNewCategory && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <input
                type="text"
                placeholder="Nombre nueva categoría..."
                value={newCategoryInput}
                onChange={e => setNewCategoryInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '2px solid var(--md-sys-color-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              />
              <button
                type="button"
                onClick={handleAddNewCategorySubmit}
                className="md-btn md-btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '12px' }}
              >
                Añadir
              </button>
            </div>
          )}
        </div>

        {/* Unit of Measure Select Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Unidad de Medida / Venta *
          </label>

          <select
            value={isAddingNewUnit ? '__NEW_UNIT__' : unit}
            onChange={(e) => {
              if (e.target.value === '__NEW_UNIT__') {
                setIsAddingNewUnit(true);
                setUnit('');
              } else {
                setIsAddingNewUnit(false);
                setUnit(e.target.value);
              }
            }}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: '0.95rem',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <option value="u">u (Unidad)</option>
            <option value="lb">lb (Libra)</option>
            <option value="kg">kg (Kilogramo)</option>
            <option value="g">g (Gramo)</option>
            <option value="oz">oz (Onza)</option>
            <option value="bolsa">Bolsa</option>
            <option value="saco">Saco</option>
            <option value="m">m (Metro)</option>
            <option value="cm">cm (Centímetro)</option>
            <option value="litro">Litro</option>
            <option value="galón">Galón</option>
            <option value="caja">Caja</option>
            <option value="paquete">Paquete</option>
            <option value="listero">Listero</option>
            <option value="par">Par</option>
            {!['u', 'lb', 'kg', 'g', 'oz', 'bolsa', 'saco', 'm', 'cm', 'litro', 'galón', 'caja', 'paquete', 'listero', 'par'].includes(unit) && unit && (
              <option value={unit}>Personalizada: {unit}</option>
            )}
            <option value="__NEW_UNIT__" style={{ fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
              ➕ Crear Nueva Unidad...
            </option>
          </select>

          {isAddingNewUnit && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <input
                type="text"
                placeholder="Ej. m2, lata, frasco, rollo..."
                value={newUnitInput}
                onChange={e => setNewUnitInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '2px solid var(--md-sys-color-primary)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: 'var(--md-sys-color-on-surface)'
                }}
              />
              <button
                type="button"
                onClick={handleAddNewUnitSubmit}
                className="md-btn md-btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '12px' }}
              >
                Añadir
              </button>
            </div>
          )}
        </div>

        {/* Currency Selector Toggle (Always available to select CUP or USD per product) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Moneda Base del Producto *
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            padding: '4px',
            borderRadius: '14px'
          }}>
            <button
              type="button"
              onClick={() => setProductCurrency('CUP')}
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: productCurrency === 'CUP' ? '1px solid #FBCFE8' : 'none',
                backgroundColor: productCurrency === 'CUP' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: productCurrency === 'CUP' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>💵 CUP ($)</span>
            </button>

            <button
              type="button"
              onClick={() => setProductCurrency('USD')}
              style={{
                padding: '10px',
                borderRadius: '10px',
                border: productCurrency === 'USD' ? '1px solid #99F6E4' : 'none',
                backgroundColor: productCurrency === 'USD' ? '#0F766E' : 'transparent',
                color: productCurrency === 'USD' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>💲 USD (US$)</span>
            </button>
          </div>
        </div>

        {/* Cost Price vs Selling Price Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <AppInput
              disableBlur
              hideAceptar
              label="Precio Costo *"
              unitSymbol={productCurrency === 'USD' ? 'US$' : '$'}
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              step="any"
              isNumeric
              placeholder="200"
              value={costPrice}
              onChange={e => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
            />

            <AppInput
              disableBlur
              hideAceptar
              label="Precio Público *"
              unitSymbol={productCurrency === 'USD' ? 'US$' : '$'}
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              step="any"
              isNumeric
              placeholder="350"
              value={price}
              onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
              required
              style={{ color: 'var(--md-sys-color-income)' }}
            />
          </div>

          {Number(price) > 0 && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem'
            }}>
              <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>Estimación de Ganancia:</span>
              <span style={{ fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                +{formatCurrency(Number(price) - (Number(costPrice) || Math.round(Number(price) * 0.7)), productCurrency, true)} ({Math.round(((Number(price) - (Number(costPrice) || Math.round(Number(price) * 0.7))) / Number(price)) * 100)}%)
              </span>
            </div>
          )}
        </div>

        {/* Stock Units */}
        <AppInput
          disableBlur
          hideAceptar
          label="Stock (Unidades) *"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          isNumeric
          placeholder="Ej. 10"
          value={stock}
          onChange={e => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
          required
        />

        {/* External Link / Affiliate Checkbox & Input */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '14px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: isExternal ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
            <input
              type="checkbox"
              checked={isExternal}
              onChange={e => setIsExternal(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--md-sys-color-primary)' }}
            />
            <span>🔗 Producto de Enlace Externo / WhatsApp Directo</span>
          </label>

          {isExternal && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setExternalType('whatsapp')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: externalType === 'whatsapp' ? '2px solid #25D366' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: externalType === 'whatsapp' ? 'rgba(37, 211, 102, 0.12)' : 'transparent',
                    color: externalType === 'whatsapp' ? '#25D366' : 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  💬 Número WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => setExternalType('link')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: externalType === 'link' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: externalType === 'link' ? 'var(--md-sys-color-primary-container)' : 'transparent',
                    color: externalType === 'link' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  🌐 Enlace Web Externo
                </button>
              </div>

              {externalType === 'whatsapp' ? (
                <div>
                  <AppInput
                    disableBlur
                    hideAceptar
                    label="Número de WhatsApp (Las Tunas) *"
                    placeholder="Ej: 53999999 (Sin +53 ni código de país)"
                    value={externalValue}
                    onChange={e => setExternalValue(e.target.value)}
                    required={isExternal}
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px', fontWeight: 600 }}>
                    💡 Escribe los 8 dígitos locales (ej: 53999999). El sistema lo convertirá a wa.me/+53...
                  </p>
                </div>
              ) : (
                <AppInput
                  disableBlur
                  hideAceptar
                  label="URL o Enlace Web Directo *"
                  placeholder="https://tienda-externa.com/producto..."
                  value={externalValue}
                  onChange={e => setExternalValue(e.target.value)}
                  required={isExternal}
                />
              )}
            </div>
          )}
        </div>

        {/* Detailed Description Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Descripción Detallada (SEO Local & Información del Cliente)
          </label>
          <textarea
            rows={3}
            placeholder="Escribe detalles del producto, especificaciones, ingredientes o disponibilidad en Las Tunas para mejorar el SEO..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="input-spotlight"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: '0.88rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Centered Photo Upload Card */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px',
          borderRadius: '20px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          gap: '10px'
        }}>
          {photoUrl ? (
            <div style={{ position: 'relative', width: '90px', height: '90px' }}>
              <img 
                src={photoUrl} 
                alt="Preview" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  borderRadius: '16px',
                  boxShadow: 'var(--md-shadow-elevation-1)',
                  border: '2px solid var(--md-sys-color-primary)'
                }} 
              />
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: 'var(--md-sys-color-expense)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ImageIcon size={28} />
            </div>
          )}

          <label className="md-btn md-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '12px' }}>
            <Camera size={16} />
            <span>{isUploadingPhoto ? 'Optimizando...' : photoUrl ? 'Cambiar Imagen' : 'Añadir Fotografía'}</span>
            <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Published Toggle Checkbox */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          borderRadius: '14px',
          backgroundColor: 'var(--md-sys-color-surface)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 700
        }}>
          <input
            type="checkbox"
            checked={published}
            onChange={e => setPublished(e.target.checked)}
            style={{ width: '20px', height: '20px', accentColor: 'var(--md-sys-color-primary)', cursor: 'pointer' }}
          />
          <span>Publicar en la tienda pública (Visible para venta)</span>
        </label>

        {/* Modal Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '12px',
          paddingTop: '14px',
          borderTop: '1px solid var(--md-sys-color-outline-variant)',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={onClose}
            className="md-btn md-btn-secondary"
            style={{
              flex: 1,
              padding: '14px',
              fontSize: '0.92rem',
              fontWeight: 700,
              borderRadius: '16px'
            }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="md-btn md-btn-primary"
            style={{ 
              flex: 1, 
              padding: '14px', 
              fontSize: '0.92rem', 
              fontWeight: 800,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Check size={18} />
            <span>{editingProduct ? 'Guardar Cambios' : 'Guardar Producto'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
