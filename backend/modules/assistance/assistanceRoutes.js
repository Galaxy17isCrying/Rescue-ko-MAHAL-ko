const express = require("express");
const db = require("../../config/db");
const verifyStaff = require("../../middleware/auth").verifyStaff;
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
 const allowedUrgencies=["Normal","Urgent","Life-threatening"];
 if(urgency&&!allowedUrgencies.includes(urgency)) return res.status(400).json({message:"Invalid urgency. Choose Normal, Urgent, or Life-threatening."});
 try {
  const [r] = await db.execute("INSERT INTO assistance_requests (user_id,request_type,description,location,barangay,contact_number,urgency,status) VALUES (?,?,?,?,?,?,?,'Pending')",[req.user.id,request_type,description,location,barangay || null,contact_number || null,urgency || "Normal"]);
  res.status(201).json({message:"Assistance request submitted.",id:r.insertId});
 } catch(e){res.status(500).json({message:"Unable to submit request."});}
});
router.patch("/:id/status", verifyStaff, async(req,res)=>{
 const allowed=["Pending","Accepted","In Progress","Completed","Rejected"];
 if(!allowed.includes(req.body.status)) return res.status(400).json({message:"Invalid status."});
 const notes=req.body.admin_notes===undefined?undefined:String(req.body.admin_notes).trim();
 if(notes!==undefined&&notes.length>1000)return res.status(400).json({message:"Admin notes must be 1,000 characters or fewer."});
 let connection;
 let committed=false;
 try{
  connection=await db.getConnection();
  await connection.beginTransaction();
  const [rows]=await connection.execute("SELECT status,admin_notes FROM assistance_requests WHERE id=? FOR UPDATE",[req.params.id]);
  if(!rows.length){await connection.rollback();return res.status(404).json({message:"Request not found."});}
  const nextNotes=notes===undefined?(rows[0].admin_notes||""):notes;
  await connection.execute("UPDATE assistance_requests SET status=?,admin_notes=? WHERE id=?",[req.body.status,nextNotes||null,req.params.id]);
  await connection.execute("INSERT INTO moderation_logs (record_type,record_id,action,reason,performed_by) VALUES ('assistance_request',?,?,?,?)",[req.params.id,`${rows[0].status} -> ${req.body.status}`,nextNotes||null,req.user.id]);
  await connection.commit();
  committed=true;
  res.json({message:"Request updated."});
 }catch(e){
  if(connection&&!committed){try{await connection.rollback();}catch(rollbackError){console.error("Assistance status rollback error:",rollbackError);}}
  console.error("Assistance status update error:",e);
  res.status(500).json({message:"Unable to update request."});
 }finally{connection?.release();}
});
module.exports=router;
