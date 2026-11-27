import { lazy, useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, HeartPulse, ShieldCheck, LogIn, UserPlus, LogOut, Users, Siren, Activity, Backpack, CloudSun, PhoneCall, Menu, Settings, X, AlertTriangle, Package, Megaphone, LifeBuoy } from "lucide-react";
import api from "./services/api";
import Sidebar from "./components/Sidebar";
import AIChatWidget from "./components/AIChatWidget";
import SafetyAlerts from "./components/SafetyAlerts";
import RescueScene from "./components/RescueScene";
import { useLanguage } from "./i18n/LanguageContext";
import "./App.css";

const FeatureWorkspace=lazy(()=>import("./features/FeatureWorkspace"));
function persistSafeUser(account){
 const {id,fullName,email,role,profilePicture}=account||{};
 localStorage.setItem("resq_user",JSON.stringify({id,fullName,email,role,profilePicture}));
}
function Header({user,onLogout,onNavigate,onToggleNavigation,navigationOpen}){
 const isHome=useLocation().pathname==="/";
 const {t}=useLanguage();
 return <header className={`header${isHome&&!user?" landing-header":""}${user?" portal-header":""}`}><Link to="/" className="brand"><span className="brand-icon"><HeartPulse size={24}/></span><span>ResQ Ko, Mahal Ko</span></Link><nav>{user?<><button type="button" className="header-menu-button" onClick={onToggleNavigation} aria-label={navigationOpen?t("Close navigation menu"):t("Open navigation menu")} aria-expanded={navigationOpen}>{navigationOpen?<X size={19}/>:<Menu size={19}/>}</button><button type="button" className="header-settings-button" onClick={()=>onNavigate?.("settings")} aria-label={t("Settings")} title={t("Settings")}><Settings size={17}/><span>{t("Settings")}</span></button><button type="button" className="nav-button" onClick={onLogout} aria-label={t("Log out")} title={t("Log out")}><LogOut size={16}/><span>{t("Log out")}</span></button></>:isHome?<><a href="#reminders">{t("Reminders")}</a><a href="#about">{t("About")}</a><Link to="/login" className="landing-login">{t("Login")}</Link><Link to="/register" className="nav-signup">{t("Sign up")}</Link></>:<><Link to="/login">{t("User login")}</Link><Link to="/admin/login">{t("Admin")}</Link><Link to="/register" className="nav-signup">{t("Sign up")}</Link></>}</nav></header>;
}
function Home(){
 const {t}=useLanguage();
 const homeRef=useRef(null);
 useEffect(()=>{
  const root=homeRef.current;
  if(!root||!("IntersectionObserver" in window)||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return undefined;
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add("is-revealed");observer.unobserve(entry.target);}
   });
  },{threshold:.12,rootMargin:"0px 0px -24px 0px"});
  root.querySelectorAll("[data-reveal]").forEach(element=>observer.observe(element));
  return()=>observer.disconnect();
 },[]);
 return <main className="landing-page" ref={homeRef}>
 <section className="landing-hero" aria-labelledby="landing-title">
  <div className="landing-copy" data-reveal="left"><div className="landing-eyebrow"><ShieldCheck size={16}/> {t("COMMUNITY CARE & SAFETY")}</div><h1 id="landing-title">{t("Ready together.")}<br/><span>{t("Safer together.")}</span></h1><p>{t("Find community healthcare, emergency support, and disaster-preparedness information in one place.")}</p><div className="landing-actions"><Link to="/login" className="landing-button landing-button-login"><LogIn size={17}/> {t("Login")}</Link><Link to="/register" className="landing-button landing-button-signup"><UserPlus size={17}/> {t("Sign up")}</Link></div><p className="landing-emergency-note"><PhoneCall size={15}/> {t("For a life-threatening emergency in the Philippines, call")} <strong>911</strong>.</p><Link className="admin-link" to="/admin/login">{t("Administrator? Open the admin portal")}</Link></div>
  <div className="landing-art" data-reveal="right"><RescueScene className="rescue-scene landing-scene"/><div className="landing-art-tag landing-art-tag-top"><Siren size={16}/> {t("Safety alerts")}</div><div className="landing-art-tag landing-art-tag-bottom"><Backpack size={16}/> {t("Be prepared")}</div></div>
 </section>
 <section className="landing-reminders" id="reminders" aria-labelledby="reminders-title"><div className="landing-section-heading" data-reveal="up"><span className="landing-eyebrow">{t("A FEW THINGS TO REMEMBER")}</span><h2 id="reminders-title">{t("Small steps can make a big difference.")}</h2><p>{t("Keep these practical reminders in mind and follow instructions from local authorities.")}</p></div><div className="reminder-grid"><article className="reminder-card reminder-emergency" data-reveal="up"><span className="reminder-icon"><PhoneCall size={21}/></span><h3>{t("Know how to get help")}</h3><p>{t("For a life-threatening emergency in the Philippines, call 911. Share your location and follow the responder’s instructions.")}</p></article><article className="reminder-card" data-reveal="up"><span className="reminder-icon"><CloudSun size={21}/></span><h3>{t("Check trusted updates")}</h3><p>{t("Monitor official PAGASA bulletins and your local government’s advisories before and during severe weather.")}</p><a href="https://www.pagasa.dost.gov.ph/" target="_blank" rel="noreferrer">{t("Visit PAGASA")}</a></article><article className="reminder-card" data-reveal="up"><span className="reminder-icon"><Backpack size={21}/></span><h3>{t("Prepare essentials")}</h3><p>{t("Keep water, needed medicines, copies of important contacts, a flashlight, and a charged power bank where you can reach them.")}</p></article></div></section>
 <section className="landing-about" id="about" aria-labelledby="about-title">
  <div data-reveal="left"><span className="landing-eyebrow">{t("MADE FOR OUR COMMUNITY")}</span><h2 id="about-title">{t("Our safety mission")}</h2><p>{t("Safety begins with trusted information, small preparations, and neighbors who can find help quickly. ResQ Ko, Mahal Ko brings community health resources, disaster updates, incident reporting, evacuation information, and emergency assistance together in one accessible place.")}</p><h3>{t("Our objectives")}</h3><ul className="mission-objectives"><li>{t("Make trusted local safety and health information easier to find.")}</li><li>{t("Help families prepare before typhoons, floods, earthquakes, and other emergencies.")}</li><li>{t("Connect people with healthcare, evacuation, relief, and assistance resources.")}</li><li>{t("Encourage verified reports, privacy, and guidance from official authorities.")}</li></ul><p className="mission-disclaimer">{t("Follow official PAGASA, PHIVOLCS, and local government advice. This website supports preparedness and does not replace emergency responders.")}</p></div>
  <aside className="landing-about-aside">
   <div className="studio-credit" data-reveal="right"><span>{t("Created by")}</span><strong>GalaxyLOVESrice STUDIO</strong><span>{t("Main developer")}</span><strong>Kent Michael Leoj Malinao</strong></div>
   <section className="landing-community-card" data-reveal="up" aria-labelledby="community-card-title">
    <div className="landing-community-card-header"><span className="landing-community-icon"><ShieldCheck size={21} aria-hidden="true"/></span><span>{t("OUR COMMUNITY PROMISE")}</span></div>
    <h3 id="community-card-title">{t("Prepared, informed, connected.")}</h3>
    <p>{t("Strong communities prepare together and follow trusted guidance.")}</p>
    <ul className="landing-community-steps">
     <li><span className="landing-community-step-icon"><CloudSun size={18} aria-hidden="true"/></span><span><strong>{t("Stay informed")}</strong><small>{t("Follow official alerts")}</small></span></li>
     <li><span className="landing-community-step-icon"><Backpack size={18} aria-hidden="true"/></span><span><strong>{t("Be ready")}</strong><small>{t("Keep essentials close")}</small></span></li>
     <li><span className="landing-community-step-icon"><HeartPulse size={18} aria-hidden="true"/></span><span><strong>{t("Look out for one another")}</strong><small>{t("Check in on your neighbors")}</small></span></li>
    </ul>
   </section>
  </aside>
 </section>
 </main>;}
