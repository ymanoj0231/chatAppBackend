
import express from "express";
import cors from "cors";
import router from "./routes.js";
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


// const httpServer = http.createServer(app);



export default app;
