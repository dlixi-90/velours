import express from "express";
import authUser, { requireOwner } from "../middleware/authMiddleware.js";
import { createCategory, listCategories, updateCategory, createCategoryType, updateCategoryType, deleteCategory, deleteCategoryType } from "../controllers/categoryController.js";

const categoryRouter = express.Router();

categoryRouter.get("/", listCategories);
categoryRouter.post("/", authUser, requireOwner, createCategory);
categoryRouter.put("/:categoryId", authUser, requireOwner, updateCategory);
categoryRouter.post("/:categoryId/types", authUser, requireOwner, createCategoryType);
categoryRouter.put("/:categoryId/types/:typeId", authUser, requireOwner, updateCategoryType);
categoryRouter.delete("/:categoryId", authUser, requireOwner, deleteCategory);
categoryRouter.delete("/:categoryId/types/:typeId", authUser, requireOwner, deleteCategoryType);

export default categoryRouter;
