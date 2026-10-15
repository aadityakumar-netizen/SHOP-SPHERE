/**
 * Convert integer paise to formatted INR string (₹)
 * @param {number} paise - Amount in paise (1 INR = 100 paise)
 * @returns {string} Formatted currency e.g. "₹1,499.00"
 */
export const formatCurrency = (paise) => {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0.00';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
};

/**
 * Format ISO date string into readable format
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
};
