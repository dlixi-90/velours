import { isSizeAvailable } from "../../../utils/productStock.js";

export const getAvailableProductOptions = (product) => {
  const currency = process.env.CURRENCY || "VND";

  return (product.sizes || [])
    .filter((size) => isSizeAvailable(product, size))
    .map((size) => ({
      size,
      amount: Number(product.price?.[size]) * 1000,
      currency,
    }))
    .filter((option) => Number.isFinite(option.amount));
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
