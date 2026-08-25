import { Transaction, ReportFilter, FinancialSummary, ReportPeriod } from '@/types';

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

// Calculate summary totals
export function calculateFinancialSummary(transactions: Transaction[]): FinancialSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryBreakdown: { [cat: string]: number } = {};

  transactions.forEach(tx => {
    if (tx.type === 'ingreso') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amount;
    }
  });

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalExpense,
    netBalance,
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

// Format currency with privacy masking support (rounds all amounts to clean integers)
export function formatCurrency(amount: number, currency: string = '$', showBalance: boolean = true): string {
  if (!showBalance) {
    return `${currency} •••••`;
  }
  const rounded = Math.round(amount);
  return `${currency}${rounded.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
