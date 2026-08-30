import { Transaction, ReportFilter, FinancialSummary, CurrencyType } from '@/types';

// 5 minutes editable window check (5 * 60 * 1000 ms)
export const EDITABLE_WINDOW_MS = 5 * 60 * 1000;

export function isTransactionEditable(createdAt?: number): boolean {
  if (!createdAt) return false;
  return (Date.now() - createdAt) <= EDITABLE_WINDOW_MS;
}

export function getRemainingEditableTime(createdAt?: number): string | null {
  if (!createdAt) return null;
  const elapsed = Date.now() - createdAt;
  const remainingMs = EDITABLE_WINDOW_MS - elapsed;
  if (remainingMs <= 0) return null;
  const remainingSecs = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(remainingSecs / 60);
  const secs = remainingSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Filter transactions by period
export function filterTransactionsByPeriod(transactions: Transaction[], filter: ReportFilter): Transaction[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  return transactions.filter(tx => {
    const txDate = new Date(tx.date + 'T00:00:00');
    
    if (filter.category && filter.category !== 'todas' && tx.category !== filter.category) {
      return false;
    }

    switch (filter.period) {
      case 'hoy': {
        return tx.date === todayStr;
      }
      case '7dias': {
        const past7 = new Date(now.getTime() - 7 * 86400 * 1000);
        past7.setHours(0, 0, 0, 0);
        return txDate >= past7;
      }
      case '15dias': {
        const past15 = new Date(now.getTime() - 15 * 86400 * 1000);
        past15.setHours(0, 0, 0, 0);
        return txDate >= past15;
      }
      case '28dias': {
        const past28 = new Date(now.getTime() - 28 * 86400 * 1000);
        past28.setHours(0, 0, 0, 0);
        return txDate >= past28;
      }
      case '90dias': {
        const past90 = new Date(now.getTime() - 90 * 86400 * 1000);
        past90.setHours(0, 0, 0, 0);
        return txDate >= past90;
      }
      case 'personalizado': {
        if (!filter.startDate && !filter.endDate) return true;
        let valid = true;
        if (filter.startDate) {
          const s = new Date(filter.startDate + 'T00:00:00');
          valid = valid && txDate >= s;
        }
        if (filter.endDate) {
          const e = new Date(filter.endDate + 'T23:59:59');
          valid = valid && txDate <= e;
        }
        return valid;
      }
      default:
        return true;
    }
  });
}

// Calculate summary totals for both CUP and USD
export function calculateFinancialSummary(transactions: Transaction[]): FinancialSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalIncomeUSD = 0;
  let totalExpenseUSD = 0;
  const categoryBreakdown: { [cat: string]: number } = {};

  transactions.forEach(tx => {
    const isUSD = tx.currency === 'USD';
    if (tx.type === 'ingreso') {
      if (isUSD) {
        totalIncomeUSD += tx.amount;
      } else {
        totalIncome += tx.amount;
      }
    } else {
      if (isUSD) {
        totalExpenseUSD += tx.amount;
      } else {
        totalExpense += tx.amount;
        categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amount;
      }
    }
  });

  const netBalance = totalIncome - totalExpense;
  const netBalanceUSD = totalIncomeUSD - totalExpenseUSD;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    totalIncomeUSD,
    totalExpenseUSD,
    netBalanceUSD,
    savingsRate,
    transactionCount: transactions.length,
    categoryBreakdown
  };
}

// Format period subtitle
export function getPeriodLabel(filter: ReportFilter): string {
  switch (filter.period) {
    case 'hoy':
      return 'Hoy';
    case '7dias':
      return 'Últimos 7 días';
    case '15dias':
      return 'Últimos 15 días';
    case '28dias':
      return 'Últimos 28 días';
    case '90dias':
      return 'Últimos 90 días';
    case 'personalizado':
      if (filter.startDate && filter.endDate) {
        return `Rango del ${filter.startDate} al ${filter.endDate}`;
      } else if (filter.startDate) {
        return `Desde el ${filter.startDate}`;
      } else if (filter.endDate) {
        return `Hasta el ${filter.endDate}`;
      }
      return 'Periodo Personalizado';
    default:
      return 'Reporte General';
  }
}

