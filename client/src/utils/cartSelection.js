export const getCartItemKey = (productId, size) => `${productId}::${size}`;

export const removePurchasedItems = (cartData, purchasedItems) => {
  const nextCartData = structuredClone(cartData);

  for (const item of purchasedItems || []) {
    const productId = String(item.product?._id || item.product || "");
    const currentQuantity = Number(nextCartData[productId]?.[item.size] ?? 0);
    const remainingQuantity = currentQuantity - Number(item.quantity || 0);

    if (!nextCartData[productId]) continue;

    if (remainingQuantity > 0) {
      nextCartData[productId][item.size] = remainingQuantity;
    } else {
      delete nextCartData[productId][item.size];

      if (Object.keys(nextCartData[productId]).length === 0) {
        delete nextCartData[productId];
      }
    }
  }

  return nextCartData;
};
