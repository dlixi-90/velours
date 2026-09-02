import express from "express";
import {
  allOrders,
  placeOrderCOD,
  updateStatus,
  placeOrderQr,
  userOrders,
  getOrderStatus,
  sepayWebhook,
} from "../controllers/orderController.js";
import authUser from "../middleware/authMiddleware.js";

const orderRouter = express.Router();

// For Admin
orderRouter.post("/sepay-webhook", sepayWebhook);
orderRouter.get("/", authUser, allOrders);
orderRouter.post("/status", authUser, updateStatus);

// For Payment
orderRouter.post("/cod", authUser, placeOrderCOD);
orderRouter.post("/qr", authUser, placeOrderQr);
orderRouter.get("/:orderId", authUser, getOrderStatus);

// For User
orderRouter.post("/userorders", authUser, userOrders);

export default orderRouter;
