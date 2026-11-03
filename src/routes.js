
import { Router } from "express";
import { getChat } from "./controller.js"
import { getChats } from "./chatController.js";


const router = Router();

router.get("/:chatId/messages", getChat);

router.get("/", getChats);

export default router;