export const formatCurrency = (amount = 0) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num = 0) => {
  return new Intl.NumberFormat('en-US').format(num);
};
