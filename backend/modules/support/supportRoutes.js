const express = require("express");
const db = require("../../config/db");
const verifyToken = require("../../middleware/auth");
const verifyAdmin = require("../../middleware/auth").verifyAdmin;

const router = express.Router();
const categories = new Set(["Complaint", "Technical issue", "Password/access help", "Other"]);
const statuses = new Set(["Open", "In Progress", "Resolved"]);

router.use(verifyToken);

router.get("/", async (req, res) => {
    try {
        if (req.user.role === "admin") {
            const [items] = await db.execute(
                "SELECT t.id, t.user_id AS userId, u.full_name AS requesterName, t.category, t.subject, t.message, t.status, t.admin_reply AS adminReply, t.created_at AS createdAt, t.updated_at AS updatedAt FROM support_tickets t JOIN users u ON u.id = t.user_id ORDER BY FIELD(t.status,'Open','In Progress','Resolved'), t.updated_at DESC LIMIT 200",
            );
            return res.json({ items });
        }

        const [items] = await db.execute(
            "SELECT id, category, subject, message, status, admin_reply AS adminReply, created_at AS createdAt, updated_at AS updatedAt FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            [req.user.id],
        );
        res.json({ items });
    } catch (error) {
        console.error("Support ticket list error:", error);
        res.status(500).json({ message: "Unable to load support requests." });
    }
});

router.post("/", async (req, res) => {
    if (req.user.role !== "user") {
        return res.status(403).json({ message: "Only user accounts can submit a support request." });
    }

    const category = String(req.body?.category || "");
    const subject = String(req.body?.subject || "").trim();
    const message = String(req.body?.message || "").trim();
    if (!categories.has(category) || !subject || subject.length > 160 || !message || message.length > 4000) {
        return res.status(400).json({
            message: "Choose a request type, enter a subject up to 160 characters, and provide details up to 4,000 characters.",
        });
    }

    try {
        const [result] = await db.execute(
            "INSERT INTO support_tickets (user_id, category, subject, message) VALUES (?, ?, ?, ?)",
            [req.user.id, category, subject, message],
        );
        res.status(201).json({ id: result.insertId, message: "Support request submitted." });
    } catch (error) {
        console.error("Support ticket create error:", error);
        res.status(500).json({ message: "Unable to submit your support request." });
    }
});

router.patch("/:id", verifyAdmin, async (req, res) => {
    const ticketId = Number(req.params.id);
    const status = String(req.body?.status || "");
    const adminReply = String(req.body?.adminReply || "").trim();
    if (!Number.isSafeInteger(ticketId) || ticketId < 1) {
        return res.status(400).json({ message: "Invalid support request id." });
    }
    if (!statuses.has(status) || adminReply.length > 4000) {
        return res.status(400).json({ message: "Choose a valid status and a reply of no more than 4,000 characters." });
    }

    let connection;
    let committed = false;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [tickets] = await connection.execute(
            "SELECT id FROM support_tickets WHERE id = ? FOR UPDATE",
            [ticketId],
        );
        if (!tickets.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Support request not found." });
        }
        await connection.execute(
            "UPDATE support_tickets SET status = ?, admin_reply = ? WHERE id = ?",
            [status, adminReply || null, ticketId],
        );
        await connection.execute(
            "INSERT INTO moderation_logs (record_type, record_id, action, reason, performed_by) VALUES ('support_ticket', ?, ?, ?, ?)",
            [ticketId, `status updated to ${status}`, adminReply || null, req.user.id],
        );
        await connection.commit();
        committed = true;
        res.json({ message: "Support request updated." });
    } catch (error) {
        if (connection && !committed) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Support ticket rollback error:", rollbackError);
            }
        }
        console.error("Support ticket update error:", error);
        res.status(500).json({ message: "Unable to update the support request." });
    } finally {
        connection?.release();
    }
});

module.exports = router;
