import { Transaction, ReportFilter, FinancialSummary, ReportPeriod } from '@/types';

// Filter transactions by period
export function filterTransactionsByPeriod(transactions: Transaction[], filter: ReportFilter): Transaction[] {
  const now = new Date();
  
  return transactions.filter(tx => {
    const txDate = new Date(tx.date + 'T00:00:00');
    
    if (filter.category && filter.category !== 'todas' && tx.category !== filter.category) {
      return false;
    }

    switch (filter.period) {
      case 'semanal': {
        const startOfWeek = new Date(now);
        const day = now.getDay() || 7; // 1 = Mon, 7 = Sun
        startOfWeek.setDate(now.getDate() - day + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        return txDate >= startOfWeek;
      }
      case 'quincenal': {
        // Current fortnight: 1-15 or 16-end of month
        const currentDay = now.getDate();
        const startOfFortnight = new Date(now.getFullYear(), now.getMonth(), currentDay <= 15 ? 1 : 16);
        startOfFortnight.setHours(0, 0, 0, 0);
        return txDate >= startOfFortnight;
      }
      case 'mensual': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        return txDate >= startOfMonth;
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
    case 'semanal':
      return 'Reporte Semanal (Esta Semana)';
    case 'quincenal':
      return 'Reporte Quincenal (Quincena Actual)';
    case 'mensual':
      return 'Reporte Mensual (Mes Actual)';
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
    return `${currency} •••••`;
  }
  return `${currency}${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