// Format currency with privacy masking support
export function formatCurrency(amount: number, currency: string = '$', showBalance: boolean = true): string {
  if (!showBalance) {
    return `••••••`;
  }
  const isUSD = currency === 'USD' || currency === 'US$' || currency === 'USD$';
  const val = Number(amount) || 0;
  const formatted = val.toLocaleString('es-ES', { 
    minimumFractionDigits: val % 1 !== 0 ? 2 : 0, 
    maximumFractionDigits: 2 
  });
  
  if (isUSD) {
    return `US$ ${formatted}`;
  }
  const symbol = (currency === 'CUP' || currency === '$') ? '$' : currency;
  return `${symbol} ${formatted}`;
}

// Helper for product price display according to currencyMode
export function getProductDisplayPrice(
  productPrice: number,
  productCurrency: 'CUP' | 'USD' | string | undefined,
  currencyMode: 'CUP' | 'USD' | 'BOTH',
  exchangeRateUSD: number = 320
): { amount: number; currency: 'CUP' | 'USD' } {
  const pCurr = productCurrency === 'USD' ? 'USD' : 'CUP';

  if (currencyMode === 'CUP') {
    if (pCurr === 'USD') {
      return { amount: Math.round(productPrice * exchangeRateUSD * 100) / 100, currency: 'CUP' };
    }
    return { amount: productPrice, currency: 'CUP' };
  }

  if (currencyMode === 'USD') {
    if (pCurr === 'CUP') {
      return { amount: Math.round((productPrice / exchangeRateUSD) * 100) / 100, currency: 'USD' };
    }
    return { amount: productPrice, currency: 'USD' };
  }

  return { amount: productPrice, currency: pCurr };
}

// Visual styling badge helper for USD distinction
export function getCurrencyBadgeStyle(currency?: string) {
  const isUSD = currency === 'USD' || currency === 'US$' || currency === 'USD$';
  if (isUSD) {
    return {
      isUSD: true,
      backgroundColor: '#ECFEFF', // Subtle teal / cyan background
      color: '#0F766E',           // Dark teal text
      border: '1px solid #99F6E4',
      badgeText: 'USD$'
    };
  }
  return {
    isUSD: false,
    backgroundColor: 'var(--md-sys-color-surface-container-high)',
    color: 'var(--md-sys-color-on-surface-variant)',
    border: '1px solid var(--md-sys-color-outline-variant)',
    badgeText: 'CUP$'
  };
}

export interface MultiCurrencyTotals {
  totalCUP: number;
  totalUSD: number;
  hasCUP: boolean;
  hasUSD: boolean;
  isMixed: boolean;
  equivalentCUP: number;
  equivalentUSD: number;
  exchangeRateUSD: number;
}

export function calculateMultiCurrencyTotals(
  items: any[],
  exchangeRateUSD: number = 320
): MultiCurrencyTotals {
  let totalCUP = 0;
  let totalUSD = 0;

  items.forEach(item => {
    const qty = item.quantity || 1;
    const curr = item.currency || item.product?.currency || 'CUP';
    const unitP = item.unitPrice !== undefined ? item.unitPrice : (item.price !== undefined ? item.price : (item.product?.price || 0));
    const sub = item.subtotal !== undefined ? item.subtotal : (unitP * qty);

    if (curr === 'USD') {
      totalUSD += sub;
    } else {
      totalCUP += sub;
    }
  });

  const hasCUP = totalCUP > 0;
  const hasUSD = totalUSD > 0;
  const isMixed = hasCUP && hasUSD;
  const rate = exchangeRateUSD || 320;
  const equivalentCUP = Math.round((totalCUP + (totalUSD * rate)) * 100) / 100;
  const equivalentUSD = Math.round((totalUSD + (rate > 0 ? totalCUP / rate : 0)) * 100) / 100;

  return {
    totalCUP: Math.round(totalCUP * 100) / 100,
    totalUSD: Math.round(totalUSD * 100) / 100,
    hasCUP,
    hasUSD,
    isMixed,
    equivalentCUP,
    equivalentUSD,
    exchangeRateUSD: rate
  };
}
