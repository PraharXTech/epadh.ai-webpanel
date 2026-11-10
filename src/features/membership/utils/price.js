export const formatPrice = (amount, currency) =>
  currency === 'INR' ? `₹${amount}` : `${currency} ${amount}`;
