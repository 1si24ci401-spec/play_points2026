export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const parseCurrency = (formatted: string): number => {
  return parseFloat(formatted.replace(/[₹,]/g, ''));
};
