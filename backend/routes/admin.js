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
   db.execute("SELECT COUNT(*) totalReports, COALESCE(SUM(status IN ('Pending','Under Review','Unverified - Evidence Pending')),0) pendingReports, COALESCE(SUM(status='Verified'),0) verifiedReports, COALESCE(SUM(status='Rejected'),0) rejectedReports FROM incident_reports"),
   db.execute("SELECT COUNT(*) totalAssistance, COALESCE(SUM(status IN ('Pending','Accepted','In Progress')),0) pendingAssistance, COALESCE(SUM(urgency IN ('Urgent','Life-threatening') AND status IN ('Pending','Accepted','In Progress')),0) urgentAssistance FROM assistance_requests"),
   db.execute("SELECT COUNT(*) totalFacilities FROM healthcare_facilities"),
   db.execute("SELECT COUNT(*) totalEvacuationCenters FROM evacuation_centers"),
   db.execute("SELECT COUNT(*) pendingReliefRequests FROM relief_requests WHERE status='Pending'"),
   db.execute("SELECT COUNT(*) activeAnnouncements FROM announcements WHERE status='Published' AND starts_at<=NOW() AND (expires_at IS NULL OR expires_at>NOW())"),
   db.execute("SELECT COUNT(*) openSupportTickets FROM support_tickets WHERE status IN ('Open','In Progress')")
  ]);
  res.json({stats:{...queries[0][0][0],...queries[1][0][0],...queries[2][0][0],...queries[3][0][0],...queries[4][0][0],...queries[5][0][0],...queries[6][0][0],...queries[7][0][0]}});
 }catch(e){console.error(e);res.status(500).json({message:"Unable to load dashboard statistics. Import the latest database schema."});}
});
router.get("/charts", async (_req,res)=>{
 try{
  const [incidentStatuses,assistanceStatuses,weeklyActivity]=await Promise.all([
   db.execute("SELECT status AS label, COUNT(*) AS value FROM incident_reports GROUP BY status ORDER BY FIELD(status,'Pending','Under Review','Unverified - Evidence Pending','Verified','Resolved','Rejected')"),
   db.execute("SELECT status AS label, COUNT(*) AS value FROM assistance_requests GROUP BY status ORDER BY FIELD(status,'Pending','Accepted','In Progress','Completed','Rejected')"),
   db.execute("WITH RECURSIVE calendar(day) AS (SELECT CURDATE() - INTERVAL 6 DAY UNION ALL SELECT day + INTERVAL 1 DAY FROM calendar WHERE day < CURDATE()), daily_activity AS (SELECT DATE(created_at) AS day, COUNT(*) AS incidentReports, 0 AS assistanceRequests FROM incident_reports WHERE created_at >= CURDATE() - INTERVAL 6 DAY AND created_at < CURDATE() + INTERVAL 1 DAY GROUP BY DATE(created_at) UNION ALL SELECT DATE(created_at) AS day, 0 AS incidentReports, COUNT(*) AS assistanceRequests FROM assistance_requests WHERE created_at >= CURDATE() - INTERVAL 6 DAY AND created_at < CURDATE() + INTERVAL 1 DAY GROUP BY DATE(created_at)) SELECT DATE_FORMAT(calendar.day,'%Y-%m-%d') AS day, COALESCE(SUM(daily_activity.incidentReports),0) AS incidentReports, COALESCE(SUM(daily_activity.assistanceRequests),0) AS assistanceRequests FROM calendar LEFT JOIN daily_activity ON daily_activity.day = calendar.day GROUP BY calendar.day ORDER BY calendar.day")
  ]);
  res.json({charts:{
   incidentStatuses:incidentStatuses[0].map(item=>({...item,value:Number(item.value)})),
   assistanceStatuses:assistanceStatuses[0].map(item=>({...item,value:Number(item.value)})),
   weeklyActivity:weeklyActivity[0].map(day=>({...day,incidentReports:Number(day.incidentReports),assistanceRequests:Number(day.assistanceRequests)}))
  }});
 }catch(error){console.error("Admin dashboard charts error:",error);res.status(500).json({message:"Unable to load dashboard charts."});}
});
router.get("/users",async(_req,res)=>{
 try{const [users]=await db.execute("SELECT id,full_name AS fullName,role,created_at AS createdAt FROM users ORDER BY created_at DESC");res.json({users});}
 catch(e){res.status(500).json({message:"Unable to load users."});}
});
router.get("/users/:id",async(req,res)=>{
 const userId=Number(req.params.id);
 if(!Number.isSafeInteger(userId)||userId<1)return res.status(400).json({message:"Invalid user id."});
 let connection;
 let committed=false;
 try{
  connection=await db.getConnection();
  await connection.beginTransaction();
  const [users]=await connection.execute("SELECT id,full_name AS fullName,email,phone,address,role,created_at AS createdAt FROM users WHERE id=? AND role='user' FOR UPDATE",[userId]);
  if(!users.length){await connection.rollback();return res.status(404).json({message:"User account not found."});}
  await connection.execute("INSERT INTO moderation_logs (record_type,record_id,action,performed_by) VALUES ('user_profile',?,'viewed_contact_details',?)",[userId,req.user.id]);
  await connection.commit();
  committed=true;
  res.json({user:users[0]});
 }catch(error){
  if(connection&&!committed){try{await connection.rollback();}catch(rollbackError){console.error("Profile audit rollback error:",rollbackError);}}
  console.error("Admin profile view error:",error);
  res.status(500).json({message:"Unable to load user contact details."});
 }finally{connection?.release();}
});
router.get("/triage",async(_req,res)=>{
 try{
  const [assistance,incidents]=await Promise.all([
   db.execute("SELECT id,request_type AS title,description,location,barangay,contact_number,urgency,status,created_at AS createdAt,updated_at AS updatedAt, 'assistance' AS type, user_id AS userId, (SELECT full_name FROM users WHERE id=user_id) AS requesterName FROM assistance_requests WHERE status IN ('Pending','Accepted','In Progress') ORDER BY FIELD(urgency,'Life-threatening','Urgent','Normal'),created_at ASC LIMIT 100"),
   db.execute("SELECT id,title,description,location,barangay,status,created_at AS createdAt, 'incident' AS type, user_id AS userId, (SELECT full_name FROM users WHERE id=user_id) AS requesterName FROM incident_reports WHERE status IN ('Pending','Under Review','Unverified - Evidence Pending') ORDER BY created_at ASC LIMIT 100")
  ]);
  const items=[
   ...assistance[0].map(item=>({...item,priority:item.urgency==="Life-threatening"?0:item.urgency==="Urgent"?1:2})),
   ...incidents[0].map(item=>({...item,urgency:null,priority:3}))
  ].sort((a,b)=>a.priority-b.priority||new Date(a.createdAt)-new Date(b.createdAt));
  res.json({items:items.slice(0,100)});
 }catch(error){console.error("Admin triage error:",error);res.status(500).json({message:"Unable to load the triage queue."});}
});
router.get("/activity",async(_req,res)=>{
 try{
  const [items]=await db.execute("SELECT l.id,l.record_type AS recordType,l.record_id AS recordId,l.action,l.reason,l.created_at AS createdAt,u.full_name AS performedBy FROM moderation_logs l JOIN users u ON u.id=l.performed_by ORDER BY l.created_at DESC LIMIT 25");
  res.json({items});
 }catch(error){console.error("Admin activity error:",error);res.status(500).json({message:"Unable to load administrator activity."});}
});
module.exports=router;
