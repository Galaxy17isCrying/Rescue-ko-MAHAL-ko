const express = require("express");
const router = express.Router();
router.get("/", async(req,res)=>{
 const lat=Number(req.query.lat), lon=Number(req.query.lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) return res.status(400).json({message:"Valid latitude and longitude are required."});
 try{
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=auto`;
  const response=await fetch(url);
  if(!response.ok) throw new Error("Weather provider error");
  res.json({source:"Open-Meteo",sourceUrl:"https://open-meteo.com/",data:await response.json()});
 }catch(e){res.status(502).json({message:"Weather information is temporarily unavailable."});}
});
module.exports=router;
