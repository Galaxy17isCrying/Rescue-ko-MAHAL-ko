const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const TYPE_LABEL = { hospital: "Hospital", clinic: "Clinic", doctors: "Doctor's office", pharmacy: "Pharmacy", ambulance_station: "Emergency" };
 
// Turns a place name (e.g. "Caloocan" or "Philippine General Hospital") into coordinates. Philippines only.
export async function geocodePlace(query) {
  const url = `${NOMINATIM}?format=jsonv2&limit=5&countrycodes=ph&q=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" }, signal: controller.signal });
    if (!res.ok) throw new Error("Place search failed. Please try again in a moment.");
    const data = await res.json();
    return data.map(p => ({ name: p.display_name, latitude: Number(p.lat), longitude: Number(p.lon) }));
  } finally {
    clearTimeout(timeout);
  }
}
 
// Finds hospitals, clinics, doctors, pharmacies and health centers around a point.
export async function findHealthcare(lat, lon, radiusMeters = 5000) {
  const around = `(around:${radiusMeters},${lat},${lon})`;
  const query = `[out:json][timeout:15];(
    nwr["amenity"~"^(hospital|clinic|doctors|pharmacy|ambulance_station)$"]${around};
    nwr["healthcare"="centre"]${around};
  );out center 100;`;
  let elements;
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const json = await res.json();
      if (!Array.isArray(json.elements)) throw new Error("The map service returned an invalid response.");
      elements = json.elements;
      break;
    } catch (error) {
      lastError = error.name === "AbortError"
        ? new Error("The healthcare map service timed out.")
        : error;
    } finally {
      clearTimeout(timeout);
    }
  }
  if (!elements) {
    throw new Error(`Could not load healthcare facilities. ${lastError?.message || "The map service may be busy; please try again."}`);
  }
  return elements
    .map(e => {
      const t = e.tags || {};
      const type = TYPE_LABEL[t.amenity] || (t.healthcare === "centre" ? "Health Center" : "Healthcare facility");
      return {
        id: `osm-${e.type}-${e.id}`,
        source: "osm",
        name: t.name || "",
        facility_type: type,
        emergency: t.emergency === "yes" || t.amenity === "ambulance_station",
        address: [t["addr:housenumber"], t["addr:street"], t["addr:suburb"], t["addr:city"]].filter(Boolean).join(", ") || "Address not listed",
        phone: t.phone || t["contact:phone"] || null,
        latitude: e.lat ?? e.center?.lat,
        longitude: e.lon ?? e.center?.lon,
      };
    })
    .filter(f => f.name && f.latitude && f.longitude);
}