function AuthPage({mode,onLogin}){
 const register=mode==="register",admin=mode==="admin",navigate=useNavigate();
 const {t}=useLanguage();
 const [form,setForm]=useState({fullName:"",email:"",phone:"",address:"",password:""}),[error,setError]=useState(""),[message,setMessage]=useState(""),[loading,setLoading]=useState(false);
 const [showPassword,setShowPassword]=useState(false);
 const update=e=>setForm({...form,[e.target.name]:e.target.value});
 async function submit(e){e.preventDefault();setError("");setMessage("");setLoading(true);
 try{if(register){const r=await api.post("/auth/register",form);setMessage(r.data.message);setTimeout(()=>navigate("/login"),900);}
 else{const r=await api.post(admin?"/auth/admin/login":"/auth/login",{email:form.email,password:form.password});onLogin(r.data.token,r.data.user);navigate(r.data.user.role==="admin"?"/admin":"/dashboard");}}
 catch(e){setError(e.response?.data?.message||"Unable to connect to backend.");}finally{setLoading(false);}}
 return <main className="auth-layout"><section className="auth-info"><div className="auth-scene-wrap"><RescueScene className="rescue-scene auth-scene"/><div className="auth-scene-overlay"><span className="auth-logo"><HeartPulse size={31}/></span><span className="auth-scene-caption">{t("Safer together.")}</span></div></div><h1>{register?t("Join our community."):admin?t("Administrator portal."):t("Welcome back.")}</h1><p>{t("Healthcare assistance, disaster preparedness, and community support.")}</p><div className="studio-credit auth-credit"><span>{t("Created by")}</span><strong>GalaxyLOVESrice STUDIO</strong><span>{t("Main developer")}</span><strong>Kent Michael Leoj Malinao</strong></div></section><section className="auth-card"><Link className="auth-back" to="/"><ArrowLeft size={17}/>{t("Back to home")}</Link><h2>{register?t("Create user account"):admin?t("Admin log in"):t("User log in")}</h2><p className="form-subtitle">{t("Enter your account details.")}</p>{error&&<div className="alert error" role="alert">{t(error)}</div>}{message&&<div className="alert success" role="status">{t(message)}</div>}<form onSubmit={submit}>{register&&<><label htmlFor="auth-full-name">{t("Full name")}</label><input id="auth-full-name" name="fullName" autoComplete="name" value={form.fullName} onChange={update} required/><label htmlFor="auth-phone">{t("Phone number")}</label><input id="auth-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update} required/><label htmlFor="auth-address">{t("Address / Municipality")}</label><input id="auth-address" name="address" autoComplete="address-level2" value={form.address} onChange={update} required/></>}<label htmlFor="auth-email">{t("Email address")}</label><input id="auth-email" type="email" name="email" autoComplete="email" value={form.email} onChange={update} required/><label htmlFor="auth-password">{t("Password")}</label><div className="password-input-wrap"><input id="auth-password" type={showPassword?"text":"password"} name="password" autoComplete={register?"new-password":"current-password"} value={form.password} onChange={update} minLength="8" required/><button type="button" className="password-toggle" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?t("Hide password"):t("Show password")} aria-pressed={showPassword}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div><button className="primary-button submit-button" disabled={loading}>{loading?t("Please wait..."):register?t("Create account"):t("Log in")}</button></form><p className="switch-auth">{register?t("Already have an account? "):t("Need an account? ")}<Link to={register?"/login":"/register"}>{register?t("Log in"):t("Sign up")}</Link></p></section></main>;
}
function Portal({admin,user,active,setActive,open,setOpen}){
 const [stats,setStats]=useState(null),[error,setError]=useState("");
 const [account,setAccount]=useState(user);
 const touchStart=useRef(null);
 const {setLanguage,t}=useLanguage();
 const swipeOrder=admin?["overview","users","support","incidents","assistance","relief-requests","announcements","healthcare","warnings","evacuation","relief","weather","typhoons","profile"]:["overview","support","healthcare","warnings","weather","typhoons","incidents","evacuation","assistance","relief","announcements","profile"];
 useEffect(()=>{let mounted=true;api.get("/auth/me").then(response=>{if(mounted){setAccount(response.data.user);persistSafeUser(response.data.user);if(response.data.user.language)setLanguage(response.data.user.language);}}).catch(e=>{if(mounted)setError(e.response?.data?.message||"Unable to refresh your account profile.");});return()=>{mounted=false;};},[setLanguage]);
 useEffect(()=>{if(!open)return undefined;function closeOnEscape(event){if(event.key==="Escape")setOpen(false);}window.addEventListener("keydown",closeOnEscape);return()=>window.removeEventListener("keydown",closeOnEscape);},[open]);
 function updateAccount(updated){const next={...account,...updated};setAccount(next);persistSafeUser(next);}
 function selectSection(id){setActive(id);setOpen(false);}
 useEffect(()=>{if(admin)api.get("/admin/overview").then(r=>setStats(r.data.stats)).catch(e=>setError(e.response?.data?.message||"Unable to load statistics."));},[admin]);
 function handleTouchStart(event){
  if(window.innerWidth>800)return;
  const touch=event.changedTouches[0];
  touchStart.current={x:touch.clientX,y:touch.clientY,target:event.target};
 }
 function handleTouchEnd(event){
  const start=touchStart.current;
  touchStart.current=null;
  if(!start||window.innerWidth>800)return;
  const touch=event.changedTouches[0],dx=touch.clientX-start.x,dy=touch.clientY-start.y;
  if(Math.abs(dx)<85||Math.abs(dy)>65)return;
  if(open){if(dx<0)setOpen(false);return;}
  if(dx>0&&start.x<28){setOpen(true);return;}
  const interactive=start.target.closest?.("input,textarea,select,button,a,[role='button'],.map-wrap,.users-table-scroll,.rain-probability-scroll");
  if(interactive)return;
  const currentIndex=swipeOrder.indexOf(active);
  if(currentIndex<0)return;
  const nextIndex=dx<0?currentIndex+1:currentIndex-1;
  if(nextIndex>=0&&nextIndex<swipeOrder.length)setActive(swipeOrder[nextIndex]);
 }
 return <div className={`portal${open?" navigation-open":""}`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}><Sidebar admin={admin} active={active} onSelect={selectSection} open={open} onToggle={()=>setOpen(false)} user={account}/><main className="portal-main">{admin&&active==="overview"&&<><div className="admin-dashboard-heading"><span>{t("ADMINISTRATOR WORKSPACE")}</span><h1>{t("Admin dashboard")}</h1><p>{t("Monitor reports, urgent requests, and support follow-ups from one place.")}</p></div><div className="stats-grid">{[["Registered users",stats?.totalUsers,Users],["Incident reports",stats?.totalReports,Siren],["Pending reports",stats?.pendingReports,Activity],["Verified reports",stats?.verifiedReports,ShieldCheck],["Assistance requests",stats?.totalAssistance,HeartPulse],["Urgent assistance",stats?.urgentAssistance,AlertTriangle],["Pending relief requests",stats?.pendingReliefRequests,Package],["Open support requests",stats?.openSupportTickets,LifeBuoy],["Active announcements",stats?.activeAnnouncements,Megaphone]].map(([label,value,Icon])=><div className="stat-card" key={label}><Icon/><span>{t(label)}</span><strong>{value??"—"}</strong></div>)}</div></>}{error&&<div className="alert error">{t(error)}</div>}{active==="warnings"&&<SafetyAlerts visible onNavigate={setActive}/>}<FeatureWorkspace feature={active} admin={admin} user={account} onUserUpdate={updateAccount} onNavigate={setActive}/><AIChatWidget/></main></div>;
}
export default function App(){
 const {t}=useLanguage();
 const [token,setToken]=useState(localStorage.getItem("resq_token"));
 const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("resq_user")||"null");}catch{return null;}});
 const [activeFeature,setActiveFeature]=useState("overview"),[navigationOpen,setNavigationOpen]=useState(false);
 useEffect(()=>{
  const saved=localStorage.getItem("resq_theme")||"system";
  const resolved=saved==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):saved;
  document.documentElement.dataset.theme=resolved;
  if(localStorage.getItem("resq_readable_mode")==="true")document.documentElement.dataset.readableMode="true";
  else delete document.documentElement.dataset.readableMode;
 },[]);
 function login(t,u){localStorage.setItem("resq_token",t);persistSafeUser(u);setToken(t);setUser(u);setActiveFeature("overview");setNavigationOpen(false);}
 function logout(){localStorage.removeItem("resq_token");localStorage.removeItem("resq_user");setToken(null);setUser(null);setActiveFeature("overview");setNavigationOpen(false);}
 const admin=user?.role==="admin";
 return <><Header user={user} onLogout={logout} onNavigate={feature=>{setActiveFeature(feature);setNavigationOpen(false);}} onToggleNavigation={()=>setNavigationOpen(value=>!value)} navigationOpen={navigationOpen}/><Routes><Route path="/" element={<Home/>}/><Route path="/register" element={token?<Navigate to={admin?"/admin":"/dashboard"}/>:<AuthPage mode="register" onLogin={login}/>}/><Route path="/login" element={token?<Navigate to={admin?"/admin":"/dashboard"}/>:<AuthPage mode="login" onLogin={login}/>}/><Route path="/admin/login" element={token?<Navigate to={admin?"/admin":"/dashboard"}/>:<AuthPage mode="admin" onLogin={login}/>}/><Route path="/dashboard" element={token&&!admin?<Portal admin={false} user={user} active={activeFeature} setActive={setActiveFeature} open={navigationOpen} setOpen={setNavigationOpen}/>:<Navigate to={admin?"/admin":"/login"}/>}/><Route path="/admin" element={token&&admin?<Portal admin user={user} active={activeFeature} setActive={setActiveFeature} open={navigationOpen} setOpen={setNavigationOpen}/>:<Navigate to="/admin/login"/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes><footer className="footer">{t("ResQ Ko, Mahal Ko · Community care starts with us.")}</footer></>;
}
