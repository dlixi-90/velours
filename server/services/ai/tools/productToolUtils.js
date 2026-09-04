import { isSizeAvailable } from "../../../utils/productStock.js";

export const getProductOptions = (product) => {
  const currency = process.env.CURRENCY || "VND";

  return (product.sizes || [])
    .map((size) => ({
      size,
      amount: Number(product.price?.[size]) * 1000,
      currency,
      isAvailable: isSizeAvailable(product, size),
    }))
    .filter((option) => Number.isFinite(option.amount));
};

export const getAvailableProductOptions = (product) => {
  return getProductOptions(product)
    .filter((option) => option.isAvailable)
    .map(({ isAvailable, ...option }) => option);
};

export const getProductPriceRange = (availableOptions) => {
  if (availableOptions.length === 0) return null;

  const prices = availableOptions.map((option) => option.amount);

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    currency: availableOptions[0].currency,
  };
};
