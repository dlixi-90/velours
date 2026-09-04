export const DELIVERY_CHARGE = 30;
export const FREE_SHIPPING_THRESHOLD = 1000;

export const getShippingCharge = (subtotal) => {
  const normalizedSubtotal = Number(subtotal);

  if (!Number.isFinite(normalizedSubtotal) || normalizedSubtotal <= 0) {
    return 0;
  }

  return normalizedSubtotal >= FREE_SHIPPING_THRESHOLD
    ? 0
    : DELIVERY_CHARGE;
};

export const getOrderTotal = (subtotal) => {
  return subtotal + getShippingCharge(subtotal);
};
