const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");

async function removeUpload(filePath) {
    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") console.error("Profile photo cleanup error:", error);
    }
}

async function removeProfilePicture(url) {
    if (typeof url !== "string" || !url.startsWith("/uploads/")) return;
    const filename = path.basename(url);
    if (filename) await removeUpload(path.join(uploadDir, filename));
}

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
            "SELECT id, full_name, email, phone, address, password, role, suspended_at, suspension_reason FROM users WHERE email = ?",
            [email]
        );

        if (!rows.length) return res.status(401).json({ message: "Incorrect email or password." });

        const account = rows[0];
        const passwordMatch = await bcrypt.compare(password, account.password);

        if (!passwordMatch || (Array.isArray(requiredRole) ? !requiredRole.includes(account.role) : account.role !== requiredRole)) {
            return res.status(401).json({ message: "Incorrect email or password." });
        }
        if (account.suspended_at) {
            return res.status(403).json({ message: `This account is suspended.${account.suspension_reason ? ` Reason: ${account.suspension_reason}` : ""}` });
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
router.post("/admin/login", loginRules, (req, res) => login(req, res, ["admin", "employee"]));

router.get("/me", verifyToken, async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT id, full_name, email, phone, address, current_location, emergency_contact_name, emergency_contact_phone, blood_type, health_conditions, allergies, role, profile_picture, theme, language, notification_preferences, account_visible, location_sharing, created_at FROM users WHERE id = ?",
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
                currentLocation: account.current_location,
                emergencyContactName: account.emergency_contact_name,
                emergencyContactPhone: account.emergency_contact_phone,
                bloodType: account.blood_type,
                healthConditions: account.health_conditions,
                allergies: account.allergies,
                role: account.role,
                profilePicture: account.profile_picture,
                theme: account.theme,
                language: account.language,
                notificationPreferences: account.notification_preferences ? (typeof account.notification_preferences === "string" ? JSON.parse(account.notification_preferences) : account.notification_preferences) : null,
                accountVisible: Boolean(account.account_visible),
                locationSharing: Boolean(account.location_sharing),
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
    body("address").optional().trim().notEmpty(),
    body("currentLocation").optional().trim().isLength({ max: 255 }),
    body("emergencyContactName").optional().trim().isLength({ max: 150 }),
    body("emergencyContactPhone").optional().trim().isLength({ max: 30 }),
    body("bloodType").optional({ values: "falsy" }).isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
    body("healthConditions").optional().trim().isLength({ max: 2000 }),
    body("allergies").optional().trim().isLength({ max: 2000 }),
    body("email").optional().trim().isEmail(),
    body("theme").optional().isIn(["light","dark","system"]),
    body("language").optional().isIn(["en","fil","ceb"]),
    body("accountVisible").optional().isBoolean(),
    body("locationSharing").optional().isBoolean(),
    body("notificationPreferences").optional().isObject()
], async (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({message: errors.array()[0].msg});
    const fields = [];
    const values = [];
    for (const [key,column] of [
        ["fullName","full_name"],["phone","phone"],["address","address"],
        ["currentLocation","current_location"],["emergencyContactName","emergency_contact_name"],
        ["emergencyContactPhone","emergency_contact_phone"],["bloodType","blood_type"],
        ["healthConditions","health_conditions"],["allergies","allergies"],
        ["email","email"],["theme","theme"],["language","language"],
        ["accountVisible","account_visible"],["locationSharing","location_sharing"]
    ]) {
        if (req.body[key] !== undefined) {
            fields.push(`${column} = ?`);
            if (key === "accountVisible" || key === "locationSharing") values.push(Boolean(req.body[key]) ? 1 : 0);
            else if (key === "bloodType") values.push(req.body[key] || null);
            else values.push(String(req.body[key]).trim());
        }
    }
    if (req.body.notificationPreferences !== undefined) {
        fields.push("notification_preferences = ?");
        values.push(JSON.stringify(req.body.notificationPreferences));
    }
    if (!fields.length) return res.status(400).json({message:"Provide profile fields to update."});
    try {
        await db.execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, [...values, req.user.id]);
        res.json({message:"Profile updated."});
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") return res.status(409).json({message:"An account with this email already exists."});
        res.status(500).json({message:"Unable to update profile."});
    }
});

router.post("/me/photo", verifyToken, upload.single("photo"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Choose a JPG or PNG profile photo under the upload size limit." });
    try {
        const [rows] = await db.execute("SELECT profile_picture FROM users WHERE id = ?", [req.user.id]);
        if (!rows.length) {
            await removeUpload(req.file.path);
            return res.status(404).json({ message: "Account not found." });
        }
        const profilePicture = `/uploads/${req.file.filename}`;
        await db.execute("UPDATE users SET profile_picture = ? WHERE id = ?", [profilePicture, req.user.id]);
        const previous = rows[0].profile_picture;
        if (previous !== profilePicture) await removeProfilePicture(previous);
        res.json({ message: "Profile photo updated.", profilePicture });
    } catch (error) {
        await removeUpload(req.file.path);
        console.error("Profile photo update error:", error);
        res.status(500).json({ message: "Unable to update your profile photo." });
    }
});

router.patch("/password", verifyToken, [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters."),
    body("confirmNewPassword").custom((value, { req }) => value === req.body.newPassword).withMessage("New passwords do not match.")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    try {
        const [rows] = await db.execute("SELECT password FROM users WHERE id = ?", [req.user.id]);
        if (!rows.length) return res.status(404).json({ message: "Account not found." });
        if (!await bcrypt.compare(req.body.currentPassword, rows[0].password)) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }
        const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
        await db.execute("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.user.id]);
        res.json({ message: "Password changed successfully." });
    } catch (error) {
        console.error("Password update error:", error);
        res.status(500).json({ message: "Unable to change password." });
    }
});

router.delete("/me", verifyToken, [
    body("password").notEmpty().withMessage("Password reauthentication is required."),
    body("passwordConfirmation").notEmpty().withMessage("Confirm your password to proceed."),
    body("passwordConfirmation").custom((value, { req }) => value === req.body.password).withMessage("Passwords do not match.")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    try {
        const [rows] = await db.execute("SELECT password, role, profile_picture FROM users WHERE id = ?", [req.user.id]);
        if (!rows.length) return res.status(404).json({ message: "Account not found." });
        if (rows[0].role === "admin") return res.status(403).json({ message: "Administrator accounts must be deleted through the administrator process." });
        if (!await bcrypt.compare(req.body.password, rows[0].password)) {
            return res.status(401).json({ message: "Password reauthentication failed." });
        }
        await db.execute("DELETE FROM moderation_logs WHERE performed_by = ?", [req.user.id]);
        await db.execute("DELETE FROM users WHERE id = ?", [req.user.id]);
        await removeProfilePicture(rows[0].profile_picture);
        res.json({ message: "Your account has been deleted." });
    } catch (error) {
        console.error("Account deletion error:", error);
        res.status(500).json({ message: "Unable to delete your account." });
    }
});

module.exports = router;
