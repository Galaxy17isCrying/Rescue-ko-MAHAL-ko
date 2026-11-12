const express = require("express");
const db = require("../../config/db");
const upload = require("../../middleware/uploadMiddleware");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT r.*, u.full_name AS reporter_name FROM incident_reports r JOIN users u ON u.id=r.user_id WHERE (? = 'admin' OR r.user_id=?) ORDER BY r.created_at DESC LIMIT 250",
      [req.user.role, req.user.id]
    );
    res.json({ items: rows });
  } catch (error) { console.error(error); res.status(500).json({ message: "Unable to load reports." }); }
});
router.post("/", upload.array("photos", 5), async (req, res) => {
  const { title, description, category, location, barangay, incident_at, urgent_without_photo } = req.body;
  if (!title || !description || !category || !location) return res.status(400).json({ message: "Title, description, category, and location are required." });
  if (!req.files?.length && urgent_without_photo !== "true") return res.status(400).json({ message: "Attach a photo or mark this as an urgent report without photo evidence." });
  const status = req.files?.length ? "Pending" : "Unverified - Evidence Pending";
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      "INSERT INTO incident_reports (user_id,title,description,category,location,barangay,incident_at,status) VALUES (?,?,?,?,?,?,?,?)",
      [req.user.id,title.slice(0,180),description,category,location,barangay || null,incident_at || new Date(),status]
    );
    for (const file of req.files || []) await connection.execute(
      "INSERT INTO incident_photos (report_id,file_name,original_name,mime_type) VALUES (?,?,?,?)",
      [result.insertId,file.filename,file.originalname,file.mimetype]
    );
    await connection.commit();
    res.status(201).json({ message: "Incident report submitted.", id: result.insertId, status });
  } catch (error) { await connection.rollback(); console.error(error); res.status(500).json({ message: "Unable to submit report." }); }
  finally { connection.release(); }
});
router.get("/:id/photos", async (req,res) => {
  try {
    const [rows] = await db.execute("SELECT p.* FROM incident_photos p JOIN incident_reports r ON r.id=p.report_id WHERE r.id=? AND (?='admin' OR r.user_id=?)", [req.params.id,req.user.role,req.user.id]);
    res.json({ photos: rows.map(p => ({...p, url: `/uploads/${p.file_name}`})) });
  } catch(e) { res.status(500).json({message:"Unable to load photos."}); }
});
router.patch("/:id/moderate", async (req,res) => {
  if (req.user.role !== "admin") return res.status(403).json({message:"Admin access only."});
  const { status, rejection_reason } = req.body;
  if (!["Verified","Rejected","Under Review","Resolved"].includes(status)) return res.status(400).json({message:"Invalid moderation status."});
  if (status === "Rejected" && !String(rejection_reason || "").trim()) return res.status(400).json({message:"A rejection reason is required."});
  try {
    const [result] = await db.execute("UPDATE incident_reports SET status=?, rejection_reason=?, reviewed_by=?, reviewed_at=NOW() WHERE id=?", [status,rejection_reason || null,req.user.id,req.params.id]);
    if (!result.affectedRows) return res.status(404).json({message:"Report not found."});
    await db.execute("INSERT INTO moderation_logs (record_type,record_id,action,reason,performed_by) VALUES ('incident',?,?,?,?)", [req.params.id,status,rejection_reason || null,req.user.id]);
    res.json({message:"Report status updated."});
  } catch(e) { console.error(e); res.status(500).json({message:"Unable to moderate report."}); }
});
module.exports = router;
