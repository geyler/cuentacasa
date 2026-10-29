/**
 * Centralized Date & Time utilities for CuentaCasa
 * Rules:
 * - Timezone: America/Havana (Cuba)
 * - Date format: dd/mm/yy (e.g. 29/10/26)
 * - Time format: 12-hour AM/PM without seconds (e.g. 7:15 AM)
 * - Safe handling of ISO YYYY-MM-DD dates to prevent UTC shift
 */

const HAVANA_TZ = 'America/Havana';

/**
 * Returns a formatted date string: "dd/mm/yy" (e.g., "29/10/26")
 */
export function formatDate(input?: string | number | Date | null): string {
  if (!input) return '';

  // If input is a pure date string "YYYY-MM-DD", parse components directly to avoid timezone shift
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    const [year, month, day] = input.trim().split('-');
    return `${day}/${month}/${year.slice(-2)}`;
  }

  try {
    const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
    if (isNaN(d.getTime())) return String(input);

    const parts = new Intl.DateTimeFormat('es-CU', {
      timeZone: HAVANA_TZ,
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).formatToParts(d);

    const day = parts.find(p => p.type === 'day')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '';

    return `${day}/${month}/${year}`;
  } catch {
    return String(input);
  }
}

/**
 * Returns a formatted time string: "h:mm AM" or "h:mm PM" (e.g., "7:15 AM") in Havana timezone
 */
export function formatTime(input?: string | number | Date | null): string {
  if (!input) return '';

  // If input is purely "YYYY-MM-DD" with no time info, time cannot be determined
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return '';
  }

  try {
    const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
    if (isNaN(d.getTime())) return '';

    // en-US gives clean "7:15 AM" format with uppercase AM/PM
    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: HAVANA_TZ,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);

    return timeStr.toUpperCase();
  } catch {
    return '';
  }
}

/**
 * Returns a combined formatted date and time string:
 * "dd/mm/yy • 7:15 AM" or just "dd/mm/yy" if no time info
 */
export function formatDateTime(input?: string | number | Date | null): string {
  if (!input) return '';

  const datePart = formatDate(input);
  const timePart = formatTime(input);

  if (!timePart) return datePart;
  return `${datePart} • ${timePart}`;
}

/**
 * Formats a transaction or sale timestamp/date reliably
 */
export function formatRecordDateTime(timestamp?: number, dateStr?: string): string {
  if (timestamp && timestamp > 0) {
    return formatDateTime(timestamp);
  }
  if (dateStr) {
    return formatDate(dateStr);
  }
  return '';
}

