const express = require("express");
const db = require("../../config/db");
const router = express.Router();
router.get("/", async (req,res) => {
 try {
  const [rows] = await db.execute("SELECT a.*,u.full_name AS requester_name FROM assistance_requests a JOIN users u ON u.id=a.user_id WHERE (?='admin' OR a.user_id=?) ORDER BY a.created_at DESC LIMIT 250",[req.user.role,req.user.id]);
  res.json({items:rows});
 } catch(e){res.status(500).json({message:"Unable to load requests."});}
});
router.post("/", async (req,res) => {
 const {request_type,description,location,barangay,contact_number,urgency} = req.body;
 if(!request_type || !description || !location) return res.status(400).json({message:"Request type, description, and location are required."});
 try {
  const [r] = await db.execute("INSERT INTO assistance_requests (user_id,request_type,description,location,barangay,contact_number,urgency,status) VALUES (?,?,?,?,?,?,?,'Pending')",[req.user.id,request_type,description,location,barangay || null,contact_number || null,urgency || "Normal"]);
  res.status(201).json({message:"Assistance request submitted.",id:r.insertId});
 } catch(e){res.status(500).json({message:"Unable to submit request."});}
});
router.patch("/:id/status", async(req,res)=>{
 if(req.user.role!=="admin") return res.status(403).json({message:"Admin access only."});
 const allowed=["Pending","Accepted","In Progress","Completed","Rejected"];
 if(!allowed.includes(req.body.status)) return res.status(400).json({message:"Invalid status."});
 try{
  const [r]=await db.execute("UPDATE assistance_requests SET status=?,admin_notes=? WHERE id=?",[req.body.status,req.body.admin_notes || null,req.params.id]);
  if(!r.affectedRows)return res.status(404).json({message:"Request not found."});
  res.json({message:"Request updated."});
 }catch(e){res.status(500).json({message:"Unable to update request."});}
});
module.exports=router;
