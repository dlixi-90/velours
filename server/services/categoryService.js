import Category from "../models/Category.js";
import Product from "../models/Product.js";

export const normalizeCategoryName = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

export const categoryNamePattern = (name) => {
  const escaped = normalizeCategoryName(name).split(" ")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  return new RegExp(`^\\s*${escaped}\\s*$`, "i");
};

export const validateProductCategory = async (productData) => {
  const category = await Category.findOne({
    nameKey: normalizeCategoryName(productData.category).toLowerCase(),
  });
  const typeKey = normalizeCategoryName(productData.type).toLowerCase();
  const type = category?.types.find((item) => item.nameKey === typeKey);
  if (!category || !type) {
    throw Object.assign(new Error("Please select a valid type for this category"), {
      statusCode: 400,
    });
  }
  productData.category = category.name;
  productData.type = type.name;
};

// Import only categories/types still used by catalog products. Deleted products
// and hard-coded defaults must not recreate entries the owner has removed.
export const initializeCategories = async () => {
  await Category.init();
  const names = await Product.distinct("category", { isDeleted: { $ne: true } });

  for (const value of names) {
    const name = normalizeCategoryName(value);
    if (!name) continue;
    await Category.updateOne(
      { nameKey: name.toLowerCase() },
      { $setOnInsert: { name, nameKey: name.toLowerCase() } },
      { upsert: true },
    );
    const types = await Product.distinct("type", {
      category: categoryNamePattern(name), isDeleted: { $ne: true },
    });
    for (const value of types) {
      const typeName = normalizeCategoryName(value);
      if (!typeName) continue;
      const nameKey = typeName.toLowerCase();
      await Category.updateOne(
        { nameKey: name.toLowerCase(), "types.nameKey": { $ne: nameKey } },
        { $push: { types: { name: typeName, nameKey } } },
      );
    }
  }
};
