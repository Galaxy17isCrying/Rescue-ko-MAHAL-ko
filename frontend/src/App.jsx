import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { HeartPulse, ShieldCheck, LogIn, UserPlus, LogOut, Users, Siren, Activity } from "lucide-react";
import axios from "axios";
import api from "./services/api";
import Sidebar from "./components/Sidebar";
import FeatureWorkspace from "./features/FeatureWorkspace";
import "./App.css";

const API_URL=import.meta.env.VITE_API_URL||"http://localhost:5000/api";
function Header({user,onLogout}){
 return <header className="header"><Link to="/" className="brand"><span className="brand-icon"><HeartPulse size={24}/></span><span>ResQ Ko, Mahal Ko</span></Link><nav>{user?<><span className="role-label">{user.role.toUpperCase()}</span><button className="nav-button" onClick={onLogout}><LogOut size={16}/> Log out</button></>:<><Link to="/login">User login</Link><Link to="/admin/login">Admin</Link><Link to="/register" className="nav-signup">Sign up</Link></>}</nav></header>;
}
function Home(){return <main className="hero"><div className="hero-content"><div className="eyebrow"><ShieldCheck size={16}/> COMMUNITY CARE AND SAFETY</div><h1>Alagang Pangkalusugan,<br/><span>Handa sa Kalamidad.</span></h1><p>A community support platform connecting people with healthcare information, emergency assistance, and disaster preparedness resources.</p><div className="hero-actions"><Link to="/register" className="primary-button"><UserPlus size={18}/> Create an account</Link><Link to="/login" className="secondary-button"><LogIn size={18}/> User log in</Link></div><p className="public-note">For life-threatening emergencies in the Philippines, call 911.</p><Link className="admin-link" to="/admin/login">Administrator? Access the admin portal</Link></div><div className="hero-card"><div className="big-icon"><HeartPulse size={48}/></div><h2>Here for the community.</h2><p>Care, preparedness, and assistance in one place.</p><div className="feature-line">Healthcare assistance</div><div className="feature-line">Disaster preparedness</div><div className="feature-line">Community support</div></div></main>;}
function AuthPage({mode,onLogin}){
 const register=mode==="register",admin=mode==="admin",navigate=useNavigate();
 const [form,setForm]=useState({fullName:"",email:"",phone:"",address:"",password:""}),[error,setError]=useState(""),[message,setMessage]=useState(""),[loading,setLoading]=useState(false);
 const update=e=>setForm({...form,[e.target.name]:e.target.value});
 async function submit(e){e.preventDefault();setError("");setMessage("");setLoading(true);
 try{if(register){const r=await axios.post(`${API_URL}/auth/register`,form);setMessage(r.data.message);setTimeout(()=>navigate("/login"),900);}
 else{const r=await axios.post(`${API_URL}${admin?"/auth/admin/login":"/auth/login"}`,{email:form.email,password:form.password});onLogin(r.data.token,r.data.user);navigate(r.data.user.role==="admin"?"/admin":"/dashboard");}}
 catch(e){setError(e.response?.data?.message||"Unable to connect to backend.");}finally{setLoading(false);}}
 return <main className="auth-layout"><section className="auth-info"><div className="auth-logo"><HeartPulse size={34}/></div><h1>{register?"Join our community.":admin?"Administrator portal.":"Welcome back."}</h1><p>Healthcare assistance, disaster preparedness, and community support.</p></section><section className="auth-card"><h2>{register?"Create user account":admin?"Admin log in":"User log in"}</h2><p className="form-subtitle">Enter your account details.</p>{error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}<form onSubmit={submit}>{register&&<><label>Full name</label><input name="fullName" value={form.fullName} onChange={update} required/><label>Phone number</label><input name="phone" value={form.phone} onChange={update} required/><label>Address / Municipality</label><input name="address" value={form.address} onChange={update} required/></>}<label>Email address</label><input type="email" name="email" value={form.email} onChange={update} required/><label>Password</label><input type="password" name="password" value={form.password} onChange={update} minLength="8" required/><button className="primary-button submit-button" disabled={loading}>{loading?"Please wait...":register?"Create account":"Log in"}</button></form><p className="switch-auth">{register?"Already have an account? ":"Need an account? "}<Link to={register?"/login":"/register"}>{register?"Log in":"Sign up"}</Link></p></section></main>;
}
function Portal({admin,user,onLogout}){
 const [active,setActive]=useState("overview"),[open,setOpen]=useState(false),[stats,setStats]=useState(null),[error,setError]=useState("");
 useEffect(()=>{if(admin)api.get("/admin/overview").then(r=>setStats(r.data.stats)).catch(e=>setError(e.response?.data?.message||"Unable to load statistics."));},[admin]);
 return <div className="portal"><Sidebar admin={admin} active={active} onSelect={setActive} open={open} onToggle={()=>setOpen(!open)}/><main className="portal-main"><div className="portal-top"><span>{admin?"Administrator workspace":"Community dashboard"}</span><button className="nav-button" onClick={onLogout}><LogOut size={16}/> Log out</button></div>{admin&&active==="overview"&&<div className="stats-grid">{[["Registered users",stats?.totalUsers,Users],["Incident reports",stats?.totalReports,Siren],["Pending reports",stats?.pendingReports,Activity],["Verified reports",stats?.verifiedReports,ShieldCheck],["Assistance requests",stats?.totalAssistance,HeartPulse]].map(([label,value,Icon])=><div className="stat-card" key={label}><Icon/><span>{label}</span><strong>{value??"—"}</strong></div>)}</div>}{error&&<div className="alert error">{error}</div>}<FeatureWorkspace feature={active} admin={admin} user={user}/></main></div>;
}
export default function App(){
 const [token,setToken]=useState(localStorage.getItem("resq_token"));
 const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem("resq_user")||"null");}catch{return null;}});
 function login(t,u){localStorage.setItem("resq_token",t);localStorage.setItem("resq_user",JSON.stringify(u));setToken(t);setUser(u);}
 function logout(){localStorage.removeItem("resq_token");localStorage.removeItem("resq_user");setToken(null);setUser(null);}
 const admin=user?.role==="admin";
 return <><Header user={user} onLogout={logout}/><Routes><Route path="/" element={<Home/>}/><Route path="/register" element={token?<Navigate to={admin?"/admin":"/dashboard"}/>:<AuthPage mode="register" onLogin={login}/>}/><Route path="/login" element={token?<Navigate to={admin?"/admin":"/dashboard"}/>:<AuthPage mode="login" onLogin={login}/>}/><Route path="/admin/login" element={token?<Navigate to={admin?"/admin":"/dashboard"}/>:<AuthPage mode="admin" onLogin={login}/>}/><Route path="/dashboard" element={token&&!admin?<Portal admin={false} user={user} onLogout={logout}/>:<Navigate to={admin?"/admin":"/login"}/>}/><Route path="/admin" element={token&&admin?<Portal admin user={user} onLogout={logout}/>:<Navigate to="/admin/login"/>}/><Route path="*" element={<Navigate to="/"/>}/></Routes><footer className="footer">ResQ Ko, Mahal Ko · Community care starts with us.</footer></>;
}
