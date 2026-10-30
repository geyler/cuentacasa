'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoreProduct, SupplierAccount, SupplierType } from '@/types';
import { 
  compressImageToBase64, 
  getCurrencySettings, 
  getStoreProductByBarcode, 
  parseBarcodeDates,
  saveStoreProduct,
  getRawDatabase,
  getStoreModulesConfig,
  StoreModulesConfig,
  DEFAULT_PRODUCT_IMAGE
} from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { AppInput } from '@/components/common/AppInput';
import { Package, X, Camera, Check, Image as ImageIcon, AlertTriangle, PlusCircle, Edit3, Sparkles, DollarSign, Wallet, ChevronDown } from 'lucide-react';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: StoreProduct | null;
  suppliers: SupplierAccount[];
  existingCategories: string[];
  onClose: () => void;
  onSaveProduct: (productData: any) => boolean | void;
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
  useLockBodyScroll(isOpen, onClose);
  const { showToast } = useActionFeedback();

  // Form State
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [priceUSD, setPriceUSD] = useState<number | ''>('');
  const [costPriceUSD, setCostPriceUSD] = useState<number | ''>('');
  const [productCurrency, setProductCurrency] = useState<'CUP' | 'USD'>('CUP');

  // Bulk-to-Unit USD Lot Calculator State
  const [isBulkCalculatorOpen, setIsBulkCalculatorOpen] = useState(false);
  const [bulkTotalUnits, setBulkTotalUnits] = useState<number | ''>('');
  const [bulkTotalCostUSD, setBulkTotalCostUSD] = useState<number | ''>('');
  const [bulkTargetPriceUSD, setBulkTargetPriceUSD] = useState<number | ''>('');
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

  // Active Modules config
  const [storeModules, setStoreModules] = useState<StoreModulesConfig>(() => getStoreModulesConfig());

  useEffect(() => {
    const handleModulesChanged = (e: any) => {
      if (e?.detail) setStoreModules(e.detail);
      else setStoreModules(getStoreModulesConfig());
    };
    window.addEventListener('cuentacasa-store-modules-changed', handleModulesChanged);
    return () => window.removeEventListener('cuentacasa-store-modules-changed', handleModulesChanged);
  }, []);

  // Valuation Book Dates (Fabricación & Vencimiento)
  const [mfgDate, setMfgDate] = useState('');
  const [expDate, setExpDate] = useState('');

  // Existing Product Alert & Add Stock Sub-Modal State
  const [existingProductAlert, setExistingProductAlert] = useState<StoreProduct | null>(null);
  const [addStockQty, setAddStockQty] = useState<number | ''>(1);
  const [addStockCost, setAddStockCost] = useState<number | ''>('');
  const [addStockExpDate, setAddStockExpDate] = useState('');

  // Form Mode: 'simple' (Fast publishing direct to store with business fund) vs 'advanced' (Full options)
  const [formMode, setFormMode] = useState<'simple' | 'advanced'>('simple');

  // Refs for focusing
  const productFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStoreModules(getStoreModulesConfig());
    }
  }, [isOpen]);

  useEffect(() => {
    if (scannedBarcode && isOpen) {
      setBarcode(scannedBarcode);
      const parsedDates = parseBarcodeDates(scannedBarcode);
      if (storeModules.enableFoodTraceability) {
        if (parsedDates.expDate) setExpDate(parsedDates.expDate);
        if (parsedDates.mfgDate) setMfgDate(parsedDates.mfgDate);
      }

      const existingProduct = getStoreProductByBarcode(scannedBarcode);
      if (existingProduct && !editingProduct) {
        setExistingProductAlert(existingProduct);
        setAddStockQty(1);
        setAddStockCost(existingProduct.costPrice || '');
        setAddStockExpDate(existingProduct.expDate || '');
      }
    }
  }, [scannedBarcode, isOpen, editingProduct, storeModules.enableFoodTraceability]);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setBarcode(editingProduct.barcode);
      setCategory(editingProduct.category || '');
      setCostPrice(editingProduct.costPrice || '');
      setPrice(editingProduct.price);
      setPriceUSD(editingProduct.priceUSD !== undefined ? editingProduct.priceUSD : '');
      setCostPriceUSD(editingProduct.costPriceUSD !== undefined ? editingProduct.costPriceUSD : '');
      setProductCurrency(editingProduct.currency === 'USD' ? 'USD' : 'CUP');
      setStock(editingProduct.stock);
      setUnit(editingProduct.unit || 'u');
      setIsAddingNewUnit(false);
      setNewUnitInput('');
      setPhotoUrl(editingProduct.photoUrl || '');
      setPublished(editingProduct.published ?? true);

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
      setMfgDate(editingProduct.mfgDate || '');
      setExpDate(editingProduct.expDate || '');

      // Open in advanced mode if it has specialized settings
      if (
        editingProduct.supplierType === 'proveedor' ||
        editingProduct.isExternal ||
        editingProduct.mfgDate ||
        editingProduct.expDate ||
        editingProduct.published === false
      ) {
        setFormMode('advanced');
      } else {
        setFormMode('simple');
      }
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
      setPriceUSD('');
      setCostPriceUSD('');
      setProductCurrency('CUP');
      setStock('');
      setIsBulkCalculatorOpen(false);
      setBulkTotalUnits('');
      setBulkTotalCostUSD('');
      setBulkTargetPriceUSD('');
      setPhotoUrl('');
      setPublished(true);
      setFundingSource('negocio');
      setSupplierType('propia');
      setSupplierName('');
      setIsAddingNewSupplier(false);
      setIsExternal(false);
      setExternalType('whatsapp');
      setExternalValue('');
      setDescription('');
      setMfgDate('');
      setExpDate('');
      setExistingProductAlert(null);
      setFormMode('simple');
    }
  }, [editingProduct, isOpen]);

  const handleGenerateSku = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const genSku = `SKU-${randomDigits}`;
    setBarcode(genSku);
    showToast({
      title: 'SKU Generado',
      message: `Código asignado: ${genSku}`,
      type: 'success'
    });
  };

  const handleUseDefaultPhoto = () => {
    setPhotoUrl(DEFAULT_PRODUCT_IMAGE);
    showToast({
      title: 'Foto por Defecto',
      message: 'Se asignó la imagen oficial de catálogo.',
      type: 'info'
    });
  };

  if (!isOpen) return null;

  const handleBarcodeInputChange = (val: string) => {
    setBarcode(val);
    const parsed = parseBarcodeDates(val);
    if (parsed.expDate && !expDate) setExpDate(parsed.expDate);
    if (parsed.mfgDate && !mfgDate) setMfgDate(parsed.mfgDate);

    if (val.trim().length >= 3 && !editingProduct) {
      const existing = getStoreProductByBarcode(val.trim());
      if (existing) {
        setExistingProductAlert(existing);
        setAddStockQty(1);
        setAddStockCost(existing.costPrice || '');
        setAddStockExpDate(existing.expDate || '');
      }
    }
  };

  const handleEditAllFromExisting = () => {
    if (!existingProductAlert) return;
    const p = existingProductAlert;
    setName(p.name);
    setBarcode(p.barcode);
    setCategory(p.category || '');
    setCostPrice(p.costPrice || '');
    setPrice(p.price);
    setPriceUSD(p.priceUSD !== undefined ? p.priceUSD : '');
    setCostPriceUSD(p.costPriceUSD !== undefined ? p.costPriceUSD : '');
    setProductCurrency(p.currency === 'USD' ? 'USD' : 'CUP');
    setStock(p.stock);
    setUnit(p.unit || 'u');
    setPhotoUrl(p.photoUrl || '');
    setPublished(p.published ?? true);
    if (p.mfgDate) setMfgDate(p.mfgDate);
    if (p.expDate) setExpDate(p.expDate);
    if (p.supplierType === 'proveedor' && p.supplierName) {
      setFundingSource('proveedor');
      setSupplierType('proveedor');
      setSupplierName(p.supplierName);
    }
    if (p.description) setDescription(p.description);

    setExistingProductAlert(null);
  };

  const handleConfirmAddStock = () => {
    if (!existingProductAlert) return;
    const addedQty = Number(addStockQty) || 0;
    if (addedQty <= 0) {
      showToast({ title: 'Cantidad Inválida', message: 'Ingresa una cantidad mayor a 0.', type: 'error' });
      return;
    }

    const newStock = existingProductAlert.stock + addedQty;
    const updatedProductPayload = {
      ...existingProductAlert,
      stock: newStock,
      costPrice: addStockCost !== '' ? Number(addStockCost) : existingProductAlert.costPrice,
      expDate: addStockExpDate.trim() || existingProductAlert.expDate
    };

    try {
      const savedOk = onSaveProduct(updatedProductPayload);
      if (savedOk === false) return;
      setExistingProductAlert(null);
      onClose();
    } catch (err: any) {
      showToast({
        title: 'Error al Añadir Stock',
        message: err?.message || 'No se pudo actualizar el stock del producto.',
        type: 'error'
      });
    }
  };

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

    const resolvedSupplierName = (storeModules.enableSuppliers && fundingSource === 'proveedor')
      ? (supplierName.trim() || (!isAddingNewSupplier && suppliers.length > 0 ? suppliers[0].name : ''))
      : '';

    if (storeModules.enableSuppliers && fundingSource === 'proveedor' && !resolvedSupplierName) {
      showToast({
        title: 'Proveedor Requerido',
        message: 'Debes seleccionar o escribir el nombre del proveedor para mercancía en consignación.',
        type: 'error'
      });
      return;
    }

    let finalExternalUrl: string | undefined = undefined;
    if (storeModules.enableExternalProducts && isExternal && externalValue.trim()) {
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

    const productPayload = {
      name: name.trim(),
      barcode: barcode.trim() || String(Math.floor(1000 + Math.random() * 9000)),
      category: category.trim() || 'Varios',
      unit: unit.trim() || 'u',
      costPrice: calculatedCost,
      price: Number(price),
      priceUSD: priceUSD !== '' ? Number(priceUSD) : (productCurrency === 'USD' ? Number(price) : undefined),
      costPriceUSD: costPriceUSD !== '' ? Number(costPriceUSD) : (productCurrency === 'USD' ? calculatedCost : undefined),
      currency: productCurrency,
      stock: Number(stock) || 0,
      photoUrl: photoUrl || undefined,
      published,
      fundingSource: storeModules.enableSuppliers && fundingSource === 'proveedor' ? 'negocio' : (storeModules.enableSuppliers ? fundingSource : 'negocio'),
      supplierType: storeModules.enableSuppliers && fundingSource === 'proveedor' ? 'proveedor' : 'propia',
      supplierName: storeModules.enableSuppliers && fundingSource === 'proveedor' ? resolvedSupplierName : undefined,
      isExternal: storeModules.enableExternalProducts ? isExternal : false,
      externalUrl: storeModules.enableExternalProducts ? finalExternalUrl : undefined,
      description: description.trim() || undefined,
      mfgDate: storeModules.enableFoodTraceability ? (mfgDate.trim() || undefined) : undefined,
      expDate: storeModules.enableFoodTraceability ? (expDate.trim() || undefined) : undefined
    };

    const savedOk = onSaveProduct(productPayload);
    if (savedOk === false) return;
    onClose();
  };

  const rawDb = getRawDatabase();
  const storeFundCUP = rawDb.storeFund || 0;
  const storeFundUSD = rawDb.storeFundUSD || 0;
  const currentStoreFund = productCurrency === 'USD' ? storeFundUSD : storeFundCUP;

  const numStock = Number(stock) || 0;
  const numCost = Number(costPrice) || 0;
  const totalInvestment = numStock * numCost;
  const hasSufficientFund = currentStoreFund >= totalInvestment;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'var(--md-sys-color-surface-container)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden'
      }} 
      className="no-print" 
    >
      <form
        ref={productFormRef}
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          boxShadow: 'var(--md-shadow-elevation-2)'
        }}
      >
        {/* Full Screen Header Bar */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--md-sys-color-surface)',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, lineHeight: 1.2 }}>
              <Package size={24} color="var(--md-sys-color-primary)" />
              <span>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</span>
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0', fontWeight: 600 }}>
              {editingProduct ? 'Modifica los datos del producto seleccionado' : 'Registra un nuevo producto en el inventario y punto de venta'}
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
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>

          {/* Form Mode Segmented Switcher */}
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
              onClick={() => setFormMode('simple')}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: formMode === 'simple' ? '1px solid var(--md-sys-color-primary)' : 'none',
                backgroundColor: formMode === 'simple' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: formMode === 'simple' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>⚡ Modo Rápido (Simple)</span>
            </button>

            <button
              type="button"
              onClick={() => setFormMode('advanced')}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: formMode === 'advanced' ? '1px solid var(--md-sys-color-primary)' : 'none',
                backgroundColor: formMode === 'advanced' ? 'var(--md-sys-color-primary)' : 'transparent',
                color: formMode === 'advanced' ? '#FFFFFF' : 'var(--md-sys-color-on-surface-variant)',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>⚙️ Modo Completo (Avanzado)</span>
            </button>
          </div>

          {/* Centered Photo Upload Card */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            borderRadius: '20px',
            backgroundColor: 'var(--md-sys-color-surface)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            gap: '12px'
          }}>
            {photoUrl ? (
              <div style={{ position: 'relative', width: '100px', height: '100px' }}>
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
                  title="Eliminar fotografía"
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
                <ImageIcon size={30} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <label className="md-btn md-btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '12px' }}>
                <Camera size={16} />
                <span>{isUploadingPhoto ? 'Optimizando...' : photoUrl ? 'Cambiar Imagen' : 'Subir Imagen'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              </label>

              {!photoUrl && (
                <button
                  type="button"
                  onClick={handleUseDefaultPhoto}
                  className="md-btn md-btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem', borderRadius: '12px' }}
                >
                  <ImageIcon size={15} />
                  <span>Foto por Defecto</span>
                </button>
              )}
            </div>
          </div>

          {/* Funding Source Selector (Only in Advanced Mode and when Suppliers are enabled) */}
          {formMode === 'advanced' && storeModules.enableSuppliers && (
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
                Origen del Financiamiento:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFundingSource('negocio');
                    setSupplierType('propia');
                  }}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '14px',
                    border: fundingSource === 'negocio' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
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
                  onClick={() => {
                    setFundingSource('proveedor');
                    setSupplierType('proveedor');
                    if (!supplierName && suppliers.length > 0) {
                      setSupplierName(suppliers[0].name);
                    }
                  }}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '14px',
                    border: fundingSource === 'proveedor' ? '2px solid var(--md-sys-color-expense)' : '1px solid var(--md-sys-color-outline-variant)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    backgroundColor: fundingSource === 'proveedor' ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-surface)',
                    color: fundingSource === 'proveedor' ? '#FFF' : 'var(--md-sys-color-on-surface)',
                    transition: 'all 0.2s ease',
                    boxShadow: fundingSource === 'proveedor' ? 'var(--md-shadow-elevation-1)' : 'none'
                  }}
                >
                  🤝 Consignación (Proveedor)
                </button>
              </div>
            </div>
          )}

          {/* Supplier Selector Dropdown (Only in Advanced Mode and when Suppliers are enabled) */}
          {formMode === 'advanced' && storeModules.enableSuppliers && fundingSource === 'proveedor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Seleccionar Proveedor (Consignación) *
              </label>

              {suppliers.length > 0 && !isAddingNewSupplier ? (
                <select
                  value={supplierName || suppliers[0]?.name || ''}
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
                onChange={e => handleBarcodeInputChange(e.target.value)}
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
                  padding: '10px 12px',
                  fontSize: '0.82rem',
                  borderColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-primary)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <Camera size={16} />
                <span>Escanear</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateSku}
                className="md-btn md-btn-secondary"
                style={{
                  padding: '10px 12px',
                  fontSize: '0.82rem',
                  borderColor: 'var(--md-sys-color-outline-variant)',
                  color: 'var(--md-sys-color-on-surface)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
                title="Generar SKU único automático"
              >
                <Sparkles size={16} color="var(--md-sys-color-primary)" />
                <span>Generar SKU</span>
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
                cursor: 'pointer'
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
                cursor: 'pointer'
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

          {/* Currency Selector Toggle */}
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
                  border: productCurrency === 'CUP' ? '1px solid var(--md-sys-color-primary)' : 'none',
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

          {/* Botón Acordeón de Calculadora de Lotes y Rollos en USD */}
          <div style={{
            borderRadius: '16px',
            border: isBulkCalculatorOpen ? '1.5px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
            backgroundColor: isBulkCalculatorOpen ? 'var(--md-sys-color-surface-container-high)' : 'var(--md-sys-color-surface)',
            overflow: 'hidden',
            transition: 'all 0.2s ease'
          }}>
            <button
              type="button"
              onClick={() => setIsBulkCalculatorOpen(prev => !prev)}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>🧮</span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                    Calculadora de Lotes / Rollos en USD
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Compra al por mayor en USD y desglose automático a precio unitario y CUP
                  </div>
                </div>
              </div>
              <ChevronDown
                size={18}
                color="var(--md-sys-color-primary)"
                style={{
                  transform: isBulkCalculatorOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }}
              />
            </button>

            {isBulkCalculatorOpen && (
              <div style={{
                padding: '14px 16px 16px 16px',
                borderTop: '1px solid var(--md-sys-color-outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'var(--md-sys-color-surface)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '4px' }}>
                      Cantidad Lote / Rollo ({unit || 'u'}) *
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 100"
                      value={bulkTotalUnits}
                      onChange={e => setBulkTotalUnits(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="md-input"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '10px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '4px' }}>
                      Costo Total Lote (US$) *
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 600"
                      value={bulkTotalCostUSD}
                      onChange={e => setBulkTotalCostUSD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="md-input"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '10px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '4px' }}>
                      Venta Unitaria en USD (US$) *
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 8.00"
                      value={bulkTargetPriceUSD}
                      onChange={e => setBulkTargetPriceUSD(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="md-input"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-income)', borderRadius: '10px' }}
                    />
                  </div>
                </div>

                {/* Tarjeta de Resultados Calculados en Tiempo Real */}
                {Number(bulkTotalUnits) > 0 && Number(bulkTotalCostUSD) > 0 && (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--md-sys-color-surface-container-high)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.78rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Costo Unitario en USD:</span>
                      <strong style={{ fontSize: '0.88rem' }}>
                        US$ {(Number(bulkTotalCostUSD) / Number(bulkTotalUnits)).toFixed(2)} / {unit || 'u'}
                      </strong>
                    </div>

                    {Number(bulkTargetPriceUSD) > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Ganancia Unitaria en USD:</span>
                          <strong style={{ color: 'var(--md-sys-color-income)', fontSize: '0.88rem' }}>
                            +US$ {(Number(bulkTargetPriceUSD) - (Number(bulkTotalCostUSD) / Number(bulkTotalUnits))).toFixed(2)} ({Math.round(((Number(bulkTargetPriceUSD) - (Number(bulkTotalCostUSD) / Number(bulkTotalUnits))) / Number(bulkTargetPriceUSD)) * 100)}% margen)
                          </strong>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Ganancia Total del Lote:</span>
                          <strong style={{ color: 'var(--md-sys-color-income)' }}>
                            +US$ {((Number(bulkTargetPriceUSD) - (Number(bulkTotalCostUSD) / Number(bulkTotalUnits))) * Number(bulkTotalUnits)).toFixed(2)} USD
                          </strong>
                        </div>

                        <div style={{
                          marginTop: '4px',
                          paddingTop: '8px',
                          borderTop: '1px dashed var(--md-sys-color-outline-variant)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--brand-primary, #1A73E8)' }}>
                              Equivalente en CUP (@ Tasa ${getCurrencySettings().exchangeRateUSD || 320}):
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                              Costo: ${Math.round((Number(bulkTotalCostUSD) / Number(bulkTotalUnits)) * (getCurrencySettings().exchangeRateUSD || 320)).toLocaleString('es-ES')} CUP
                            </div>
                          </div>
                          <strong style={{ fontSize: '0.96rem', color: 'var(--md-sys-color-income)' }}>
                            ${Math.round(Number(bulkTargetPriceUSD) * (getCurrencySettings().exchangeRateUSD || 320)).toLocaleString('es-ES')} CUP
                          </strong>
                        </div>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const unitsVal = Number(bulkTotalUnits);
                        const costUSDVal = Math.round((Number(bulkTotalCostUSD) / unitsVal) * 100) / 100;
                        const targetUSDVal = Number(bulkTargetPriceUSD);
                        const rateVal = getCurrencySettings().exchangeRateUSD || 320;

                        setStock(unitsVal);
                        setCostPriceUSD(costUSDVal);
                        if (targetUSDVal > 0) setPriceUSD(targetUSDVal);

                        if (productCurrency === 'USD') {
                          setCostPrice(costUSDVal);
                          if (targetUSDVal > 0) setPrice(targetUSDVal);
                        } else {
                          setCostPrice(Math.round(costUSDVal * rateVal));
                          if (targetUSDVal > 0) setPrice(Math.round(targetUSDVal * rateVal));
                        }

                        showToast({
                          title: '¡Cálculo Aplicado al Producto!',
                          message: `Stock: ${unitsVal}${unit} • Costo: US$${costUSDVal} • Venta: ${targetUSDVal > 0 ? (productCurrency === 'USD' ? `US$${targetUSDVal}` : `$${Math.round(targetUSDVal * rateVal)} CUP`) : 'Falta precio'}`,
                          type: 'success'
                        });
                      }}
                      className="md-btn md-btn-primary"
                      style={{
                        padding: '9px 16px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Sparkles size={15} />
                      <span>Aplicar este Cálculo al Formulario</span>
                    </button>
                  </div>
                )}
              </div>
            )}
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

          {/* Live Investment Calculation & Store Fund Availability Box */}
          {numStock > 0 && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: totalInvestment > currentStoreFund 
                ? '1.5px solid #FCA5A5' 
                : '1.5px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                  💰 Presupuesto de Entrada al Inventario
                </span>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: hasSufficientFund ? '#DCFCE7' : '#FEE2E2',
                  color: hasSufficientFund ? '#166534' : '#991B1B'
                }}>
                  {hasSufficientFund ? 'Fondos en Caja Suficientes' : 'Supera Fondos en Caja'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                    Costo Total de Adquisición:
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                    {formatCurrency(totalInvestment, productCurrency, true)}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    {numCost > 0 ? `${numStock} ${unit} × ${formatCurrency(numCost, productCurrency, true)}` : 'Sin costo asignado'}
                  </span>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--md-sys-color-surface-container-high)'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                    Disponible en Caja Negocio:
                  </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
                    {formatCurrency(currentStoreFund, productCurrency, true)}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
                    Fondo {productCurrency} en Tienda
                  </span>
                </div>
              </div>

              {totalInvestment > currentStoreFund && (
                <div style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#B91C1C',
                  backgroundColor: '#FEF2F2',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>El costo total ({formatCurrency(totalInvestment, productCurrency, true)}) supera el fondo disponible en la caja del negocio ({formatCurrency(currentStoreFund, productCurrency, true)}).</span>
                </div>
              )}
            </div>
          )}

          {/* Advanced Mode Only Fields */}
          {formMode === 'advanced' && (
            <>
              {/* External Link / Affiliate Checkbox & Input (Only if enabled in modules) */}
              {storeModules.enableExternalProducts && (
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
                            💡 Escribe los 8 dígitos locales (ej: 53999999). El sistema lo convertirá a wa.me/53...
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
              )}

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

              {/* Libro de Tasaciones: Manufacturing & Expiration Dates (Solo si el módulo de alimentos está activo) */}
              {storeModules.enableFoodTraceability && (
                <div style={{
                  padding: '14px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  border: '1px dashed var(--md-sys-color-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>📜</span>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                        Fechas para Libro de Tasaciones (Opcional)
                      </h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
                        Requerido para control sanitario e inspección de autoridades. No visible en tienda pública.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                        F. Fabricación / Creación
                      </label>
                      <input
                        type="date"
                        value={mfgDate}
                        onChange={e => setMfgDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '10px',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          backgroundColor: 'var(--md-sys-color-surface-container)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontSize: '0.82rem',
                          fontWeight: 700
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '4px' }}>
                        F. Vencimiento / Caducidad
                      </label>
                      <input
                        type="date"
                        value={expDate}
                        onChange={e => setExpDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '10px',
                          border: '1px solid var(--md-sys-color-outline-variant)',
                          backgroundColor: 'var(--md-sys-color-surface-container)',
                          color: 'var(--md-sys-color-on-surface)',
                          fontSize: '0.82rem',
                          fontWeight: 700
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

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
            </>
          )}

        </div>

        {/* Full Screen Footer Action Bar */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--md-sys-color-outline-variant)',
          backgroundColor: 'var(--md-sys-color-surface)',
          display: 'flex',
          gap: '12px',
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
            <span>{editingProduct ? 'Guardar Cambios' : (formMode === 'simple' ? '⚡ Publicar en Tienda Online' : 'Guardar Producto')}</span>
          </button>
        </div>

      </form>

      {/* Existing Product Detection Overlay Sub-Modal */}
      {existingProductAlert && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'var(--md-sys-color-surface)',
            zIndex: 2600,
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto',
            overflow: 'hidden'
          }}
          onClick={() => setExistingProductAlert(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              width: '100%',
              height: '100%',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto'
            }}
          >

            {/* Warning Banner Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                flexShrink: 0
              }}>
                📦
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
                  ¡Producto Ya Existe en Inventario!
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '2px 0 0 0', fontWeight: 700 }}>
                  SKU / Barras: <span style={{ fontFamily: 'monospace' }}>{existingProductAlert.barcode}</span>
                </p>
              </div>
            </div>

            {/* Product Summary Card */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'var(--md-sys-color-surface)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{existingProductAlert.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>
                <span>Stock Actual: <strong style={{ color: 'var(--md-sys-color-primary)' }}>{existingProductAlert.stock} {existingProductAlert.unit || 'u'}</strong></span>
                <span>Costo Unitario: <strong>{formatCurrency(existingProductAlert.costPrice || 0, existingProductAlert.currency || 'CUP')}</strong></span>
              </div>
            </div>

            {/* Add Stock Section Card */}
            <div style={{
              padding: '14px',
              borderRadius: '16px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlusCircle size={18} />
                <span>Agregar Stock / Reabastecer Lote</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                    Stock Adicional a Sumar *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={addStockQty}
                    onChange={e => setAddStockQty(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--md-sys-color-primary)',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '0.95rem',
                      fontWeight: 900,
                      textAlign: 'center'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                    Costo Unitario de este Lote
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    step="any"
                    value={addStockCost}
                    onChange={e => setAddStockCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>

              {storeModules.enableFoodTraceability && (
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                    Fecha de Vencimiento de este Lote (Opcional)
                  </label>
                  <input
                    type="date"
                    value={addStockExpDate}
                    onChange={e => setAddStockExpDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmAddStock}
                className="md-btn md-btn-primary"
                style={{
                  padding: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  borderRadius: '12px',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Check size={16} />
                <span>Confirmar y Sumar Stock (+{addStockQty || 0} {existingProductAlert.unit || 'u'})</span>
              </button>
            </div>

            {/* Alternative Action: Edit All Product Fields */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleEditAllFromExisting}
                className="md-btn md-btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Edit3 size={14} />
                <span>Modificar Todos los Datos</span>
              </button>
              <button
                type="button"
                onClick={() => setExistingProductAlert(null)}
                style={{
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
