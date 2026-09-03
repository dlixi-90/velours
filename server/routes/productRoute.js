import express from "express";
import { upload } from "../middleware/multer.js";
import authUser from "../middleware/authMiddleware.js";
import {
  createProduct,
  deleteProduct,
  listProduct,
  singleProduct,
  toggleStock,
  updateProduct,
} from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.post("/", upload.array("images", 4), authUser, createProduct);
productRouter.get("/", listProduct);
productRouter.get("/single", singleProduct);
productRouter.post("/toggle-stock", authUser, toggleStock);
productRouter.put(
  "/:productId",
  upload.array("images", 4),
  authUser,
  updateProduct,
);
productRouter.delete("/:productId", authUser, deleteProduct);

export default productRouter;
