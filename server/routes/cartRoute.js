import express from "express";
import authUser from "../middleware/authMiddleware.js";
import { addToCart, updateCart, changeCartSize } from "../controllers/cartController.js";

const cartRouter = express.Router();

cartRouter.post("/add", authUser, addToCart);
cartRouter.post("/update", authUser, updateCart);
cartRouter.post("/change-size", authUser, changeCartSize);

export default cartRouter;
