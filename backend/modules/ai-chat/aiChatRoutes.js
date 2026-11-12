const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false });
const allowedTopics = /health|hospital|clinic|pharmacy|emergency|disaster|typhoon|rain|weather|flood|pagasa|evacuat|relief|incident|report|website|account|assistance|first aid|earthquake|preparedness|safety|warning/i;
router.post("/", limiter, async (req,res)=>{
 const message=String(req.body.message || "").trim();
 if(!message || message.length>2000) return res.status(400).json({message:"Enter a message up to 2,000 characters."});
 if(!allowedTopics.test(message)) return res.json({reply:"I can help with healthcare information, emergencies, disaster preparedness, weather safety, evacuation, relief, incident reporting, and using this website. Please ask me something related to those topics."});
 if(!process.env.OPENAI_API_KEY) return res.status(503).json({message:"ResQ AI is not configured yet. Add OPENAI_API_KEY to backend/.env."});
 try{
  const response=await fetch("https://api.openai.com/v1/chat/completions",{
   method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},
   body:JSON.stringify({model:process.env.OPENAI_MODEL || "gpt-4o-mini",temperature:0.2,messages:[
    {role:"system",content:"You are ResQ AI for a Philippine community healthcare and disaster assistance platform. Only answer health information, healthcare facilities, emergencies, disaster preparedness, PAGASA safety, evacuation centers, relief, incident reporting, and website navigation. Do not diagnose or prescribe. For serious symptoms advise professional care. For life-threatening emergencies say call 911 in the Philippines now. Never invent facility locations, phone numbers, live warnings, or API data. Say when you cannot verify current information. Ask permission before using location; you cannot access it unless user provides it. Keep answers concise and practical. Never claim to predict earthquakes."},
    {role:"user",content:message}
   ]})
  });
  const data=await response.json();
  if(!response.ok) return res.status(502).json({message:"The AI service could not respond. Check the backend API configuration."});
  res.json({reply:data.choices?.[0]?.message?.content || "I couldn't prepare an answer. Please try again."});
 }catch(e){console.error("ResQ AI:",e);res.status(502).json({message:"Unable to reach ResQ AI right now."});}
});
module.exports=router;
