const express = require("express");
const db = require("../../config/db");
const verifyToken = require("../../middleware/auth");
const verifyAdmin = require("../../middleware/auth").verifyAdmin;

const router = express.Router();
const severities = new Set(["Information", "Advisory", "Urgent", "Emergency"]);
const audiences = new Set(["All", "Barangay"]);
const editableStatuses = new Set(["Draft", "Published"]);
const statusUpdates = new Set(["Draft", "Published", "Cancelled"]);

function mysqlDateTime(value) {
    if (!value) return null;
    const text = String(value).trim();
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return undefined;
    const normalized = text.replace("T", " ");
    return normalized.length === 16 ? `${normalized}:00` : normalized.slice(0, 19);
}

function validateAnnouncement(body, status) {
    const title = String(body.title || "").trim();
    const description = String(body.body || "").trim();
    const severity = String(body.severity || "Information");
    const audience = String(body.audience || "All");
    const targetBarangay = String(body.target_barangay || "").trim();
    const sourceName = String(body.source_name || "").trim();
    const sourceUrl = String(body.source_url || "").trim();
    const startsAt = mysqlDateTime(body.starts_at);
    const expiresAt = mysqlDateTime(body.expires_at);

    if (!title || title.length > 180 || !description || description.length > 5000) {
        return { error: "Enter a title (up to 180 characters) and message (up to 5,000 characters)." };
    }
    if (!severities.has(severity) || !audiences.has(audience) || !editableStatuses.has(status)) {
        return { error: "Choose valid announcement severity, audience, and status values." };
    }
    if (!sourceName || sourceName.length > 120 || sourceUrl.length > 500) {
        return { error: "A source name is required and must be 120 characters or fewer." };
    }
    if (audience === "Barangay" && (!targetBarangay || targetBarangay.length > 120)) {
        return { error: "Enter a barangay for a targeted announcement." };
    }
    if (sourceUrl) {
        try {
            const parsedUrl = new URL(sourceUrl);
            if (!["http:", "https:"].includes(parsedUrl.protocol)) return { error: "Source URL must use HTTP or HTTPS." };
        } catch {
            return { error: "Enter a valid source URL." };
        }
    }
    if (startsAt === undefined || expiresAt === undefined) return { error: "Enter valid announcement dates." };
    if (status === "Published" && !expiresAt) return { error: "Set an expiry time before publishing." };
    if (status === "Published" && new Date(expiresAt).getTime() <= Date.now()) return { error: "Set an expiry time in the future before publishing." };
    if (expiresAt && new Date(expiresAt).getTime() <= new Date(startsAt || Date.now()).getTime()) {
        return { error: "The expiry time must be after the start time." };
    }

    return {
        value: {
            title,
            body: description,
            severity,
            audience,
            target_barangay: audience === "Barangay" ? targetBarangay : null,
            source_name: sourceName,
            source_url: sourceUrl || null,
            status,
            starts_at: startsAt,
            expires_at: expiresAt,
        },
    };
}

async function writeAudit(connection, announcementId, action, adminId) {
    await connection.execute(
        "INSERT INTO moderation_logs (record_type, record_id, action, performed_by) VALUES ('announcement', ?, ?, ?)",
        [announcementId, action, adminId],
    );
}

router.get("/", async (req, res) => {
    const barangay = String(req.query.barangay || "").trim().slice(0, 120);
    try {
        const [items] = await db.execute(
            "SELECT id, title, body, severity, audience, target_barangay, source_name, source_url, starts_at, expires_at, created_at, updated_at FROM announcements WHERE status = 'Published' AND starts_at <= NOW() AND (expires_at IS NULL OR expires_at > NOW()) AND (audience = 'All' OR ? = '' OR LOWER(target_barangay) = LOWER(?)) ORDER BY FIELD(severity,'Emergency','Urgent','Advisory','Information'), starts_at DESC LIMIT 100",
            [barangay, barangay],
        );
        res.json({ items });
    } catch (error) {
        console.error("Public announcement list error:", error);
        res.status(500).json({ message: "Unable to load announcements." });
    }
});

