import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
const icon = new L.Icon({iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",iconSize:[25,41],iconAnchor:[12,41]});
function RouteLine({from,to,onRouteInfo}) {
 const map=useMap();
 useEffect(()=>{
  if(!from||!to)return;
  let layer;
  fetch(`https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&alternatives=true`)
   .then(r=>r.json()).then(data=>{
    if(data.routes?.length){
     const best=data.routes[0];
     onRouteInfo?.({distanceKm:(best.distance/1000).toFixed(1),durationMin:Math.round(best.duration/60)});
     const features=data.routes.map(route=>({type:"Feature",geometry:route.geometry,properties:{}}));
     layer=L.geoJSON(features,{style:{color:"red",weight:5,opacity:.8}}).addTo(map);
     map.fitBounds(layer.getBounds(),{padding:[25,25]});
    }
   }).catch(()=>{});
  return ()=>{if(layer)map.removeLayer(layer);};
 },[from?.[0],from?.[1],to?.[0],to?.[1],map]);
 return null;
}
export default function MapView({items=[],userLocation,destination,onRouteInfo}){
 const center=userLocation||[14.5547,121.0244];
 return <div className="map-wrap"><MapContainer center={center} zoom={12} scrollWheelZoom style={{height:"360px",width:"100%"}}>
  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
  {userLocation&&<Marker position={userLocation} icon={icon}><Popup>Your location</Popup></Marker>}
  {items.filter(x=>Number.isFinite(Number(x.latitude))&&Number.isFinite(Number(x.longitude))).map(item=><Marker key={item.id} position={[Number(item.latitude),Number(item.longitude)]} icon={icon}><Popup><b>{item.name}</b><br/>{item.address}</Popup></Marker>)}
  {destination&&<RouteLine from={userLocation} to={destination} onRouteInfo={onRouteInfo}/>}
 </MapContainer></div>;
}
