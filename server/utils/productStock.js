export const getSizeQuantity = (product, size) => {
  const quantity = Number(product?.stockBySize?.[size] ?? 0);

  return Number.isFinite(quantity) ? quantity : 0;
};

export const isSizeEnabled = (product, size) => {
  const savedStatus = product?.inStockBySize?.[size];

  if (typeof savedStatus === "boolean") {
    return savedStatus;
  }

  // Tương thích sản phẩm cũ chưa có inStockBySize.
  return getSizeQuantity(product, size) > 0;
};

export const hasAnyQuantity = (product) => {
  return (product?.sizes || []).some(
    (size) => getSizeQuantity(product, size) > 0,
  );
};

export const isSizeAvailable = (product, size) => {
  return (
    Boolean(product?.inStock) &&
    getSizeQuantity(product, size) > 0 &&
    isSizeEnabled(product, size)
  );
};

export const hasAnyAvailableSize = (product) => {
  return (product?.sizes || []).some((size) => isSizeAvailable(product, size));
};
