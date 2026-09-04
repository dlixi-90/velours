import express from "express";
import authUser from "../middleware/authMiddleware.js";
import aiRateLimit from "../middleware/aiRateLimit.js";
import { chatWithAI } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post("/chat", authUser, aiRateLimit, chatWithAI);

export default aiRouter;
