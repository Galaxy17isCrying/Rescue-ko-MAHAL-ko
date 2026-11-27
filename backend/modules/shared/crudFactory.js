const db = require("../../config/db");

function createCrudRouter({ table, fields, searchFields = [], filterFields = [], orderBy = "created_at DESC", publicRead = false }) {
  const express = require("express");
  const router = express.Router();
  const verifyToken = require("../../middleware/auth");
  const verifyAdmin = require("../../middleware/auth").verifyAdmin;
  const allowed = new Set(fields);
  const columns = fields.join(", ");

  router.get("/", async (req, res) => {
    try {
      const where = [];
      const values = [];
      if (req.query.status && allowed.has("status")) { where.push("status = ?"); values.push(req.query.status); }
      if (req.query.q && searchFields.length) {
        where.push(`(${searchFields.map(field => `${field} LIKE ?`).join(" OR ")})`);
        searchFields.forEach(() => values.push(`%${String(req.query.q).slice(0, 100)}%`));
      }
      for (const field of filterFields) {
        const filterValue = req.query[field];
        if (typeof filterValue === "string" && filterValue.trim()) {
          where.push(`${field} = ?`);
          values.push(filterValue.trim());
        }
      }
      const sql = `SELECT id, ${columns} FROM ${table}${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY ${orderBy} LIMIT 250`;
      const [rows] = await db.execute(sql, values);
      res.json({ items: rows });
    } catch (error) { console.error(`${table} list:`, error); res.status(500).json({ message: "Unable to load records." }); }
  });

  router.post("/", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const entries = Object.entries(req.body || {}).filter(([key, value]) => allowed.has(key) && value !== undefined);
      if (!entries.length) return res.status(400).json({ message: "Provide at least one valid field." });
      for (const [key, value] of entries) if (typeof value === "string" && value.length > 5000) return res.status(400).json({ message: `${key} is too long.` });
      const names = entries.map(([key]) => key);
      const [result] = await db.execute(`INSERT INTO ${table} (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`, entries.map(([key, value]) => ((key.endsWith("_at") || key.endsWith("_date")) && value === "") ? null : value));
      res.status(201).json({ message: "Record created.", id: result.insertId });
    } catch (error) { console.error(`${table} create:`, error); res.status(500).json({ message: "Unable to create record." }); }
  });

  router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const entries = Object.entries(req.body || {}).filter(([key, value]) => allowed.has(key) && value !== undefined);
      if (!entries.length) return res.status(400).json({ message: "Provide fields to update." });
      const [result] = await db.execute(`UPDATE ${table} SET ${entries.map(([key]) => `${key} = ?`).join(", ")} WHERE id = ?`, [...entries.map(([key, value]) => ((key.endsWith("_at") || key.endsWith("_date")) && value === "") ? null : value), req.params.id]);
      if (!result.affectedRows) {
        const [matches] = await db.execute(`SELECT id FROM ${table} WHERE id = ?`, [req.params.id]);
        if (!matches.length) return res.status(404).json({ message: "Record not found." });
      }
      res.json({ message: "Record updated." });
    } catch (error) { console.error(`${table} update:`, error); res.status(500).json({ message: "Unable to update record." }); }
  });

  router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const [result] = await db.execute(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
      if (!result.affectedRows) return res.status(404).json({ message: "Record not found." });
      res.json({ message: "Record deleted." });
    } catch (error) { console.error(`${table} delete:`, error); res.status(500).json({ message: "Unable to delete record. Related records may still exist." }); }
  });
  return router;
}
module.exports = createCrudRouter;
