/**
 * Format a number as Indian Rupee currency
 * @param {number} amount
 * @returns {string} e.g. "₹1,000.00"
 * 
 */
export const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};
