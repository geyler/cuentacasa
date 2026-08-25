'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { StoreProduct, SupplierType, SupplierAccount } from '@/types';
import { 
  getStoreProducts, 
  saveStoreProduct, 
  deleteStoreProduct,
  getStoreSales,
  getSupplierAccounts,
  paySupplierAccount,
  saveSupplierAccount,
  deleteSupplierAccount,
  transferStoreFundToCasa,
  transferCasaToStoreFund,
  addTransaction,
  getRawDatabase,
  compressImageToBase64,
  getStoreWhatsappNumber,
  saveStoreWhatsappNumber,
  getUserRole
} from '@/lib/storage';
import { UserRole } from '@/types';
import { syncDatabaseWithCloud } from '@/lib/sync';
import { formatCurrency } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { TransferModal } from '@/components/TransferModal';
import { AppInput } from '@/components/common/AppInput';

const FormBarcodeScannerOverlay: React.FC<{
  onScan: (code: string) => void;
  onClose: () => void;
}> = ({ onScan, onClose }) => {
  const containerId = 'form-barcode-scanner-box';
  const html5QrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.ITF
          ],
          verbose: false
        });
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 25, qrbox: (w, h) => ({ width: Math.min(Math.floor(w * 0.9), 320), height: Math.min(Math.floor(h * 0.85), 180) }), aspectRatio: 1.777778 },
          (decodedText) => {
            if (isMounted) {
              const code = decodedText.trim();
              if (code) {
                try {
                  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                  if (AudioCtx) {
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1050, ctx.currentTime);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.14);
                  }
                } catch (e) {}
                onScan(code);
              }
            }
          },
          () => {}
        );
      } catch (err) {
        console.warn('Camera start error:', err);
      }
    };

    const stop = async () => {
      if (html5QrRef.current) {
        try {
          if (html5QrRef.current.isScanning) {
            await html5QrRef.current.stop();
          }
          html5QrRef.current.clear();
        } catch (e) {}
        html5QrRef.current = null;
      }
    };

    const timer = setTimeout(startScanner, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stop();
    };
  }, [onScan]);

  const [manualCode, setManualCode] = useState('');

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderRadius: '24px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        textAlign: 'center',
        boxShadow: 'var(--md-shadow-elevation-3)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scan size={20} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Escanear Código de Barras / SKU</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          width: '100%',
          height: '210px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#000',
          position: 'relative'
        }}>
          <div id={containerId} style={{ width: '100%', height: '100%' }} />
          <div className="scanner-laser-line" style={{ top: '50%' }} />
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, margin: 0 }}>
          Apunta la cámara al código de barras del producto para tomar el SKU automáticamente.
        </p>

        {/* Manual SKU fallback */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <input
            type="text"
            placeholder="O escribe el SKU manualmente..."
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              fontSize: '0.88rem',
              fontWeight: 700
            }}
          />
          <button
            type="button"
            disabled={!manualCode.trim()}
            onClick={() => {
              if (manualCode.trim()) {
                onScan(manualCode.trim());
              }
            }}
            className="md-btn md-btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', flexShrink: 0 }}
          >
            Usar
          </button>
        </div>

        <button onClick={onClose} className="md-btn md-btn-secondary" style={{ width: '100%', padding: '10px' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};
import { 
  Store, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Scan, 
  Search, 
  Tag, 
  Package, 
  X,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  Users,
  CheckCircle,
  Vault,
  ArrowRightLeft,
  UserPlus,
  PlusCircle,
  Receipt,
  Keyboard,
  ArrowRight,
  Check,
  Camera,
  PiggyBank,
  MessageCircle
} from 'lucide-react';

interface StoreManagementViewProps {
  currency?: string;
  onOpenScanner?: () => void;
  userRole?: UserRole;
}

export const StoreManagementView: React.FC<StoreManagementViewProps> = ({
  currency = '$',
  onOpenScanner,
  userRole: propUserRole
}) => {
  const effectiveRole = propUserRole || getUserRole();
  const isOwner = effectiveRole === 'propietario';
  const isAdmin = effectiveRole === 'administrador';
  const isVendor = effectiveRole === 'vendedor';

  const { showToast, confirmAction, showActionResult } = useActionFeedback();
  const rawDb = getRawDatabase();
  const [products, setProducts] = useState<StoreProduct[]>(() => getStoreProducts());
  const [suppliers, setSuppliers] = useState<SupplierAccount[]>(() => getSupplierAccounts());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductForDetailModal, setSelectedProductForDetailModal] = useState<StoreProduct | null>(null);
  
  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'suppliers' | 'transfer' | 'sales' | 'settings'>('products');

  // Modal State for Add / Edit Store Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUniversalTransferModalOpen, setIsUniversalTransferModalOpen] = useState(false);
  const [isScanningForFormBarcode, setIsScanningForFormBarcode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  // Form State
  const [barcode, setBarcode] = useState('0005');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [published, setPublished] = useState(true);
  const [supplierType, setSupplierType] = useState<SupplierType>('propia');
  const [supplierName, setSupplierName] = useState('Maikel');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // External / Affiliate Product Fields
  const [isExternal, setIsExternal] = useState(false);
  const [externalType, setExternalType] = useState<'whatsapp' | 'link'>('whatsapp');
  const [externalValue, setExternalValue] = useState('');
  const [externalUrl, setExternalUrl] = useState('');

  // Store WhatsApp Target Setting
  const [storeWhatsappNumber, setStoreWhatsappNumberState] = useState('');

  // Supplier Management States
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

  React.useEffect(() => {
    setStoreWhatsappNumberState(getStoreWhatsappNumber());
  }, []);

  // WordPress-Style Category Creation
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Active focused field state for Spotlight UX
  const [focusedField, setFocusedField] = useState<'name' | 'costPrice' | 'price' | 'stock' | 'description' | 'supplierName' | 'category' | 'newCategory' | 'externalUrl' | null>(null);

  const nameRef = React.useRef<HTMLInputElement>(null);
  const costPriceRef = React.useRef<HTMLInputElement>(null);
  const priceRef = React.useRef<HTMLInputElement>(null);
  const stockRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLInputElement>(null);
  const supplierNameRef = React.useRef<HTMLInputElement>(null);
  const productFormRef = React.useRef<HTMLFormElement>(null);

  // Purchase Funding Source: 'negocio' | 'casa' | 'proveedor'
  const [fundingSource, setFundingSource] = useState<'negocio' | 'casa' | 'proveedor'>('negocio');

  // Supplier Account Modals
  const [payoutSupplier, setPayoutSupplier] = useState<SupplierAccount | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSupplierNameInput, setNewSupplierNameInput] = useState('');

  // Transfer Fund & Payout States
  const [transferDirection, setTransferDirection] = useState<'store_to_casa' | 'casa_to_store'>('store_to_casa');
  const [transferAmountInput, setTransferAmountInput] = useState<number | ''>('');
  const [transferNotesInput, setTransferNotesInput] = useState('');
  const [payoutSource, setPayoutSource] = useState<'negocio' | 'casa'>('negocio');

  const salesRecords = getStoreSales();

  // Metrics calculations
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const totalCostValueInStock = products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
  const totalSellingValueInStock = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const potentialProfitInStock = totalSellingValueInStock - totalCostValueInStock;

  const totalHouseProfit = salesRecords.reduce((sum, s) => sum + s.netProfit, 0);
  const totalStoreFund = rawDb.storeFund || 0;
  const totalPendingSupplierDebt = suppliers.reduce((sum, sup) => sum + sup.pendingPayout, 0);

  // Category List (WordPress style)
  const existingCategories = Array.from(new Set([
    'Viveres', 'Panadería', 'Bebidas', 'Lácteos', 'Aseo', 'Golosinas', 'Carnes',
    ...customCategories,
    ...products.map(p => p.category)
  ]));

  const refreshData = () => {
    setProducts(getStoreProducts());
    setSuppliers(getSupplierAccounts());
  };

  const handleOpenAdd = () => {
    const allProds = getStoreProducts();
    let maxVal = 0;
    allProds.forEach(p => {
      const num = parseInt(p.barcode, 10);
      if (!isNaN(num) && num > maxVal) {
        maxVal = num;
      }
    });
    const nextBarcode = (maxVal + 1).toString().padStart(4, '0');
    setEditingProduct(null);
    setBarcode(nextBarcode);
    setName('');
    setCostPrice('');
    setPrice('');
    setCategory('');
    setStock('');
    setDescription('');
    setPhotoUrl('');
    setPublished(true);
    setSupplierType('propia');
    setSupplierName('Maikel');
    setFundingSource('negocio');
    setIsExternal(false);
    setExternalType('whatsapp');
    setExternalValue('');
    setExternalUrl('');
    setIsAddingNewCategory(false);
    setFocusedField(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: StoreProduct) => {
    setEditingProduct(p);
    setBarcode(p.barcode);
    setName(p.name);
    setCostPrice(p.costPrice || Math.round(p.price * 0.7));
    setPrice(p.price);
    setCategory(p.category);
    setStock(p.stock);
    setDescription(p.description || '');
    setPhotoUrl(p.photoUrl || '');
    setPublished(p.published);
    setSupplierType(p.supplierType || 'propia');
    setSupplierName(p.supplierName || 'Maikel');
    setFundingSource(p.supplierType === 'proveedor' ? 'proveedor' : 'negocio');
    setIsExternal(p.isExternal || false);
    const isWa = p.externalType === 'whatsapp' || (p.externalUrl && (p.externalUrl.includes('wa.me') || p.externalUrl.includes('whatsapp')));
    setExternalType(isWa ? 'whatsapp' : 'link');
    if (isWa && p.externalUrl) {
      const digits = p.externalUrl.replace(/\D/g, '');
      setExternalValue(digits || p.externalUrl);
    } else {
      setExternalValue(p.externalUrl || '');
    }
    setExternalUrl(p.externalUrl || '');
    setIsAddingNewCategory(false);
    setFocusedField(null);
    setIsModalOpen(true);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressedBase64 = await compressImageToBase64(file, 400);
      setPhotoUrl(compressedBase64);
      showToast({ title: 'Fotografía Cargada', message: 'Imagen comprimida y optimizada exitosamente.', type: 'success' });
    } catch (err) {
      showToast({ title: 'Error de Imagen', message: 'No se pudo procesar la fotografía.', type: 'error' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || Number(price) <= 0) {
      showToast({ title: 'Campos Requeridos', message: 'Ingresa el nombre del producto y un precio de venta válido.', type: 'warning' });
      return;
    }

    if (!category.trim()) {
      showToast({ title: 'Categoría Requerida', message: 'Selecciona una categoría para el producto.', type: 'warning' });
      return;
    }

    const numericCost = Number(costPrice) > 0 ? Number(costPrice) : Math.round(Number(price) * 0.7);

    // Save supplier / owner type depending on funding source
    const effectiveSupplierType: SupplierType = fundingSource === 'proveedor' ? 'proveedor' : 'propia';
    const effectiveSupplierName = effectiveSupplierType === 'proveedor' ? supplierName.trim() : undefined;

    let finalExternalUrl = '';
    if (isExternal) {
      if (externalType === 'whatsapp') {
        const digits = externalValue.replace(/\D/g, '');
        if (digits) {
          const cleanDigits = digits.length === 8 ? `53${digits}` : digits;
          finalExternalUrl = `https://wa.me/+${cleanDigits}`;
        } else {
          finalExternalUrl = externalValue.trim();
        }
      } else {
        const val = externalValue.trim();
        if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
          finalExternalUrl = `https://${val}`;
        } else {
          finalExternalUrl = val;
        }
      }
    }

    const savedProd = saveStoreProduct({
      barcode: barcode.padStart(4, '0'),
      name: name.trim(),
      costPrice: numericCost,
      price: Number(price),
      category: category.trim() || 'General',
      stock: isExternal ? 1 : (Number(stock) || 0),
      description: description.trim(),
      photoUrl: photoUrl || undefined,
      published,
      salesCount: editingProduct ? editingProduct.salesCount : 0,
      supplierType: effectiveSupplierType,
      supplierName: effectiveSupplierName,
      isExternal,
      externalType: isExternal ? externalType : undefined,
      externalUrl: isExternal ? finalExternalUrl : undefined
    });

    // If new product funded by Casa (and NOT external), log dual transaction for the merchandise investment
    if (!editingProduct && !isExternal && fundingSource === 'casa' && savedProd.stock > 0 && numericCost > 0) {
      const todayISO = new Date().toISOString().split('T')[0];
      const investmentTotal = numericCost * savedProd.stock;

      addTransaction({
        type: 'gasto',
        concept: `Compra Mercancía: ${savedProd.name} (${savedProd.stock} u.)`,
        category: 'Inversión Tienda',
        amount: investmentTotal,
        date: todayISO,
        accountSource: 'casa',
        notes: `Fondos personales de Casa utilizados para adquirir inventario.`
      });

      addTransaction({
        type: 'ingreso',
        concept: `Aporte Casa: Mercancía ${savedProd.name} (${savedProd.stock} u.)`,
        category: 'Inversión Tienda',
        amount: investmentTotal,
        date: todayISO,
        accountSource: 'tienda',
        notes: `Entrada de inventario valorada al costo y financiada por Casa.`
      });
    }

    refreshData();
    setIsModalOpen(false);

    // Trigger cloud sync to propagate product to other devices
    syncDatabaseWithCloud(true).catch(err => console.warn('Product sync warning:', err));
    
    showActionResult({
      title: editingProduct ? '¡Producto Actualizado!' : '¡Producto Creado!',
      message: `"${name.trim()}" ${editingProduct ? 'ha sido modificado correctamente' : 'se agregó al inventario'}.`,
      type: 'success',
      actions: [
        { label: 'Ver Tienda Pública', href: '/', icon: <ExternalLink size={16} /> },
        { label: 'Agregar Otro Producto', onClick: () => handleOpenAdd(), icon: <Plus size={16} /> }
      ]
    });
  };

  const handleTogglePublish = (p: StoreProduct) => {
    const isNowPublished = !p.published;
    saveStoreProduct({
      ...p,
      published: isNowPublished
    });
    refreshData();
    syncDatabaseWithCloud(true).catch(err => console.warn('Product sync warning:', err));

    showActionResult({
      title: isNowPublished ? '¡Producto Publicado!' : '¡Producto en Borrador!',
      message: `"${p.name}" ahora está ${isNowPublished ? 'visible para tus clientes en la Tienda Pública' : 'oculto en estado de borrador'}.`,
      type: isNowPublished ? 'success' : 'info',
      actions: [
        { label: 'Ver en Tienda Pública', href: '/', icon: <ExternalLink size={16} /> }
      ]
    });
  };

  const handleDelete = (id: string, prodName: string) => {
    confirmAction({
      title: '¿Eliminar Producto?',
      message: `¿Estás seguro de eliminar "${prodName}" del inventario de la tienda?`,
      variant: 'danger',
      confirmText: 'Eliminar Producto',
      onConfirm: () => {
        deleteStoreProduct(id);
        refreshData();
        syncDatabaseWithCloud(true).catch(err => console.warn('Product sync warning:', err));
        showActionResult({
          title: '¡Producto Eliminado!',
          message: `"${prodName}" fue retirado del inventario de la tienda.`,
          type: 'info'
        });
      }
    });
  };

  const handleAddNewCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newCategoryInput.trim();
    if (!catName) return;
    setCustomCategories(prev => Array.from(new Set([...prev, catName])));
    setCategory(catName);
    setNewCategoryInput('');
    setIsAddingNewCategory(false);
    showToast({ title: 'Nueva Categoría', message: `Categoría "${catName}" elegida automáticamente.`, type: 'success' });
  };

  const handleCreateSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierNameInput.trim()) return;
    saveSupplierAccount(newSupplierNameInput.trim());
    refreshData();
    showActionResult({
      title: '¡Proveedor Registrado!',
      message: `Proveedor "${newSupplierNameInput.trim()}" creado exitosamente.`,
      type: 'success',
      actions: [
        { label: 'Ver Lista de Proveedores', onClick: () => setActiveSubTab('suppliers'), icon: <Users size={16} /> }
      ]
    });
    setNewSupplierNameInput('');
    setIsAddSupplierModalOpen(false);
  };

  const handleDeleteSupplierAccount = (sup: SupplierAccount) => {
    confirmAction({
      title: `¿Eliminar Proveedor "${sup.name}"?`,
      message: `Se eliminará a ${sup.name} del registro de proveedores y sus productos asignados pasarán a mercadería propia.`,
      variant: 'danger',
      confirmText: 'Sí, Eliminar Proveedor',
      onConfirm: () => {
        const res = deleteSupplierAccount(sup.id);
        if (res.success) {
          refreshData();
          syncDatabaseWithCloud(true).catch(() => {});
          showActionResult({
            title: '¡Proveedor Eliminado!',
            message: `"${sup.name}" fue borrado exitosamente del sistema.`,
            type: 'success'
          });
        } else {
          showToast({ title: 'No se pudo eliminar', message: res.error || '', type: 'error' });
        }
      }
    });
  };

  const handleOpenPayout = (sup: SupplierAccount) => {
    setPayoutSupplier(sup);
    setPayoutAmount(sup.pendingPayout);
  };

  const handleExecutePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutSupplier || !payoutAmount || Number(payoutAmount) <= 0) return;

    const srcLabel = payoutSource === 'casa' ? 'Cuenta Casa' : 'Fondo Tienda';
    confirmAction({
      title: '¿Confirmar Liquidación a Proveedor?',
      message: `Se registrará la entrega de ${formatCurrency(Number(payoutAmount), currency)} a ${payoutSupplier.name} desde ${srcLabel}.`,
      variant: 'warning',
      confirmText: 'Confirmar Pago',
      onConfirm: () => {
        const res = paySupplierAccount(payoutSupplier.name, Number(payoutAmount), payoutSource);
        setPayoutSupplier(null);
        refreshData();
        syncDatabaseWithCloud(true).catch(err => console.warn('Payout sync warning:', err));
        showActionResult({
          title: '¡Liquidación Entregada!',
          message: res.message,
          type: 'success',
          actions: [
            { label: 'Ver Pestaña Proveedores', onClick: () => setActiveSubTab('suppliers'), icon: <Users size={16} /> }
          ]
        });
      }
    });
  };

  const handleExecuteStoreFundTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmountInput || Number(transferAmountInput) <= 0) {
      showToast({ title: 'Monto Inválido', message: 'Ingresa una cantidad mayor a 0 para transferir.', type: 'warning' });
      return;
    }

    const amt = Number(transferAmountInput);
    const isStoreToCasa = transferDirection === 'store_to_casa';
    const dialogTitle = isStoreToCasa ? '¿Transferir Saldo a Cuenta Casa?' : '¿Inyectar Capital a Fondo Tienda?';
    const dialogMsg = isStoreToCasa 
      ? `Se transferirán ${formatCurrency(amt, currency)} del Fondo de la Tienda hacia tu Cuenta Casa (se registrarán ambas transacciones saliente y entrante).`
      : `Se inyectarán ${formatCurrency(amt, currency)} desde tu Cuenta Casa hacia el Fondo de la Tienda (se registrarán ambas transacciones saliente y entrante).`;

    confirmAction({
      title: dialogTitle,
      message: dialogMsg,
      variant: 'info',
      confirmText: 'Transferir Ahora',
      onConfirm: () => {
        const res = isStoreToCasa 
          ? transferStoreFundToCasa(amt, transferNotesInput)
          : transferCasaToStoreFund(amt, transferNotesInput);

        if (res.success) {
          setTransferAmountInput('');
          setTransferNotesInput('');
          refreshData();
          syncDatabaseWithCloud(true).catch(err => console.warn('Transfer sync warning:', err));
          showActionResult({
            title: '¡Transferencia Exitosa!',
            message: isStoreToCasa 
              ? `Se registraron 2 transacciones: Saliente en Tienda y Entrante en Cuenta Casa ($${amt}).`
              : `Se registraron 2 transacciones: Saliente en Cuenta Casa y Entrante en Fondo Tienda ($${amt}).`,
            type: 'success',
            actions: [
              { label: 'Ver Pestaña Transferencias', onClick: () => setActiveSubTab('transfer'), icon: <ArrowRightLeft size={16} /> }
            ]
          });
        } else {
          showToast({ title: 'Error de Transferencia', message: res.error || '', type: 'error' });
        }
      }
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.supplierName && p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header Banner */}
      <div className="md-card" style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        color: '#FFFFFF',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Store size={22} color="#F472B6" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Inventario y Cuentas de Tienda</h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            Separación de Fondos: El margen de ganancias se envía a CuentaCasa y el costo permanece en el Fondo Tienda / Proveedores.
          </p>
        </div>

        {/* 50 / 50 Equal Width Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="md-btn"
              style={{
                flex: '1 1 0px',
                width: '50%',
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                fontSize: '0.92rem',
                fontWeight: 800,
                padding: '12px 16px',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <Scan size={20} />
              <span>Vender</span>
            </button>
          )}

          {!isVendor && (
            <button
              onClick={handleOpenAdd}
              className="md-btn"
              style={{
                flex: '1 1 0px',
                width: '50%',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.92rem',
                fontWeight: 800,
                padding: '12px 16px',
                border: 'none',
                borderRadius: '14px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={20} color="#EC4899" />
              <span>Publicar</span>
            </button>
          )}
        </div>
      </div>

      {/* Dual Funds Accounting Metrics (2 Columns on Mobile) */}
      {!isVendor && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px'
        }}>
          
          {/* House Net Profit */}
          <div className="md-card" style={{ padding: '12px 14px', backgroundColor: 'var(--md-sys-color-income-container)' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-income-container)', display: 'block' }}>
              {isOwner ? 'Ganancias a Casa' : 'Ganancias a Propietario'}
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-income)', display: 'block', margin: '4px 0 2px 0' }}>
              +{formatCurrency(totalHouseProfit, currency, true)}
            </span>
            <span style={{ fontSize: '0.68rem', opacity: 0.8, display: 'block' }}>
              {isOwner ? 'A balance general' : 'Transferido a Propietario'}
            </span>
          </div>

          {/* Store Fund (Caja Chica) */}
          <div className="md-card" style={{ padding: '12px 14px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
              Fondo Tienda (Caja)
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-primary)', display: 'block', margin: '4px 0 2px 0' }}>
              {formatCurrency(totalStoreFund, currency, true)}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
              Caja de reposición
            </span>
          </div>

          {/* Supplier Debts */}
          <div className="md-card" style={{ padding: '12px 14px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
              Por Pagar Proveedor
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-expense)', display: 'block', margin: '4px 0 2px 0' }}>
              {formatCurrency(totalPendingSupplierDebt, currency, true)}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
              Deudas pendientes
            </span>
          </div>

          {/* Total Stock Capital */}
          <div className="md-card" style={{ padding: '12px 14px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
              Capital Almacén
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', display: 'block', margin: '4px 0 2px 0' }}>
              {formatCurrency(totalCostValueInStock, currency, true)}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
              {totalStockUnits}u en stock
            </span>
          </div>

        </div>
      )}

      {/* Navigation Sub-Tabs Bar */}
      <div style={{
        display: 'flex',
        gap: '6px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        padding: '6px',
        borderRadius: '16px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveSubTab('products')}
          style={{
            flex: '1 1 auto',
            padding: '10px 14px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            backgroundColor: activeSubTab === 'products' ? 'var(--md-sys-color-surface)' : 'transparent',
            color: activeSubTab === 'products' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            boxShadow: activeSubTab === 'products' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Package size={16} />
          <span>Productos</span>
        </button>

        {!isVendor && (
          <button
            onClick={() => setActiveSubTab('suppliers')}
            style={{
              flex: '1 1 auto',
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'suppliers' ? 'var(--md-sys-color-surface)' : 'transparent',
              color: activeSubTab === 'suppliers' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
              boxShadow: activeSubTab === 'suppliers' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <Users size={16} />
            <span>Proveedores ({suppliers.length})</span>
          </button>
        )}

        {isOwner && (
          <button
            onClick={() => setActiveSubTab('transfer')}
            style={{
              flex: '1 1 auto',
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              backgroundColor: activeSubTab === 'transfer' ? 'var(--md-sys-color-surface)' : 'transparent',
              color: activeSubTab === 'transfer' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
              boxShadow: activeSubTab === 'transfer' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <ArrowRightLeft size={16} />
            <span>Transferir a Casa</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('sales')}
          style={{
            flex: '1 1 auto',
            padding: '10px 14px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            backgroundColor: activeSubTab === 'sales' ? 'var(--md-sys-color-surface)' : 'transparent',
            color: activeSubTab === 'sales' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            boxShadow: activeSubTab === 'sales' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Receipt size={16} />
          <span>Ventas ({salesRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          style={{
            flex: '1 1 auto',
            padding: '10px 14px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            backgroundColor: activeSubTab === 'settings' ? 'var(--md-sys-color-surface)' : 'transparent',
            color: activeSubTab === 'settings' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
            boxShadow: activeSubTab === 'settings' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <MessageCircle size={16} />
          <span>WhatsApp Pedidos</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTS INVENTORY */}
      {activeSubTab === 'products' && (
        <>
          {/* Search Bar with Input Spotlight */}
          <div className="md-card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              
              <div style={{ position: 'relative', flex: '1 1 200px' }}>
                <Search 
                  size={16} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--md-sys-color-on-surface-variant)'
                  }} 
                />
                <input
                  type="text"
                  placeholder="Buscar por código, producto o proveedor (ej. Maikel)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input-spotlight"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '12px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface)',
                    color: 'var(--md-sys-color-on-surface)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <a
                href="/"
                target="_self"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--md-sys-color-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none'
                }}
              >
                <span>Ver Tienda Pública</span>
                <Store size={14} />
              </a>

            </div>
          </div>

          {/* Products List View for Admin */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredProducts.map(prod => {
              return (
                <div
                  key={prod.id}
                  className="md-card"
                  onClick={() => setSelectedProductForDetailModal(prod)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    opacity: prod.published ? 1 : 0.65,
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  {/* Left: Thumbnail & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    {/* 44x44 Thumbnail */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: 'var(--md-sys-color-surface-container-high)'
                    }}>
                      <img 
                        src={prod.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F0F4F8"><rect width="400" height="400" fill="%23E2E8F0"/><circle cx="200" cy="200" r="80" fill="%23CBD5E1"/><text x="50%" y="54%" fill="%2364748B" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">TIENDA CASA</text></svg>`} 
                        alt={prod.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>

                    {/* Info Text */}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          backgroundColor: 'var(--md-sys-color-primary-container)',
                          color: 'var(--md-sys-color-on-primary-container)',
                          padding: '1px 5px',
                          borderRadius: '5px'
                        }}>
                          #{prod.barcode}
                        </span>
                        {prod.isExternal ? (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            color: '#059669',
                            backgroundColor: '#D1FAE5',
                            padding: '1px 7px',
                            borderRadius: '5px',
                            border: '1px solid #A7F3D0'
                          }}>
                            {prod.externalUrl?.includes('wa.me') || prod.externalUrl?.includes('whatsapp') ? '💬 WhatsApp Directo' : '🌐 Enlace Externo'}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: prod.stock > 5 ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-expense)',
                            backgroundColor: prod.stock > 5 ? 'var(--md-sys-color-surface-container)' : 'var(--md-sys-color-expense-container)',
                            padding: '1px 6px',
                            borderRadius: '5px'
                          }}>
                            Stock: {prod.stock}u
                          </span>
                        )}
                        {prod.supplierType === 'proveedor' && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            backgroundColor: '#FFF3E0',
                            color: '#E65100',
                            padding: '1px 5px',
                            borderRadius: '5px'
                          }}>
                            {prod.supplierName || 'Proveedor'}
                          </span>
                        )}
                      </div>

                      <h3 style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 800, 
                        color: 'var(--md-sys-color-on-surface)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {prod.name}
                      </h3>
                    </div>
                  </div>

                  {/* Right: Price & Quick Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                        {formatCurrency(prod.price, currency, true)}
                      </div>
                      {!isVendor && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                          Costo: ${prod.costPrice || 0}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
                      {!isVendor && (
                        <button
                          onClick={() => handleTogglePublish(prod)}
                          title={prod.published ? 'Publicado en Tienda' : 'Borrador (Oculto)'}
                          style={{
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            backgroundColor: prod.published ? 'var(--md-sys-color-income-container)' : 'var(--md-sys-color-surface-container-high)',
                            color: prod.published ? 'var(--md-sys-color-income)' : 'var(--md-sys-color-on-surface-variant)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {prod.published ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      )}

                      {!isVendor && (
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          title="Editar producto"
                          style={{
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            backgroundColor: 'var(--md-sys-color-surface-container-high)',
                            color: 'var(--md-sys-color-on-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Edit3 size={16} />
                        </button>
                      )}

                      {!isVendor && (
                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          title="Eliminar producto"
                          style={{
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            backgroundColor: 'var(--md-sys-color-expense-container)',
                            color: 'var(--md-sys-color-expense)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TAB 2: PROVEEDORES MANAGEMENT & CONTROL DE MERCANCÍAS */}
      {activeSubTab === 'suppliers' && (
        <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={22} color="var(--md-sys-color-primary)" />
                <span>Control Financiero de Proveedores (Consignación)</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                Auditoría en tiempo real de mercancía en inventario, ventas por liquidar, historial de pagos y liquidaciones a proveedores.
              </p>
            </div>

            <button
              onClick={() => setIsAddSupplierModalOpen(true)}
              className="md-btn md-btn-primary"
              style={{ padding: '9px 18px', fontSize: '0.85rem' }}
            >
              <UserPlus size={16} />
              <span>Nuevo Proveedor</span>
            </button>
          </div>

          {/* Top Summary Metrics Bar */}
          {(() => {
            const consignmentProds = products.filter(p => p.supplierType === 'proveedor');
            const totalUnsoldNet = consignmentProds.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
            const totalPendingDebt = suppliers.reduce((sum, s) => sum + s.pendingPayout, 0);
            const totalPaidAll = suppliers.reduce((sum, s) => sum + s.totalPaid, 0);

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    📦 Mercancía Stock
                  </span>
                  <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
                    {formatCurrency(totalUnsoldNet, currency, true)}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {consignmentProds.reduce((s, p) => s + p.stock, 0)}u en inventario
                  </span>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--md-sys-color-expense-container)',
                  border: '1px solid var(--md-sys-color-expense)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-expense)' }}>
                    ⏳ Por Liquidar
                  </span>
                  <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-expense)' }}>
                    {formatCurrency(totalPendingDebt, currency, true)}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-expense)' }}>
                    Ventas pendientes
                  </span>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--md-sys-color-income-container)',
                  border: '1px solid var(--md-sys-color-income)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  gridColumn: 'span 2'
                }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                    ✅ Total Ya Liquidado (Pagado a Proveedores)
                  </span>
                  <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                    {formatCurrency(totalPaidAll, currency, true)}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-income)' }}>
                    Entregado en efectivo a proveedores
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Supplier Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {suppliers.map(sup => {
              const supProds = products.filter(p => p.supplierType === 'proveedor' && p.supplierName?.toLowerCase() === sup.name.toLowerCase());
              const unsoldNet = supProds.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
              const totalStock = supProds.reduce((sum, p) => sum + p.stock, 0);

              // Gather sales history for this supplier
              const salesHistory = getStoreSales();
              const supplierSalesItems: {
                saleId: string;
                timestamp: number;
                barcode: string;
                name: string;
                quantity: number;
                costPrice: number;
                price: number;
                totalCost: number;
                totalPrice: number;
                profit: number;
              }[] = [];

              salesHistory.forEach(sale => {
                sale.items.forEach(item => {
                  if (item.supplierType === 'proveedor' && item.supplierName?.toLowerCase() === sup.name.toLowerCase()) {
                    const totalItemCost = item.costPrice * item.quantity;
                    const totalItemPrice = item.subtotal || (item.unitPrice * item.quantity);
                    supplierSalesItems.push({
                      saleId: sale.id,
                      timestamp: sale.timestamp,
                      barcode: item.barcode,
                      name: item.name,
                      quantity: item.quantity,
                      costPrice: item.costPrice,
                      price: item.unitPrice,
                      totalCost: totalItemCost,
                      totalPrice: totalItemPrice,
                      profit: totalItemPrice - totalItemCost
                    });
                  }
                });
              });

              const isExpanded = expandedSupplierId === sup.id;

              return (
                <div
                  key={sup.id}
                  style={{
                    padding: '18px',
                    borderRadius: '18px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface-container)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {/* Card Title Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👤 {sup.name}</span>
                        <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                          {supProds.length} productos
                        </span>
                      </h4>
                      <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        ID Registro: #{sup.id.slice(-6)}
                      </span>
                    </div>

                    {sup.pendingPayout <= 0 && (
                      <button
                        onClick={() => handleDeleteSupplierAccount(sup)}
                        title="Eliminar proveedor sin deuda"
                        style={{ border: 'none', background: 'none', color: 'var(--md-sys-color-expense)', cursor: 'pointer', padding: '6px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Financial Grid (4 Pills in 2x2 Grid) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    
                    <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', fontWeight: 700 }}>
                        En Inventario (Sin Vender):
                      </span>
                      <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-on-surface)' }}>
                        {formatCurrency(unsoldNet, currency, true)}
                      </strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                        {totalStock} unidades en stock
                      </span>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-expense)', display: 'block', fontWeight: 700 }}>
                        Por Liquidar (Vendidas):
                      </span>
                      <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: sup.pendingPayout > 0 ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-income)' }}>
                        {formatCurrency(sup.pendingPayout, currency, true)}
                      </strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                        Pendiente de pagar
                      </span>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-income)', display: 'block', fontWeight: 700 }}>
                        Ya Liquidado (Pagado):
                      </span>
                      <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-income)' }}>
                        {formatCurrency(sup.totalPaid, currency, true)}
                      </strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                        Pagos realizados
                      </span>
                    </div>

                    <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-primary)', display: 'block', fontWeight: 700 }}>
                        Ganancia para la Tienda:
                      </span>
                      <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--md-sys-color-primary)' }}>
                        {formatCurrency(supplierSalesItems.reduce((s, i) => s + i.profit, 0), currency, true)}
                      </strong>
                      <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                        Margen acumulado
                      </span>
                    </div>

                  </div>

                  {/* Actions Bar: Liquidar Pago & Ver Historial de Ventas */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleOpenPayout(sup)}
                      disabled={sup.pendingPayout <= 0}
                      className="md-btn md-btn-primary"
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        fontSize: '0.85rem',
                        opacity: sup.pendingPayout <= 0 ? 0.4 : 1,
                        cursor: sup.pendingPayout <= 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <DollarSign size={16} />
                      <span>Liquidar Pago (${sup.pendingPayout})</span>
                    </button>

                    <button
                      onClick={() => setExpandedSupplierId(isExpanded ? null : sup.id)}
                      className="md-btn md-btn-secondary"
                      style={{
                        padding: '10px 14px',
                        fontSize: '0.85rem',
                        gap: '6px'
                      }}
                    >
                      <Receipt size={16} />
                      <span>{isExpanded ? 'Ocultar Historial' : `Historial Ventas (${supplierSalesItems.length})`}</span>
                    </button>
                  </div>

                  {/* Expanded Sales History Table for this Supplier */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '8px',
                      padding: '14px',
                      borderRadius: '14px',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Receipt size={16} color="var(--md-sys-color-primary)" />
                        <span>Historial Detallado de Ventas de {sup.name}</span>
                      </h5>

                      {supplierSalesItems.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic', margin: 0 }}>
                          Aún no se han registrado ventas de productos pertenecientes a {sup.name}.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                          {supplierSalesItems.map((item, idx) => (
                            <div
                              key={`${item.saleId}-${idx}`}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '10px',
                                backgroundColor: 'var(--md-sys-color-surface-container)',
                                border: '1px solid var(--md-sys-color-outline-variant)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '0.8rem'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                                  {item.name} <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)' }}>(#{item.barcode})</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                  {new Date(item.timestamp).toLocaleString('es-ES')} | Cantidad: <strong>{item.quantity}u</strong>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 800, color: 'var(--md-sys-color-expense)' }}>
                                  A Proveedor: {formatCurrency(item.totalCost, currency, true)}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-income)' }}>
                                  Venta Total: {formatCurrency(item.totalPrice, currency, true)} (Ganancia: +${item.profit})
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 3: TRANSFER STORE FUND TO CUENTA CASA */}
      {activeSubTab === 'transfer' && (
        <div className="md-card" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Transferencias entre Cuentas</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Transfiere entre el Fondo de la Tienda, Fondo de Ahorro y Cuenta Casa. Cada movimiento registrará automáticamente 2 transacciones.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUniversalTransferModalOpen(true)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.88rem',
              marginBottom: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--md-shadow-elevation-1)'
            }}
          >
            <PiggyBank size={20} />
            <span>Abrir Asistente de Transferencias (Incluye Ahorro)</span>
          </button>

          {/* Direction Selector Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setTransferDirection('store_to_casa')}
              style={{
                padding: '10px',
                borderRadius: '12px',
                border: transferDirection === 'store_to_casa' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: transferDirection === 'store_to_casa' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                color: transferDirection === 'store_to_casa' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                fontWeight: transferDirection === 'store_to_casa' ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              🏦 Tienda ➔ 🏡 Casa
            </button>

            <button
              type="button"
              onClick={() => setTransferDirection('casa_to_store')}
              style={{
                padding: '10px',
                borderRadius: '12px',
                border: transferDirection === 'casa_to_store' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                backgroundColor: transferDirection === 'casa_to_store' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                color: transferDirection === 'casa_to_store' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                fontWeight: transferDirection === 'casa_to_store' ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              🏡 Casa ➔ 🏦 Tienda
            </button>
          </div>

          <div style={{
            padding: '14px',
            borderRadius: '14px',
            backgroundColor: 'var(--md-sys-color-surface-container)',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                Saldo Disponible en Fondo Tienda:
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
                {formatCurrency(totalStoreFund, currency, true)}
              </span>
            </div>
            {transferDirection === 'store_to_casa' && (
              <button
                type="button"
                onClick={() => setTransferAmountInput(totalStoreFund)}
                className="md-btn md-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                Usar Todo
              </button>
            )}
          </div>

          <form onSubmit={handleExecuteStoreFundTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Monto a Transferir ({currency}):
              </label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                required
                max={transferDirection === 'store_to_casa' ? totalStoreFund : undefined}
                placeholder="500"
                value={transferAmountInput}
                onChange={e => setTransferAmountInput(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="input-spotlight"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid var(--md-sys-color-primary)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  textAlign: 'center'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Nota / Concepto opcional:
              </label>
              <input
                type="text"
                placeholder={transferDirection === 'store_to_casa' ? "Ej. Retiro de utilidad mensual para gastos del hogar" : "Ej. Aporte para compra de inventario"}
                value={transferNotesInput}
                onChange={e => setTransferNotesInput(e.target.value)}
                className="input-spotlight"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={transferDirection === 'store_to_casa' && totalStoreFund <= 0}
              className="md-btn md-btn-primary"
              style={{ padding: '14px', fontSize: '0.95rem', opacity: (transferDirection === 'store_to_casa' && totalStoreFund <= 0) ? 0.5 : 1 }}
            >
              <ArrowRightLeft size={18} />
              <span>
                {transferDirection === 'store_to_casa' ? 'Confirmar Transferencia a Cuenta Casa' : 'Confirmar Inyección a Fondo Tienda'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: SALES RECEIPTS LOG */}
      {activeSubTab === 'sales' && (
        <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={20} color="var(--md-sys-color-primary)" />
            <span>Historial de Ventas y Recibos</span>
          </h3>

          {salesRecords.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', padding: '20px' }}>
              Aún no hay ventas registradas. Escanea productos en el POS para realizar tu primera venta.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {salesRecords.map(sale => (
                <div
                  key={sale.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: 'var(--md-sys-color-surface-container)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
                      Ticket #{sale.id.slice(-6)} • {sale.date}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                      {formatCurrency(sale.totalAmount, currency, true)}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '6px' }}>
                    {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    paddingTop: '6px',
                    borderTop: '1px dashed var(--md-sys-color-outline-variant)'
                  }}>
                    <span>Ganancia a Casa: <strong style={{ color: 'var(--md-sys-color-income)' }}>${sale.netProfit}</strong></span>
                    <span>Costo Retenido (Negocio/Proveedores): <strong>${sale.totalCost}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: WHATSAPP SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: '#25D366',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageCircle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                WhatsApp para Pedidos del Carrito
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                Los pedidos del catálogo online se enviarán automáticamente a este número de WhatsApp.
              </p>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginBottom: '6px' }}>
              Número de WhatsApp Target (Ej. 5351234567)
            </label>
            <input
              type="tel"
              placeholder="Ej. 5351234567"
              value={storeWhatsappNumber}
              onChange={e => setStoreWhatsappNumberState(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid var(--md-sys-color-outline-variant)',
                fontSize: '1rem',
                fontWeight: 700,
                outline: 'none',
                backgroundColor: 'var(--md-sys-color-surface)',
                color: 'var(--md-sys-color-on-surface)'
              }}
            />
          </div>

          <button
            onClick={() => {
              saveStoreWhatsappNumber(storeWhatsappNumber);
              showToast({ title: 'WhatsApp Guardado', message: 'Los pedidos online del carrito se dirigirán a este número.', type: 'success' });
            }}
            className="md-btn"
            style={{
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              padding: '12px',
              fontSize: '0.92rem',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
            }}
          >
            <Check size={18} />
            <span>Guardar Número WhatsApp</span>
          </button>
        </div>
      )}

      {/* Add / Edit Product Bottom Sheet Modal */}
      {isModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(8px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0'
          }} 
          className="no-print" 
          onClick={() => { 
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            setFocusedField(null); 
            setIsModalOpen(false); 
          }}
        >
          
          <form
            ref={productFormRef}
            onClick={e => {
              e.stopPropagation();
              const target = e.target as HTMLElement;
              const isTextInputElement = target.tagName === 'INPUT' || 
                                         target.tagName === 'TEXTAREA' || 
                                         target.tagName === 'SELECT';
              if (!isTextInputElement) {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                setFocusedField(null);
              }
            }}
            onSubmit={handleSaveProduct}
            className="bottom-sheet-modal"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              width: '100%',
              maxWidth: '520px',
              padding: '20px 20px 28px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--md-shadow-elevation-4)',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px'
            }}
          >
            {/* Handle Drag Indicator */}
            <div style={{ width: '44px', height: '4px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 2px auto', opacity: 0.8 }} />

            {/* Header (Top) */}
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
                onClick={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  setFocusedField(null);
                  setIsModalOpen(false);
                }} 
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

            {/* Origen del Financiamiento y Proveedores (Immediately Below Header) */}
            <div style={{
              opacity: focusedField !== null ? 0.85 : 1,
              filter: focusedField !== null ? 'blur(1px)' : 'none',
              transition: 'all 0.25s ease'
            }}>
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

            {/* Supplier Selection Dropdown / New Input if Consignment */}
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
                        label="Nombre del Nuevo Proveedor *"
                        placeholder="Ej. Maikel, Carlos..."
                        value={supplierName}
                        onChange={e => setSupplierName(e.target.value)}
                        focusedField={focusedField}
                        fieldName="supplierName"
                        onFocus={() => setFocusedField('supplierName')}
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
              ref={nameRef}
              label="Nombre del Producto *"
              placeholder="Ej. Pan Dulce Casero 5u"
              value={name}
              onChange={e => setName(e.target.value)}
              focusedField={focusedField}
              fieldName="name"
              onFocus={() => setFocusedField('name')}
              onNextField={() => {
                setFocusedField('costPrice');
                setTimeout(() => costPriceRef.current?.focus(), 50);
              }}
              required
            />

            {/* Dedicated Barcode / SKU Field with Camera Scan Button */}
            <div style={{
              opacity: focusedField !== null && focusedField !== 'category' && focusedField !== 'newCategory' ? 0.85 : 1,
              filter: focusedField !== null && focusedField !== 'category' && focusedField !== 'newCategory' ? 'blur(1px)' : 'none',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
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
                  onClick={() => setIsScanningForFormBarcode(true)}
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
            <div style={{
              opacity: focusedField !== null && focusedField !== 'category' && focusedField !== 'newCategory' ? 0.85 : 1,
              filter: focusedField !== null && focusedField !== 'category' && focusedField !== 'newCategory' ? 'blur(1px)' : 'none',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Categoría del Producto *
              </label>

              {/* Standardized Category Select Dropdown */}
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
                onFocus={() => setFocusedField('category')}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: focusedField === 'category' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  color: category ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: focusedField === 'category' ? '0 0 0 4px rgba(0, 99, 155, 0.25)' : 'none',
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

              {/* Inline input if Creating New Category */}
              {isAddingNewCategory && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    type="text"
                    placeholder="Nombre nueva categoría..."
                    value={newCategoryInput}
                    onChange={e => setNewCategoryInput(e.target.value)}
                    onFocus={() => setFocusedField('newCategory')}
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

            {/* Cost Price vs Selling Price Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <AppInput
                  ref={costPriceRef}
                  label="Precio Costo *"
                  unitSymbol={currency}
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  step="any"
                  isNumeric
                  placeholder="200"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  focusedField={focusedField}
                  fieldName="costPrice"
                  onFocus={() => setFocusedField('costPrice')}
                  onNextField={() => {
                    setFocusedField('price');
                    setTimeout(() => priceRef.current?.focus(), 50);
                  }}
                  required
                />

                <AppInput
                  ref={priceRef}
                  label="Precio Público *"
                  unitSymbol={currency}
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  step="any"
                  isNumeric
                  placeholder="350"
                  value={price}
                  onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  focusedField={focusedField}
                  fieldName="price"
                  onFocus={() => setFocusedField('price')}
                  onNextField={() => {
                    setFocusedField('stock');
                    setTimeout(() => stockRef.current?.focus(), 50);
                  }}
                  required
                  style={{ color: 'var(--md-sys-color-income)' }}
                />
              </div>

              {/* Profit Calculation Badge for Admin */}
              {Number(price) > 0 && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  opacity: focusedField !== null ? 0.85 : 1,
                  filter: focusedField !== null ? 'blur(1px)' : 'none',
                  transition: 'all 0.25s ease'
                }}>
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700 }}>Estimación de Ganancia:</span>
                  <span style={{ fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
                    +{formatCurrency(Number(price) - (Number(costPrice) || Math.round(Number(price) * 0.7)), currency, true)} ({Math.round(((Number(price) - (Number(costPrice) || Math.round(Number(price) * 0.7))) / Number(price)) * 100)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Stock Units */}
            <AppInput
              ref={stockRef}
              label="Stock (Unidades) *"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              isNumeric
              placeholder="Ej. 10"
              value={stock}
              onChange={e => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              focusedField={focusedField}
              fieldName="stock"
              onFocus={() => setFocusedField('stock')}
              onDone={() => {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                setFocusedField(null);
              }}
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
              gap: '10px',
              opacity: focusedField !== null && focusedField !== 'externalUrl' ? 0.85 : 1,
              filter: focusedField !== null && focusedField !== 'externalUrl' ? 'blur(1px)' : 'none',
              transition: 'all 0.25s ease'
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
                  {/* Selector Tab: WhatsApp vs Link */}
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
                        label="Número de WhatsApp (Las Tunas) *"
                        placeholder="Ej: 53999999 (Sin +53 ni código de país)"
                        value={externalValue}
                        onChange={e => setExternalValue(e.target.value)}
                        focusedField={focusedField}
                        fieldName="externalUrl"
                        onFocus={() => setFocusedField('externalUrl')}
                        required={isExternal}
                      />
                      <p style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px', fontWeight: 600 }}>
                        💡 Escribe los 8 dígitos locales (ej: 53999999). El sistema lo convertirá a wa.me/+53...
                      </p>
                    </div>
                  ) : (
                    <AppInput
                      label="URL o Enlace Web Directo *"
                      placeholder="https://tienda-externa.com/producto..."
                      value={externalValue}
                      onChange={e => setExternalValue(e.target.value)}
                      focusedField={focusedField}
                      fieldName="externalUrl"
                      onFocus={() => setFocusedField('externalUrl')}
                      required={isExternal}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Detailed Description Field for Local SEO & User Information */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              opacity: focusedField !== null && focusedField !== 'description' ? 0.85 : 1,
              filter: focusedField !== null && focusedField !== 'description' ? 'blur(1px)' : 'none',
              transition: 'all 0.25s ease'
            }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
                Descripción Detallada (SEO Local & Información del Cliente)
              </label>
              <textarea
                rows={3}
                placeholder="Escribe detalles del producto, especificaciones, ingredientes o disponibilidad en Las Tunas para mejorar el SEO..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                className="input-spotlight"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: focusedField === 'description' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
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
              gap: '10px',
              opacity: focusedField !== null ? 0.85 : 1,
              filter: focusedField !== null ? 'blur(1px)' : 'none',
              transition: 'all 0.25s ease'
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
              fontWeight: 700,
              opacity: focusedField !== null ? 0.85 : 1,
              filter: focusedField !== null ? 'blur(1px)' : 'none',
              transition: 'all 0.25s ease'
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
                onClick={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  setFocusedField(null);
                  setIsModalOpen(false);
                }}
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
      )}

      {/* Add New Supplier Modal */}
      {isAddSupplierModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.70)',
          backdropFilter: 'blur(8px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0'
        }} onClick={() => setIsAddSupplierModalOpen(false)}>
          
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleCreateSupplierSubmit}
            className="bottom-sheet-modal"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              width: '100%',
              maxWidth: '440px',
              padding: '20px 20px 28px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--md-shadow-elevation-4)'
            }}
          >
            <div style={{ width: '40px', height: '4px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto', opacity: 0.8 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>+ Nuevo Proveedor</h3>
              <button type="button" onClick={() => setIsAddSupplierModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Nombre del Proveedor (ej. Carlos, Distribuidora XYZ):
              </label>
              <input
                type="text"
                required
                placeholder="Nombre del proveedor..."
                value={newSupplierNameInput}
                onChange={e => setNewSupplierNameInput(e.target.value)}
                className="app-input"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  fontWeight: 800
                }}
              />
            </div>

            <button
              type="submit"
              className="md-btn md-btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              Registrar Proveedor
            </button>
          </form>
        </div>
      )}

      {/* Supplier Payout Bottom Sheet Modal */}
      {payoutSupplier && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.70)',
          backdropFilter: 'blur(8px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: '0'
        }} onClick={() => setPayoutSupplier(null)}>
          
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleExecutePayout}
            className="bottom-sheet-modal"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              color: 'var(--md-sys-color-on-surface)',
              width: '100%',
              maxWidth: '460px',
              padding: '20px 20px 28px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--md-shadow-elevation-4)'
            }}
          >
            {/* Handle Drag Indicator */}
            <div style={{ width: '40px', height: '4px', borderRadius: '9999px', backgroundColor: 'var(--md-sys-color-outline-variant)', margin: '0 auto 4px auto', opacity: 0.8 }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Liquidar Proveedor: {payoutSupplier.name}</h3>
              <button type="button" onClick={() => setPayoutSupplier(null)} style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Monto retenido pendiente de entregar: <strong style={{ color: 'var(--md-sys-color-expense)' }}>${payoutSupplier.pendingPayout}</strong>
            </p>

            {/* Payout Source Selector */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Origen del Dinero para Liquidar:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPayoutSource('negocio')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: payoutSource === 'negocio' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: payoutSource === 'negocio' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                    color: payoutSource === 'negocio' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                    fontWeight: payoutSource === 'negocio' ? 800 : 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  🏦 Fondo Tienda
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutSource('casa')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: payoutSource === 'casa' ? '2px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    backgroundColor: payoutSource === 'casa' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface)',
                    color: payoutSource === 'casa' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                    fontWeight: payoutSource === 'casa' ? 800 : 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  🏡 Cuenta Casa
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Monto a Entregar ({currency}):
              </label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="any"
                required
                max={payoutSupplier.pendingPayout}
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="app-input-numeric"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid var(--md-sys-color-primary)',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  textAlign: 'center'
                }}
              />
            </div>

            <button
              type="submit"
              className="md-btn md-btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              Registrar Liquidación Entregada
            </button>

          </form>

        </div>
      )}

      {/* Product Detail Modal for Store Admin */}
      <ProductDetailModal
        product={selectedProductForDetailModal}
        onClose={() => setSelectedProductForDetailModal(null)}
        onEditProduct={(p) => {
          setSelectedProductForDetailModal(null);
          handleOpenEdit(p);
        }}
        onDeleteProduct={(id: string, name?: string) => {
          setSelectedProductForDetailModal(null);
          handleDelete(id, name || '');
        }}
        allProducts={products}
        currency={currency}
        isAdmin={!isVendor}
      />

      {/* Universal Transfer Modal */}
      <TransferModal
        isOpen={isUniversalTransferModalOpen}
        onClose={() => setIsUniversalTransferModalOpen(false)}
        onSuccess={() => {
          setProducts(getStoreProducts());
          setSuppliers(getSupplierAccounts());
        }}
      />

      {/* Form Barcode Scanner Camera Overlay Modal */}
      {isScanningForFormBarcode && (
        <FormBarcodeScannerOverlay
          onScan={(scannedCode) => {
            setBarcode(scannedCode);
            setIsScanningForFormBarcode(false);
            showToast({
              title: '¡Código Escaneado!',
              message: `Asignado código de barras #${scannedCode} al producto.`,
              type: 'success'
            });
          }}
          onClose={() => setIsScanningForFormBarcode(false)}
        />
      )}

    </div>
  );
};
