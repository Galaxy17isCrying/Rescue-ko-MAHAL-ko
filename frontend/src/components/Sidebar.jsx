import { Menu, X, HeartPulse, MapPinned, Hospital, Siren, ClipboardList, TentTree, HandHeart, Package, MessageCircle, CloudSun, Users, LayoutDashboard } from "lucide-react";
const items = [
 ["overview","Overview",LayoutDashboard],["profile","My profile",Users],["healthcare","Healthcare directory",Hospital],["warnings","Disaster warnings",Siren],
 ["incidents","Incident reports",ClipboardList],["evacuation","Evacuation centers",TentTree],["assistance","Emergency assistance",HandHeart],
 ["relief","Relief information",Package],["weather","Local weather",CloudSun],["chat","ResQ AI",MessageCircle]
];
export default function Sidebar({admin,active,onSelect,open,onToggle}){
 const visible=admin?[...items.slice(0,1),["users","User accounts",Users],...items.slice(1)]:items;
 return <><button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button>
 {open&&<><div className="sidebar-scrim" onClick={onToggle}/><aside className="sidebar">
 <div className="sidebar-brand"><HeartPulse/> <b>ResQ Ko</b></div>
 <small>{admin?"ADMINISTRATION":"COMMUNITY SERVICES"}</small>
 {visible.map(([id,label,Icon])=><button key={id} className={active===id?"active":""} onClick={()=>{onSelect(id);onToggle();}}><Icon size={18}/>{label}</button>)}
 </aside></>}</>;
}
