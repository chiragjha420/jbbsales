import { PaymentStatus } from '@/types';

/**
 * Rounds a number to two decimal places safely without floating-point artifacts.
 */
export function round2(num: number): number {
  if (!isFinite(num) || isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates a single sale item's financial values.
 */
export function calculateLineItem(quantity: number, sellingPrice: number, costAtSale: number) {
  const safeQty = Math.max(0, quantity || 0);
  const safePrice = Math.max(0, sellingPrice || 0);
  const safeCost = Math.max(0, costAtSale || 0);

  const lineRevenue = round2(safeQty * safePrice);
  const lineCost = round2(safeQty * safeCost);
  const lineProfit = round2(lineRevenue - lineCost);

  return {
    quantity: safeQty,
    sellingPrice: safePrice,
    costAtSale: safeCost,
    lineRevenue,
    lineCost,
    lineProfit,
  };
}

export interface SaleFinancialInputs {
  items: Array<{
    quantity: number;
    sellingPrice: number;
    costAtSale: number;
  }>;
  courierCharge?: number;
  courierCost?: number;
  otherCharge?: number;
  otherCost?: number;
}

/**
 * Authoritative sale calculation engine matching JBB Sales specifications.
 */
export function calculateSaleTotals(inputs: SaleFinancialInputs) {
  const courierCharge = Math.max(0, inputs.courierCharge || 0);
  const courierCost = Math.max(0, inputs.courierCost || 0);
  const otherCharge = Math.max(0, inputs.otherCharge || 0);
  const otherCost = Math.max(0, inputs.otherCost || 0);

  let productRevenue = 0;
  let productCost = 0;

  for (const item of inputs.items) {
    const calc = calculateLineItem(item.quantity, item.sellingPrice, item.costAtSale);
    productRevenue += calc.lineRevenue;
    productCost += calc.lineCost;
  }

  productRevenue = round2(productRevenue);
  productCost = round2(productCost);

  const totalRevenue = round2(productRevenue + courierCharge + otherCharge);
  const totalCost = round2(productCost + courierCost + otherCost);
  const grossProfit = round2(totalRevenue - totalCost);

  // Division by zero protection: Never return NaN or Infinity
  const grossMargin = totalRevenue > 0 ? round2((grossProfit / totalRevenue) * 100) : 0;

  return {
    courierCharge: round2(courierCharge),
    courierCost: round2(courierCost),
    otherCharge: round2(otherCharge),
    otherCost: round2(otherCost),
    productRevenue,
    productCost,
    totalRevenue,
    totalCost,
    grossProfit,
    grossMargin,
  };
}

/**
 * Determines payment status from received payments and total sale revenue.
 */
export function calculatePaymentStatus(totalRevenue: number, totalPaid: number): PaymentStatus {
  const safeRevenue = round2(totalRevenue || 0);
  const safePaid = round2(totalPaid || 0);

  if (safePaid <= 0) {
    return 'unpaid';
  }
  if (safePaid < safeRevenue) {
    return 'partially_paid';
  }
  if (Math.abs(safePaid - safeRevenue) < 0.01) {
    return 'paid';
  }
  return 'overpaid';
}

/**
 * Formats currency in Indian Rupee format (e.g. ₹1,25,000 or ₹1,25,000.50).
 */
export function formatINR(amount: number, includeDecimals = false): string {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    return '₹0';
  }

  const rounded = round2(amount);
  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);

  // Indian currency numbering system (lakhs, crores)
  const parts = absAmount.toFixed(includeDecimals ? 2 : 0).split('.');
  let lastThree = parts[0].slice(-3);
  const otherNumbers = parts[0].slice(0, -3);

  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }

  const formattedWhole = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const formattedDecimal = includeDecimals && parts[1] ? `.${parts[1]}` : '';

  return `${isNegative ? '-' : ''}₹${formattedWhole}${formattedDecimal}`;
}

/**
 * Short Indian currency format for high density tables (e.g., ₹4.2L, ₹85K).
 */
export function formatCompactINR(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    return '₹0';
  }

  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(1)}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  }
  return `${sign}₹${abs.toFixed(0)}`;
}

/**
 * Formats a date cleanly for business interfaces.
 */
export function formatDate(dateString: string | Date, includeTime = false): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  if (!includeTime) {
    return `${day} ${month} ${year}`;
  }

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 is 12

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}
