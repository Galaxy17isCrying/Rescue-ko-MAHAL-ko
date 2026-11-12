const express = require("express");
const db = require("../config/db");
const verifyToken = require("../middleware/auth");
const verifyAdmin = require("../middleware/auth").verifyAdmin;
const router = express.Router();
router.use(verifyToken, verifyAdmin);
router.get("/overview", async (_req,res)=>{
 try{
  const queries = await Promise.all([
   db.execute("SELECT COUNT(*) totalUsers FROM users WHERE role='user'"),
   db.execute("SELECT COUNT(*) totalReports, SUM(status='Pending') pendingReports, SUM(status='Verified') verifiedReports, SUM(status='Rejected') rejectedReports FROM incident_reports"),
   db.execute("SELECT COUNT(*) totalAssistance FROM assistance_requests"),
   db.execute("SELECT COUNT(*) totalFacilities FROM healthcare_facilities"),
   db.execute("SELECT COUNT(*) totalEvacuationCenters FROM evacuation_centers")
  ]);
  res.json({stats:{...queries[0][0][0],...queries[1][0][0],...queries[2][0][0],...queries[3][0][0],...queries[4][0][0]}});
 }catch(e){console.error(e);res.status(500).json({message:"Unable to load dashboard statistics. Import the latest database schema."});}
});
router.get("/users",async(_req,res)=>{
 try{const [users]=await db.execute("SELECT id,full_name AS fullName,email,phone,address,role,created_at AS createdAt FROM users ORDER BY created_at DESC");res.json({users});}
 catch(e){res.status(500).json({message:"Unable to load users."});}
});
module.exports=router;
