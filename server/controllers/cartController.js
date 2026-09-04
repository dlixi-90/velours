import { isObjectIdOrHexString } from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { getSizeQuantity, isSizeAvailable } from "../utils/productStock.js";

const MAX_ADD_QUANTITY = 10;
const isSafePathSegment = (value) =>
  typeof value === "string" &&
  Boolean(value.trim()) &&
  !value.includes(".") &&
  !value.startsWith("$");

const findAvailableProduct = async (itemId) => {
  return Product.findOne({
    _id: itemId,
    isDeleted: { $ne: true },
  });
};

const validateProductSize = (product, size) => {
  if (!product.sizes.includes(size)) {
    return "Invalid product size";
  }

  if (!isSizeAvailable(product, size)) {
    return "This product size is out of stock";
  }

  return null;
};

// Adding to Cart [POST '/add']
export const addToCart = async (req, res) => {
  try {
    const { itemId, size } = req.body;
    const quantity =
      req.body.quantity === undefined ? 1 : Number(req.body.quantity);
    const { userId } = req.auth();

    if (!isObjectIdOrHexString(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!isSafePathSegment(size)) {
      return res.status(400).json({
        success: false,
        message: "Please select a product size",
      });
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ADD_QUANTITY
    ) {
      return res.status(400).json({
        success: false,
        message: `Quantity must be between 1 and ${MAX_ADD_QUANTITY}`,
      });
    }

    const [userData, product] = await Promise.all([
      User.findById(userId),
      findAvailableProduct(itemId),
    ]);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const sizeError = validateProductSize(product, size);

    if (sizeError) {
      return res.status(400).json({
        success: false,
        message: sizeError,
      });
    }

    const stockQuantity = getSizeQuantity(product, size);

    if (quantity > stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${stockQuantity} items are available for size ${size}`,
      });
    }

    const cartItemPath = `cartData.${itemId}.${size}`;
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        $or: [
          { [cartItemPath]: { $exists: false } },
          { [cartItemPath]: { $lte: stockQuantity - quantity } },
        ],
      },
      { $inc: { [cartItemPath]: quantity } },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message: `Only ${stockQuantity} items are available for size ${size}`,
      });
    }

    const nextQuantity = Number(updatedUser.cartData?.[itemId]?.[size] ?? 0);

    return res.json({
      success: true,
      message: "Added to Cart",
      addedQuantity: quantity,
      quantity: nextQuantity,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to add item to cart",
    });
  }
};

// Update the Cart [POST '/update']
export const updateCart = async (req, res) => {
  try {
    const { itemId, size } = req.body;
    const quantity = Number(req.body.quantity);
    const { userId } = req.auth();

    if (!isObjectIdOrHexString(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!isSafePathSegment(size)) {
      return res.status(400).json({
        success: false,
        message: "Please select a product size",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a non-negative integer",
      });
    }

    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cartItemPath = `cartData.${itemId}.${size}`;

    // Removing an item must remain possible even if the product is no longer sold.
    if (quantity === 0) {
      await User.updateOne(
        { _id: userId },
        { $unset: { [cartItemPath]: "" } },
      );

      return res.json({
        success: true,
        message: "Cart Updated",
        quantity: 0,
      });
    }

    const product = await findAvailableProduct(itemId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const sizeError = validateProductSize(product, size);

    if (sizeError) {
      return res.status(400).json({
        success: false,
        message: sizeError,
      });
    }

    const stockQuantity = getSizeQuantity(product, size);

    if (quantity > stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${stockQuantity} items are available for size ${size}`,
      });
    }

    await User.updateOne(
      { _id: userId },
      { $set: { [cartItemPath]: quantity } },
    );

    return res.json({
      success: true,
      message: "Cart Updated",
      quantity,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update cart",
    });
  }
};
