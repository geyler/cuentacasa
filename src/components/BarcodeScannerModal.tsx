'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StoreProduct, StoreSaleItem, CurrencyType, PaymentMethodType, StoreSalePaymentBreakdown } from '@/types';
import { 
  getStoreProductByBarcode, 
  getStoreProducts, 
  registerStoreSale,
  mergeSyncQRPayload,
  getCurrencySettings,
  saveCurrencySettings,
  getLoggedInUser,
  getActiveShift,
  getLocalISODate
} from '@/lib/storage';
import { syncDatabaseWithCloud } from '@/lib/sync';
import { formatCurrency, calculateMultiCurrencyTotals } from '@/lib/invoice';
import { useActionFeedback } from '@/components/ActionFeedbackProvider';
import { 
  Scan, 
  X, 
  Plus, 
  Minus, 
  Check, 
  Keyboard, 
  Camera, 
  CameraOff,
  ShoppingCart,
  Barcode,
  CheckCircle2,
  ShoppingBag, 
  Trash2, 
  Receipt, 
  Volume2, 
  PackageSearch, 
  Banknote, 
  SendHorizontal, 
  CreditCard, 
  DollarSign, 
  Split, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useLockBodyScroll } from '@/lib/useLockBodyScroll';
import { QuickProductSearchModal } from '@/components/store/QuickProductSearchModal';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCompleted?: () => void;
  currency?: string;
  initialTicketItems?: StoreSaleItem[];
}

