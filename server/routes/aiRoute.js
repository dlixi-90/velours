import express from "express";
import authUser from "../middleware/authMiddleware.js";
import { chatWithAI } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post("/chat", authUser, chatWithAI);

export default aiRouter;
