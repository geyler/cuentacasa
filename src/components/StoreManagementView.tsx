'use client';

import React, { useState } from 'react';
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
  saveStoreWhatsappNumber
} from '@/lib/storage';
import { formatCurrency } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { TransferModal } from '@/components/TransferModal';
import { AppInput } from '@/components/common/AppInput';
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
}

export const StoreManagementView: React.FC<StoreManagementViewProps> = ({
  currency = '$',
  onOpenScanner
}) => {
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
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  // Form State
  const [barcode, setBarcode] = useState('0005');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [published, setPublished] = useState(true);
  const [supplierType, setSupplierType] = useState<SupplierType>('propia');
  const [supplierName, setSupplierName] = useState('Maikel');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // External / Affiliate Product Fields
  const [isExternal, setIsExternal] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');

  // Store WhatsApp Target Setting
  const [storeWhatsappNumber, setStoreWhatsappNumberState] = useState('');

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
    setStock(10);
    setDescription('');
    setPhotoUrl('');
    setPublished(true);
    setSupplierType('propia');
    setSupplierName('Maikel');
    setFundingSource('negocio');
    setIsExternal(false);
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

    const savedProd = saveStoreProduct({
      barcode: barcode.padStart(4, '0'),
      name: name.trim(),
      costPrice: numericCost,
      price: Number(price),
      category: category.trim() || 'General',
      stock: Number(stock) || 0,
      description: description.trim(),
      photoUrl: photoUrl || undefined,
      published,
      salesCount: editingProduct ? editingProduct.salesCount : 0,
      supplierType: effectiveSupplierType,
      supplierName: effectiveSupplierName,
      isExternal,
      externalUrl: isExternal ? externalUrl.trim() : undefined
    });

    // If new product funded by Casa, log dual transaction for the merchandise investment
    if (!editingProduct && fundingSource === 'casa' && savedProd.stock > 0 && numericCost > 0) {
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
      title: `¿Eliminar a ${sup.name}?`,
      message: `Esta acción quitará a ${sup.name} del listado de proveedores.`,
      variant: 'danger',
      confirmText: 'Eliminar',
      onConfirm: () => {
        const res = deleteSupplierAccount(sup.id);
        if (res.success) {
          refreshData();
          showActionResult({ title: 'Proveedor Eliminado', message: `"${sup.name}" fue removido del sistema.`, type: 'info' });
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
        background: 'linear-gradient(135deg, var(--md-sys-color-primary) 0%, #00385E 100%)',
        color: '#FFFFFF',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Store size={22} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Inventario y Cuentas de Tienda</h2>
          </div>
          <p style={{ fontSize: '0.8rem', opacity: 0.85 }}>
            Separación de Fondos: El margen de ganancias se envía a CuentaCasa y el costo permanece en el Fondo Tienda / Proveedores.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '320px' }}>
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="md-btn"
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.25)',
                color: '#FFFFFF',
                fontSize: '0.92rem',
                fontWeight: 800,
                padding: '12px 16px',
                border: '1px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(4px)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Scan size={20} />
              <span>Vender</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="md-btn"
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              color: 'var(--md-sys-color-primary)',
              fontSize: '0.92rem',
              fontWeight: 800,
              padding: '12px 16px',
              borderRadius: '16px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Plus size={20} />
            <span>Publicar</span>
          </button>
        </div>
      </div>

      {/* Dual Funds Accounting Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        
        {/* House Net Profit */}
        <div className="md-card" style={{ padding: '14px 16px', backgroundColor: 'var(--md-sys-color-income-container)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--md-sys-color-on-income-container)', display: 'block' }}>
            Ganancias a CuentaCasa
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--md-sys-color-income)' }}>
            +{formatCurrency(totalHouseProfit, currency, true)}
          </span>
          <span style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block', marginTop: '2px' }}>
            Transferido al balance general
          </span>
        </div>

        {/* Store Fund (Caja Chica) */}
        <div className="md-card" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
            Fondo Recaudado Tienda
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
            {formatCurrency(totalStoreFund, currency, true)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
            Dinero para reposición propia
          </span>
        </div>

        {/* Supplier Debts */}
        <div className="md-card" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
            Por Pagar a Proveedores
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--md-sys-color-expense)' }}>
            {formatCurrency(totalPendingSupplierDebt, currency, true)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
            Maikel, Carlos, etc.
          </span>
        </div>

        {/* Total Stock Capital */}
        <div className="md-card" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
            Capital en Almacén
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
            {formatCurrency(totalCostValueInStock, currency, true)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block', marginTop: '2px' }}>
            {totalStockUnits} unidades en existencia
          </span>
        </div>

      </div>

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
                target="_blank"
                rel="noopener noreferrer"
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
                <ExternalLink size={14} />
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
                      <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                        Costo: ${prod.costPrice || 0}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={e => e.stopPropagation()}>
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
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TAB 2: PROVEEDORES MANAGEMENT */}
      {activeSubTab === 'suppliers' && (
        <div className="md-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--md-sys-color-primary)" />
                <span>Control de Proveedores (Consignación)</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                Gestiona las cuentas por pagar a proveedores de mercancía en consignación (ej. Maikel, Carlos).
              </p>
            </div>

            <button
              onClick={() => setIsAddSupplierModalOpen(true)}
              className="md-btn md-btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <UserPlus size={16} />
              <span>+ Nuevo Proveedor</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {suppliers.map(sup => (
              <div
                key={sup.id}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'var(--md-sys-color-surface-container)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                      {sup.name}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                      ID Proveedor: #{sup.id.slice(-6)}
                    </span>
                  </div>

                  {sup.pendingPayout <= 0 && (
                    <button
                      onClick={() => handleDeleteSupplierAccount(sup)}
                      title="Eliminar proveedor sin deuda"
                      style={{ border: 'none', background: 'none', color: 'var(--md-sys-color-expense)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--md-sys-color-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                      Deuda Pendiente:
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: sup.pendingPayout > 0 ? 'var(--md-sys-color-expense)' : 'var(--md-sys-color-income)' }}>
                      ${sup.pendingPayout}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', display: 'block' }}>
                      Total Liquidado:
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                      ${sup.totalPaid}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenPayout(sup)}
                  disabled={sup.pendingPayout <= 0}
                  className="md-btn md-btn-primary"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    opacity: sup.pendingPayout <= 0 ? 0.4 : 1,
                    cursor: sup.pendingPayout <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <DollarSign size={16} />
                  <span>Liquidar Pago en Efectivo</span>
                </button>
              </div>
            ))}
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
              opacity: focusedField !== null ? 0.35 : 1,
              filter: focusedField !== null ? 'blur(3px)' : 'none',
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

            {/* Supplier Name Input if Consignment */}
            {fundingSource === 'proveedor' && (
              <AppInput
                label="Nombre del Proveedor (Consignación) *"
                placeholder="Maikel, Carlos..."
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                focusedField={focusedField}
                fieldName="supplierName"
                onFocus={() => setFocusedField('supplierName')}
                required
              />
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

            {/* Category Select & Auto-generated Barcode Tag */}
            <div style={{
              opacity: focusedField !== null && focusedField !== 'category' && focusedField !== 'newCategory' ? 0.35 : 1,
              filter: focusedField !== null && focusedField !== 'category' && focusedField !== 'newCategory' ? 'blur(3px)' : 'none',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  Categoría del Producto *
                </label>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--md-sys-color-primary-container)',
                  color: 'var(--md-sys-color-on-primary-container)',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  fontWeight: 800
                }}>
                  <Tag size={13} />
                  <span>Código: #{barcode}</span>
                </div>
              </div>

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
                  opacity: focusedField !== null ? 0.35 : 1,
                  filter: focusedField !== null ? 'blur(3px)' : 'none',
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
              placeholder="10"
              value={stock}
              onChange={e => setStock(parseInt(e.target.value, 10) || 0)}
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
              gap: '8px',
              opacity: focusedField !== null && focusedField !== 'externalUrl' ? 0.35 : 1,
              filter: focusedField !== null && focusedField !== 'externalUrl' ? 'blur(3px)' : 'none',
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
                <AppInput
                  label="Enlace Externo o WhatsApp *"
                  placeholder="https://wa.me/5351234567 o https://..."
                  value={externalUrl}
                  onChange={e => setExternalUrl(e.target.value)}
                  focusedField={focusedField}
                  fieldName="externalUrl"
                  onFocus={() => setFocusedField('externalUrl')}
                  required={isExternal}
                />
              )}
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
              opacity: focusedField !== null ? 0.35 : 1,
              filter: focusedField !== null ? 'blur(3px)' : 'none',
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
              opacity: focusedField !== null ? 0.35 : 1,
              filter: focusedField !== null ? 'blur(3px)' : 'none',
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                className="md-btn md-btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  fontSize: '1rem', 
                  fontWeight: 800,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Check size={20} />
                <span>{editingProduct ? 'Guardar Cambios del Producto' : 'Guardar Producto en Inventario'}</span>
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
        onDeleteProduct={(id, name) => {
          setSelectedProductForDetailModal(null);
          handleDelete(id, name);
        }}
        allProducts={products}
        currency={currency}
        isAdmin={true}
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

    </div>
  );
};
