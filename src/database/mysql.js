import mysql from "mysql2/promise";

const pool = mysql.createPool({
    host: "172.31.112.1",
    port: "3306",
    user: "chatly_user",
    password: "test@123",
    database: "chatly_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool;