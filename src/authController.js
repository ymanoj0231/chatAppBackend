
import pool from "./database/mysql.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;

export const signup = async (req, res) => {
    try {
        console.log("req body for signup ", req.body)
        const { name, email, password } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Name, email, and password are required",
            });
        }

        if (typeof name !== "string" || typeof email !== "string" ||
            typeof password !== "string") {
            return res.status(400).json({
                error: "Invalid input",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must contain at least 8 characters",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 2. Check whether the email already exists
        const [existingUsers] = await pool.execute(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [normalizedEmail]
        );

        console.log("==existing users===", existingUsers)
        if (existingUsers.length > 0) {
            return res.status(409).json({
                error: "Email is already registered",
            });
        }

        // 3. Hash the password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // 4. Create the user
        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
            [name.trim(), normalizedEmail, passwordHash]
        );

        // 5. Return user details (never return the password hash)
        return res.status(201).json({
            message: "Account created successfully",
            user: {
                id: result.insertId,
                name: name.trim(),
                email: normalizedEmail,
            },
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "Email is already registered",
            });
        }

        console.error("Signup error:", error);

        return res.status(500).json({
            error: "Unable to create account",
        });
    }
};



export const login = async (req, res) => {
    try {
        console.log("env==", process.env)
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user by email
        const [users] = await pool.execute(
            `SELECT id, name, email, password_hash
       FROM users
       WHERE email = ?
       LIMIT 1`,
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        const user = users[0];

        // Compare password with stored bcrypt hash
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid email or password",
            });
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: String(user.id),
            },
            JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: String(user.id),
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            error: "Unable to login",
        });
    }
};

