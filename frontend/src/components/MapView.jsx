import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
const icon = new L.Icon({iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",iconSize:[25,41],iconAnchor:[12,41]});
const destinationIcon = L.divIcon({className:"route-destination-marker",html:"<span></span>",iconSize:[20,20],iconAnchor:[10,10]});
function hasCoordinates(item){
 return item.latitude!==null&&item.latitude!==undefined&&item.latitude!==""&&item.longitude!==null&&item.longitude!==undefined&&item.longitude!==""&&Number.isFinite(Number(item.latitude))&&Number.isFinite(Number(item.longitude))&&Math.abs(Number(item.latitude))<=90&&Math.abs(Number(item.longitude))<=180;
}
function FitMapToMarkers({positions,userLocation,focus}){
 const map=useMap();
 const signature=positions.map(point=>point.join(",")).join("|");
 useEffect(()=>{
  // When the person searched a place, frame that place. Otherwise frame the markers and the user's location.
  const allPositions=focus?[...positions,focus]:(userLocation?[...positions,userLocation]:positions);
  if(!allPositions.length)return;
  if(allPositions.length===1)map.setView(allPositions[0],14);
  else map.fitBounds(L.latLngBounds(allPositions),{padding:[30,30],maxZoom:14});
 },[map,signature,userLocation?.[0],userLocation?.[1],focus?.[0],focus?.[1]]);
 return null;
}
function RouteLine({from,to,onRouteInfo,onRouteError}) {
 const map=useMap();
 useEffect(()=>{
  if(!from||!to)return;
  const controller=new AbortController();
  let layer;
  let active=true;
  const timeout=setTimeout(()=>controller.abort(),15000);
  async function loadRoute(){
   try{
    const response=await fetch(`https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`,{signal:controller.signal});
    if(!response.ok)throw new Error(`Routing service returned HTTP ${response.status}.`);
    const data=await response.json();
    if(data.code!=="Ok"||!data.routes?.length)throw new Error("No road route was found between these locations.");
    if(controller.signal.aborted)return;
    const best=data.routes[0];
    onRouteInfo?.({distanceKm:(best.distance/1000).toFixed(1),durationMin:Math.round(best.duration/60)});
    layer=L.geoJSON(best.geometry,{style:{color:"#dc2626",weight:5,opacity:.9}}).addTo(map);
    map.fitBounds(layer.getBounds(),{padding:[25,25]});
   }catch(error){
    if(active)onRouteError?.(controller.signal.aborted?"The routing service timed out. Use turn-by-turn navigation to continue.":error.message||"Could not load a road route. Please try again.");
   }finally{
    clearTimeout(timeout);
   }
  }
  const requestTimer=setTimeout(loadRoute,0);
  return ()=>{active=false;clearTimeout(requestTimer);clearTimeout(timeout);controller.abort();if(layer)map.removeLayer(layer);};
 },[from?.[0],from?.[1],to?.[0],to?.[1],map,onRouteInfo,onRouteError]);
 return null;
}
export default function MapView({items=[],userLocation,locationLabel="Your location",emptyMessage="No matching records with valid map coordinates.",destination,destinationLabel,onRouteInfo,onRouteError,focus}){
 const center=focus||userLocation||[14.5547,121.0244];
 const mappedItems=items.filter(hasCoordinates);
 const positions=mappedItems.map(item=>[Number(item.latitude),Number(item.longitude)]);
 return <div className="map-wrap"><MapContainer center={center} zoom={12} scrollWheelZoom style={{height:"360px",width:"100%"}}>
  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
  <FitMapToMarkers positions={positions} userLocation={userLocation} focus={focus}/>
  {userLocation&&<Marker position={userLocation} icon={icon}><Popup>{locationLabel||"Your location"}</Popup></Marker>}
  {mappedItems.map(item=><Marker key={item.id} position={[Number(item.latitude),Number(item.longitude)]} icon={icon}><Popup><b>{item.name}</b><br/>{item.facility_type||item.address}<br/>{item.facility_type?item.address:""}{item.phone?<><br/>{item.phone}</>:null}{item.source==="osm"?<><br/><small>Source: OpenStreetMap. Call to confirm before going.</small></>:null}</Popup></Marker>)}
  {destination&&<><Marker position={destination} icon={destinationIcon}><Popup>{destinationLabel||"Destination"}</Popup></Marker><RouteLine from={userLocation} to={destination} onRouteInfo={onRouteInfo} onRouteError={onRouteError}/></>}
 </MapContainer>{mappedItems.length===0&&<p className="map-empty">{emptyMessage}</p>}</div>;
}
