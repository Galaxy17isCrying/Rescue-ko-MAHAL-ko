const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`)
});
function fileFilter(_req, file, cb) {
  const allowed = ["image/jpeg", "image/png"];
  cb(allowed.includes(file.mimetype) ? null : new Error("Only JPG and PNG images are allowed."), allowed.includes(file.mimetype));
}
module.exports = multer({ storage, fileFilter, limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 8) * 1024 * 1024, files: 5 } });
