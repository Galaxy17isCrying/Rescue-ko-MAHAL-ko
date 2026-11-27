require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
const db = require("./config/db");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const verifyToken = require("./middleware/auth");
const verifyAdmin = require("./middleware/auth").verifyAdmin;
const healthcareRoutes = require("./modules/healthcare/healthcareRoutes");
const evacuationRoutes = require("./modules/evacuation/evacuationRoutes");
const warningRoutes = require("./modules/warnings/warningsRoutes");
const reliefRoutes = require("./modules/relief/reliefRoutes");
const incidentRoutes = require("./modules/incident-reports/incidentReportRoutes");
const assistanceRoutes = require("./modules/assistance/assistanceRoutes");
const reliefRequestRoutes = require("./modules/relief/reliefRequestRoutes");
const announcementRoutes = require("./modules/announcements/announcementRoutes");
const supportRoutes = require("./modules/support/supportRoutes");
const aiRoutes = require("./modules/ai-chat/aiChatRoutes");
const weatherRoutes = require("./modules/map-warning/weatherRoutes");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET must be set to a random secret of at least 32 characters.");
  process.exit(1);
}
const app = express();
const PORT = process.env.PORT || 5001;
const configuredFrontendOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);
const frontendOrigins = new Set(configuredFrontendOrigins);
configuredFrontendOrigins.forEach(origin => {
  if (/^https?:\/\/localhost(?::\d+)?$/i.test(origin)) {
    frontendOrigins.add(origin.replace(/:\/\/localhost/i, "://127.0.0.1"));
  } else if (/^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin)) {
    frontendOrigins.add(origin.replace("://127.0.0.1", "://localhost"));
  }
});
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: [...frontendOrigins], credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(process.env.UPLOAD_DIR || "uploads"), { dotfiles: "deny", index: false }));
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.get("/", (_req,res)=>res.json({message:"ResQ Ko, Mahal Ko API is running."}));
app.get("/api/health", async(_req,res)=>{
 try{await db.query("SELECT 1");res.json({status:"ok",database:"connected"});}
 catch(e){res.status(500).json({status:"error",database:"not connected"});}
});
app.use("/api/auth",authRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/healthcare",healthcareRoutes);
app.use("/api/evacuation",evacuationRoutes);
app.use("/api/warnings",warningRoutes);
app.use("/api/relief",reliefRoutes);
app.use("/api/relief-requests",verifyToken,reliefRequestRoutes);
app.use("/api/announcements",announcementRoutes);
app.use("/api/support",supportRoutes);
app.use("/api/incidents",verifyToken,incidentRoutes);
app.use("/api/assistance",verifyToken,assistanceRoutes);
app.use("/api/ai-chat",aiRoutes);
app.use("/api/weather",weatherRoutes);
app.use((err,_req,res,_next)=>{console.error(err);res.status(400).json({message:err.message || "Request failed."});});
app.listen(PORT,()=>console.log(`ResQ backend running at http://localhost:${PORT}`));
