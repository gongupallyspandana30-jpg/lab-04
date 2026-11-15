const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const PORT = 3000;
const SECRET_KEY = "lab4_secret_key_change_before_deployment";

let db;

// Connect to database and create users table
async function initializeDatabase() {
    db = await open({
        filename: "./users.db",
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password TEXT NOT NULL
        )
    `);

    console.log("Database connected successfully");
}

// Registration API
app.post("/register", async (req, res) => {
    try {
        const { username, name, password } = req.body;

        if (!username || !name || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const existingUser = await db.get(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (existingUser) {
            return res.status(400).json({
                message: "Username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.run(
            "INSERT INTO users (username, name, password) VALUES (?, ?, ?)",
            [username, name, hashedPassword]
        );

        res.status(201).json({
            message: "Registration successful"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

// Login API
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const user = await db.get(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (!user) {
            return res.status(400).json({
                message: "Invalid username"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        const token = jwt.sign(
            { username: user.username },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            jwt_token: token
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

// Start server after database initialization
initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Database initialization failed:", error);
    });
