const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

router.post("/register", [
    body("fullName").trim().notEmpty().withMessage("Full name is required."),
    body("email").trim().isEmail().withMessage("Enter a valid email address."),
    body("phone").trim().notEmpty().withMessage("Phone number is required."),
    body("address").trim().notEmpty().withMessage("Address is required."),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { fullName, email, phone, address, password } = req.body;

    try {
        const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length) return res.status(409).json({ message: "An account with this email already exists." });

        const hashedPassword = await bcrypt.hash(password, 12);
        const [result] = await db.execute(
            "INSERT INTO users (full_name, email, phone, address, password, role) VALUES (?, ?, ?, ?, ?, 'user')",
            [fullName, email, phone, address, hashedPassword]
        );

        res.status(201).json({ message: "Account created successfully. You can now log in.", userId: result.insertId });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Unable to create your account right now." });
    }
});

async function login(req, res, requiredRole) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { email, password } = req.body;

    try {
        const [rows] = await db.execute(
            "SELECT id, full_name, email, phone, address, password, role FROM users WHERE email = ?",
            [email]
        );

        if (!rows.length) return res.status(401).json({ message: "Incorrect email or password." });

        const account = rows[0];
        const passwordMatch = await bcrypt.compare(password, account.password);

        if (!passwordMatch || account.role !== requiredRole) {
            return res.status(401).json({ message: "Incorrect email or password." });
        }

        const token = jwt.sign(
            { id: account.id, email: account.email, role: account.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful.",
            token,
            user: {
                id: account.id,
                fullName: account.full_name,
                email: account.email,
                phone: account.phone,
                address: account.address,
                role: account.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Unable to log in right now." });
    }
}

const loginRules = [
    body("email").trim().isEmail().withMessage("Enter a valid email address."),
    body("password").notEmpty().withMessage("Password is required.")
];

router.post("/login", loginRules, (req, res) => login(req, res, "user"));
router.post("/admin/login", loginRules, (req, res) => login(req, res, "admin"));

router.get("/me", verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT id, full_name, email, phone, address, role, created_at FROM users WHERE id = ?",
            [req.user.id]
        );

        if (!rows.length) return res.status(404).json({ message: "Account not found." });

        const account = rows[0];
        res.json({
            user: {
                id: account.id,
                fullName: account.full_name,
                email: account.email,
                phone: account.phone,
                address: account.address,
                role: account.role,
                createdAt: account.created_at
            }
        });
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ message: "Unable to load your profile." });
    }
});


router.patch("/me", verifyToken, [
    body("fullName").optional().trim().notEmpty(),
    body("phone").optional().trim().notEmpty(),
    body("address").optional().trim().notEmpty()
], async (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({message: errors.array()[0].msg});
    const fields = [];
    const values = [];
    for (const [key,column] of [["fullName","full_name"],["phone","phone"],["address","address"]]) {
        if (req.body[key] !== undefined) { fields.push(`${column} = ?`); values.push(String(req.body[key]).trim()); }
    }
    if (!fields.length) return res.status(400).json({message:"Provide profile fields to update."});
    try {
        await db.execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [...values, req.user.id]);
        res.json({message:"Profile updated."});
    } catch (error) { res.status(500).json({message:"Unable to update profile."}); }
});

module.exports = router;
