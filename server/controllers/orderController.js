import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import transporter from "../config/nodemailer.js";
import crypto from "crypto";
import Address from "../models/Address.js";

// Global variables for payment
const currency = "VND";
const delivery_charges = 30;

const validateUserAddress = async (addressId, userId) => {
  if (!addressId) {
    throw new Error("Please provide a delivery address");
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
  });

  if (!address) {
    throw new Error("Delivery address not found");
  }

  return address;
};

// Place Order using COD [POST '/cod']
export const placeOrderCOD = async (req, res) => {
  try {
    const { items, address } = req.body;
    const { userId } = req.auth();
    const selectedAddress = await validateUserAddress(address, userId);

    if (!items || items.length === 0) {
      return res.json({ success: false, message: "Please add product first" });
    }

    // calculate amount using items
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.json({ success: false, message: "Product not found" });
      }

      const unitPrice = product.price[item.size];
      if (!unitPrice) {
        return res.json({ success: false, message: "Invalid size selected" });
      }
      subtotal += unitPrice * item.quantity;
    }

    // calculate total amount by adding delivery charges
    const totalAmount = subtotal + delivery_charges;

    const order = await Order.create({
      userId,
      items,
      amount: totalAmount,
      address: selectedAddress._id,
      paymentMethod: "COD",
    });

    // Clear user cart after placing order
    await User.findByIdAndUpdate(userId, { cartData: {} });

    // Send confirmation email for COD
    const populatedOrder = await Order.findById(order._id).populate(
      "items.product address",
    );
    const user = await User.findById(userId);

    const productTitles = populatedOrder.items
      .map((item) => item.product?.title || "Unknown")
      .join(", ");
    const addressString = populatedOrder.address
      ? `${populatedOrder.address.street || "N/A"}, ${populatedOrder.address.city || "N/A"}, ${populatedOrder.address.state || "N/A"}, ${populatedOrder.address.country || "N/A"}`
      : "No address";

    const mailOptions = {
      from: process.env.SMTP_SENDER_EMAIL,
      to: user.email,
      subject: "Order Details (COD)",
      html: `
      <h2>Your Delivery Details</h2>
      <p>Thank you for your Order! Below are your Order details:</p>
      <ul>
        <li><strong>Order ID:</strong> ${populatedOrder._id}</li>
        <li><strong>Products Name:</strong> ${productTitles}</li>
        <li><strong>Address:</strong> ${addressString}</li>
        <li><strong>Total Amount:</strong> ${process.env.CURRENCY || "VNĐ"}${populatedOrder.amount}</li>
      </ul>
      <p>You will get your delivery in 1-2 Days. Pay on delivery</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: "Order Placed",
      order: populatedOrder,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

const createPaymentCode = () => {
  return `DH${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

const createQrUrl = ({ paymentCode, qrAmount }) => {
  const params = new URLSearchParams({
    bank: process.env.SEPAY_BANK_CODE,

    acc: process.env.SEPAY_ACCOUNT_NUMBER,

    amount: String(qrAmount),

    des: paymentCode,

    template: "compact",
    showinfo: "true",
    fullacc: "true",
  });

  if (process.env.SEPAY_ACCOUNT_NAME) {
    params.set("holder", process.env.SEPAY_ACCOUNT_NAME);
  }

  return `https://vietqr.app/img?${params.toString()}`;
};

// Place order using Qr [POST '/qr']
export const placeOrderQr = async (req, res) => {
  try {
    const { items, address } = req.body;
    const { userId } = req.auth();

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please add product first",
      });
    }

    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const unitPrice = Number(product.price[item.size]);
      const quantity = Number(item.quantity);

      if (!unitPrice || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid product size or quantity",
        });
      }

      subtotal += unitPrice * quantity;
    }

    const totalAmount = subtotal + delivery_charges;
    const paymentCode = createPaymentCode();

    // Giá trong project đang biểu diễn 30 = 30.000 VNĐ.
    const qrAmount = totalAmount * 1000;

    const order = await Order.create({
      userId,
      items,
      amount: totalAmount,
      address,
      paymentMethod: "QR",
      paymentCode,
      qrAmount,
      status: "Awaiting Payment",
      isPaid: false,
    });

    const qrUrl = createQrUrl({
      paymentCode,
      qrAmount,
    });

    return res.status(201).json({
      success: true,
      message: "QR order created",
      order: {
        ...order.toObject(),
        qrUrl,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getOrderStatus = async (req, res) => {
  try {
    const { userId } = req.auth();
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.userId !== userId && req.user?.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Not Authorized",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const sepayWebhook = async (req, res) => {
  try {
    const authorization = req.get("authorization") || "";
    const apiKey = authorization.replace(/^Apikey\s+/i, "").trim();

    if (apiKey !== process.env.SEPAY_WEBHOOK_API_KEY) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook API key",
      });
    }

    const { id, transferType, transferAmount, content, code } = req.body;

    // Chỉ xử lý tiền chuyển vào
    if (String(transferType).toLowerCase() !== "in") {
      return res.json({ success: true });
    }

    // SePay có thể gửi lại cùng một giao dịch
    const processedOrder = await Order.findOne({
      transactionId: String(id),
    });

    if (processedOrder) {
      return res.json({ success: true });
    }

    const paymentText = `${code || ""} ${content || ""}`.toUpperCase();
    const paymentCode = paymentText.match(/DH[A-F0-9]{8}/)?.[0];

    if (!paymentCode) {
      return res.json({ success: true });
    }

    const order = await Order.findOne({ paymentCode });

    if (!order || order.isPaid) {
      return res.json({ success: true });
    }

    if (Number(transferAmount) < Number(order.qrAmount)) {
      return res.json({ success: true });
    }

    order.isPaid = true;
    order.status = "Order Placed";
    order.transactionId = String(id);
    order.paidAt = new Date();

    await order.save();

    // Chỉ xoá giỏ sau khi đã nhận tiền
    await User.findByIdAndUpdate(order.userId, {
      cartData: {},
    });

    return res.json({ success: true });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// All Orders data for the user [POST '/userorders']
export const userOrders = async (req, res) => {
  try {
    const { userId } = req.auth();
    const orders = await Order.find({
      userId,
      $or: [{ paymentMethod: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// All Orders data for Admin [POST '/']
export const allOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentMethod: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (acc, o) => acc + (o.isPaid ? o.amount : 0),
      0,
    );
    res.json({
      success: true,
      dashboardData: { totalOrders, totalRevenue, orders },
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Update Order status for Admin [POST '/status']
export const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await Order.findByIdAndUpdate(orderId, { status });

    res.json({ success: true, message: "Order status updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
