import { useEffect, useState } from "react";
import { MapPin, RefreshCw, Send, ShieldAlert, Navigation, ExternalLink } from "lucide-react";
import api from "../services/api";
import MapView from "../components/MapView";
import "./featureWorkspace.css";

const config={
 healthcare:{title:"Healthcare directory",endpoint:"/healthcare",fields:["name","facility_type","address","barangay","phone","operating_hours","latitude","longitude","services"],labels:["Facility name","Type (Hospital/Clinic/Pharmacy/Health Center/Emergency)","Address","Barangay","Contact number","Operating hours","Latitude","Longitude","Services"],map:true},
 warnings:{title:"Disaster warnings",endpoint:"/warnings",fields:["title","description","hazard_type","severity","status","source_name","source_url","area_name","starts_at","ends_at"],labels:["Title","Description","Hazard type","Severity","Status","Official source","Source URL","Affected area","Start date/time","End date/time"]},
 evacuation:{title:"Evacuation centers",endpoint:"/evacuation",fields:["name","address","barangay","facilities","contact_number","capacity","current_status","latitude","longitude"],labels:["Center name","Address","Barangay","Facilities","Contact number","Capacity","Status","Latitude","Longitude"],map:true},
 relief:{title:"Relief information",endpoint:"/relief",fields:["item_name","description","quantity_available","distribution_location","distribution_date","status"],labels:["Item name","Description","Quantity available","Distribution location","Distribution date","Status"]},
 incidents:{title:"Incident reports",endpoint:"/incidents",fields:["title","description","category","location","barangay","incident_at"],labels:["Title","Description","Category","Location","Barangay","Incident date/time"]},
 assistance:{title:"Emergency assistance",endpoint:"/assistance",fields:["request_type","description","location","barangay","contact_number","urgency"],labels:["Request type","Description","Location","Barangay","Contact number","Urgency"]}
};
function Field({name,label,value,onChange}) {
 const type=name.endsWith("_at")?"datetime-local":name.endsWith("_date")?"date":name==="quantity_available"||name==="capacity"?"number":"text";
 return <label className="field">{label}{(name==="description"||name==="services"||name==="facilities")?<textarea name={name} value={value||""} onChange={onChange} required={name!=="services"&&name!=="facilities"}/>:<input name={name} type={type} value={value||""} onChange={onChange} required={!["barangay","phone","operating_hours","latitude","longitude","services","facilities","contact_number","capacity","ends_at","distribution_date"].includes(name)}/>}</label>;
}
export default function FeatureWorkspace({feature,admin,user}){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [form,setForm]=useState({}),[photos,setPhotos]=useState([]),[urgent,setUrgent]=useState(false),[query,setQuery]=useState("");
 const [location,setLocation]=useState(null),[destination,setDestination]=useState(null),[routeInfo,setRouteInfo]=useState(null),[weather,setWeather]=useState(null),[chat,setChat]=useState([]),[message,setMessage]=useState("");
 const [moderation,setModeration]=useState({}),[editingId,setEditingId]=useState(null);
 const isAdmin=admin;
 async function load(){
  if(!config[feature])return;
  setLoading(true);setError("");
  try{const r=await api.get(config[feature].endpoint,{params:{q:query}});setItems(r.data.items||[]);}
  catch(e){setError(e.response?.data?.message||"Could not load records. Check your server and database.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{if(config[feature])load();},[feature]);
 function change(e){setForm({...form,[e.target.name]:e.target.value});}
 async function submit(e){
  e.preventDefault();setNotice("");setError("");
  try{
   if(feature==="incidents"){
    const data=new FormData();Object.entries(form).forEach(([k,v])=>data.append(k,v));
    data.append("urgent_without_photo",String(urgent));photos.forEach(file=>data.append("photos",file));
    await api.post("/incidents",data,{headers:{"Content-Type":"multipart/form-data"}});
   }else if(editingId) await api.put(`${config[feature].endpoint}/${editingId}`,form);
   else await api.post(config[feature].endpoint,form);
   setNotice(editingId?"Record updated successfully.":"Submitted successfully.");setForm({});setEditingId(null);setPhotos([]);setUrgent(false);load();
  }catch(e){setError(e.response?.data?.message||"Submission failed.");}
 }
 async function viewEvidence(id){
  try{const r=await api.get(`/incidents/${id}/photos`);if(!r.data.photos.length){setNotice("No photo evidence attached.");return;}r.data.photos.forEach(p=>window.open(`${import.meta.env.VITE_API_URL?.replace("/api","")||"http://localhost:5000"}${p.url}`,"_blank","noopener"));}
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
 async function locate(){
  if(!navigator.geolocation){setError("Geolocation is not supported. You can use the map's default view.");return;}
  navigator.geolocation.getCurrentPosition(pos=>setLocation([pos.coords.latitude,pos.coords.longitude]),()=>setError("Location permission was not granted. Enter an address manually or enable location permission."));
 }
 async function getWeather(){
  if(!location){setError("Select Allow when prompted to use your location first.");return;}
  try{const r=await api.get("/weather",{params:{lat:location[0],lon:location[1]}});setWeather(r.data);}
  catch(e){setError(e.response?.data?.message||"Weather unavailable.");}
 }
 async function askAI(e){
  e.preventDefault();if(!message.trim())return;
  const current=message;setChat(c=>[...c,{role:"user",text:current}]);setMessage("");
  try{const r=await api.post("/ai-chat",{message:current});setChat(c=>[...c,{role:"assistant",text:r.data.reply}]);}
  catch(e){setChat(c=>[...c,{role:"assistant",text:e.response?.data?.message||"ResQ AI is unavailable."}]);}
 }
 if(feature==="profile")return <ProfileWorkspace user={user}/>;
 if(feature==="overview")return <section className="workspace"><h1>Welcome, {user?.fullName||"community member"}!</h1><p>Choose a service from the sidebar to find help, stay informed, or request assistance.</p><div className="notice-card"><ShieldAlert/> In a life-threatening emergency in the Philippines, call <b>911</b>. Follow instructions from local authorities.</div></section>;
 if(feature==="users")return <UserManagement/>;
 if(feature==="chat")return <section className="workspace"><h1>ResQ AI</h1><p>Ask about health guidance, disaster safety, evacuation, relief, or using this website.</p><div className="chat-box">{chat.map((m,i)=><div className={`chat-message ${m.role}`} key={i}><b>{m.role==="user"?"You":"ResQ AI"}</b><p>{m.text}</p></div>)}</div><form className="inline-form" onSubmit={askAI}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="How can I prepare for flooding?" maxLength="2000"/><button className="primary-button"><Send size={16}/> Send</button></form><small>ResQ AI does not diagnose or prescribe. For serious symptoms, seek professional care. Call 911 for life-threatening emergencies.</small></section>;
 if(feature==="weather")return <section className="workspace"><h1>Local weather</h1><p>Weather information is supplied by Open-Meteo, not PAGASA. Check PAGASA for official Philippine warnings.</p><button className="secondary-button" onClick={locate}><MapPin size={16}/> Use my location</button> <button className="primary-button" onClick={getWeather}>Load forecast</button>{weather&&<pre className="weather-data">{JSON.stringify(weather.data.current,null,2)}</pre>}<a href="https://www.pagasa.dost.gov.ph/" target="_blank" rel="noreferrer">Official PAGASA website <ExternalLink size={13}/></a></section>;
 const c=config[feature];if(!c)return null;
 return <section className="workspace">
  <div className="workspace-heading"><div><h1>{c.title}</h1><p>Information is shown from the connected ResQ database.</p></div><button className="secondary-button" onClick={load}><RefreshCw size={16}/> Refresh</button></div>
  {error&&<div className="alert error">{error}</div>}{notice&&<div className="alert success">{notice}</div>}
  {feature==="incidents"||feature==="assistance"?<form className="record-form" onSubmit={submit}>
   <h3>{feature==="incidents"?"Submit an incident report":"Request emergency assistance"}</h3>
   {c.fields.map((name,i)=><Field key={name} name={name} label={c.labels[i]} value={form[name]} onChange={change}/>)}
   {feature==="incidents"&&<><label className="field">Photo evidence (JPG/PNG, up to 5 files)<input type="file" accept="image/jpeg,image/png" multiple onChange={e=>setPhotos([...e.target.files])}/></label><label className="check-line"><input type="checkbox" checked={urgent} onChange={e=>setUrgent(e.target.checked)}/> Urgent report: obtaining a photograph is unsafe or impossible (submitted as Unverified – Evidence Pending).</label><label className="check-line"><input type="checkbox" required/> I understand knowingly fabricated, manipulated, or misleading reports may result in account restrictions and possible legal consequences under applicable Philippine laws.</label></>}
   <button className="primary-button">Submit</button>
  </form>:null}
  {c.map&&<><button className="secondary-button" onClick={locate}><MapPin size={16}/> Use my current location</button><MapView items={items} userLocation={location} destination={destination} onRouteInfo={setRouteInfo}/>{destination&&<div className="source-note">Route: {routeInfo?`${routeInfo.distanceKm} km · about ${routeInfo.durationMin} minutes (routing estimate)`:"Calculating route..."} · <a href={`https://www.google.com/maps/dir/?api=1&origin=${location?.join(",")||""}&destination=${destination.join(",")}&travelmode=driving`} target="_blank" rel="noreferrer">Open turn-by-turn navigation</a></div>}</>}
  {feature==="warnings"&&<div className="source-note">Official sources: <a href="https://www.pagasa.dost.gov.ph/" target="_blank" rel="noreferrer">PAGASA</a> · <a href="https://www.phivolcs.dost.gov.ph/" target="_blank" rel="noreferrer">PHIVOLCS</a> · <a href="https://noah.up.edu.ph/" target="_blank" rel="noreferrer">UP NOAH</a>. Automatic feeds are not assumed; administrators maintain verified warnings.</div>}
  <div className="record-list"><div className="list-heading"><h3>Records</h3><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search records"/><button className="secondary-button" onClick={load}>Search</button></div>
   {loading?<p>Loading records...</p>:items.length===0?<p>No records available yet.</p>:items.map(item=><article className="record-card" key={item.id}>
    <div><b>{item.name||item.title||item.item_name||item.request_type}</b><p>{item.description||item.address||item.area_name||item.distribution_location||item.location}</p><small>{item.status||item.current_status||item.severity||""} {item.barangay?`· ${item.barangay}`:""}</small></div>
    {isAdmin&&["healthcare","warnings","evacuation","relief"].includes(feature)&&<div className="admin-record-actions"><button className="text-button" onClick={()=>editRecord(item)}>Edit</button><button className="text-button danger" onClick={()=>deleteRecord(item.id)}>Delete</button></div>}
    {c.map&&item.latitude&&item.longitude&&<button className="text-button" onClick={()=>{setDestination([Number(item.latitude),Number(item.longitude)]);if(!location)locate();}}> <Navigation size={15}/> Route</button>}
    {feature==="incidents"&&<><button className="text-button" onClick={()=>viewEvidence(item.id)}>View evidence</button>{admin&&<div className="moderation"><input placeholder="Reason if rejected" value={moderation[item.id]||""} onChange={e=>setModeration({...moderation,[item.id]:e.target.value})}/>{["Verified","Under Review","Rejected","Resolved"].map(s=><button key={s} onClick={()=>moderate(item.id,s)}>{s}</button>)}</div>}</>}
    {feature==="assistance"&&admin&&<select value={item.status} onChange={e=>updateRequest(item.id,e.target.value)}>{["Pending","Accepted","In Progress","Completed","Rejected"].map(s=><option key={s}>{s}</option>)}</select>}
   </article>)}
  </div>
  {isAdmin&&["healthcare","warnings","evacuation","relief"].includes(feature)&&<form className="record-form" onSubmit={submit}><h3>{editingId?"Edit record":"Add new record"}</h3>{c.fields.map((name,i)=><Field key={name} name={name} label={c.labels[i]} value={form[name]} onChange={change}/>) }<button className="primary-button">{editingId?"Save changes":"Add record"}</button>{editingId&&<button type="button" className="secondary-button" onClick={()=>{setEditingId(null);setForm({});}}>Cancel edit</button>}</form>}
 </section>;
}
function UserManagement(){
 const [users,setUsers]=useState([]),[error,setError]=useState("");
 useEffect(()=>{api.get("/admin/users").then(r=>setUsers(r.data.users)).catch(e=>setError(e.response?.data?.message||"Unable to load users."));},[]);
 return <section className="workspace"><h1>User accounts</h1>{error&&<div className="alert error">{error}</div>}{users.map(u=><article className="record-card" key={u.id}><div><b>{u.fullName}</b><p>{u.email} · {u.phone} · {u.address}</p></div><span>{u.role}</span></article>)}</section>;
}

function ProfileWorkspace({user}){
 const [form,setForm]=useState({fullName:user?.fullName||"",phone:user?.phone||"",address:user?.address||""});
 const [message,setMessage]=useState(""),[error,setError]=useState("");
 async function save(e){e.preventDefault();try{await api.patch("/auth/me",form);setMessage("Profile updated. Log out and back in to refresh the account header.");}catch(e){setError(e.response?.data?.message||"Unable to update profile.");}}
 return <section className="workspace"><h1>My profile</h1><p>Update your contact and address details.</p>{error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}<form className="record-form" onSubmit={save}><label className="field">Full name<input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} required/></label><label className="field">Phone number<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/></label><label className="field">Address<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} required/></label><label className="field">Email<input value={user?.email||""} disabled/></label><button className="primary-button">Save profile</button></form></section>;
}
