import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import { categoryNamePattern, normalizeCategoryName } from "../services/categoryService.js";

const serializeCategory = (category) => ({
  _id: category._id,
  name: category.name,
  types: (category.types || []).map((type) => ({ _id: type._id, name: type.name })),
});

const sendError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: "Category name already exists" });
  }
  if (!error.statusCode) console.error(error);
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : "Unable to save category",
  });
};

const readName = (req, label = "Category") => {
  const name = normalizeCategoryName(req.body?.name);
  if (!name || name.length > 100) {
    throw Object.assign(new Error(`${label} name must contain 1 to 100 characters`), {
      statusCode: 400,
    });
  }
  return name;
};

export const listCategories = async (_req, res) => {
  try {
    const categories = await Category.find({}).select("name types._id types.name").sort({ name: 1 });
    return res.json({ success: true, categories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to load categories" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const name = readName(req);
    const category = await Category.create({ name, nameKey: name.toLowerCase() });
    return res.status(201).json({
      success: true,
      message: "Category added successfully",
      category: serializeCategory(category),
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const name = readName(req);
    const { categoryId } = req.params;
    if (!mongoose.isValidObjectId(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    // Keep the category and existing products consistent if either write fails.
    const category = await mongoose.connection.transaction(async (session) => {
      const current = await Category.findById(categoryId).session(session);
      if (!current) {
        throw Object.assign(new Error("Category not found"), { statusCode: 404 });
      }
      const oldName = current.name;
      current.name = name;
      current.nameKey = name.toLowerCase();
      await current.save({ session });
      if (oldName !== name) {
        await Product.updateMany(
          { category: categoryNamePattern(oldName) },
          { $set: { category: name } },
          { session },
        );
      }
      return serializeCategory(current);
    });

    return res.json({ success: true, message: "Category updated successfully", category });
  } catch (error) {
    return sendError(res, error);
  }
};

const saveCategoryType = async (req, res, isEditing) => {
  try {
    const name = readName(req, "Type");
    const { categoryId, typeId } = req.params;
    if (!mongoose.isValidObjectId(categoryId) ||
      (isEditing && !mongoose.isValidObjectId(typeId))) {
      return res.status(400).json({ success: false, message: "Invalid category or type ID" });
    }
    const category = await mongoose.connection.transaction(async (session) => {
      const current = await Category.findById(categoryId).session(session);
      if (!current) {
        throw Object.assign(new Error("Category not found"), { statusCode: 404 });
      }
      const type = isEditing ? current.types.id(typeId) : null;
      if (isEditing && !type) {
        throw Object.assign(new Error("Type not found in this category"), { statusCode: 404 });
      }
      const nameKey = name.toLowerCase();
      if (current.types.some((item) => item.nameKey === nameKey &&
        String(item._id) !== typeId)) {
        throw Object.assign(new Error("Type name already exists in this category"), { statusCode: 409 });
      }
      const oldName = type?.name;
      if (type) {
        type.name = name;
        type.nameKey = nameKey;
      } else {
        current.types.push({ name, nameKey });
      }
      await current.save({ session });
      if (isEditing && oldName !== name) {
        await Product.updateMany(
          { category: categoryNamePattern(current.name), type: categoryNamePattern(oldName) },
          { $set: { type: name } },
          { session },
        );
      }
      return serializeCategory(current);
    });
    return res.status(isEditing ? 200 : 201).json({
      success: true,
      message: isEditing ? "Type updated successfully" : "Type added successfully",
      category,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const createCategoryType = (req, res) => saveCategoryType(req, res, false);
export const updateCategoryType = (req, res) => saveCategoryType(req, res, true);

const removeCategoryEntry = async (req, res, isType) => {
  try {
    const { categoryId, typeId } = req.params;
    if (!mongoose.isValidObjectId(categoryId) ||
      (isType && !mongoose.isValidObjectId(typeId))) {
      return res.status(400).json({ success: false, message: "Invalid category or type ID" });
    }
    const category = await mongoose.connection.transaction(async (session) => {
      const current = await Category.findById(categoryId).session(session);
      if (!current) {
        throw Object.assign(new Error("Category not found"), { statusCode: 404 });
      }
      const type = isType ? current.types.id(typeId) : null;
      if (isType && !type) {
        throw Object.assign(new Error("Type not found in this category"), { statusCode: 404 });
      }
      const used = await Product.exists({
        isDeleted: { $ne: true },
        category: categoryNamePattern(current.name),
        ...(isType && { type: categoryNamePattern(type.name) }),
      }).session(session);
      if (used) {
        throw Object.assign(new Error(
          isType
            ? "This type is used by products. Change their type in List Product before deleting it."
            : "This category is used by products. Move them to another category in List Product before deleting it.",
        ), { statusCode: 409 });
      }
      if (isType) {
        type.deleteOne();
        await current.save({ session });
        return serializeCategory(current);
      }
      await current.deleteOne({ session });
      return null;
    });
    return res.json({
      success: true,
      message: isType ? "Type deleted successfully" : "Category deleted successfully",
      ...(isType ? { category } : { categoryId: req.params.categoryId }),
    });
  } catch (error) {
    if (!error.statusCode) console.error(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Unable to delete category or type",
    });
  }
};

export const deleteCategory = (req, res) => removeCategoryEntry(req, res, false);
export const deleteCategoryType = (req, res) => removeCategoryEntry(req, res, true);
