const express = require("express");
const db = require("../../config/db");
const verifyStaff = require("../../middleware/auth").verifyStaff;

const router = express.Router();
const allowedCategories = new Set(["Food", "Drinking water", "Medicine", "Hygiene", "Infant supplies", "Shelter", "Clothing", "Other"]);
const allowedStatuses = new Set(["Pending", "Verified", "Assigned", "Distributed", "Rejected"]);

router.get("/", async (req, res) => {
    try {
        const [requests] = await db.execute(
            "SELECT r.id,r.user_id,r.household_size,r.location,r.barangay,r.contact_number,r.notes,r.status,CASE WHEN ? = 'admin' THEN r.admin_notes ELSE NULL END AS admin_notes,r.assigned_to,r.created_at,r.updated_at,u.full_name AS requester_name FROM relief_requests r JOIN users u ON u.id = r.user_id WHERE (? = 'admin' OR r.user_id = ?) ORDER BY FIELD(r.status,'Pending','Verified','Assigned','Distributed','Rejected'), r.created_at ASC LIMIT 250",
            [req.user.role, req.user.role, req.user.id],
        );
        if (!requests.length) return res.json({ items: [] });

        const placeholders = requests.map(() => "?").join(",");
        const [requestItems] = await db.execute(
            `SELECT request_id, category, quantity FROM relief_request_items WHERE request_id IN (${placeholders}) ORDER BY category`,
            requests.map(request => request.id),
        );
        const itemsByRequest = new Map();
        requestItems.forEach(item => {
            const current = itemsByRequest.get(item.request_id) || [];
            current.push({ category: item.category, quantity: item.quantity });
            itemsByRequest.set(item.request_id, current);
        });
        res.json({ items: requests.map(request => ({ ...request, requested_items: itemsByRequest.get(request.id) || [] })) });
    } catch (error) {
        console.error("Relief request list error:", error);
        res.status(500).json({ message: "Unable to load relief requests." });
    }
});

router.post("/", async (req, res) => {
    if (req.user.role !== "user") return res.status(403).json({ message: "Only community accounts can submit relief requests." });

    const body = req.body || {};
    const location = String(body.location || "").trim();
    const barangay = String(body.barangay || "").trim();
    const contactNumber = String(body.contact_number || "").trim();
    const notes = String(body.notes || "").trim();
    const householdSize = Number(body.household_size);
    const submittedItems = body.items;
    if (!location || location.length > 255 || !barangay || barangay.length > 120) {
        return res.status(400).json({ message: "A valid location and barangay are required." });
    }
    if (!Number.isInteger(householdSize) || householdSize < 1 || householdSize > 50) {
        return res.status(400).json({ message: "Household size must be between 1 and 50." });
    }
    if (contactNumber.length > 40 || notes.length > 1000) {
        return res.status(400).json({ message: "Contact number or additional notes are too long." });
    }
    if (!Array.isArray(submittedItems) || submittedItems.length < 1 || submittedItems.length > allowedCategories.size) {
        return res.status(400).json({ message: "Select at least one relief item." });
    }

    const seenCategories = new Set();
    const items = [];
    for (const item of submittedItems) {
        const category = String(item?.category || "");
        const quantity = Number(item?.quantity);
        if (!allowedCategories.has(category) || seenCategories.has(category) || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
            return res.status(400).json({ message: "Choose valid, unique relief items and quantities between 1 and 50." });
        }
        seenCategories.add(category);
        items.push({ category, quantity });
    }

    let connection;
    let committed = false;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [result] = await connection.execute(
            "INSERT INTO relief_requests (user_id, household_size, location, barangay, contact_number, notes) VALUES (?, ?, ?, ?, ?, ?)",
            [req.user.id, householdSize, location, barangay, contactNumber || null, notes || null],
        );
        for (const item of items) {
            await connection.execute(
                "INSERT INTO relief_request_items (request_id, category, quantity) VALUES (?, ?, ?)",
                [result.insertId, item.category, item.quantity],
            );
        }
        await connection.commit();
        committed = true;
        res.status(201).json({ message: "Relief request submitted.", id: result.insertId });
    } catch (error) {
        if (connection && !committed) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Relief request rollback error:", rollbackError);
            }
        }
        console.error("Relief request submission error:", error);
        res.status(500).json({ message: "Unable to submit relief request." });
    } finally {
        connection?.release();
    }
});

router.patch("/:id/status", verifyStaff, async (req, res) => {
    const body = req.body || {};
    const status = String(body.status || "");
    const adminNotes = body.admin_notes === undefined ? undefined : String(body.admin_notes).trim();
    if (!allowedStatuses.has(status)) return res.status(400).json({ message: "Invalid relief request status." });
    if (adminNotes !== undefined && adminNotes.length > 1000) return res.status(400).json({ message: "Admin notes must be 1,000 characters or fewer." });

    let connection;
    let committed = false;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [rows] = await connection.execute("SELECT status, admin_notes FROM relief_requests WHERE id = ? FOR UPDATE", [req.params.id]);
        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Relief request not found." });
        }
        const previousNotes = rows[0].admin_notes || "";
        const nextNotes = adminNotes === undefined ? previousNotes : adminNotes;
        await connection.execute(
            "UPDATE relief_requests SET status = ?, admin_notes = ?, assigned_to = CASE WHEN ? = 'Assigned' THEN ? ELSE assigned_to END WHERE id = ?",
            [status, nextNotes || null, status, req.user.id, req.params.id],
        );
        await connection.execute(
            "INSERT INTO moderation_logs (record_type, record_id, action, reason, performed_by) VALUES ('relief_request', ?, ?, ?, ?)",
            [req.params.id, rows[0].status === status ? "coordination_note_updated" : `${rows[0].status} -> ${status}`, nextNotes || null, req.user.id],
        );
        await connection.commit();
        committed = true;
        res.json({ message: "Relief request status updated." });
    } catch (error) {
        if (connection && !committed) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Relief status rollback error:", rollbackError);
            }
        }
        console.error("Relief status update error:", error);
        res.status(500).json({ message: "Unable to update relief request." });
    } finally {
        connection?.release();
    }
});

module.exports = router;
