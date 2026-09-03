import { isObjectIdOrHexString } from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { getSizeQuantity, isSizeAvailable } from "../utils/productStock.js";

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
    const { userId } = req.auth();

    if (!isObjectIdOrHexString(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (typeof size !== "string" || !size.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please select a product size",
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

    const cartData = userData.cartData || {};
    const currentQuantity = Number(cartData[itemId]?.[size] ?? 0);
    const nextQuantity = currentQuantity + 1;
    const stockQuantity = getSizeQuantity(product, size);

    if (nextQuantity > stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${stockQuantity} items are available for size ${size}`,
      });
    }

    cartData[itemId] = cartData[itemId] || {};
    cartData[itemId][size] = nextQuantity;

    await User.findByIdAndUpdate(userId, { cartData });

    return res.json({
      success: true,
      message: "Added to Cart",
      quantity: nextQuantity,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
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

    if (typeof size !== "string" || !size.trim()) {
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

    const cartData = userData.cartData || {};

    // Removing an item must remain possible even if the product is no longer sold.
    if (quantity === 0) {
      if (cartData[itemId]?.[size] !== undefined) {
        delete cartData[itemId][size];

        if (Object.keys(cartData[itemId]).length === 0) {
          delete cartData[itemId];
        }

        await User.findByIdAndUpdate(userId, { cartData });
      }

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

    cartData[itemId] = cartData[itemId] || {};
    cartData[itemId][size] = quantity;

    await User.findByIdAndUpdate(userId, { cartData });

    return res.json({
      success: true,
      message: "Cart Updated",
      quantity,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
