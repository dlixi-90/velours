export const saveVariantEdit = (variants, id, draft) => {
  const size = String(draft.size ?? "").trim();
  const price = Number(draft.price);
  const quantity = Number(draft.quantity);
  if (!size || size.length > 50 || size.includes(".") || size.startsWith("$") ||
      ["__proto__", "constructor", "prototype"].includes(size)) {
    throw new Error("Enter a valid size name (up to 50 characters, no dots or leading $).");
  }
  if (variants.some((item) => item.id !== id && item.size.trim().toLowerCase() === size.toLowerCase())) {
    throw new Error("Size already exists");
  }
  if (!Number.isFinite(price) || price <= 0 || price > Number.MAX_SAFE_INTEGER / 1000) {
    throw new Error("Price must be greater than 0 and within the supported range");
  }
  if (draft.quantity == null || String(draft.quantity).trim() === "" ||
      !Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error("Quantity must be a non-negative integer");
  }
  return variants.map((item) => item.id === id ? { ...item, size, price, quantity } : item);
};
