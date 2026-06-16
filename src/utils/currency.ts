export const formatCurrency = (amount: number): string => {
  return `Rs ${amount.toFixed(2)}`;
};

export const parseCurrency = (formatted: string): number => {
  return parseFloat(formatted.replace(/[^\d.]/g, '')) || 0;
};
