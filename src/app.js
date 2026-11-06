
import express from "express";
import cors from "cors";
import router from "./routes.js";
import authRoutes from './authRouter.js'
import { testConnection } from "./database/testMysql.js";


const app = express();

app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

app.get("/health", async (req, res) => {
    await testConnection()
    res.json({
        status: "ok",
        service: "chat-backend"
    });
});
app.use("/api/chats", router)
app.use("/api/auth", authRoutes);

// const httpServer = http.createServer(app);



export default app;
