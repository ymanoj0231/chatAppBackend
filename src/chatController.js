
import pool from "./database/mysql.js";

export const getChats = async (req, res) => {
    try {
        const userId = Number(req.query.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                error: "Valid userId is required",
            });
        }

        const [rows] = await pool.execute(
            `SELECT
          c.id AS chatId,
          c.chat_type AS chatType,
          c.name AS chatName,
          c.created_at AS createdAt,
          u.id AS participantId,
          u.name AS participantName,
          u.email AS participantEmail,
          u.avatar_url AS avatarUrl,
          u.is_online AS isOnline,
          u.last_seen AS lastSeen
       FROM chats c
       INNER JOIN chat_participants cp
          ON cp.chat_id = c.id
       INNER JOIN users u
          ON u.id = cp.user_id
       WHERE c.id IN (
          SELECT chat_id
          FROM chat_participants
          WHERE user_id = ?
       )
       ORDER BY c.updated_at DESC, cp.joined_at ASC`,
            [userId]
        );

        const chatMap = new Map();

        for (const row of rows) {
            if (!chatMap.has(row.chatId)) {
                chatMap.set(row.chatId, {
                    id: String(row.chatId),
                    type: row.chatType,
                    name: row.chatName,
                    createdAt: row.createdAt,
                    participants: [],
                });
            }

            const chat = chatMap.get(row.chatId);

            chat.participants.push({
                id: row.participantId,
                name: row.participantName,
                email: row.participantEmail,
                avatarUrl: row.avatarUrl,
                isOnline: Boolean(row.isOnline),
                lastSeen: row.lastSeen,
            });
        }

        const chats = Array.from(chatMap.values()).map((chat) => {
            const otherParticipants = chat.participants.filter(
                (participant) => participant.id !== userId
            );

            return {
                ...chat,
                name:
                    chat.type === "direct"
                        ? otherParticipants[0]?.name ?? "Unknown user"
                        : chat.name,
            };
        });

        return res.status(200).json({ chats });

    } catch (error) {
        console.error("Failed to fetch chats:", error);

        return res.status(500).json({
            error: "Unable to fetch conversations",
        });
    }
};
