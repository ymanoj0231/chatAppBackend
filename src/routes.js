
import { Router } from "express";
import { getChat } from "./controller.js"
import { getChats } from "./chatController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";



const router = Router();

router.get("/:chatId/messages", authenticateToken, getChat);

router.get("/", authenticateToken, getChats);

export default router;