router.get("/admin", verifyToken, verifyAdmin, async (_req, res) => {
    try {
        const [items] = await db.execute(
            "SELECT a.*, creator.full_name AS creator_name FROM announcements a LEFT JOIN users creator ON creator.id = a.created_by ORDER BY FIELD(a.status,'Published','Draft','Cancelled'), a.starts_at DESC LIMIT 250",
        );
        res.json({ items });
    } catch (error) {
        console.error("Admin announcement list error:", error);
        res.status(500).json({ message: "Unable to load announcement management." });
    }
});

router.post("/", verifyToken, verifyAdmin, async (req, res) => {
    const input = req.body || {};
    const status = String(input.status || "Draft");
    const validated = validateAnnouncement(input, status);
    if (validated.error) return res.status(400).json({ message: validated.error });

    let connection;
    let committed = false;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const value = validated.value;
        const [result] = await connection.execute(
            "INSERT INTO announcements (title, body, severity, audience, target_barangay, source_name, source_url, status, starts_at, expires_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()), ?, ?, ?)",
            [value.title, value.body, value.severity, value.audience, value.target_barangay, value.source_name, value.source_url, value.status, value.starts_at, value.expires_at, req.user.id, req.user.id],
        );
        await writeAudit(connection, result.insertId, `created_${value.status.toLowerCase()}`, req.user.id);
        await connection.commit();
        committed = true;
        res.status(201).json({ message: "Announcement saved.", id: result.insertId });
    } catch (error) {
        if (connection && !committed) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Announcement create rollback error:", rollbackError);
            }
        }
        console.error("Announcement create error:", error);
        res.status(500).json({ message: "Unable to save announcement." });
    } finally {
        connection?.release();
    }
});

router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
    const input = req.body || {};
    const status = String(input.status || "Draft");
    const validated = validateAnnouncement(input, status);
    if (validated.error) return res.status(400).json({ message: validated.error });

    let connection;
    let committed = false;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [existing] = await connection.execute("SELECT id FROM announcements WHERE id = ? FOR UPDATE", [req.params.id]);
        if (!existing.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Announcement not found." });
        }
        const value = validated.value;
        await connection.execute(
            "UPDATE announcements SET title = ?, body = ?, severity = ?, audience = ?, target_barangay = ?, source_name = ?, source_url = ?, status = ?, starts_at = COALESCE(?, NOW()), expires_at = ?, updated_by = ? WHERE id = ?",
            [value.title, value.body, value.severity, value.audience, value.target_barangay, value.source_name, value.source_url, value.status, value.starts_at, value.expires_at, req.user.id, req.params.id],
        );
        await writeAudit(connection, Number(req.params.id), `updated_${value.status.toLowerCase()}`, req.user.id);
        await connection.commit();
        committed = true;
        res.json({ message: "Announcement updated." });
    } catch (error) {
        if (connection && !committed) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Announcement update rollback error:", rollbackError);
            }
        }
        console.error("Announcement update error:", error);
        res.status(500).json({ message: "Unable to update announcement." });
    } finally {
        connection?.release();
    }
});

router.patch("/:id/status", verifyToken, verifyAdmin, async (req, res) => {
    const status = String(req.body?.status || "");
    if (!statusUpdates.has(status)) return res.status(400).json({ message: "Invalid announcement status." });

    let connection;
    let committed = false;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [rows] = await connection.execute("SELECT status, expires_at, starts_at FROM announcements WHERE id = ? FOR UPDATE", [req.params.id]);
        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Announcement not found." });
        }
        if (status === "Published" && (!rows[0].expires_at || new Date(rows[0].expires_at).getTime() <= Date.now())) {
            await connection.rollback();
            return res.status(400).json({ message: "Set a future expiry time before publishing." });
        }
        await connection.execute("UPDATE announcements SET status = ?, updated_by = ? WHERE id = ?", [status, req.user.id, req.params.id]);
        await writeAudit(connection, Number(req.params.id), `status_${rows[0].status.toLowerCase()}_to_${status.toLowerCase()}`, req.user.id);
        await connection.commit();
        committed = true;
        res.json({ message: "Announcement status updated." });
    } catch (error) {
        if (connection && !committed) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Announcement status rollback error:", rollbackError);
            }
        }
        console.error("Announcement status update error:", error);
        res.status(500).json({ message: "Unable to update announcement status." });
    } finally {
        connection?.release();
    }
});

module.exports = router;
