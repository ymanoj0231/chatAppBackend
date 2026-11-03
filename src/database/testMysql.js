
import pool from "./mysql.js";

async function testConnection() {
    try {
        console.log("inside test connection")
        const [rows] = await pool.query("SELECT 1 AS result");
        console.log("MySQL connected successfully:", rows);

    } catch (error) {
        console.error("MySQL connection failed:", error.message);

    } finally {
        await pool.end();
    }
}

export { testConnection };
