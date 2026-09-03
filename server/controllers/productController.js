import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import { isValidObjectId } from "mongoose";
import User from "../models/User.js";

// Controller Function for Adding Product [POST '/']
export const createProduct = async (req, res) => {
  try {
    const productData = JSON.parse(req.body.productData);
    const images = req.files;

    // Upload images tp cloudinary
    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      }),
    );

    const sizes = Array.isArray(productData.sizes) ? productData.sizes : [];

    const inStockBySize = Object.fromEntries(
      sizes.map((size) => {
        const quantity = Number(productData.stockBySize?.[size] ?? 0);

        return [size, quantity > 0];
      }),
    );

    const hasStock = sizes.some(
      (size) => Number(productData.stockBySize?.[size] ?? 0) > 0,
    );

    await Product.create({
      ...productData,
      images: imagesUrl,
      inStock: hasStock,
      inStockBySize,
    });

    res.json({ success: true, message: "Product Added" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Controller function for Product List [GET '/']
export const listProduct = async (req, res) => {
  try {
    const products = await Product.find({
      isDeleted: {
        $ne: true,
      },
    }).sort({
      createdAt: -1,
    });
    res.json({ success: true, products });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Controller function for get single product [GET '/single']
export const singleProduct = async (req, res) => {
  try {
    const { productId } = await req.body;
    const product = await Product.findById(productId);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Controller function for toggle stock [POST '/toggle-stock']
export const toggleStock = async (req, res) => {
  try {
    if (req.user?.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { productId, size, inStock } = req.body;

    if (typeof inStock !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Invalid stock status",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      isDeleted: {
        $ne: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Không truyền size: cập nhật switch tổng
    if (!size) {
      const hasStock = product.sizes.some(
        (currentSize) => Number(product.stockBySize?.[currentSize] ?? 0) > 0,
      );

      if (inStock && !hasStock) {
        return res.status(400).json({
          success: false,
          message: "Cannot enable a product when all sizes are out of stock",
        });
      }

      product.inStock = inStock;

      await product.save();

      return res.json({
        success: true,
        message: "Product status updated",
        product,
      });
    }

    // Có truyền size: cập nhật switch của size
    if (!product.sizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product size",
      });
    }

    const quantity = Number(product.stockBySize?.[size] ?? 0);

    if (inStock && quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot enable a size with zero quantity",
      });
    }

    product.inStockBySize = {
      ...(product.inStockBySize || {}),
      [size]: inStock,
    };

    product.markModified("inStockBySize");

    await product.save();

    return res.json({
      success: true,
      message: `Status for size ${size} updated`,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (req.user?.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { productId } = req.params;

    const currentProduct = await Product.findOne({
      _id: productId,
      isDeleted: {
        $ne: true,
      },
    });

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productData = JSON.parse(req.body.productData);

    const {
      title,
      description,
      category,
      type,
      popular,
      price,
      sizes,
      stockBySize,
      existingImages = [],
    } = productData;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !category ||
      !type ||
      !Array.isArray(sizes) ||
      sizes.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product data",
      });
    }

    const normalizedPrices = {};
    const normalizedStock = {};
    const normalizedSizeStock = {};

    for (const size of sizes) {
      const productPrice = Number(price?.[size]);
      const quantity = Number(stockBySize?.[size]);

      if (!Number.isFinite(productPrice) || productPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for size ${size}`,
        });
      }

      if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for size ${size}`,
        });
      }

      const savedSizeStatus = currentProduct.inStockBySize?.[size];

      normalizedSizeStock[size] =
        quantity > 0 &&
        (typeof savedSizeStatus === "boolean" ? savedSizeStatus : true);

      normalizedPrices[size] = productPrice;
      normalizedStock[size] = quantity;
    }

    const hasStock = sizes.some(
      (size) => Number(normalizedStock[size] ?? 0) > 0,
    );

    const safeExistingImages = existingImages.filter((imageUrl) =>
      currentProduct.images.includes(imageUrl),
    );

    const uploadedImages = await Promise.all(
      (req.files || []).map(async (image) => {
        const result = await cloudinary.uploader.upload(image.path, {
          resource_type: "image",
        });

        return result.secure_url;
      }),
    );

    const images = [...safeExistingImages, ...uploadedImages].slice(0, 4);

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        title: title.trim(),
        description: description.trim(),
        category,
        type,
        popular: Boolean(popular),
        price: normalizedPrices,
        stockBySize: normalizedStock,
        inStockBySize: normalizedSizeStock,
        inStock: hasStock ? Boolean(currentProduct.inStock) : false,
        sizes,
        images,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.log(error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    if (req.user?.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const deletedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        isDeleted: {
          $ne: true,
        },
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
        inStock: false,
        popular: false,
      },
      {
        new: true,
      },
    );

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found or already deleted",
      });
    }

    // Xóa sản phẩm khỏi giỏ hàng của tất cả người dùng.
    const cartProductPath = `cartData.${productId}`;

    await User.updateMany(
      {
        [cartProductPath]: {
          $exists: true,
        },
      },
      {
        $unset: {
          [cartProductPath]: "",
        },
      },
    );

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
