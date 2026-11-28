import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Clock3, MapPin, Package, PhoneCall, RefreshCw, ShieldAlert, Navigation, ExternalLink, Siren, Hospital, TentTree, ClipboardList, HandHeart, Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Search, Settings, Sun, Megaphone, X, LifeBuoy, Wind } from "lucide-react";
import api, { API_ORIGIN } from "../services/api";
import MapView from "../components/MapView";
import { geocodePlace, findHealthcare } from "../services/places";
import { useLanguage } from "../i18n/LanguageContext";
import AdminDashboardCharts from "../components/AdminDashboardCharts";
import { AdminActivityPanel, AdminAuditLog, AdminTriageQueue, AnnouncementPreview, AnnouncementsWorkspace, PasswordResetWorkspace, ReliefRequestIntake, ReliefRequestsWorkspace, SupportResponsesWorkspace, SupportWorkspace } from "./AdminWorkflows";
import TyphoonHistoryWorkspace from "../components/TyphoonHistoryWorkspace";
import "./featureWorkspace.css";

const config={
 healthcare:{title:"Healthcare directory",endpoint:"/healthcare",fields:["name","facility_type","address","barangay","phone","operating_hours","latitude","longitude","services"],labels:["Facility name","Type (Hospital/Clinic/Pharmacy/Health Center/Emergency)","Address","Barangay","Contact number","Operating hours","Latitude","Longitude","Services"],map:true},
 warnings:{title:"Safety alerts",endpoint:"/warnings",fields:["title","description","hazard_type","severity","status","source_name","source_url","area_name","starts_at","ends_at"],labels:["Title","Description","Hazard type","Severity","Status","Official source","Source URL","Affected area","Start date/time","End date/time"]},
 evacuation:{title:"Evacuation centers",endpoint:"/evacuation",fields:["name","address","barangay","facilities","contact_number","capacity","current_status","latitude","longitude"],labels:["Center name","Address","Barangay","Facilities","Contact number","Capacity","Status","Latitude","Longitude"],map:true},
 relief:{title:"Relief information",endpoint:"/relief",fields:["item_name","description","quantity_available","distribution_location","distribution_date","status"],labels:["Item name","Description","Quantity available","Distribution location","Distribution date","Status"]},
 incidents:{title:"Incident reports",endpoint:"/incidents",fields:["title","description","category","location","barangay","incident_at"],labels:["Title","Description","Category","Location","Barangay","Incident date/time"]},
 assistance:{title:"Emergency assistance",endpoint:"/assistance",fields:["request_type","description","location","barangay","contact_number","urgency"],labels:["Request type","Description","Location","Barangay","Contact number","Urgency"]}
};
const URGENCY_OPTIONS=["Normal","Urgent","Life-threatening"];
function Field({name,label,value,onChange,t=(text)=>text}) {
 const type=name.endsWith("_at")?"datetime-local":name.endsWith("_date")?"date":name==="quantity_available"||name==="capacity"?"number":"text";
 const optional=["barangay","phone","operating_hours","latitude","longitude","services","facilities","contact_number","capacity","ends_at","distribution_date"].includes(name);
 return <label className="field">{label}{(name==="description"||name==="services"||name==="facilities")?<textarea name={name} value={value||""} onChange={onChange} required={name!=="services"&&name!=="facilities"}/>:name==="urgency"?<select name={name} value={value||""} onChange={onChange} required><option value="">{t("Select urgency")}</option><option value="Normal">{t("Normal")} — {t("Can wait; routine assistance")}</option><option value="Urgent">{t("Urgent")} — {t("Needs prompt assistance")}</option><option value="Life-threatening">{t("Life-threatening")} — {t("Immediate danger; call 911")}</option></select>:<input name={name} type={type} value={value||""} onChange={onChange} required={!optional}/>}</label>;
}
function hasCoordinates(item){
 return item.latitude!==null&&item.latitude!==undefined&&item.latitude!==""&&item.longitude!==null&&item.longitude!==undefined&&item.longitude!==""&&Number.isFinite(Number(item.latitude))&&Number.isFinite(Number(item.longitude))&&Math.abs(Number(item.latitude))<=90&&Math.abs(Number(item.longitude))<=180;
}
function weatherDescription(code,t=(text)=>text){
 const descriptions={0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",80:"Light rain showers",81:"Rain showers",82:"Heavy rain showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Severe thunderstorm with hail"};
 return t(descriptions[code]||"Conditions unavailable");
}
function weatherIcon(code){
 if(code===0)return Sun;
 if([1,2].includes(code))return CloudSun;
 if([3,45,48].includes(code))return Cloud;
 if([51,53,55].includes(code))return CloudDrizzle;
 if([61,63,65,80,81,82].includes(code))return CloudRain;
 if([95,96,99].includes(code))return CloudLightning;
 return CloudSun;
}
function dashboardDate(value){
 if(!value)return null;
 const date=new Date(value);
 return Number.isNaN(date.getTime())?null:date.toLocaleString("en-PH",{dateStyle:"medium",timeStyle:"short"});
}
function dashboardError(error,fallback){
 return error?.response?.data?.message||error?.message||fallback;
}
const PHILIPPINE_REGIONS=[{minLat:12,maxLat:21.5,minLon:119,maxLon:127.5},{minLat:7.5,maxLat:12.5,minLon:116.5,maxLon:120.5},{minLat:9,maxLat:12.8,minLon:121.5,maxLon:127.5},{minLat:4.5,maxLat:9.5,minLon:120.5,maxLon:127.5},{minLat:4.5,maxLat:7.8,minLon:118.8,maxLon:123.5}];
function isPhilippinesCoordinate(lat,lon){return PHILIPPINE_REGIONS.some(region=>lat>=region.minLat&&lat<=region.maxLat&&lon>=region.minLon&&lon<=region.maxLon);}
const HEALTHCARE_FILTERS=["Hospital","Clinic","Pharmacy","Health Center","Emergency"];
function matchesHealthcareFilters(item,selectedTypes){
 if(!selectedTypes.length)return true;
 const type=String(item.facility_type||"").toLowerCase();
 return selectedTypes.some(selected=>{
  if(selected==="Emergency")return item.emergency===true||item.emergency===1||item.emergency==="yes"||type.includes("emergency")||type.includes("ambulance");
  if(selected==="Clinic")return type.includes("clinic")||type.includes("doctor");
  if(selected==="Health Center")return type.includes("health center")||type.includes("health centre");
  return type.includes(selected.toLowerCase());
 });
}
function DashboardOverview({admin,user,onNavigate}){
 const {t}=useLanguage();
 const [alerts,setAlerts]=useState({items:[],loading:true,error:""});
 const [weather,setWeather]=useState({data:null,place:null,loading:true,error:""});
 const [activity,setActivity]=useState({latest:null,loading:true,error:""});
 const [alertsRetry,setAlertsRetry]=useState(0);
 const [weatherRetry,setWeatherRetry]=useState(0);
 const [activityRetry,setActivityRetry]=useState(0);
 const currentLocation=String(user?.currentLocation||"").trim();

 useEffect(()=>{
  let active=true;
  setAlerts({items:[],loading:true,error:""});
  api.get("/warnings",{timeout:12000}).then(response=>{
   if(!Array.isArray(response.data?.items))throw new Error("The safety alert response did not contain a warning list.");
   if(active)setAlerts({items:response.data.items.filter(item=>item.status==="Active"),loading:false,error:""});
  }).catch(error=>{
   if(active)setAlerts({items:[],loading:false,error:dashboardError(error,"Unable to load active safety alerts.")});
  });
  return()=>{active=false;};
 },[user?.id,alertsRetry]);

 useEffect(()=>{
  let active=true;
  if(!currentLocation){
   setWeather({data:null,place:null,loading:false,error:""});
   return()=>{active=false;};
  }
  setWeather({data:null,place:null,loading:true,error:""});
  (async()=>{
   try{
    const places=await geocodePlace(currentLocation);
    if(!places.length)throw new Error("Your saved location could not be found in the Philippines.");
    const place=places[0];
    const response=await api.get("/weather",{params:{lat:place.latitude,lon:place.longitude},timeout:12000});
    if(active)setWeather({data:response.data,place,loading:false,error:""});
   }catch(error){
    if(active)setWeather({data:null,place:null,loading:false,error:dashboardError(error,"Unable to load weather for your saved location.")});
   }
  })();
  return()=>{active=false;};
 },[user?.id,currentLocation,weatherRetry]);

 useEffect(()=>{
  let active=true;
  setActivity({latest:null,loading:true,error:""});
  (async()=>{
   const results=await Promise.allSettled([api.get("/incidents",{timeout:12000}),api.get("/assistance",{timeout:12000})]);
   if(!active)return;
   const records=[];
   const failures=[];
   const sources=[
    {result:results[0],kind:"Incident report",target:"incidents",titleField:"title"},
    {result:results[1],kind:"Assistance request",target:"assistance",titleField:"request_type"}
   ];
   sources.forEach(({result,kind,target,titleField})=>{
    if(result.status==="rejected"){
     failures.push(`${kind}: ${dashboardError(result.reason,`Unable to load ${kind.toLowerCase()}.`)}`);
     return;
    }
    const items=result.value.data?.items;
    if(!Array.isArray(items)){
     failures.push(`${kind}: response did not contain a record list.`);
     return;
    }
    items.forEach(item=>records.push({
     kind,
     target,
     title:item[titleField],
     location:item.location,
     status:item.status,
     timestamp:item.created_at||item.incident_at||item.requested_at
    }));
   });
   records.sort((left,right)=>(Date.parse(right.timestamp)||0)-(Date.parse(left.timestamp)||0));
   const failureMessage=failures.length
    ?`${failures.map(message=>message.replace(/[.!?]+$/,"")).join(". ")}.${records.length?" The latest activity may be incomplete.":""}`
    :"";
   setActivity({latest:records[0]||null,loading:false,error:failureMessage});
  })();
  return()=>{active=false;};
 },[user?.id,activityRetry]);

 const quickLinks=[
  ["assistance","Emergency assistance","Request help from responders.",HandHeart],
  ["support","Help & support",admin?"Review complaints and account-help requests.":"Contact staff with a complaint or request account help.",LifeBuoy],
  ["healthcare","Healthcare directory","Browse health facilities.",Hospital],
  ["warnings","Safety alerts","Check active safety updates.",Siren],
  ["incidents","Incident reports","Submit and track reports.",ClipboardList],
  ["evacuation","Evacuation centers","Find local evacuation information.",TentTree],
  ["relief","Relief information","View available relief information.",Package],
  ["announcements","Announcements","Read current community updates.",Megaphone],
  ["weather","Weather forecast","Check current forecast information.",CloudSun],
  ...(admin?[["users","User accounts","Manage registered accounts.",ClipboardList],["relief-requests","Relief requests","Track household relief needs.",Package]]:[])
 ];
 const current=weather.data?.currentWeather?.data?.current;
 const WeatherIcon=current?weatherIcon(current.weather_code):CloudSun;
 const checkedAt=dashboardDate(weather.data?.checkedAt);
 const weatherPlace=weather.place?.name?.split(",").slice(0,2).join(", ");
 const warningTime=warning=>{
  if(warning.starts_at)return [t("Starts"),dashboardDate(warning.starts_at)];
  if(warning.last_updated)return [t("Updated"),dashboardDate(warning.last_updated)];
  if(warning.created_at)return [t("Reported"),dashboardDate(warning.created_at)];
  return [t("Time"),null];
 };
 const retryButton=(label,onClick,loading)=> <button type="button" className="secondary-button dashboard-retry" onClick={onClick} disabled={loading}><RefreshCw size={15}/>{loading?t("Loading…"):t(label)}</button>;

 return <section className="workspace dashboard-workspace">
  <div className="dashboard-welcome"><span className="dashboard-eyebrow"><ShieldAlert size={16}/>{t(admin?"ADMIN OPERATIONS":"COMMUNITY SAFETY DASHBOARD")}</span><h1>{admin?t("Admin overview"):`${t("Welcome")}, ${user?.fullName||t("community member")}!`}</h1><p>{t(admin?"Review urgent requests, account needs, and public updates.":"Your community safety dashboard. Get help, find verified resources, and stay informed.")}</p></div>
  <AnnouncementPreview onNavigate={onNavigate}/>
  {!admin&&<section className="dashboard-emergency" aria-labelledby="dashboard-emergency-title"><span className="dashboard-emergency-icon" aria-hidden="true"><ShieldAlert size={22}/></span><div className="dashboard-emergency-copy"><h2 id="dashboard-emergency-title">{t("Need urgent help?")}</h2><p>{t("For life-threatening emergencies in the Philippines, call:")}</p><span className="dashboard-emergency-number"><strong>911</strong></span><p className="dashboard-emergency-instructions">{t("Follow instructions from local authorities.")}</p></div></section>}
  {admin&&<><AdminTriageQueue onNavigate={onNavigate}/><AdminActivityPanel/><AdminDashboardCharts/></>}

  <section className="dashboard-section" aria-labelledby="dashboard-alerts-title">
   <div className="dashboard-section-heading"><div><h2 id="dashboard-alerts-title">{t("Active safety alerts")}</h2><p>{t("Current warnings listed by the connected ResQ service.")}</p></div>{retryButton("Retry",()=>setAlertsRetry(value=>value+1),alerts.loading)}</div>
   {alerts.loading?<div className="dashboard-state" role="status"><RefreshCw size={18}/>{t("Loading active safety alerts…")}</div>
    :alerts.error?<div className="dashboard-state dashboard-state-error" role="alert"><AlertTriangle size={18}/><span>{t(alerts.error)}</span></div>
    :alerts.items.length===0?<div className="dashboard-state dashboard-state-empty"><ShieldAlert size={19}/><span>{t("No active safety warnings are currently listed.")}</span></div>
    :<div className="dashboard-alert-grid">{alerts.items.slice(0,4).map(warning=>{
      const severity=String(warning.severity||"").toLowerCase();
      const [timeLabel,timeValue]=warningTime(warning);
      return <article className={`dashboard-alert-card severity-${severity}`} key={warning.id}>
       <div className="dashboard-alert-title"><AlertTriangle size={18}/><div><h3>{warning.title}</h3><span>{t(warning.hazard_type||"Hazard type not provided")}</span></div></div>
       <div className="dashboard-alert-meta"><span><strong>{t("Severity")}:</strong> {warning.severity||t("Not provided")}</span><span><MapPin size={15}/><strong>{t("Area")}:</strong> {warning.area_name||t("Not provided")}</span><span><Clock3 size={15}/><strong>{timeLabel}:</strong> {timeValue||t("Not provided by source")}</span></div>
      </article>;
     })}</div>}
  </section>

  <div className="dashboard-summary-grid">
   <section className="dashboard-section dashboard-weather-section" aria-labelledby="dashboard-weather-title">
    <div className="dashboard-section-heading"><div><h2 id="dashboard-weather-title">{t("Current weather")}</h2><p>{weatherPlace||currentLocation||t("Your saved location")}</p></div>{retryButton("Retry",()=>setWeatherRetry(value=>value+1),weather.loading)}</div>
    {weather.loading?<div className="dashboard-state" role="status"><RefreshCw size={18}/>{t("Loading weather…")}</div>
     :weather.error?<div className="dashboard-state dashboard-state-error" role="alert"><AlertTriangle size={18}/><span>{t(weather.error)}</span></div>
     :!currentLocation?<div className="dashboard-state dashboard-state-empty"><CloudSun size={21}/><span>{t("Add a current location to see local weather.")}</span><button type="button" className="secondary-button" onClick={()=>onNavigate?.("profile")}>{t("Set location")}</button></div>
     :!current?<div className="dashboard-state dashboard-state-empty"><CloudSun size={21}/><span>{t("Current conditions were not provided for this location.")}</span>{checkedAt&&<small>{t("Last checked")}: {checkedAt}</small>}</div>
     :<article className="dashboard-weather-card"><span className="dashboard-weather-icon"><WeatherIcon size={24}/></span><strong>{current.temperature_2m!=null?`${current.temperature_2m}°C`:t("Temperature unavailable")}</strong><b>{weatherDescription(current.weather_code,t)}</b><span>{weatherPlace}</span><small>{t("Updated")}: {checkedAt||t("Time not provided by source")}</small>{current.relative_humidity_2m!=null&&<small>{t("Humidity")}: {current.relative_humidity_2m}%</small>}{current.wind_speed_10m!=null&&<small>{t("Wind")}: {current.wind_speed_10m} km/h</small>}<button type="button" className="dashboard-text-link" onClick={()=>onNavigate?.("weather")}>{t("Open weather forecast")}<ArrowRight size={15}/></button></article>}
   </section>

   <section className="dashboard-section dashboard-activity-section" aria-labelledby="dashboard-activity-title">
    <div className="dashboard-section-heading"><div><h2 id="dashboard-activity-title">{t("Latest activity")}</h2><p>{t(admin?"Latest incident report or assistance request across the community.":"Your most recent incident report or assistance request.")}</p></div>{retryButton("Retry",()=>setActivityRetry(value=>value+1),activity.loading)}</div>
    {activity.loading?<div className="dashboard-state" role="status"><RefreshCw size={18}/>{t("Loading recent activity…")}</div>
     :activity.error?<div className="dashboard-activity-result">{activity.latest&&<ActivityCard item={activity.latest} t={t} onNavigate={onNavigate}/>}<div className="dashboard-state dashboard-state-error" role="alert"><AlertTriangle size={18}/><span>{t(activity.error)}</span></div></div>
     :activity.latest?<ActivityCard item={activity.latest} t={t} onNavigate={onNavigate}/>
     :<div className="dashboard-state dashboard-state-empty"><ClipboardList size={20}/><span>{t("No incident reports or assistance requests are listed yet.")}</span></div>}
   </section>
  </div>

  <section className="dashboard-section" aria-labelledby="dashboard-quick-title"><div className="dashboard-section-heading"><div><h2 id="dashboard-quick-title">{t("Quick access")}</h2><p>{t("Go directly to the services you use most.")}</p></div></div><div className="dashboard-quick-grid">{quickLinks.map(([id,title,description,Icon],index)=><button type="button" className={`dashboard-quick-card${index===0?" priority":""}`} key={id} onClick={()=>onNavigate?.(id)}><span className="dashboard-quick-icon"><Icon size={20}/></span><b>{t(title)}</b><span>{t(description)}</span><strong>{t("Open")} <ArrowRight size={15}/></strong></button>)}</div></section>
  <p className="dashboard-disclaimer">{t("Information depends on reports and verified local updates. Submitting a request does not guarantee immediate rescue.")}</p>
 </section>;
}
function ActivityCard({item,t,onNavigate}){
 const date=dashboardDate(item.timestamp);
 return <article className="dashboard-activity-card"><span className="dashboard-activity-icon">{item.target==="assistance"?<HandHeart size={20}/>:<ClipboardList size={20}/>}</span><div className="dashboard-activity-copy"><span>{t(item.kind)}</span><h3>{item.title||t("Title not provided")}</h3><p><MapPin size={14}/>{item.location||t("Location not provided")}</p>{item.status&&<small>{t("Status")}: {item.status}</small>}<small><Clock3 size={14}/>{date||t("Time not provided")}</small><button type="button" className="dashboard-text-link" onClick={()=>onNavigate?.(item.target)}>{t("View")}<ArrowRight size={15}/></button></div></article>;
}
export default function FeatureWorkspace({feature,admin,employee,user,onNavigate,onUserUpdate}){
 const {t}=useLanguage();
 const [items,setItems]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [form,setForm]=useState({}),[photos,setPhotos]=useState([]),[urgent,setUrgent]=useState(false),[recordQuery,setRecordQuery]=useState(""),[mapQuery,setMapQuery]=useState(""),[facilityTypes,setFacilityTypes]=useState([]),[placeSuggestions,setPlaceSuggestions]=useState([]),[destinationSuggestions,setDestinationSuggestions]=useState([]);
 const [location,setLocation]=useState(null),[locationLabel,setLocationLabel]=useState(""),[forecastQuery,setForecastQuery]=useState(""),[weatherLoading,setWeatherLoading]=useState(false),[destination,setDestination]=useState(null),[destinationQuery,setDestinationQuery]=useState(""),[destinationLabel,setDestinationLabel]=useState(""),[routeRequested,setRouteRequested]=useState(false),[routeInfo,setRouteInfo]=useState(null),[routeLoading,setRouteLoading]=useState(false),[weather,setWeather]=useState(null);
 const [moderation,setModeration]=useState({}),[editingId,setEditingId]=useState(null);
 const [osmItems,setOsmItems]=useState([]),[focus,setFocus]=useState(null),[mapStatus,setMapStatus]=useState(""),[mapBusy,setMapBusy]=useState(false),[radiusKm,setRadiusKm]=useState(5);
 const itemsRequest=useRef(0),mapRequest=useRef(0),routeRequest=useRef(0);
 const isAdmin=admin;
 const isStaff=admin||employee;
 async function load(override){
  if(!config[feature])return;
  const requestId=++itemsRequest.current;
  const q=typeof override==="string"?override:recordQuery;
  setLoading(true);setError("");
  try{const params={q};const r=await api.get(config[feature].endpoint,{params});if(requestId===itemsRequest.current)setItems(r.data.items||[]);}
  catch(e){if(requestId===itemsRequest.current)setError(e.response?.data?.message||"Could not load records. Check your server and database.");}
  finally{if(requestId===itemsRequest.current)setLoading(false);}
 }
 useEffect(()=>{setRecordQuery("");setMapQuery("");setFacilityTypes([]);setPlaceSuggestions([]);setItems([]);setError("");if(config[feature])load("");return()=>{itemsRequest.current+=1;};},[feature]);
 useEffect(()=>{mapRequest.current+=1;routeRequest.current+=1;setOsmItems([]);setFocus(null);setMapStatus("");setMapBusy(false);setLocation(null);setLocationLabel("");setDestination(null);setDestinationQuery("");setDestinationLabel("");setDestinationSuggestions([]);setRouteRequested(false);setRouteInfo(null);setWeather(null);},[feature]);
 useEffect(()=>{if(user?.currentLocation)setForecastQuery(current=>current||user.currentLocation);},[user?.currentLocation]);
 function change(e){setForm({...form,[e.target.name]:e.target.value});}
 async function submit(e){
  e.preventDefault();setNotice("");setError("");
  try{
   if(feature==="incidents"){
    const data=new FormData();Object.entries(form).forEach(([k,v])=>data.append(k,v));
    data.append("urgent_without_photo",String(urgent));photos.forEach(file=>data.append("photos",file));
    await api.post("/incidents",data);
   }else if(editingId) await api.put(`${config[feature].endpoint}/${editingId}`,form);
   else await api.post(config[feature].endpoint,form);
   setNotice(editingId?"Record updated successfully.":"Submitted successfully.");setForm({});setEditingId(null);setPhotos([]);setUrgent(false);load();
  }catch(e){setError(e.response?.data?.message||"Unable to reach the ResQ API. Check that the backend is running and try again.");}
 }
 async function viewEvidence(id){
  try{const r=await api.get(`/incidents/${id}/photos`);if(!r.data.photos.length){setNotice("No photo evidence attached.");return;}r.data.photos.forEach(p=>window.open(`${API_ORIGIN}${p.url}`,"_blank","noopener"));}
  catch(e){setError(e.response?.data?.message||"Unable to open evidence.");}
 }
 async function moderate(id,status){
  try{await api.patch(`/incidents/${id}/moderate`,{status,rejection_reason:moderation[id]||""});setNotice("Report moderation saved.");load();}
  catch(e){setError(e.response?.data?.message||"Unable to update report.");}
 }
 function editRecord(item){
  const values={};config[feature].fields.forEach(field=>values[field]=item[field]??"");
  setForm(values);setEditingId(item.id);window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
 }
 async function deleteRecord(id){
  if(!window.confirm("Delete this record? This action cannot be undone."))return;
  try{await api.delete(`${config[feature].endpoint}/${id}`);setNotice("Record deleted.");load();}
  catch(e){setError(e.response?.data?.message||"Unable to delete record.");}
 }
 async function updateRequest(id,status){
  try{await api.patch(`/assistance/${id}/status`,{status});setNotice("Request status updated.");load();}
  catch(e){setError(e.response?.data?.message||"Unable to update request.");}
 }
 // withSearch=true also loads nearby healthcare facilities (used by the "Use my current location" button).
 function locate(withSearch=false){
  const searchHealthcare=withSearch&&feature==="healthcare";
  if(!navigator.geolocation){setError("Geolocation is not supported. You can enter a Philippine location instead.");setMapStatus("");setMapBusy(false);return;}
  if(searchHealthcare){setMapBusy(true);setMapStatus("Getting your location...");}
  setError("");
  navigator.geolocation.getCurrentPosition(pos=>{
   const here=[pos.coords.latitude,pos.coords.longitude];
   if(!isPhilippinesCoordinate(here[0],here[1])){setError("ResQ local safety information is available for locations in the Philippines only.");setMapStatus("");setMapBusy(false);return;}
   setLocation(here);
   setLocationLabel(t("Your current location"));
   setMapQuery(t("Your current location"));
   setRouteRequested(false);
   setRouteInfo(null);
   if(withSearch===true){
    setPlaceSuggestions([]);setFocus(null);
    if(feature==="healthcare")searchNearby(here[0],here[1],"your location");
  }
  },()=>{setError("Location permission was not granted. Enter an address manually or enable location permission.");setMapStatus("");setMapBusy(false);},{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
 }
 async function searchNearby(lat,lon,label,radius=radiusKm){
  const requestId=++mapRequest.current;
  setError("");setMapBusy(true);setMapStatus("Searching...");
  try{
   const found=await findHealthcare(lat,lon,radius*1000);
   if(requestId===mapRequest.current){setOsmItems(found);setMapStatus(found.length?`${found.length} healthcare facilit${found.length===1?"y":"ies"} found within ${radius} km of ${label}.`:`No healthcare facilities found within ${radius} km of ${label}. Try a larger radius.`);}
  }catch(e){if(requestId===mapRequest.current){setOsmItems([]);setMapStatus(e.message||"Could not load healthcare facilities.");}}
  finally{if(requestId===mapRequest.current)setMapBusy(false);}
 }
 async function searchAtPlace(place){
  const coordinates=[place.latitude,place.longitude],label=place.name.split(",")[0];
  setPlaceSuggestions([]);setMapQuery(place.name);setLocation(coordinates);setLocationLabel(label);setFocus(coordinates);setRouteRequested(false);setRouteInfo(null);
  if(feature==="healthcare")await searchNearby(coordinates[0],coordinates[1],label);
  else{setMapStatus(`Showing ${label}. Choose an evacuation center as your destination.`);setRecordQuery("");load("");}
 }
 function toggleFacilityType(type){
  setFacilityTypes(current=>current.includes(type)?current.filter(value=>value!==type):[...current,type]);
 }
 async function searchMap(){
  const requestId=++mapRequest.current;
  const text=mapQuery.trim();
  if(location&&text===locationLabel){
   setFocus(location);setMapStatus(`Using ${locationLabel} as your starting location.`);
   if(feature==="healthcare")await searchNearby(location[0],location[1],locationLabel);
   else{setRecordQuery("");load("");}
   return;
  }
  if(feature==="evacuation"){
   if(!text){setFocus(null);setMapStatus("");setMapBusy(false);setRecordQuery("");load("");return;}
   setMapBusy(true);setMapStatus("Searching...");
   try{
    const places=await geocodePlace(text);
    if(requestId!==mapRequest.current)return;
    if(places.length){
     if(places.length>1){setPlaceSuggestions(places);setMapStatus("Choose a matching location.");return;}
     await searchAtPlace(places[0]);
    }else{
     setMapStatus("No place found in the Philippines, showing matching database records instead.");
     setRecordQuery(text);load(text);
    }
   }catch(e){if(requestId===mapRequest.current)setMapStatus(e.message||"Place search failed.");}
   finally{if(requestId===mapRequest.current)setMapBusy(false);}
   return;
  }
  if(feature!=="healthcare"){load();return;}
  if(!text){setError("");setMapBusy(false);setMapStatus("Enter a Philippine city, barangay, address or landmark first.");return;}
  setPlaceSuggestions([]);
  setMapBusy(true);setError("");setMapStatus("Searching...");
  try{
   const places=await geocodePlace(text);
   if(requestId!==mapRequest.current)return;
   if(!places.length){setMapStatus("No place found in the Philippines for that search.");setMapBusy(false);return;}
   if(places.length>1){setPlaceSuggestions(places);setMapStatus("Choose a matching location.");setMapBusy(false);return;}
   await searchAtPlace(places[0]);
  }catch(e){if(requestId===mapRequest.current){setMapStatus(e.message||"Place search failed.");setMapBusy(false);}}
 }
 async function planRoute(event){
  event.preventDefault();
  const requestId=++routeRequest.current;
  setMapStatus("");setRouteInfo(null);setRouteRequested(false);setRouteLoading(true);
  try{
   let start=location,startLabel=locationLabel;
   if(!start){
    const originQuery=mapQuery.trim();
    if(!originQuery){setMapStatus("Enter a starting location or use your current location.");return;}
    const places=await geocodePlace(originQuery);
    if(requestId!==routeRequest.current)return;
    if(!places.length){setMapStatus("No starting location found in the Philippines.");return;}
    if(places.length>1){setPlaceSuggestions(places);setMapStatus("Choose a matching starting location.");return;}
    start=[places[0].latitude,places[0].longitude];startLabel=places[0].name.split(",")[0];
    setLocation(start);setLocationLabel(startLabel);setFocus(start);
   }
   const targetQuery=destinationQuery.trim();
   if(!targetQuery){setMapStatus("Enter a destination facility or center.");return;}
   const savedDestination=listItems.find(item=>hasCoordinates(item)&&String(item.name||"").trim().toLowerCase()===targetQuery.toLowerCase());
   let end,endLabel;
   if(destination&&destinationLabel){end=destination;endLabel=destinationLabel;}
   else if(savedDestination){end=[Number(savedDestination.latitude),Number(savedDestination.longitude)];endLabel=savedDestination.name;}
   else{
    const places=await geocodePlace(targetQuery);
    if(requestId!==routeRequest.current)return;
    if(!places.length){setMapStatus("No destination found in the Philippines.");return;}
    if(places.length>1){setDestinationSuggestions(places);setMapStatus("Choose a destination location.");return;}
    end=[places[0].latitude,places[0].longitude];endLabel=places[0].name.split(",")[0];
   }
   if(requestId!==routeRequest.current)return;
   setLocation(start);setLocationLabel(startLabel);setDestination(end);setDestinationLabel(endLabel);setDestinationSuggestions([]);setFocus(start);setRouteRequested(true);
  }catch(error){if(requestId===routeRequest.current)setMapStatus(error.message||"Could not plan this route.");}
  finally{if(requestId===routeRequest.current)setRouteLoading(false);}
 }
 function selectDestinationPlace(place){
  setDestination([place.latitude,place.longitude]);setDestinationLabel(place.name.split(",")[0]);setDestinationQuery(place.name);setDestinationSuggestions([]);setRouteInfo(null);setRouteRequested(false);setMapStatus("");
 }
 async function getWeather(coordinates=location,label=locationLabel){
  if(!coordinates){setError("Search for a Philippine city or choose your current location first.");return;}
  setError("");setWeather(null);setWeatherLoading(true);
  try{const r=await api.get("/weather",{params:{lat:coordinates[0],lon:coordinates[1]}});setLocation(coordinates);setLocationLabel(label||"Selected Philippine location");setWeather(r.data);}
  catch(e){setError(e.response?.data?.message||"Weather unavailable.");}
  finally{setWeatherLoading(false);}
 }
 async function searchWeatherLocation(event){
  event.preventDefault();
  const query=forecastQuery.trim();
  if(!query){setError("Enter a Philippine city, municipality, or place name.");return;}
  setError("");setWeather(null);setWeatherLoading(true);
  try{
   const places=await geocodePlace(query);
   if(!places.length){setError("No matching place found in the Philippines. Try a city or municipality name.");return;}
   const place=places[0];
   await getWeather([place.latitude,place.longitude],place.name.split(",").slice(0,2).join(", "));
  }catch(e){setError(e.message||"Could not find that place.");}
  finally{setWeatherLoading(false);}
 }
 function locateWeather(){
  if(!navigator.geolocation){setError("Geolocation is not supported. Search for a Philippine city instead.");return;}
  setError("");setWeatherLoading(true);
  navigator.geolocation.getCurrentPosition(async pos=>{
   const coords=[pos.coords.latitude,pos.coords.longitude];
   if(!isPhilippinesCoordinate(coords[0],coords[1])){setWeatherLoading(false);setError("ResQ local weather is available for locations in the Philippines only.");return;}
   await getWeather(coords,"Your current location");
  },()=>{setWeatherLoading(false);setError("Location permission was not granted. Search for a Philippine city instead.");});
 }
 if(feature==="profile")return <ProfileWorkspace user={user} onUserUpdate={onUserUpdate} onNavigate={onNavigate}/>;
 if(feature==="support-responses")return (admin||employee)?<SupportResponsesWorkspace onNavigate={onNavigate}/>:null;
 if(feature==="password-resets")return (admin||employee)?<PasswordResetWorkspace admin={admin}/>:null;
 if(feature==="audit-log")return admin?<AdminAuditLog/>:null;
 if(feature==="settings")return <SettingsWorkspace user={user} onLogout={undefined}/>;
 if(feature==="announcements")return <AnnouncementsWorkspace admin={admin}/>;
 if(feature==="relief-requests")return (admin||employee)?<ReliefRequestsWorkspace/>:null;
 if(feature==="overview")return <DashboardOverview admin={admin||employee} user={user} onNavigate={onNavigate}/>;
 if(feature==="users")return <UserManagement/>;
 if(feature==="support")return <SupportWorkspace admin={admin||employee} onNavigate={onNavigate}/>;
 if(feature==="typhoons")return <TyphoonHistoryWorkspace onNavigate={onNavigate}/>;
 if(feature==="weather"){
  const current=weather?.currentWeather?.data?.current;
  const today=weather?.currentWeather?.data?.daily;
  const hourly=weather?.currentWeather?.data?.hourly;
  const nextHours=(hourly?.time||[]).map((time,index)=>({time,probability:hourly.precipitation_probability?.[index],code:hourly.weather_code?.[index]})).filter(hour=>!current?.time||hour.time>=current.time).slice(0,24);
  const forecastDays=(today?.time||[]).map((date,index)=>({date,min:today.temperature_2m_min?.[index],max:today.temperature_2m_max?.[index],code:today.weather_code?.[index],rain:today.precipitation_probability_max?.[index]}));
  return <section className="workspace"><div className="workspace-heading"><div><h1>{t("Philippines weather & alerts")}</h1><p>{t("Search any Philippine city while traveling, or use your current location. International locations are filtered out.")}</p></div><div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}><button type="button" className="secondary-button" onClick={()=>onNavigate?.("typhoons")}><Wind size={16}/> {t("Typhoon history")}</button><button type="button" className="secondary-button" onClick={()=>onNavigate?.("warnings")}><Siren size={16}/> {t("Safety alerts")}</button></div></div>
   {error&&<div className="alert error">{error}</div>}
   <form className="weather-location-form" onSubmit={searchWeatherLocation}><label className="field">{t("Search a city or place in the Philippines")}<input type="search" autoComplete="off" name="forecast-location" value={forecastQuery} onChange={e=>setForecastQuery(e.target.value)} placeholder={t("e.g. Cebu City, Baguio, Davao City")}/></label><button type="submit" className="primary-button" disabled={weatherLoading}>{weatherLoading?t("Loading…"):t("Search forecast")}</button></form>
   <div className="weather-actions"><button type="button" className="secondary-button" onClick={locateWeather} disabled={weatherLoading}><MapPin size={16}/> {t("Use my current location")}</button><button type="button" className="secondary-button" onClick={()=>getWeather()} disabled={!location||weatherLoading}><RefreshCw size={16}/> {t("Refresh forecast")}</button>{locationLabel&&<small>{t("Forecast for")} {locationLabel}</small>}</div>
   {weather&&<><div className="weather-summary-grid">
    {current&&<><article className="weather-summary-card weather-current"><span>{t("Current conditions")}</span><strong>{current.temperature_2m}°C</strong><b>{weatherDescription(current.weather_code,t)}</b><small>{t("Humidity")} {current.relative_humidity_2m}% · {t("Wind")} {current.wind_speed_10m} km/h · {t("Rain")} {current.precipitation} mm</small></article>
     <article className="weather-summary-card"><span>{t("Today's forecast")}</span><strong>{today?.temperature_2m_min?.[0]}°–{today?.temperature_2m_max?.[0]}°C</strong><b>{weatherDescription(today?.weather_code?.[0],t)}</b><small>{t("Rain probability up to")} {today?.precipitation_probability_max?.[0]??"—"}%</small></article></>}
    <article className="weather-summary-card noah-status-card"><span>Typhoon track status · UP NOAH / PAGASA</span><strong>{weather.noah?.available?(weather.noah.activeTrackCount>0?`${weather.noah.activeTrackCount} track feature${weather.noah.activeTrackCount===1?"":"s"}`:"No plotted tracks"):"Feed unavailable"}</strong><b>{weather.noah?.available?(weather.noah.activeTrackCount>0?"Forecast track data is available.":"No active typhoon tracks are currently listed in this feed."):"Could not load the current UP NOAH track feed."}</b><small>An empty track feed does not predict whether a typhoon may form later. Check PAGASA bulletins for official advisories.</small><a href={weather.noah?.sourceUrl||"https://noah.up.edu.ph/weather-updates"} target="_blank" rel="noreferrer">Open UP NOAH weather updates <ExternalLink size={13}/></a></article>
   </div>
   {nextHours.length>0&&<section className="rain-probability" aria-labelledby="rain-probability-title"><div><h2 id="rain-probability-title">{t("Rain probability · next 24 hours")}</h2><p>{t("Hourly precipitation chance for")} {locationLabel||t("your selected Philippine location")}.</p></div><div className={`rain-probability-content${weather.noah?.available&&weather.noah.rainfallImageUrl?" has-rainfall-image":""}`}><div className="rain-probability-scroll">{nextHours.map(hour=>{const time=hour.time.slice(11,16),probability=hour.probability,WeatherIcon=weatherIcon(hour.code);return <div className="rain-hour" key={hour.time}><span>{time}</span><WeatherIcon className="rain-hour-icon" size={20} aria-hidden="true"/><b>{probability??"—"}%</b><div className="rain-meter" role="meter" aria-label={`${hour.time} ${t("rain probability")}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={probability??0}><span style={{width:`${probability??0}%`}}/></div><small>{weatherDescription(hour.code,t)}</small></div>;})}</div>{weather.noah?.available&&weather.noah.rainfallImageUrl&&<figure className="rainfall-visual"><a href={weather.noah.rainfallImageUrl} target="_blank" rel="noreferrer"><img src={weather.noah.rainfallImageUrl} alt={t("Latest one-hour rainfall contour published by UP NOAH")}/></a><figcaption><b>{t("UP NOAH rainfall contour")}</b><span>{t("Official rainfall visualization")} · <a href={weather.noah.sourceUrl||"https://noah.up.edu.ph/weather-updates"} target="_blank" rel="noreferrer">{t("Source")}</a></span></figcaption></figure>}</div></section>}
   {forecastDays.length>1&&<section className="daily-forecast" aria-labelledby="daily-forecast-title"><h2 id="daily-forecast-title">{t("Coming days")}</h2><div className="daily-forecast-grid">{forecastDays.map(day=><article key={day.date}><span>{new Date(`${day.date}T12:00:00`).toLocaleDateString("en-PH",{weekday:"short",month:"short",day:"numeric"})}</span><b>{weatherDescription(day.code,t)}</b><strong>{day.min}° / {day.max}°C</strong><small>{t("Rain chance up to")} {day.rain??"—"}%</small></article>)}</div></section>}
   {!weather.currentWeather&&<div className="alert error">Current weather conditions are unavailable. The UP NOAH feed may still be available above.</div>}
   <p className="weather-updated">Checked {new Date(weather.checkedAt).toLocaleString("en-PH")}. Sources: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · <a href={weather.noah?.sourceUrl||"https://noah.up.edu.ph/weather-updates"} target="_blank" rel="noreferrer">UP NOAH</a> · <a href="https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin" target="_blank" rel="noreferrer">PAGASA severe weather bulletins</a>.</p></>}
  </section>;
 }
 const c=config[feature];if(!c)return null;
 // Healthcare shows your database records plus OpenStreetMap results; every other feature shows database records only.
 const filteredItems=feature==="healthcare"?items.filter(item=>matchesHealthcareFilters(item,facilityTypes)):items;
 const osmFiltered=feature==="healthcare"?osmItems.filter(item=>matchesHealthcareFilters(item,facilityTypes)):[];
 const listItems=feature==="healthcare"?[...filteredItems,...osmFiltered]:items;
 return <section className="workspace">
  <div className="workspace-heading"><div><h1>{t(c.title)}</h1><p>{feature==="healthcare"?t("Search a Philippine city, barangay, address or landmark, or use your current location. Choose the facility types to show. Results are from OpenStreetMap and ResQ records; call to confirm before traveling."):t("Information is shown from the connected ResQ database.")}</p></div><button className="secondary-button" onClick={load}><RefreshCw size={16}/> {t("Refresh")}</button></div>
  {error&&<div className="alert error">{error}</div>}{notice&&<div className="alert success">{notice}</div>}
  {feature==="relief"&&!isAdmin&&<ReliefRequestIntake/>}
  {feature==="incidents"||feature==="assistance"?<form className="record-form" onSubmit={submit}>
   <h3>{t(feature==="incidents"?"Submit an incident report":"Request emergency assistance")}</h3>
   {c.fields.map((name,i)=><Field key={name} name={name} label={t(c.labels[i])} value={form[name]} onChange={change} t={t}/>)}
   {feature==="incidents"&&<><label className="field">Photo evidence (JPG/PNG, up to 5 files)<input type="file" accept="image/jpeg,image/png" multiple onChange={e=>setPhotos([...e.target.files])}/></label><label className="check-line"><input type="checkbox" checked={urgent} onChange={e=>setUrgent(e.target.checked)}/> Urgent report: obtaining a photograph is unsafe or impossible (submitted as Unverified – Evidence Pending).</label><label className="check-line"><input type="checkbox" required/> I understand knowingly fabricated, manipulated, or misleading reports may result in account restrictions and possible legal consequences under applicable Philippine laws.</label></>}
   <button className="primary-button">Submit</button>
  </form>:null}
  {feature==="healthcare"&&<div className="healthcare-explorer">
   <form className="healthcare-search-form" onSubmit={e=>{e.preventDefault();searchMap();}}>
    <label className="field">{t("Your starting location")}<input type="search" name="healthcare-location" autoComplete="off" value={mapQuery} onChange={e=>{setMapQuery(e.target.value);setLocation(null);setLocationLabel("");setFocus(null);setRouteRequested(false);setRouteInfo(null);setPlaceSuggestions([]);}} placeholder={t("Enter a starting city, barangay, address or landmark")}/></label>
    <button type="submit" className="primary-button" disabled={mapBusy}><Search size={16}/>{mapBusy?t("Searching..."):t("Search map")}</button>
   </form>
   <div className="healthcare-map-tools">
    <button type="button" className="secondary-button" onClick={()=>locate(true)} disabled={mapBusy}><MapPin size={16}/>{t("Use my current location")}</button>
    <label className="field">{t("Search radius")}<select value={radiusKm} onChange={e=>{const radius=Number(e.target.value);setRadiusKm(radius);if(location)searchNearby(location[0],location[1],locationLabel||"selected location",radius);}}><option value={3}>3 km</option><option value={5}>5 km</option><option value={10}>10 km</option></select></label>
   </div>
   {placeSuggestions.length>0&&<div className="healthcare-place-results" role="group" aria-label={t("Location search results")}>
    <h3>{t("Choose a matching location.")}</h3>
    {placeSuggestions.map(place=><button type="button" className="healthcare-place-option" key={`${place.latitude}:${place.longitude}`} onClick={()=>searchAtPlace(place)}><MapPin size={16}/><span>{place.name}</span><b>{t("Show nearby")}</b></button>)}
   </div>}
   <fieldset className="healthcare-filters">
    <legend>{t("Facilities to show")}</legend>
    <p>{t("Choose one or more types, or leave all unselected to see everything.")}</p>
    <div className="healthcare-filter-chips">{HEALTHCARE_FILTERS.map(type=><button type="button" key={type} className="healthcare-filter-chip" aria-pressed={facilityTypes.includes(type)} onClick={()=>toggleFacilityType(type)}>{t(type)}</button>)}</div>
   </fieldset>
  </div>}
  {feature==="evacuation"&&<><div className="map-search-controls"><label className="field">{t("Your starting location")}<input type="search" name={`map-search-${feature}`} autoComplete="off" value={mapQuery} onChange={e=>{setMapQuery(e.target.value);setLocation(null);setLocationLabel("");setFocus(null);setRouteRequested(false);setRouteInfo(null);setPlaceSuggestions([]);}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();searchMap();}}} placeholder={t("Enter a starting city, barangay, address or landmark")}/></label><button type="button" className="primary-button" onClick={searchMap} disabled={mapBusy}>{mapBusy?t("Searching..."):t("Search map")}</button><button type="button" className="secondary-button" onClick={()=>locate(false)} disabled={mapBusy}><MapPin size={16}/>{t("Use my current location")}</button></div>{placeSuggestions.length>0&&<div className="healthcare-place-results" role="group" aria-label={t("Location search results")}><h3>{t("Choose a matching location.")}</h3>{placeSuggestions.map(place=><button type="button" className="healthcare-place-option" key={`${place.latitude}:${place.longitude}`} onClick={()=>searchAtPlace(place)}><MapPin size={16}/><span>{place.name}</span><b>{t("Use as starting location")}</b></button>)}</div>}</>}
  {c.map&&<form className="route-planner" onSubmit={planRoute}>
   <div className="route-planner-heading"><div><h3>{t("Plan a route")}</h3><p>{locationLabel||mapQuery?`${t("Starting from")} ${locationLabel||mapQuery}`:t("Set your starting location above or use your current location.")}</p></div><Navigation size={19} aria-hidden="true"/></div>
   <label className="field">{t(feature==="healthcare"?"Destination facility":"Destination evacuation center")}<input type="search" name={`route-destination-${feature}`} list={`route-destinations-${feature}`} autoComplete="off" value={destinationQuery} onChange={e=>{setDestinationQuery(e.target.value);setDestination(null);setDestinationLabel("");setDestinationSuggestions([]);setRouteRequested(false);setRouteInfo(null);}} placeholder={t(feature==="healthcare"?"Enter a facility name or place":"Enter an evacuation center or place")}/><datalist id={`route-destinations-${feature}`}>{listItems.filter(item=>hasCoordinates(item)&&item.name).slice(0,100).map(item=><option key={`${item.id}-${item.name}`} value={item.name}/>)}</datalist></label>
   <button type="submit" className="primary-button" disabled={routeLoading}>{routeLoading?t("Finding route..."):t("Show route")}</button>
   <p className="route-disclosure">{t("When you choose Show route, your start and destination coordinates are sent to the OSRM public routing service to calculate the road route.")}</p>
   {destinationSuggestions.length>0&&<div className="route-destination-options" role="group" aria-label={t("Choose a destination location.")}>{destinationSuggestions.map(place=><button type="button" className="healthcare-place-option" key={`${place.latitude}:${place.longitude}`} onClick={()=>selectDestinationPlace(place)}><MapPin size={16}/><span>{place.name}</span><b>{t("Set as destination")}</b></button>)}</div>}
   {routeRequested&&destinationLabel&&<p className="route-destination-label">{t("Destination")}: <b>{destinationLabel}</b></p>}
  </form>}
  {mapStatus&&<div className="source-note" role="status">{t(mapStatus)}</div>}
  {feature==="healthcare"&&<p className="healthcare-results-count" aria-live="polite">{listItems.length} {t(listItems.length===1?"facility shown on the map":"facilities shown on the map")}</p>}
  {c.map&&<><MapView items={listItems} userLocation={location} locationLabel={locationLabel} destination={routeRequested?destination:null} destinationLabel={destinationLabel} onRouteInfo={setRouteInfo} onRouteError={setMapStatus} focus={focus}/>{routeRequested&&destination&&<div className="source-note" aria-live="polite">{routeInfo&&<>{t("Route")}: {`${routeInfo.distanceKm} km · ${t("about")} ${routeInfo.durationMin} ${t("minutes (routing estimate)")}`} · </>}{!routeInfo&&!mapStatus&&<>{t("Calculating route...")} · </>}<a href={`https://www.google.com/maps/dir/?api=1&origin=${location?.join(",")||""}&destination=${destination.join(",")}&travelmode=driving`} target="_blank" rel="noreferrer">{t("Open turn-by-turn navigation")}</a></div>}</>}
  {feature==="warnings"&&<div className="source-note">Live typhoon tracks come from the UP NOAH/PAGASA feed. Recent earthquake activity is from the USGS catalog filtered to the Philippines; earthquakes cannot be predicted. Follow official <a href="https://www.pagasa.dost.gov.ph/" target="_blank" rel="noreferrer">PAGASA</a> and <a href="https://www.phivolcs.dost.gov.ph/" target="_blank" rel="noreferrer">PHIVOLCS</a> advisories.</div>}
  <div className="record-list"><form className="list-heading" onSubmit={e=>{e.preventDefault();load();}}><div className="list-heading-copy"><h3>{t("Records")}</h3><p>{t("Search this section’s records by keyword.")}</p></div><label className="search-field"><span className="sr-only">{t("Search records in")} {t(c.title)}</span><input type="search" name={`record-search-${feature}`} autoComplete="off" value={recordQuery} onChange={e=>setRecordQuery(e.target.value)} placeholder={t("Search records")}/></label><button type="submit" className="secondary-button" disabled={loading}>{loading?t("Searching..."):t("Search")}</button></form>
   {loading?<p role="status">{t("Searching records...")}</p>:listItems.length===0?<p className="empty-state">{recordQuery?t(`No records found for “${recordQuery}”. Try another search.`):t("No records available yet.")}</p>:listItems.map(item=><article className="record-card" key={item.id}>
    <div><b>{item.name||item.title||item.item_name||item.request_type}</b><p>{item.description||item.address||item.area_name||item.distribution_location||item.location}</p><small>{item.status||item.current_status||item.severity||item.facility_type||""} {item.barangay?`· ${item.barangay}`:""}{item.source==="osm"?" · OpenStreetMap":""}</small></div>
    {isAdmin&&item.source!=="osm"&&["healthcare","warnings","evacuation","relief"].includes(feature)&&<div className="admin-record-actions"><button className="text-button" onClick={()=>editRecord(item)}>Edit</button><button className="text-button danger" onClick={()=>deleteRecord(item.id)}>Delete</button></div>}
    {c.map&&hasCoordinates(item)&&<button type="button" className="text-button" onClick={()=>{setDestinationQuery(item.name||"");setDestination([Number(item.latitude),Number(item.longitude)]);setDestinationLabel(item.name||"");setDestinationSuggestions([]);setRouteRequested(false);setRouteInfo(null);}}> <Navigation size={15}/> {t("Set as destination")}</button>}
    {feature==="incidents"&&<><button className="text-button" onClick={()=>viewEvidence(item.id)}>View evidence</button>{isStaff&&<div className="moderation"><input placeholder="Reason if rejected" value={moderation[item.id]||""} onChange={e=>setModeration({...moderation,[item.id]:e.target.value})}/>{["Verified","Under Review","Rejected","Resolved"].map(s=><button key={s} onClick={()=>moderate(item.id,s)}>{s}</button>)}</div>}</>}
    {feature==="assistance"&&isStaff&&<select value={item.status} onChange={e=>updateRequest(item.id,e.target.value)}>{["Pending","Accepted","In Progress","Completed","Rejected"].map(s=><option key={s}>{s}</option>)}</select>}
   </article>)}
  </div>
  {isAdmin&&["healthcare","warnings","evacuation","relief"].includes(feature)&&<form className="record-form" onSubmit={submit}><h3>{t(editingId?"Edit record":"Add new record")}</h3>{c.fields.map((name,i)=><Field key={name} name={name} label={t(c.labels[i])} value={form[name]} onChange={change} t={t}/>) }<button className="primary-button">{t(editingId?"Save changes":"Add record")}</button>{editingId&&<button type="button" className="secondary-button" onClick={()=>{setEditingId(null);setForm({});}}>{t("Cancel edit")}</button>}</form>}
 </section>;
}
function UserManagement(){
 const {t}=useLanguage();
 const [users,setUsers]=useState([]),[error,setError]=useState(""),[loading,setLoading]=useState(true),[query,setQuery]=useState(""),[selectedUser,setSelectedUser]=useState(null),[profileLoading,setProfileLoading]=useState(false),[profileError,setProfileError]=useState("");
 const [notice,setNotice]=useState(""),[employeeForm,setEmployeeForm]=useState({fullName:"",email:"",phone:"",address:"",password:""});
 const profileRequestId=useRef(0);
 useEffect(()=>{
  let active=true;
  api.get("/admin/users").then(r=>{if(active)setUsers(r.data.users||[]);})
   .catch(e=>{if(active)setError(e.response?.data?.message||"Unable to load users.");})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]);
 const normalizedQuery=query.trim().toLocaleLowerCase();
 const filteredUsers=users.filter(account=>[account.fullName,account.role].some(value=>String(value||"").toLocaleLowerCase().includes(normalizedQuery)));
 const adminCount=users.filter(account=>account.role==="admin").length;
 async function openProfile(account){
  const requestId=++profileRequestId.current;
  setSelectedUser(account);setProfileLoading(true);setProfileError("");
  try{const response=await api.get(`/admin/users/${account.id}`);if(requestId===profileRequestId.current)setSelectedUser(response.data.user);}
  catch(e){if(requestId===profileRequestId.current)setProfileError(e.response?.data?.message||"Unable to load contact details.");}
  finally{if(requestId===profileRequestId.current)setProfileLoading(false);}
 }
 function closeProfile(){profileRequestId.current+=1;setSelectedUser(null);setProfileLoading(false);}
 async function createEmployee(event){
  event.preventDefault();setError("");setNotice("");
  if(!employeeForm.email.trim().toLowerCase().endsWith("@my.rescueko.ph")){setError("Employee email must use the @my.rescueko.ph domain.");return;}
  try{await api.post("/admin/employees",employeeForm);setNotice("Employee account created.");setEmployeeForm({fullName:"",email:"",phone:"",address:"",password:""});const response=await api.get("/admin/users");setUsers(response.data.users||[]);}
  catch(e){setError(e.response?.data?.message||"Unable to create employee account.");}
 }
 async function setSuspension(account){
  const suspended=!account.suspendedAt;
  const reason=suspended?window.prompt("Enter the reason for suspension:",""):"";
  if(suspended&&!reason?.trim())return;
  try{await api.post(`/admin/users/${account.id}/suspension`,{suspended,reason:reason?.trim()||""});setNotice(suspended?"Account suspended.":"Account unsuspended.");const response=await api.get("/admin/users");setUsers(response.data.users||[]);}
  catch(e){setError(e.response?.data?.message||"Unable to update suspension.");}
 }
 async function resetPassword(account){
  const password=window.prompt(`Enter a new password for ${account.fullName} (at least 8 characters):`);
  if(!password)return;
  if(password.length<8){setError("The new password must be at least 8 characters.");return;}
  try{await api.post(`/admin/users/${account.id}/reset-password`,{newPassword:password});setNotice("User password reset successfully.");}
  catch(e){setError(e.response?.data?.message||"Unable to reset password.");}
 }
 return <section className="workspace users-workspace">
  <div className="workspace-heading"><div><h1>{t("User accounts")}</h1><p>{t("Find community accounts and review contact details.")}</p></div><span className="users-count">{users.length} {t("total")}</span></div>
  {error&&<div className="alert error" role="alert">{t(error)}</div>}
  {notice&&<div className="alert success" role="status">{t(notice)}</div>}
  <form className="record-form employee-create-form" onSubmit={createEmployee}>
   <h2>{t("Create employee account")}</h2>
   <label className="field">{t("Full name")}<input value={employeeForm.fullName} onChange={e=>setEmployeeForm({...employeeForm,fullName:e.target.value})} maxLength="150" required/></label>
   <label className="field">{t("Employee email")}<input type="email" value={employeeForm.email} onChange={e=>setEmployeeForm({...employeeForm,email:e.target.value})} placeholder="name@my.rescueko.ph" maxLength="190" required/></label>
   <label className="field">{t("Phone number")}<input value={employeeForm.phone} onChange={e=>setEmployeeForm({...employeeForm,phone:e.target.value})} maxLength="30" required/></label>
   <label className="field">{t("Address")}<input value={employeeForm.address} onChange={e=>setEmployeeForm({...employeeForm,address:e.target.value})} maxLength="255" required/></label>
   <label className="field">{t("Temporary password")}<input type="password" value={employeeForm.password} onChange={e=>setEmployeeForm({...employeeForm,password:e.target.value})} minLength="8" required/></label>
   <button className="primary-button">{t("Create employee")}</button>
  </form>
  <div className="users-summary" aria-label={t("Account summary")}><article><span>{t("Total accounts")}</span><strong>{loading?"—":users.length}</strong></article><article><span>{t("Community members")}</span><strong>{loading?"—":users.length-adminCount}</strong></article><article><span>{t("Administrators")}</span><strong>{loading?"—":adminCount}</strong></article></div>
  <section className="users-directory" aria-labelledby="users-directory-title">
   <div className="users-directory-heading"><div><h2 id="users-directory-title">{t("Account directory")}</h2><p>{loading?t("Loading accounts…"):`${filteredUsers.length} ${t("matching")} ${filteredUsers.length===1?t("account"):t("accounts")}`}</p></div><label className="users-search"><Search size={17} aria-hidden="true"/><span className="sr-only">{t("Search user accounts")}</span><input type="search" name="user-account-search" autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Search by name or role")}/></label></div>
   {loading?<p className="users-empty" role="status">{t("Loading user accounts…")}</p>:filteredUsers.length===0?<p className="users-empty">{users.length?t("No matching accounts. Try another search."):t("No user accounts have been registered yet.")}</p>:<div className="users-table-scroll" role="region" aria-label={t("User account results")} tabIndex="0"><table className="users-table"><caption className="sr-only">{t("Registered ResQ Ko user accounts")}</caption><thead><tr><th scope="col">{t("Name")}</th><th scope="col">{t("Role")}</th><th scope="col">{t("Created")}</th><th scope="col">{t("Details")}</th></tr></thead><tbody>{filteredUsers.map(account=><tr key={account.id}><td data-label="Name"><b>{account.fullName}</b>{account.suspendedAt&&<small className="account-suspended">{t("Suspended")}</small>}</td><td data-label="Role"><span className={`user-role-badge ${account.role==="admin"?"admin":account.role==="employee"?"employee":"member"}`}>{t(account.role)}</span></td><td data-label="Created">{dashboardDate(account.createdAt)||"—"}</td><td data-label="Details"><div className="account-admin-actions">{account.role==="user"&&<button type="button" className="text-button" onClick={()=>openProfile(account)}>{t("View contact details")}</button>}{account.role!=="admin"&&<><button type="button" className="text-button" onClick={()=>resetPassword(account)}>{t("Reset password")}</button><button type="button" className={`text-button${account.suspendedAt?"":" danger"}`} onClick={()=>setSuspension(account)}>{account.suspendedAt?t("Unsuspend"):t("Suspend")}</button></>}</div></td></tr>)}</tbody></table></div>}
  </section>
  {selectedUser&&<div className="profile-detail-backdrop" role="presentation" onClick={closeProfile}><section className="profile-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-profile-title" onClick={event=>event.stopPropagation()}><div className="admin-panel-heading"><h2 id="admin-profile-title">{t("User contact details")}</h2><button type="button" className="icon-button" onClick={closeProfile} aria-label={t("Close")}><X size={18}/></button></div>{profileLoading?<p role="status">{t("Loading contact details…")}</p>:profileError?<p className="admin-inline-error" role="alert">{t(profileError)}</p>:<><dl className="profile-detail-list"><div><dt>{t("Full name")}</dt><dd>{selectedUser.fullName||"—"}</dd></div><div><dt>{t("Email")}</dt><dd>{selectedUser.email||"—"}</dd></div><div><dt>{t("Phone")}</dt><dd>{selectedUser.phone||"—"}</dd></div><div><dt>{t("Address")}</dt><dd>{selectedUser.address||"—"}</dd></div><div><dt>{t("Account created")}</dt><dd>{dashboardDate(selectedUser.createdAt)||"—"}</dd></div></dl><p className="profile-detail-privacy">{t("Only basic contact details are available here. Health information is not shown. This access is recorded in the admin activity log.")}</p></>}</section></div>}
 </section>;
}

function ProfileWorkspace({user,onUserUpdate,onNavigate}){
 const {t}=useLanguage();
 const [form,setForm]=useState({fullName:user?.fullName||"",phone:user?.phone||"",address:user?.address||"",currentLocation:user?.currentLocation||"",emergencyContactName:user?.emergencyContactName||"",emergencyContactPhone:user?.emergencyContactPhone||"",bloodType:user?.bloodType||"",healthConditions:user?.healthConditions||"",allergies:user?.allergies||""});
 const [message,setMessage]=useState(""),[error,setError]=useState(""),[saving,setSaving]=useState(false),[photoSaving,setPhotoSaving]=useState(false),[profilePicture,setProfilePicture]=useState(user?.profilePicture||"");
 useEffect(()=>{let active=true;api.get("/auth/me").then(response=>{if(!active)return;const account=response.data.user;setForm({fullName:account.fullName||"",phone:account.phone||"",address:account.address||"",currentLocation:account.currentLocation||"",emergencyContactName:account.emergencyContactName||"",emergencyContactPhone:account.emergencyContactPhone||"",bloodType:account.bloodType||"",healthConditions:account.healthConditions||"",allergies:account.allergies||""});setProfilePicture(account.profilePicture||"");}).catch(e=>{if(active)setError(e.response?.data?.message||"Unable to load your profile.");});return()=>{active=false;};},[]);
 function update(event){setForm(current=>({...current,[event.target.name]:event.target.value}));}
 async function save(event){event.preventDefault();setError("");setMessage("");setSaving(true);try{await api.patch("/auth/me",form);onUserUpdate?.({...form,email:user?.email});setMessage("Your profile has been saved.");}catch(e){setError(e.response?.data?.message||"Unable to save your profile.");}finally{setSaving(false);}}
 async function savePhoto(event){const file=event.target.files?.[0];event.target.value="";if(!file)return;setError("");setMessage("");if(!["image/jpeg","image/png"].includes(file.type)){setError("Choose a JPG or PNG image.");return;}if(file.size>8*1024*1024){setError("Choose an image smaller than 8 MB.");return;}const data=new FormData();data.append("photo",file);setPhotoSaving(true);try{const response=await api.post("/auth/me/photo",data);setProfilePicture(response.data.profilePicture);onUserUpdate?.({profilePicture:response.data.profilePicture});setMessage("Profile photo updated.");}catch(e){setError(e.response?.data?.message||"Unable to update your profile photo.");}finally{setPhotoSaving(false);}}
 const avatarUrl=profilePicture?(profilePicture.startsWith("http")?profilePicture:`${API_ORIGIN}${profilePicture}`):"";
 return <section className="workspace profile-workspace"><div className="workspace-heading"><div><h1>{t("My profile")}</h1><p>{t("Keep your contact and optional emergency details up to date.")}</p></div><button type="button" className="secondary-button" onClick={()=>onNavigate?.("settings")}><Settings size={16}/> {t("Account settings")}</button></div>{error&&<div className="alert error" role="alert">{t(error)}</div>}{message&&<div className="alert success" role="status">{t(message)}</div>}
  <div className="profile-photo-card"><div className="profile-avatar-large">{avatarUrl?<img src={avatarUrl} alt={t("Your profile")}/>:String(user?.fullName||"U").split(/\s+/).map(part=>part[0]).slice(0,2).join("").toUpperCase()}</div><div><h2>{user?.fullName||form.fullName||t("Your profile")}</h2><p>{user?.email||t("Profile photo")}</p><label className="secondary-button profile-photo-upload">{photoSaving?t("Uploading…"):t("Upload photo")}<input type="file" accept="image/jpeg,image/png" onChange={savePhoto} disabled={photoSaving}/></label><small>{t("JPG or PNG · up to 8 MB")}</small></div></div>
  <div className="profile-privacy-note"><ShieldAlert size={18}/><span>{t("Health details are optional and saved to your account. Share only information you are comfortable storing; this is not a substitute for emergency care.")}</span></div>
  <form className="record-form profile-details-form" onSubmit={save}><h3>{t("Contact and location")}</h3><label className="field">{t("Full name")}<input name="fullName" value={form.fullName} onChange={update} maxLength="150" required/></label><label className="field">{t("Phone number")}<input name="phone" value={form.phone} onChange={update} maxLength="30" required/></label><label className="field">{t("Home address")}<input name="address" value={form.address} onChange={update} maxLength="255" required/></label><label className="field">{t("Current or travel location")}<input name="currentLocation" value={form.currentLocation} onChange={update} maxLength="255" placeholder={t("City or municipality in the Philippines")}/></label><h3>{t("Emergency contact")}</h3><label className="field">{t("Contact name")}<input name="emergencyContactName" value={form.emergencyContactName} onChange={update} maxLength="150"/></label><label className="field">{t("Contact phone")}<input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={update} maxLength="30" type="tel"/></label><h3>{t("Optional health information")}</h3><label className="field">{t("Blood type")}<select name="bloodType" value={form.bloodType} onChange={update}><option value="">{t("Prefer not to say")}</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(type=><option key={type}>{type}</option>)}</select></label><label className="field">{t("Health conditions")}<textarea name="healthConditions" value={form.healthConditions} onChange={update} maxLength="2000" placeholder={t("Optional. Include only details you may want responders to know.")}/></label><label className="field">{t("Allergies")}<textarea name="allergies" value={form.allergies} onChange={update} maxLength="2000" placeholder={t("Optional")}/></label><label className="field">{t("Email address")}<input value={user?.email||""} disabled/></label><button className="primary-button" disabled={saving}>{saving?t("Saving…"):t("Save profile")}</button></form>
 </section>;
}

function SettingsWorkspace({user}){
 const {t,language:uiLanguage,setLanguage:setUiLanguage}=useLanguage();
 const [activeTab,setActiveTab]=useState("security");
 const [theme,setTheme]=useState(localStorage.getItem("resq_theme")||"system");
 const [readableMode,setReadableMode]=useState(localStorage.getItem("resq_readable_mode")==="true");
 const [language,setLanguage]=useState(uiLanguage);
 const [profile,setProfile]=useState({fullName:user?.fullName||"",email:user?.email||"",phone:user?.phone||"",address:user?.address||""});
 const [passwords,setPasswords]=useState({currentPassword:"",newPassword:"",confirmNewPassword:""});
 const [notifications,setNotifications]=useState({emergency:true,weather:true,evacuation:true,medical:true,rescue:true,community:true,email:false,inApp:true,typhoonAlerts:false,earthquakeAlerts:false});
 const [accountVisible,setAccountVisible]=useState(true);
 const [locationSharing,setLocationSharing]=useState(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [saving,setSaving]=useState(false);
 const [deletePassword,setDeletePassword]=useState("");
 const [deleteConfirmPassword,setDeleteConfirmPassword]=useState("");
 const [confirmDelete,setConfirmDelete]=useState(false);
 const settingsTabs=["security","account","appearance","language","notifications","privacy"];

 useEffect(()=>{
  let active=true;
  api.get("/auth/me").then(r=>{
   if(!active)return;
   const account=r.data.user;
   setProfile({fullName:account.fullName||"",email:account.email||"",phone:account.phone||"",address:account.address||""});
   setTheme(account.theme||localStorage.getItem("resq_theme")||"system");
   const accountLanguage=account.language||localStorage.getItem("resq_language")||"en";
   setLanguage(accountLanguage);
   setUiLanguage(accountLanguage);
   setAccountVisible(account.accountVisible!==false);
   setLocationSharing(Boolean(account.locationSharing));
   if(account.notificationPreferences) setNotifications(v=>({...v,...account.notificationPreferences}));
  }).catch(e=>{if(active)setError(e.response?.data?.message||"Unable to load your settings.");});
  return()=>{active=false;};
 },[setUiLanguage]);

 function applyTheme(value){
  setTheme(value);localStorage.setItem("resq_theme",value);
  const resolved=value==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):value;
  document.documentElement.dataset.theme=resolved;
 }
 function applyReadableMode(value){
  setReadableMode(value);
  localStorage.setItem("resq_readable_mode",String(value));
  if(value)document.documentElement.dataset.readableMode="true";
  else delete document.documentElement.dataset.readableMode;
 }
 function applyLanguage(value){setLanguage(value);setUiLanguage(value);}
 function moveSettingsTab(event,index){
  let nextIndex=index;
  if(event.key==="ArrowRight")nextIndex=(index+1)%settingsTabs.length;
  else if(event.key==="ArrowLeft")nextIndex=(index+settingsTabs.length-1)%settingsTabs.length;
  else if(event.key==="Home")nextIndex=0;
  else if(event.key==="End")nextIndex=settingsTabs.length-1;
  else return;
  event.preventDefault();
  setActiveTab(settingsTabs[nextIndex]);
  document.getElementById(`settings-tab-${settingsTabs[nextIndex]}`)?.focus();
 }
 async function savePreferences(payload,message){
  setNotice("");setError("");setSaving(true);
  try{await api.patch("/auth/me",payload);if(payload.language){localStorage.setItem("resq_language",payload.language);setUiLanguage(payload.language);}setNotice(message);}
  catch(e){setError(e.response?.data?.message||"Unable to save settings.");}
  finally{setSaving(false);}
 }
 async function saveProfile(e){
  e.preventDefault();
  await savePreferences({fullName:profile.fullName,email:profile.email,phone:profile.phone,address:profile.address},"Profile settings saved.");
 }
 async function changePassword(e){
  e.preventDefault();setNotice("");setError("");
  if(passwords.newPassword!==passwords.confirmNewPassword){setError("New passwords do not match.");return;}
  setSaving(true);
  try{await api.patch("/auth/password",passwords);setPasswords({currentPassword:"",newPassword:"",confirmNewPassword:""});setNotice("Password changed successfully.");}
  catch(e){setError(e.response?.data?.message||"Unable to change password.");}
  finally{setSaving(false);}
 }
 async function deleteAccount(){
  setNotice("");setError("");
  if(!deletePassword||deletePassword!==deleteConfirmPassword){setError("Passwords do not match.");return;}
  setSaving(true);
  try{
   await api.delete("/auth/me",{data:{password:deletePassword,passwordConfirmation:deleteConfirmPassword}});
   localStorage.removeItem("resq_token");localStorage.removeItem("resq_user");
   window.location.href="/";
  }catch(e){setError(e.response?.data?.message||"Unable to delete account.");}
  finally{setSaving(false);}
 }
 return <section className="workspace settings-workspace">
  <h1>{t("Settings")}</h1><p>{t("Personalize ResQ and manage account security.")}</p>
  {notice&&<div className="alert success" role="status" aria-live="polite">{t(notice)}</div>}{error&&<div className="alert error" role="alert">{t(error)}</div>}
  <div className="settings-tabs" role="tablist" aria-label="Settings categories">
   {settingsTabs.map((tab,index)=><button type="button" key={tab} id={`settings-tab-${tab}`} role="tab" aria-selected={activeTab===tab} aria-controls={`settings-panel-${tab}`} tabIndex={activeTab===tab?0:-1} className={activeTab===tab?"active":""} onClick={()=>setActiveTab(tab)} onKeyDown={e=>moveSettingsTab(e,index)}>{t(tab[0].toUpperCase()+tab.slice(1))}</button>)}
  </div>
  {activeTab==="appearance"&&<div className="settings-panel" id="settings-panel-appearance" role="tabpanel" aria-labelledby="settings-tab-appearance" tabIndex="0"><h2>{t("Appearance")}</h2><p>{t("Choose a theme for this device and your account.")}</p><div className="option-grid">{["light","dark","system"].map(value=><button type="button" key={value} aria-pressed={theme===value} className={`option-card ${theme===value?"selected":""}`} onClick={()=>applyTheme(value)}><b>{t(value==="light"?"Light":value==="dark"?"Dark":"System default")}</b><span>{t(value==="system"?"Follow this device’s appearance":`Use the ${value} theme`)}</span></button>)}</div><label className="check-line readable-mode-option"><input type="checkbox" checked={readableMode} onChange={event=>applyReadableMode(event.target.checked)}/><span><b>{t("Large text mode")}</b><small>{t("Use larger text and more spacing across the app. This preference is saved on this device.")}</small></span></label><button type="button" className="primary-button" disabled={saving} onClick={()=>savePreferences({theme},"Appearance preference saved.")}>{saving?t("Saving…"):t("Save appearance")}</button></div>}
  {activeTab==="language"&&<div className="settings-panel" id="settings-panel-language" role="tabpanel" aria-labelledby="settings-tab-language" tabIndex="0"><h2>{t("Language")}</h2><p>{t("Choose your preferred language for your account.")}</p><label className="field">{t("Language")}<select value={language} onChange={e=>applyLanguage(e.target.value)}><option value="en">English</option><option value="fil">Filipino (Tagalog)</option><option value="ceb">Cebuano (Bisaya)</option></select></label><p className="language-coverage-note">{t("This interface uses built-in translations. Official alerts and user-submitted content may remain in their original language.")}</p><button type="button" className="primary-button" disabled={saving} onClick={()=>savePreferences({language},"Language preference saved.")}>{saving?t("Saving…"):t("Save language")}</button></div>}
  {activeTab==="notifications"&&<div className="settings-panel" id="settings-panel-notifications" role="tabpanel" aria-labelledby="settings-tab-notifications" tabIndex="0"><h2>{t("Notifications")}</h2><p>{t("Save your preferred update categories. Browser alerts only arrive while ResQ is open and browser notifications are allowed.")}</p>{Object.entries(notifications).map(([key,value])=><label className="check-line" key={key}><input type="checkbox" checked={value} onChange={e=>setNotifications({...notifications,[key]:e.target.checked})}/> {t(({inApp:"In-app notifications",emergency:"Emergency alerts",weather:"Weather and disaster warnings",evacuation:"Evacuation announcements",medical:"Medical assistance updates",rescue:"Rescue request updates",community:"Community announcements",email:"Email notifications",typhoonAlerts:"Typhoon track alerts",earthquakeAlerts:"Earthquake activity alerts"})[key]||"Notifications")}</label>)}<button type="button" className="primary-button" disabled={saving} onClick={()=>savePreferences({notificationPreferences:notifications},"Notification preferences saved.")}>{saving?t("Saving…"):t("Save notification settings")}</button></div>}
  {activeTab==="privacy"&&<div className="settings-panel" id="settings-panel-privacy" role="tabpanel" aria-labelledby="settings-tab-privacy" tabIndex="0"><h2>{t("Privacy and security")}</h2><p>{t("Control optional account visibility and location sharing.")}</p><label className="check-line"><input type="checkbox" checked={accountVisible} onChange={e=>setAccountVisible(e.target.checked)}/> {t("Allow optional account visibility")}</label><label className="check-line"><input type="checkbox" checked={locationSharing} onChange={e=>setLocationSharing(e.target.checked)}/> {t("Allow location sharing with location-based features")}</label><button type="button" className="primary-button" disabled={saving} onClick={()=>savePreferences({accountVisible,locationSharing},"Privacy preferences saved.")}>{saving?t("Saving…"):t("Save privacy preferences")}</button><div className="source-note"><b>{t("Privacy note:")}</b> {t("Your account supports disaster assistance and community safety records. Avoid sharing sensitive information in public reports.")}</div></div>}
  {activeTab==="security"&&<div className="settings-panel" id="settings-panel-security" role="tabpanel" aria-labelledby="settings-tab-security" tabIndex="0"><h2>{t("Account security")}</h2><p>{t("Change your password or permanently delete your account.")}</p><form className="record-form" onSubmit={changePassword}><h3>{t("Change password")}</h3><label className="field">{t("Current password")}<input type="password" autoComplete="current-password" value={passwords.currentPassword} onChange={e=>setPasswords({...passwords,currentPassword:e.target.value})} required/></label><label className="field">{t("New password")}<input type="password" autoComplete="new-password" minLength="8" value={passwords.newPassword} onChange={e=>setPasswords({...passwords,newPassword:e.target.value})} required/></label><label className="field">{t("Confirm new password")}<input type="password" autoComplete="new-password" minLength="8" value={passwords.confirmNewPassword} onChange={e=>setPasswords({...passwords,confirmNewPassword:e.target.value})} required/></label>{passwords.confirmNewPassword&&passwords.newPassword!==passwords.confirmNewPassword&&<small className="password-mismatch" role="alert">{t("New passwords do not match.")}</small>}<button className="primary-button" disabled={saving||!passwords.currentPassword||!passwords.newPassword||passwords.newPassword!==passwords.confirmNewPassword}>{saving?t("Saving…"):t("Change password")}</button></form>{user?.role!=="admin"&&<div className="danger-zone"><h3>{t("Delete account")}</h3><p>{t("This permanently removes your user profile, submitted reports, assistance requests, and account preferences where legally permitted. Official incident and safety records may be retained when required for lawful safety or audit purposes.")}</p><button type="button" className="delete-button" onClick={()=>{setError("");setDeletePassword("");setDeleteConfirmPassword("");setConfirmDelete(true);}}>{t("Delete account")}</button></div>}</div>}
  {activeTab==="account"&&<div className="settings-panel" id="settings-panel-account" role="tabpanel" aria-labelledby="settings-tab-account" tabIndex="0"><h2>{t("Account management")}</h2><p>{t("Update your contact details and personal information.")}</p><form className="record-form" onSubmit={saveProfile}><h3>{t("Personal information")}</h3><label className="field">{t("Full name")}<input value={profile.fullName} onChange={e=>setProfile({...profile,fullName:e.target.value})} required/></label><label className="field">{t("Email address")}<input type="email" value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})} required/></label><label className="field">{t("Phone number")}<input value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})} required/></label><label className="field">{t("Address")}<input value={profile.address} onChange={e=>setProfile({...profile,address:e.target.value})} required/></label><button className="primary-button" disabled={saving}>{saving?t("Saving…"):t("Save personal information")}</button></form></div>}
  {confirmDelete&&<div className="modal-backdrop" role="presentation"><div className="modal settings-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"><h2 id="delete-title">{t("Are you sure you want to delete your account?")}</h2><p id="delete-description">{t("This action cannot be undone. Enter your current password twice to confirm this deletion.")}</p><label className="field">{t("Current password")}<input type="password" autoComplete="current-password" value={deletePassword} onChange={e=>setDeletePassword(e.target.value)} required/></label><label className="field">{t("Confirm current password")}<input type="password" autoComplete="current-password" value={deleteConfirmPassword} onChange={e=>setDeleteConfirmPassword(e.target.value)} required/></label>{deleteConfirmPassword&&deletePassword!==deleteConfirmPassword&&<small className="password-mismatch" role="alert">{t("Passwords do not match.")}</small>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>{setConfirmDelete(false);setDeletePassword("");setDeleteConfirmPassword("");setError("");}}>{t("Cancel")}</button><button type="button" className="delete-button" disabled={!deletePassword||!deleteConfirmPassword||deletePassword!==deleteConfirmPassword||saving} onClick={deleteAccount}>{saving?t("Deleting…"):t("Permanently delete account")}</button></div></div></div>}
 </section>;
}