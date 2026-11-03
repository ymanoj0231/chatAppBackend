import Message from "./database/models/message.js";

const getChat = async (req, res) => {
    try {
        const { chatId } = req.params;

        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isInteger(parsedLimit)
            ? Math.min(Math.max(parsedLimit, 1), 100)
            : 50;

        const messages = await Message.find({ chatId })
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit)
            .lean();

        res.json({
            messages: messages.reverse().map((message) => ({
                id: message._id.toString(),
                chatId: message.chatId,
                senderId: message.senderId,
                text: message.text,
                createdAt: message.createdAt,
            })),
        });
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        res.status(500).json({ error: "Unable to fetch messages" });
    }
}

export {
    getChat
}