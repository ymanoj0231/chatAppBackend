import http from "node:http";
import "dotenv/config";
import { Server } from "socket.io";
import app from "./app.js";
import connectMongoDB from "./database/mongodb.js";
import Message from "./database/models/message.js";
import pool from "./database/mysql.js";
import jwt from "jsonwebtoken";


const httpServer = http.createServer(app)
const PORT = 3000;
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        socket.data.userId = String(decoded.userId);

        next();
    } catch (error) {
        next(new Error("Invalid or expired token"));
    }
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);


    socket.on("message:sent", async (data, acknowledge) => {
        try {
            const chatId = String(data?.chatId ?? "");
            const senderId = socket.data.userId;
            const text = data?.text?.trim();

            // Validate input
            if (
                !/^[1-9]\d*$/.test(chatId) ||
                typeof text !== "string" ||
                !text ||
                text.length > 5000
            ) {
                acknowledge?.({
                    success: false,
                    error: "Invalid message data",
                });
                return;
            }

            // Verify that the sender belongs to this chat
            const [participants] = await pool.execute(
                `SELECT 1
             FROM chat_participants
             WHERE chat_id = ? AND user_id = ?
             LIMIT 1`,
                [chatId, senderId]
            );

            if (participants.length === 0) {
                acknowledge?.({
                    success: false,
                    error: "User is not a participant of this chat",
                });
                return;
            }

            // Save message in MongoDB
            const savedMessage = await Message.create({
                chatId,
                senderId,
                text,
            });

            const message = {
                id: savedMessage._id.toString(),
                chatId: savedMessage.chatId,
                senderId: savedMessage.senderId,
                text: savedMessage.text,
                createdAt: savedMessage.createdAt.toISOString(),
            };

            // Broadcast after successful persistence
            // io.emit("message:recieved", message);

            // Broadcast the message to specific client
            io.to(`chat:${chatId}`).emit("message:recieved", message);

            acknowledge?.({
                success: true,
                messageId: message.id,
            });

        } catch (error) {
            console.error("Failed to save message:", error);

            acknowledge?.({
                success: false,
                error: "Unable to send message",
            });
        }
    });


    socket.on("chat:join", async (data, acknowledge) => {
        try {
            const userId = socket.data.userId;
            const chatId = String(data?.chatId ?? "");

            if (
                !/^[1-9]\d*$/.test(userId) ||
                !/^[1-9]\d*$/.test(chatId)
            ) {
                return acknowledge?.({
                    success: false,
                    error: "Invalid user or chat ID",
                });
            }

            const [participants] = await pool.execute(
                `SELECT 1
             FROM chat_participants
             WHERE chat_id = ? AND user_id = ?
             LIMIT 1`,
                [chatId, userId]
            );

            if (!participants.length) {
                return acknowledge?.({
                    success: false,
                    error: "Unauthorized chat access",
                });
            }

            socket.join(`chat:${chatId}`);

            acknowledge?.({
                success: true
            });
        } catch (error) {
            console.error("Failed to join chat:", error);

            acknowledge?.({
                success: false,
                error: "Unable to join chat",
            });
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

async function startServer() {
    try {
        await connectMongoDB();

        httpServer.listen(PORT, () => {
            console.log(`Chat backend running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}


startServer();