// Web Audio API Beep Generator (100% offline, zero network delay)
const playScanBeep = () => {
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
  } catch (e) {
    // Ignore audio context autoplay restrictions if any
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSaleCompleted,
  currency = '$',
  initialTicketItems = []
}) => {
  useLockBodyScroll(isOpen, onClose);
  const { showToast, confirmAction, showActionResult } = useActionFeedback();
  const scannerContainerId = 'cuentacasa-html5-barcode-reader';
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Scanner & Currency state
  const [manualCode, setManualCode] = useState('');
  const [ticketItems, setTicketItems] = useState<StoreSaleItem[]>([]);
  const [showSuccessBadge, setShowSuccessBadge] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cameraStatus, setCameraStatus] = useState<string>('Iniciando cámara...');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [liveExchangeRate, setLiveExchangeRate] = useState<number>(320);
  const [selectedPaymentCurrency, setSelectedPaymentCurrency] = useState<'AUTO' | 'CUP' | 'USD' | 'MIXED'>('MIXED');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Checkout Modal & Payment Methods State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState<PaymentMethodType>('efectivo');

  // Inputs para cobro simple
  const [receivedCashCUP, setReceivedCashCUP] = useState<string>('');
  const [transferRef, setTransferRef] = useState<string>('');
  const [receivedCashUSD, setReceivedCashUSD] = useState<string>('');
  const [debtCustomerName, setDebtCustomerName] = useState<string>('');
  const [debtCustomerPhone, setDebtCustomerPhone] = useState<string>('');
  const [debtTypeCUP, setDebtTypeCUP] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [debtNotes, setDebtNotes] = useState<string>('');

  // Inputs para cobro mixto / split payment
  const [splitCashCUP, setSplitCashCUP] = useState<string>('');
  const [splitTransferCUP, setSplitTransferCUP] = useState<string>('');
  const [splitCashUSD, setSplitCashUSD] = useState<string>('');
  const [splitDebtCUP, setSplitDebtCUP] = useState<string>('');
  const [splitDebtUSD, setSplitDebtUSD] = useState<string>('');
  const [splitCustomerName, setSplitCustomerName] = useState<string>('');

  // Cooldown tracker to prevent duplicate scans in 1.8 seconds
  const lastScanTimeRef = useRef<number>(0);

  // Sync exchange rate & initial ticket items when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialSettings = getCurrencySettings();
      setLiveExchangeRate(initialSettings.exchangeRateUSD || 320);
      setSelectedPaymentCurrency('MIXED');
      if (initialTicketItems && initialTicketItems.length > 0) {
        setTicketItems(initialTicketItems);
      }
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsCameraActive(isMobile);
    }
  }, [isOpen, initialTicketItems]);

  const handleAddProductsFromSearch = (incomingItems: StoreSaleItem[]) => {
    let addedTotalCount = 0;
    setTicketItems(prev => {
      const updated = [...prev];
      incomingItems.forEach(newItem => {
        const idx = updated.findIndex(i => i.productId === newItem.productId || i.barcode === newItem.barcode);
        if (idx !== -1) {
          const newQty = updated[idx].quantity + newItem.quantity;
          updated[idx] = {
            ...updated[idx],
            quantity: newQty,
            subtotal: newQty * updated[idx].unitPrice
          };
        } else {
          updated.push(newItem);
        }
        addedTotalCount += newItem.quantity;
      });
      return updated;
    });

    if (addedTotalCount > 0) {
      triggerSuccessEffect(`¡${addedTotalCount} ${addedTotalCount === 1 ? 'producto agregado' : 'productos agregados'} por nombre!`);
    }
  };

  const handleDecodedBarcode = (decodedText: string) => {
    const rawStr = decodedText.trim();
    if (!rawStr) return;

    const now = Date.now();
    if (now - lastScanTimeRef.current < 800) return; // Cooldown 800ms for fast scanning
    lastScanTimeRef.current = now;

    playScanBeep();

    // Check if scanned code is a JSON payload (Cart QR or Sync QR)
    if (rawStr.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawStr);
        if (parsed.type === 'SAMY_STORE_CART_V1' && Array.isArray(parsed.items)) {
          let addedCount = 0;
          const newItems: StoreSaleItem[] = [];

          parsed.items.forEach((item: any) => {
            const prod = getStoreProductByBarcode(item.barcode) || getStoreProducts().find(p => p.id === item.productId);
            const unitPrice = item.price || (prod ? prod.price : 0);
            const costPrice = item.costPrice || (prod ? prod.costPrice : Math.round(unitPrice * 0.7));
            const qty = item.quantity || 1;

            newItems.push({
              productId: prod ? prod.id : item.productId,
              barcode: item.barcode,
              name: item.name || (prod ? prod.name : 'Producto'),
              quantity: qty,
              costPrice: costPrice,
              unitPrice: unitPrice,
              subtotal: qty * unitPrice,
              currency: item.currency || (prod ? prod.currency : 'CUP'),
              supplierType: (prod ? prod.supplierType : item.supplierType) || 'propia',
              supplierName: prod ? prod.supplierName : item.supplierName
            });
            addedCount += qty;
          });

          setTicketItems(prev => {
            const updated = [...prev];
            newItems.forEach(newItem => {
              const idx = updated.findIndex(i => i.productId === newItem.productId || i.barcode === newItem.barcode);
              if (idx !== -1) {
                const totalQty = updated[idx].quantity + newItem.quantity;
                updated[idx] = {
                  ...updated[idx],
                  quantity: totalQty,
                  subtotal: totalQty * updated[idx].unitPrice
                };
              } else {
                updated.push(newItem);
              }
            });
            return updated;
          });

          showToast({
            title: '¡Carrito Recibido por QR!',
            message: `Se cargaron ${addedCount} unidades en el ticket de cobro.`,
            type: 'success'
          });
          triggerSuccessEffect(`🛒 Carrito de ${parsed.customerName || 'Cliente'} cargado`);
          return;
        }

        if (parsed.type === 'SAMY_STORE_SYNC_V1' || parsed.type === 'SAMY_SYNC_V2') {
          const result = mergeSyncQRPayload(rawStr);
          showToast({
            title: '¡Sincronización Exitosa!',
            message: result.message,
            type: 'success'
          });
          triggerSuccessEffect(`⚡ Datos Sincronizados`);
          return;
        }
      } catch (e) {
        // Fallback to normal product barcode scan
      }
    }

    const numericOnly = rawStr.replace(/\D/g, '');
    const searchCode = (numericOnly.length > 0 && rawStr.length <= 4) ? rawStr.padStart(4, '0') : rawStr;

    const product = getStoreProductByBarcode(rawStr) || getStoreProductByBarcode(searchCode) || getStoreProductByBarcode(numericOnly);

    if (product) {
      setLastScanned(product.barcode);
      addItemToTicket(product);
    } else {
      setLastScanned(rawStr);
      showToast({
        title: 'Producto No Encontrado',
        message: `El producto con código "${rawStr}" no existe en el inventario.`,
        type: 'warning'
      });
      triggerSuccessEffect(`⚠️ Código #${rawStr} no encontrado`);
    }
  };

  const addItemToTicket = (product: StoreProduct) => {
    const allProducts = getStoreProducts();
    const liveProd = allProducts.find(p => p.id === product.id || p.barcode === product.barcode) || product;
    const availableStock = liveProd.stock || 0;

    let blocked = false;
    setTicketItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id || item.barcode === product.barcode);
      const currentQty = existingIndex !== -1 ? prev[existingIndex].quantity : 0;

      if (currentQty + 1 > availableStock) {
        blocked = true;
        return prev;
      }

      playScanBeep();

      if (existingIndex !== -1) {
        const updated = [...prev];
        const newQty = currentQty + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: newQty * updated[existingIndex].unitPrice
        };
        return updated;
      }

      return [
        ...prev,
        {
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          quantity: 1,
          costPrice: product.costPrice || Math.round(product.price * 0.7),
          unitPrice: product.price,
          subtotal: product.price,
          currency: product.currency || 'CUP',
          supplierType: product.supplierType || 'propia',
          supplierName: product.supplierName
        }
      ];
    });

    if (blocked) {
      showToast({
        title: 'Stock Insuficiente',
        message: `No puedes vender más unidades de "${product.name}". Stock disponible: ${availableStock}.`,
        type: 'error'
      });
    } else {
      triggerSuccessEffect(`¡Agregado: ${product.name}!`);
    }
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    const allProducts = getStoreProducts();
    const liveProd = allProducts.find(p => p.id === productId);
    const availableStock = liveProd ? liveProd.stock : 9999;

    let blocked = false;
    setTicketItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (delta > 0 && newQty > availableStock) {
          blocked = true;
          return item;
        }
        playScanBeep();
        return newQty > 0 ? {
          ...item,
          quantity: newQty,
          subtotal: newQty * item.unitPrice
        } : null;
      }
      return item;
    }).filter(Boolean) as StoreSaleItem[]);

    if (blocked) {
      showToast({
        title: 'Límite de Stock Alcanzado',
        message: `No hay más stock disponible para este producto. Stock actual: ${availableStock}.`,
        type: 'error'
      });
    }
  };

  const updateItemUnitPrice = (productId: string, newUnitPrice: number) => {
    setTicketItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const validPrice = Math.max(0, newUnitPrice);
        return {
          ...item,
          unitPrice: validPrice,
          subtotal: item.quantity * validPrice
        };
      }
      return item;
    }));
  };

  const updateItemSubtotal = (productId: string, newSubtotal: number) => {
    setTicketItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const validSubtotal = Math.max(0, newSubtotal);
        return {
          ...item,
          subtotal: validSubtotal,
          unitPrice: item.quantity > 0 ? Math.round(validSubtotal / item.quantity) : validSubtotal
        };
      }
      return item;
    }));
  };

  const removeItemFromTicket = (productId: string) => {
    playScanBeep();
    setTicketItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Initialize Html5Qrcode Scanner Engine (Only if camera is active)
  useEffect(() => {
    if (!isOpen || !isCameraActive) {
      stopScannerEngine();
      if (!isOpen) {
        setTicketItems([]);
      }
      return;
    }

    let isMounted = true;
    let ocrTimer: NodeJS.Timeout | null = null;

    const initEngine = async () => {
      try {
        await stopScannerEngine();

        const html5Qrcode = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.MAXICODE,
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.RSS_14,
            Html5QrcodeSupportedFormats.RSS_EXPANDED,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR
          ],
          verbose: false
        });

        html5QrcodeRef.current = html5Qrcode;

        const config = {
          fps: 20,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            return {
              width: Math.min(viewfinderWidth * 0.9, 280),
              height: Math.min(viewfinderHeight * 0.68, 140)
            };
          },
          aspectRatio: 1.777778
        };

        await html5Qrcode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isMounted) handleDecodedBarcode(decodedText);
          },
          () => {}
        );

        if (isMounted) setCameraStatus('Cámara lista para escanear.');
      } catch (err) {
        if (isMounted) {
          setCameraStatus('No se pudo acceder a la cámara trasera. Puedes ingresar código manual.');
        }
      }
    };

    const timer = setTimeout(initEngine, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScannerEngine();
    };
  }, [isOpen, isCameraActive]);

  const stopScannerEngine = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (e) {
        // Ignore stop errors
      }
      html5QrcodeRef.current = null;
    }
  };

  if (!isOpen) return null;

  const triggerSuccessEffect = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessBadge(true);
    setTimeout(() => setShowSuccessBadge(false), 1600);
  };

  const handleExchangeRateChange = (newRate: number) => {
    const validRate = Math.max(1, newRate);
    setLiveExchangeRate(validRate);
    saveCurrencySettings({ exchangeRateUSD: validRate });
  };

  const uniqueItemsCount = ticketItems.length;
  const totalUnitsCount = ticketItems.reduce((sum, item) => sum + item.quantity, 0);
  const multiTotals = calculateMultiCurrencyTotals(ticketItems, liveExchangeRate);

  const totalCostCUP = ticketItems
    .filter(item => (item.currency || 'CUP') !== 'USD')
    .reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  const totalCostUSD = ticketItems
    .filter(item => item.currency === 'USD')
    .reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  const equivalentCostCUP = totalCostCUP + (totalCostUSD * liveExchangeRate);
  const equivalentCostUSD = totalCostUSD + (totalCostCUP / (liveExchangeRate || 320));

  const handleOpenCheckout = () => {
    if (ticketItems.length === 0) {
      showToast({
        title: 'Ticket Vacío',
        message: 'Agrega al menos un producto al ticket antes de cobrar.',
        type: 'warning'
      });
      return;
    }

    if (multiTotals.isMixed) {
      setCheckoutMethod('mixto');
      setSplitCashCUP(multiTotals.totalCUP > 0 ? multiTotals.totalCUP.toString() : '');
      setSplitCashUSD(multiTotals.totalUSD > 0 ? multiTotals.totalUSD.toString() : '');
      setSplitTransferCUP('');
      setSplitDebtCUP('');
      setSplitDebtUSD('');
    } else if (multiTotals.hasUSD) {
      setCheckoutMethod('usd');
      setReceivedCashUSD(multiTotals.totalUSD.toString());
      setReceivedCashCUP('');
    } else {
      setCheckoutMethod('efectivo');
      setReceivedCashCUP(multiTotals.totalCUP.toString());
      setReceivedCashUSD('');
    }

    setTransferRef('');
    setDebtCustomerName('');
    setDebtCustomerPhone('');
    setDebtTypeCUP('efectivo');
    setDebtNotes('');
    setSplitCustomerName('');
    setIsCheckoutOpen(true);
  };

  const handleExecuteCheckout = () => {
    let finalSaleCurrency: CurrencyType = 'CUP';
    let finalTotalAmount = multiTotals.equivalentCUP;
    let finalTotalCost = Math.round(equivalentCostCUP * 100) / 100;
    let netProfit = Math.round((multiTotals.equivalentCUP - finalTotalCost) * 100) / 100;
    let totalAmountCUP: number | undefined = undefined;
    let totalAmountUSD: number | undefined = undefined;

    let breakdown: StoreSalePaymentBreakdown = {
      cashCUP: 0,
      transferCUP: 0,
      cashUSD: 0,
      debtCUP: 0,
      debtUSD: 0
    };

    if (checkoutMethod === 'efectivo') {
      const recCUP = parseFloat(receivedCashCUP) || multiTotals.equivalentCUP;
      if (recCUP < multiTotals.equivalentCUP) {
        showToast({ title: 'Monto Insuficiente', message: `El total a cobrar es $${multiTotals.equivalentCUP} CUP. Ingresaste $${recCUP} CUP.`, type: 'warning' });
        return;
      }
      finalSaleCurrency = 'CUP';
      finalTotalAmount = multiTotals.equivalentCUP;
      totalAmountCUP = multiTotals.equivalentCUP;
      breakdown.cashCUP = multiTotals.equivalentCUP;
    } else if (checkoutMethod === 'transferencia') {
      finalSaleCurrency = 'CUP';
      finalTotalAmount = multiTotals.equivalentCUP;
      totalAmountCUP = multiTotals.equivalentCUP;
      breakdown.transferCUP = multiTotals.equivalentCUP;
      breakdown.transferRef = transferRef.trim() || undefined;
    } else if (checkoutMethod === 'usd') {
      const targetUSD = Math.round((multiTotals.equivalentCUP / liveExchangeRate) * 100) / 100;
      const recUSD = parseFloat(receivedCashUSD) || targetUSD;
      if (recUSD < targetUSD) {
        showToast({ title: 'Monto Insuficiente', message: `El total a cobrar es US$${targetUSD.toFixed(2)} USD. Ingresaste US$${recUSD} USD.`, type: 'warning' });
        return;
      }
      finalSaleCurrency = 'USD';
      finalTotalAmount = targetUSD;
      finalTotalCost = Math.round(equivalentCostUSD * 100) / 100;
      netProfit = Math.round((targetUSD - finalTotalCost) * 100) / 100;
      totalAmountUSD = targetUSD;
      breakdown.cashUSD = targetUSD;
    } else if (checkoutMethod === 'fiado') {
      if (!debtCustomerName.trim()) {
        showToast({ title: 'Cliente Requerido', message: 'Debes indicar el nombre del cliente que adeuda la compra.', type: 'warning' });
        return;
      }
      if (multiTotals.hasUSD && !multiTotals.hasCUP) {
        finalSaleCurrency = 'USD';
        finalTotalAmount = multiTotals.totalUSD;
        finalTotalCost = Math.round(totalCostUSD * 100) / 100;
        netProfit = Math.round((finalTotalAmount - finalTotalCost) * 100) / 100;
        totalAmountUSD = multiTotals.totalUSD;
        breakdown.debtUSD = multiTotals.totalUSD;
      } else {
        finalSaleCurrency = 'CUP';
        finalTotalAmount = multiTotals.equivalentCUP;
        totalAmountCUP = multiTotals.equivalentCUP;
        breakdown.debtCUP = multiTotals.equivalentCUP;
      }
      breakdown.customerName = debtCustomerName.trim();
      breakdown.customerPhone = debtCustomerPhone.trim() || undefined;
      breakdown.debtTypeCUP = debtTypeCUP;
      breakdown.notes = debtNotes.trim() || undefined;
    } else if (checkoutMethod === 'mixto') {
      const cCUP = Math.max(0, parseFloat(splitCashCUP) || 0);
      const tCUP = Math.max(0, parseFloat(splitTransferCUP) || 0);
      const cUSD = Math.max(0, parseFloat(splitCashUSD) || 0);
      const dCUP = Math.max(0, parseFloat(splitDebtCUP) || 0);
      const dUSD = Math.max(0, parseFloat(splitDebtUSD) || 0);

      const totalCoveredInCUP = cCUP + tCUP + dCUP + ((cUSD + dUSD) * liveExchangeRate);
      const diff = multiTotals.equivalentCUP - totalCoveredInCUP;

      if (diff > 1) {
        showToast({
          title: 'Cobro Incompleto',
          message: `Faltan $${Math.round(diff)} CUP por cubrir en el desglose combinado.`,
          type: 'warning'
        });
        return;
      }

      if ((dCUP > 0 || dUSD > 0) && !splitCustomerName.trim()) {
        showToast({
          title: 'Nombre de Cliente Requerido',
          message: 'Hay un monto asignado a Fiado/Deuda. Indica el nombre del cliente para registrar la cuenta por cobrar.',
          type: 'warning'
        });
        return;
      }

      finalSaleCurrency = (cUSD > 0 || dUSD > 0) && (cCUP > 0 || tCUP > 0 || dCUP > 0) ? 'MIXED' : (cUSD > 0 || dUSD > 0 ? 'USD' : 'CUP');
      finalTotalAmount = multiTotals.equivalentCUP;
      totalAmountCUP = cCUP + tCUP + dCUP;
      totalAmountUSD = cUSD + dUSD;

      breakdown = {
        cashCUP: cCUP,
        transferCUP: tCUP,
        cashUSD: cUSD,
        debtCUP: dCUP,
        debtUSD: dUSD,
        customerName: (dCUP > 0 || dUSD > 0) ? splitCustomerName.trim() : undefined,
        transferRef: transferRef.trim() || undefined
      };
    }

    const todayStr = getLocalISODate();
    const loggedUser = getLoggedInUser();
    const activeShift = getActiveShift();

    const sellerId = loggedUser?.id || activeShift?.sellerId || 'usr-admin';
    const sellerUsername = loggedUser?.username || activeShift?.sellerUsername || 'admin';
    const sellerName = loggedUser?.name || activeShift?.sellerName || (loggedUser?.username ? `@${loggedUser.username}` : 'Administrador');

    registerStoreSale({
      date: todayStr,
      items: ticketItems,
      totalAmount: finalTotalAmount,
      totalAmountCUP: totalAmountCUP,
      totalAmountUSD: totalAmountUSD,
      totalCost: finalTotalCost,
      netProfit: Math.max(0, netProfit),
      currency: finalSaleCurrency,
      paymentMethod: checkoutMethod,
      paymentBreakdown: breakdown,
      sellerId,
      sellerUsername,
      sellerName
    });

    // Si se cobró en USD o Mixto, actualizar y persistir la tasa de cambio en la configuración
    if (checkoutMethod === 'usd' || checkoutMethod === 'mixto') {
      const currentSettings = getCurrencySettings();
      if (currentSettings.exchangeRateUSD !== liveExchangeRate) {
        saveCurrencySettings({
          ...currentSettings,
          exchangeRateUSD: liveExchangeRate
        });
      }
    }

    // Trigger automatic sync with Hostinger DB
    syncDatabaseWithCloud(true).catch(err => console.warn('Sale sync warning:', err));

    let methodDesc = '';
    if (checkoutMethod === 'efectivo') methodDesc = '💵 Efectivo en Caja';
    else if (checkoutMethod === 'transferencia') methodDesc = '📲 Transferencia Bancaria';
    else if (checkoutMethod === 'usd') methodDesc = '💵 Efectivo en Dólares';
    else if (checkoutMethod === 'fiado') methodDesc = `📝 Fiado a ${breakdown.customerName}`;
    else if (checkoutMethod === 'mixto') methodDesc = '🔀 Pago Combinado / Split';

    const saleTotalText = finalSaleCurrency === 'MIXED'
      ? `$${totalAmountCUP} CUP + US$${totalAmountUSD} USD`
      : formatCurrency(finalTotalAmount, finalSaleCurrency, true);

    const itemsListStr = ticketItems.map(i => `${i.name} (x${i.quantity})`).join(', ');

    setTicketItems([]);
    setIsCheckoutOpen(false);
    if (onSaleCompleted) onSaleCompleted();
    onClose();

    showActionResult({
      title: '¡Venta Cobrada y Registrada!',
      message: `Total: ${saleTotalText} • Método: ${methodDesc}`,
      type: 'success',
      details: (
        <div>
          <div><strong>Artículos:</strong> {itemsListStr}</div>
          {checkoutMethod === 'mixto' && (
            <div style={{ marginTop: '4px', fontSize: '0.8rem', opacity: 0.9 }}>
              Desglose: {breakdown.cashCUP > 0 ? `$${breakdown.cashCUP} Efvo ` : ''}
              {breakdown.transferCUP > 0 ? `$${breakdown.transferCUP} Transf ` : ''}
              {breakdown.cashUSD > 0 ? `US$${breakdown.cashUSD} USD ` : ''}
              {breakdown.debtCUP > 0 ? `Fiado $${breakdown.debtCUP} CUP ` : ''}
              {breakdown.debtUSD > 0 ? `Fiado US$${breakdown.debtUSD} USD ` : ''}
            </div>
          )}
        </div>
      )
    });
  };

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCode = manualCode.trim();
    if (rawCode) {
      const searchCode = rawCode.replace(/\D/g, '').length > 0 && rawCode.length <= 4 
        ? rawCode.padStart(4, '0') 
        : rawCode;
      
      const product = getStoreProductByBarcode(searchCode) || getStoreProductByBarcode(rawCode);

      if (product) {
        setLastScanned(product.barcode);
        addItemToTicket(product);
        setManualCode('');
      } else {
        showToast({
          title: 'Producto No Encontrado',
          message: `El producto con código "${rawCode}" no existe en el inventario.`,
          type: 'warning'
        });
        triggerSuccessEffect(`⚠️ Código #${rawCode} no existe`);
      }
    }
  };

  return (
    <div 
      className="no-print"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.70)',
        backdropFilter: 'blur(5px)',
        zIndex: 2500,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0'
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '900px',
          height: '100dvh',
          maxHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          overflow: 'hidden'
        }}
        className="pos-modal-window"
      >

        {/* POS HEADER */}
        <div style={{
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--md-sys-color-surface)',
          color: 'var(--md-sys-color-on-surface)',
          borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Scan size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 900, margin: 0, color: 'var(--md-sys-color-on-surface)', whiteSpace: 'nowrap' }}>
                Caja Registradora
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsCameraActive(prev => !prev)}
              className="md-btn md-btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isCameraActive ? <CameraOff size={15} /> : <Camera size={15} />}
              <span>{isCameraActive ? 'Ocultar Cámara' : 'Usar Cámara'}</span>
            </button>

            <button
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
              title="Cerrar POS"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* HARDWARE BARCODE GUN / KEYBOARD ACTIVE BANNER (WHEN CAMERA IS OFF) */}
        {!isCameraActive && (
          <div style={{
            padding: '10px 18px',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }} />
              <div>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                  Terminal POS Activo • Pistola Escáner & Búsqueda
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, display: 'block' }}>
                  Pasa el lector láser sobre los códigos de barras o escribe para cobrar a toda velocidad
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCameraActive(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--md-sys-color-primary)',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Camera size={14} />
              <span>¿Escanear con cámara web?</span>
            </button>
          </div>
        )}

        {/* CAMERA VIEWFINDER BOX (ONLY VISIBLE IF CAMERA IS ACTIVE) */}
        {isCameraActive && (
          <div style={{
            width: '100%',
            height: '180px',
            minHeight: '180px',
            maxHeight: '180px',
            backgroundColor: '#050505',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '2px solid var(--md-sys-color-primary)',
            flexShrink: 0
          }}>
            {/* Html5Qrcode Reader Element */}
            <div id={scannerContainerId} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />

            {/* Target Box Overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '240px',
              height: '110px',
              border: showSuccessBadge ? '2px solid #00FF88' : '2px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '14px',
              boxShadow: showSuccessBadge ? '0 0 24px rgba(0, 255, 136, 0.8)' : '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              pointerEvents: 'none',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {!showSuccessBadge && <div className="scanner-laser-line" />}
              <div style={{ position: 'absolute', top: '6px', left: '6px', width: '14px', height: '14px', borderTop: '3px solid #FF0033', borderLeft: '3px solid #FF0033', borderRadius: '3px 0 0 0' }} />
              <div style={{ position: 'absolute', top: '6px', right: '6px', width: '14px', height: '14px', borderTop: '3px solid #FF0033', borderRight: '3px solid #FF0033', borderRadius: '0 3px 0 0' }} />
              <div style={{ position: 'absolute', bottom: '6px', left: '6px', width: '14px', height: '14px', borderBottom: '3px solid #FF0033', borderLeft: '3px solid #FF0033', borderRadius: '0 0 0 3px' }} />
              <div style={{ position: 'absolute', bottom: '6px', right: '6px', width: '14px', height: '14px', borderBottom: '3px solid #FF0033', borderRight: '3px solid #FF0033', borderRadius: '0 0 3px 0' }} />
            </div>

            {/* Success Beep Badge */}
            {showSuccessBadge && (
              <div style={{
                position: 'absolute',
                top: '10px',
                backgroundColor: '#00875A',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(0, 135, 90, 0.6)',
                zIndex: 10
              }}>
                <Volume2 size={16} />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        )}

      {/* FIXED TOOLBAR BAR: SEARCH BY NAME, INPUT AND SUMAR BUTTON */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        flexShrink: 0
      }}>
        <form onSubmit={handleManualFormSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <button
            type="button"
            onClick={() => setIsQuickSearchOpen(true)}
            title="Buscar y agregar producto por nombre"
            style={{
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1.5px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <PackageSearch size={18} />
            <span>Nombre</span>
          </button>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="Escribe o escanea el código (Ej: 00968)..."
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onFocus={(e) => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 150);
            }}
            className="input-spotlight"
            style={{
              flex: 1,
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '2px solid var(--md-sys-color-primary)',
              backgroundColor: 'var(--md-sys-color-surface)',
              color: 'var(--md-sys-color-on-surface)',
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: '0.95rem',
              textAlign: 'left'
            }}
          />
          <button
            type="submit"
            className="md-btn md-btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 800,
              backgroundColor: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)',
              boxShadow: '0 2px 10px rgba(0, 99, 155, 0.3)',
              borderRadius: '12px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} />
            <span>Sumar</span>
          </button>
        </form>
      </div>

      {/* MIDDLE SECTION: SCROLLABLE TICKET LIST (Independent scroll without pushing top/bottom) */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '10px 14px',
        backgroundColor: 'var(--md-sys-color-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        
        {/* Ticket Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Receipt size={16} color="var(--md-sys-color-primary)" />
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800 }}>Ticket de Venta (Editable)</h3>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {uniqueItemsCount} Ítems • {totalUnitsCount} Unidades
          </span>
        </div>

        {/* Ticket Items List */}
        {ticketItems.length === 0 ? (
          <div style={{
            padding: '36px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            margin: 'auto 0'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--md-sys-color-primary)'
            }}>
              <ShoppingCart size={30} />
            </div>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 4px 0' }}>Ticket de Venta Vacío</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', maxWidth: '340px', margin: '0 auto', lineHeight: '1.4' }}>
                Pasa la pistola lectora sobre los productos o haz clic en "Nombre" para buscar en el catálogo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsQuickSearchOpen(true)}
              className="md-btn md-btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', borderRadius: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <PackageSearch size={16} />
              <span>Buscar en Catálogo</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ticketItems.map(item => (
              <div
                key={item.productId}
                className="md-card"
                style={{
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {/* Item Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', backgroundColor: 'var(--md-sys-color-surface-container-high)', border: '1px solid var(--md-sys-color-outline-variant)', padding: '1px 5px', borderRadius: '5px' }}>
                      #{item.barcode}
                    </span>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h4>
                    <span style={{
                      fontSize: '0.66rem',
                      fontWeight: 900,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: (item.currency || 'CUP') === 'USD' ? '#ECFEFF' : '#E6F4EA',
                      color: (item.currency || 'CUP') === 'USD' ? '#0F766E' : '#137333',
                      border: (item.currency || 'CUP') === 'USD' ? '1px solid #99F6E4' : '1px solid #A8DADC'
                    }}>
                      {item.currency || 'CUP'}
                    </span>
                    {item.supplierType === 'proveedor' && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--md-sys-color-expense)', backgroundColor: 'var(--md-sys-color-expense-container)', padding: '1px 4px', borderRadius: '3px' }}>
                        {item.supplierName || 'Proveedor'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => removeItemFromTicket(item.productId)}
                    style={{ background: 'none', border: 'none', color: 'var(--md-sys-color-expense)', cursor: 'pointer', padding: '2px', marginLeft: '6px' }}
                    title="Eliminar ítem"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Editable Quantity, Unit Price and Subtotal Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '6px', alignItems: 'center' }}>
                  
                  {/* Quantity Stepper */}
                  <div>
                    <label style={{ fontSize: '0.62rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                      Cant:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <button
                        onClick={() => updateItemQuantity(item.productId, -1)}
                        style={{ width: '22px', height: '22px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--md-sys-color-surface-container-high)', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        -
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '0.8rem', minWidth: '16px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQuantity(item.productId, 1)}
                        style={{ width: '22px', height: '22px', borderRadius: '5px', border: 'none', backgroundColor: 'var(--md-sys-color-primary)', color: '#FFF', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Unit Price Editable */}
                  <div>
                    <label style={{ fontSize: '0.62rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                      Precio ({item.currency || 'CUP'}):
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={item.unitPrice}
                      onChange={e => updateItemUnitPrice(item.productId, parseFloat(e.target.value) || 0)}
                      className="input-spotlight"
                      style={{
                        width: '100%',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        fontWeight: 800,
                        fontSize: '0.78rem'
                      }}
                    />
                  </div>

                  {/* Subtotal Editable */}
                  <div>
                    <label style={{ fontSize: '0.62rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 700, display: 'block' }}>
                      Subtotal ({item.currency || 'CUP'}):
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={item.subtotal}
                      onChange={e => updateItemSubtotal(item.productId, parseFloat(e.target.value) || 0)}
                      className="input-spotlight"
                      style={{
                        width: '100%',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: (item.currency || 'CUP') === 'USD' ? '#ECFEFF' : 'var(--md-sys-color-income-container)',
                        color: (item.currency || 'CUP') === 'USD' ? '#0F766E' : 'var(--md-sys-color-income)',
                        fontWeight: 800,
                        fontSize: '0.78rem'
                      }}
                    />
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* FIXED BOTTOM SECTION: SUMMARY + CONFIRM ACTION BUTTON (LOCKED AT BOTTOM) */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: 'var(--md-sys-color-surface-container)',
        borderTop: '1px solid var(--md-sys-color-outline-variant)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0
      }}>
        {/* Factura / Ticket Summary Box */}
        {ticketItems.length > 0 && (
          <div style={{
            backgroundColor: 'var(--md-sys-color-income-container)',
            color: 'var(--md-sys-color-on-income-container)',
            padding: '10px 14px',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(0, 135, 90, 0.2)'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, display: 'block', letterSpacing: '0.04em' }}>TOTAL COBRADO</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 700, display: 'block' }}>
                {totalUnitsCount} {totalUnitsCount === 1 ? 'artículo en ticket' : 'artículos en ticket'}
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '1.45rem',
                fontWeight: 900,
                color: 'var(--md-sys-color-income)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {multiTotals.hasUSD && !multiTotals.hasCUP
                  ? formatCurrency(multiTotals.totalUSD, 'USD', true)
                  : formatCurrency(multiTotals.equivalentCUP, 'CUP', true)}
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleOpenCheckout}
            disabled={ticketItems.length === 0}
            className="md-btn md-btn-primary"
            style={{
              flex: 1,
              padding: '12px 14px',
              fontSize: '0.92rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: ticketItems.length === 0 ? 0.5 : 1
            }}
          >
            <Banknote size={19} />
            <span>Cobrar (${multiTotals.equivalentCUP.toLocaleString('es-ES')} CUP)</span>
          </button>

          <button
            onClick={onClose}
            className="md-btn md-btn-secondary"
            style={{ padding: '10px 14px', fontSize: '0.82rem' }}
          >
            <span>Cerrar</span>
          </button>
        </div>
      </div>

      </div>

      <QuickProductSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onAddProductsToTicket={handleAddProductsFromSearch}
        currency={currency}
      />

      {/* MODAL DE COBRO PROFESIONAL (EFECTIVO, TRANSFERENCIA, DÓLARES, FIADO Y MIXTO) */}
      {isCheckoutOpen && (
        <div
          className="modal-backdrop-responsive"
          onClick={() => setIsCheckoutOpen(false)}
          style={{ zIndex: 3000 }}
        >
          <div
            className="bottom-sheet-modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              maxHeight: '94dvh',
              backgroundColor: 'var(--md-sys-color-surface-container)',
              padding: '20px 24px 28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
                  Caja & Cobro de Venta
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                  {totalUnitsCount} {totalUnitsCount === 1 ? 'artículo en ticket' : 'artículos en ticket'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Total Requerido Banner */}
            <div style={{
              backgroundColor: 'var(--md-sys-color-surface)',
              borderRadius: '16px',
              border: '2px solid var(--brand-primary, #1A73E8)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
                  Total a Cobrar
                </span>
                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-primary-dark, #1E3A8A)' }}>
                  ${multiTotals.equivalentCUP.toLocaleString('es-ES')} <span style={{ fontSize: '0.85rem' }}>CUP</span>
                </div>
              </div>

              {(multiTotals.hasUSD || multiTotals.isMixed) && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Desglose Original
                  </span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--brand-secondary-dark, #115E59)' }}>
                    ${multiTotals.totalCUP.toLocaleString('es-ES')} CUP + US${multiTotals.totalUSD.toLocaleString('es-ES')} USD
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                    Tasa: 1 USD = {liveExchangeRate} CUP
                  </span>
                </div>
              )}
            </div>

            {/* Métodos de Cobro Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
                Selecciona la Forma de Pago
              </span>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))',
                gap: '6px'
              }}>
                {[
                  { id: 'efectivo', label: 'Efectivo CUP', icon: <Banknote size={15} /> },
                  { id: 'transferencia', label: 'Transferencia', icon: <SendHorizontal size={15} /> },
                  { id: 'usd', label: 'Dólares USD', icon: <DollarSign size={15} /> },
                  { id: 'fiado', label: 'Fiado / Deuda', icon: <CreditCard size={15} /> },
                  { id: 'mixto', label: 'Combinado', icon: <Split size={15} /> },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCheckoutMethod(m.id as PaymentMethodType)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '12px',
                      border: checkoutMethod === m.id ? '2px solid var(--brand-primary, #1A73E8)' : '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: checkoutMethod === m.id ? 'var(--brand-primary-light, #EFF6FF)' : 'var(--md-sys-color-surface)',
                      color: checkoutMethod === m.id ? 'var(--brand-primary-dark, #1E3A8A)' : 'var(--md-sys-color-on-surface)',
                      fontWeight: checkoutMethod === m.id ? 900 : 700,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VISTA 1: EFECTIVO CUP */}
            {checkoutMethod === 'efectivo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                    Monto Entregado por el Cliente en Efectivo ($ CUP)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Monto entregado"
                    value={receivedCashCUP}
                    onChange={e => setReceivedCashCUP(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '1.1rem',
                      fontWeight: 900
                    }}
                  />
                </div>

                {/* Botones de billetes rápidos */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setReceivedCashCUP(multiTotals.equivalentCUP.toString())}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Exacto (${multiTotals.equivalentCUP})
                  </button>
                  {[500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setReceivedCashCUP(amt.toString())}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                {/* Cálculo de Vuelto */}
                {parseFloat(receivedCashCUP) >= multiTotals.equivalentCUP && (
                  <div style={{
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem'
                  }}>
                    <span>Vuelto / Cambio a Devolver:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                      ${(parseFloat(receivedCashCUP) - multiTotals.equivalentCUP).toLocaleString('es-ES')} CUP
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* VISTA 2: TRANSFERENCIA BANCARIA */}
            {checkoutMethod === 'transferencia' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#1E40AF'
                }}>
                  <SendHorizontal size={24} />
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    El cliente transfiere exactamente <strong>${multiTotals.equivalentCUP.toLocaleString('es-ES')} CUP</strong> por Transfermóvil o EnZona.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                    Referencia / Teléfono de Confirmación (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. #548923 o +53 52000000"
                    value={transferRef}
                    onChange={e => setTransferRef(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            )}

            {/* VISTA 3: DÓLARES USD */}
            {checkoutMethod === 'usd' && (() => {
              const targetUSD = Math.round((multiTotals.equivalentCUP / liveExchangeRate) * 100) / 100;
              const recUSD = parseFloat(receivedCashUSD) || 0;
              const vueltoUSD = Math.max(0, recUSD - targetUSD);
              const vueltoCUP = Math.round(vueltoUSD * liveExchangeRate);

              return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* WIDGET PROMINENTE DE TASA DE CAMBIO */}
                <div style={{
                  backgroundColor: 'var(--md-sys-color-surface)',
                  border: '1.5px solid #0D9488',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0F766E' }}>
                      💵 Tasa de Cambio (elTOQUE / Mercado)
                    </span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                      Actualiza al instante
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>1 USD =</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={liveExchangeRate}
                      onChange={e => handleExchangeRateChange(parseFloat(e.target.value) || 1)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '2px solid #0D9488',
                        backgroundColor: 'var(--md-sys-color-surface-container)',
                        color: '#0F766E',
                        fontSize: '1.2rem',
                        fontWeight: 900,
                        textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>CUP</span>
                  </div>

                  {/* Cálculo en Dólares a la Tasa */}
                  <div style={{
                    backgroundColor: '#F0FDFA',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #CCFBF1'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.66rem', color: '#0F766E', fontWeight: 700, display: 'block' }}>
                        TOTAL A COBRAR EN USD:
                      </span>
                      <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F766E' }}>
                        US$ {targetUSD.toFixed(2)} USD
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.66rem', color: '#64748B', display: 'block' }}>
                        Cuenta en CUP:
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                        ${multiTotals.equivalentCUP.toLocaleString('es-ES')} CUP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Monto entregado por el cliente */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                    Monto Entregado por el Cliente en Dólares (US$ USD)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Monto en USD"
                    value={receivedCashUSD}
                    onChange={e => setReceivedCashUSD(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '1.1rem',
                      fontWeight: 900
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setReceivedCashUSD(targetUSD.toFixed(2))}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid #0D9488',
                      backgroundColor: '#F0FDFA',
                      color: '#0F766E',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Exacto (US${targetUSD.toFixed(2)})
                  </button>
                  {[5, 10, 20, 50, 100].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setReceivedCashUSD(amt.toString())}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      US${amt}
                    </button>
                  ))}
                </div>

                {recUSD >= targetUSD && (
                  <div style={{
                    backgroundColor: '#CCFBF1',
                    color: '#0F766E',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 800,
                    fontSize: '0.88rem'
                  }}>
                    <div>
                      <span>Vuelto a Devolver:</span>
                      {vueltoCUP > 0 && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#115E59', fontWeight: 700 }}>
                          O en CUP: ${vueltoCUP.toLocaleString('es-ES')} CUP
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                      US${vueltoUSD.toFixed(2)} USD
                    </span>
                  </div>
                )}
              </div>
              );
            })()}

            {/* VISTA 4: FIADO / A DEBER */}
            {checkoutMethod === 'fiado' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: '#991B1B',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}>
                  ⚠️ Esta venta se registrará a crédito y se creará una cuenta por cobrar en el módulo de Fiados.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                    Nombre del Cliente / Deudor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez (Vecino)"
                    value={debtCustomerName}
                    onChange={e => setDebtCustomerName(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--brand-primary, #1A73E8)',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      color: 'var(--md-sys-color-on-surface)',
                      fontSize: '0.95rem',
                      fontWeight: 700
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                      Teléfono (Opcional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+53 5xxxxxxx"
                      value={debtCustomerPhone}
                      onChange={e => setDebtCustomerPhone(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                      ¿Cómo abonará a futuro?
                    </label>
                    <select
                      value={debtTypeCUP}
                      onChange={e => setDebtTypeCUP(e.target.value as any)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        backgroundColor: 'var(--md-sys-color-surface)',
                        color: 'var(--md-sys-color-on-surface)',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    >
                      <option value="efectivo">💵 En Efectivo</option>
                      <option value="transferencia">📲 Por Transferencia</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)' }}>
                    Observaciones / Notas (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Prometió pagar el próximo viernes al cobrar"
                    value={debtNotes}
                    onChange={e => setDebtNotes(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      backgroundColor: 'var(--md-sys-color-surface)',
                      fontSize: '0.84rem'
                    }}
                  />
                </div>
              </div>
            )}

            {/* VISTA 5: COBRO MIXTO / COMBINADO (SPLIT PAYMENT) */}
            {checkoutMethod === 'mixto' && (() => {
              const cCUP = Math.max(0, parseFloat(splitCashCUP) || 0);
              const tCUP = Math.max(0, parseFloat(splitTransferCUP) || 0);
              const cUSD = Math.max(0, parseFloat(splitCashUSD) || 0);
              const dCUP = Math.max(0, parseFloat(splitDebtCUP) || 0);
              const dUSD = Math.max(0, parseFloat(splitDebtUSD) || 0);

              const totalCoveredInCUP = cCUP + tCUP + dCUP + ((cUSD + dUSD) * liveExchangeRate);
              const diff = multiTotals.equivalentCUP - totalCoveredInCUP;
              const hasDebt = dCUP > 0 || dUSD > 0;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600 }}>
                    Distribuye el cobro entre efectivo, transferencias bancarias, dólares y fiado:
                  </span>

                  {/* WIDGET DE TASA DE CAMBIO PARA EL COBRO COMBINADO */}
                  <div style={{
                    backgroundColor: 'var(--md-sys-color-surface)',
                    border: '1.5px solid #0D9488',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0F766E' }}>
                        💵 Tasa para conversión de USD:
                      </span>
                      <span style={{ fontSize: '0.66rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Afecta el monto en dólares del cobro mixto
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>1 USD =</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={liveExchangeRate}
                        onChange={e => handleExchangeRateChange(parseFloat(e.target.value) || 1)}
                        style={{
                          width: '70px',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          border: '2px solid #0D9488',
                          backgroundColor: 'var(--md-sys-color-surface-container)',
                          color: '#0F766E',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>CUP</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857' }}>
                        💵 Efectivo CUP
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={splitCashCUP}
                        onChange={e => setSplitCashCUP(e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #10B981',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          fontWeight: 800,
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1D4ED8' }}>
                        📲 Transferencia CUP
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={splitTransferCUP}
                        onChange={e => setSplitTransferCUP(e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #3B82F6',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          fontWeight: 800,
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F766E' }}>
                        💵 Efectivo USD (US$)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={splitCashUSD}
                        onChange={e => setSplitCashUSD(e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #14B8A6',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          fontWeight: 800,
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#DC2626' }}>
                        📝 Fiado / A Deber CUP
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={splitDebtCUP}
                        onChange={e => setSplitDebtCUP(e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #EF4444',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          fontWeight: 800,
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Campo de Cliente si hay monto en Fiado */}
                  {hasDebt && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#DC2626' }}>
                        Nombre del Cliente Deudor (Requerido por haber fiado) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Carlos Martínez"
                        value={splitCustomerName}
                        onChange={e => setSplitCustomerName(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1.5px solid #EF4444',
                          backgroundColor: 'var(--md-sys-color-surface)',
                          fontWeight: 700,
                          fontSize: '0.88rem'
                        }}
                      />
                    </div>
                  )}

                  {/* Estado del balance combinado */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: diff > 1 ? '#FEF2F2' : '#F0FDF4',
                    border: diff > 1 ? '1px solid #FECACA' : '1px solid #BBF7D0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--md-sys-color-on-surface-variant)' }}>
                        Cubierto: ${Math.round(totalCoveredInCUP).toLocaleString('es-ES')} de ${multiTotals.equivalentCUP.toLocaleString('es-ES')} CUP
                      </span>
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        color: diff > 1 ? '#DC2626' : '#16A34A'
                      }}>
                        {diff > 1
                          ? `Faltan $${Math.round(diff).toLocaleString('es-ES')} CUP`
                          : diff < -1
                            ? `Vuelto: $${Math.abs(Math.round(diff)).toLocaleString('es-ES')} CUP`
                            : '✓ Total Cubierto Exacto'}
                      </span>
                    </div>

                    {/* Botones de autocompletar si falta */}
                    {diff > 1 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setSplitTransferCUP((tCUP + diff).toString())}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #3B82F6',
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          + Asignar resto a Transferencia
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitDebtCUP((dCUP + diff).toString())}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #EF4444',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          + Asignar resto a Fiado
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitCashCUP((cCUP + diff).toString())}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #10B981',
                            backgroundColor: '#ECFDF5',
                            color: '#047857',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          + Asignar resto a Efectivo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Botones de Acción Final */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  backgroundColor: 'transparent',
                  color: 'var(--md-sys-color-on-surface)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Volver al Ticket
              </button>

              <button
                type="button"
                onClick={handleExecuteCheckout}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: 'var(--brand-primary, #1A73E8)',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(26, 115, 232, 0.3)'
                }}
              >
                <Check size={18} />
                <span>Confirmar Cobro</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
