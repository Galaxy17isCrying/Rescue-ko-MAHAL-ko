import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import { Bell, BellOff, ExternalLink, Radio, RefreshCw, Waves, Wind } from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../i18n/LanguageContext";
import "leaflet/dist/leaflet.css";

const DEFAULT_PREFERENCES = {
  emergency: true,
  weather: true,
  evacuation: true,
  medical: true,
  rescue: true,
  community: true,
  email: false,
  inApp: true,
  typhoonAlerts: false,
  earthquakeAlerts: false
};
const SEEN_KEY = "resq_seen_live_alerts";

function readSeen() {
  try {
    const saved = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function trackName(track, index) {
  const properties = track?.properties || {};
  return properties.name || properties.NAME || properties.storm_name || properties.STORMNAME || `Typhoon track ${index + 1}`;
}

function earthquakeName(event) {
  return event?.properties?.title || "Earthquake activity";
}

function earthquakeKey(event) {
  return `earthquake:${event.id || `${event.properties?.time || ""}:${earthquakeName(event)}`}`;
}

function typhoonKey(track, index) {
  const properties = track?.properties || {};
  return `typhoon:${track.id || properties.id || properties.storm_id || properties.name || properties.NAME || index}`;
}

function formatEventTime(timestamp) {
  if (!Number.isFinite(timestamp)) return "Time not provided";
  return new Date(timestamp).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

function FitTrackBounds({ data }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.geoJSON(data).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 7 });
  }, [data, map]);
  return null;
}

function TyphoonTrackMap({ tracks, label }) {
  const data = useMemo(() => ({
    type: "FeatureCollection",
    features: tracks.filter(track => track?.type === "Feature" && track.geometry)
  }), [tracks]);
  return <div className="typhoon-map" role="region" aria-label={label}>
    <MapContainer center={[12.8797, 121.774]} zoom={5} scrollWheelZoom={false} aria-label={label}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {data.features.length > 0 && <GeoJSON data={data} style={{ color: "#b43e39", weight: 3, dashArray: "7 5" }} pointToLayer={(_, latLng) => L.circleMarker(latLng, { radius: 6, color: "#8f2f2a", fillColor: "#e99b58", fillOpacity: 0.9, weight: 2 })} onEachFeature={(feature, layer) => layer.bindTooltip(trackName({ properties: feature.properties }, 0))} />}
      <FitTrackBounds data={data} />
    </MapContainer>
  </div>;
}

export default function SafetyAlerts({ visible, onNavigate }) {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastChecked, setLastChecked] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const seen = useRef(readSeen());
  const seeded = useRef(false);

  useEffect(() => {
    let active = true;
    api.get("/auth/me").then(response => {
      if (active && response.data.user?.notificationPreferences) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...response.data.user.notificationPreferences });
      }
    }).catch(() => {
      if (active) setError("Could not load saved alert preferences.");
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    let requestInFlight = false;

    async function refresh() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await api.get("/weather/alerts");
        if (!active) return;
        const data = response.data;
        setAlerts(data);
        setLastChecked(data.checkedAt);
        setError("");

        const currentItems = [
          ...(data.typhoon?.tracks || []).map((track, index) => ({
            id: typhoonKey(track, index),
            title: t("UP NOAH / PAGASA typhoon track update"),
            body: trackName(track, index),
            enabled: preferences.typhoonAlerts
          })),
          ...(data.earthquake?.events || []).map(event => ({
            id: earthquakeKey(event),
            title: t("Recent earthquake in the Philippines"),
            body: earthquakeName(event),
            enabled: preferences.earthquakeAlerts
          }))
        ];

        if (!seeded.current) {
          currentItems.forEach(item => seen.current.add(item.id));
          seeded.current = true;
        } else {
          currentItems.forEach(item => {
            if (!seen.current.has(item.id) && item.enabled && window.Notification?.permission === "granted") {
              new window.Notification(item.title, { body: item.body, tag: item.id });
            }
            seen.current.add(item.id);
          });
        }
        const savedIds = Array.from(seen.current).slice(-500);
        seen.current = new Set(savedIds);
        localStorage.setItem(SEEN_KEY, JSON.stringify(savedIds));
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Live safety alerts are temporarily unavailable.");
      } finally {
        requestInFlight = false;
        if (active) setLoading(false);
      }
    }

    refresh();
    const interval = window.setInterval(refresh, 5 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [preferences.typhoonAlerts, preferences.earthquakeAlerts, refreshKey, t]);

  async function togglePreference(key, label) {
    if (saving) return;
    setError("");
    setNotice("");
    const enabled = !preferences[key];
    if (enabled && "Notification" in window && window.Notification.permission === "default") {
      try {
        await window.Notification.requestPermission();
      } catch {
        setNotice(t("Browser notifications could not be enabled. Live alerts remain available on this page."));
      }
    }

    const updated = { ...preferences, [key]: enabled };
    setSaving(key);
    try {
      await api.patch("/auth/me", { notificationPreferences: updated });
      setPreferences(updated);
      if (!("Notification" in window) || window.Notification.permission !== "granted") {
        setNotice(t("Preference saved. Allow browser notifications in your browser settings to receive desktop alerts while ResQ is open."));
      } else {
        setNotice(enabled ? `${label} ${t("enabled. New feed items can notify you while ResQ is open.")}` : `${label} ${t("disabled.")}`);
      }
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Could not save your alert preference.");
    } finally {
      setSaving("");
    }
  }

  if (!visible) return null;
  const tracks = alerts?.typhoon?.tracks || [];
  const earthquakes = alerts?.earthquake?.events || [];

  return <section className="live-alerts" aria-labelledby="live-alerts-title">
    <div className="live-alerts-heading">
      <div>
        <span className="live-alerts-eyebrow"><Radio size={15} /> {t("PHILIPPINES LIVE FEEDS")}</span>
        <h2 id="live-alerts-title">{t("Typhoon & earthquake updates")}</h2>
        <p>Source-attributed activity updates. Earthquakes cannot be predicted; always follow PAGASA, PHIVOLCS, and LGU instructions.</p>
      </div>
      <span className="live-alerts-refresh">{loading ? t("Checking feeds…") : lastChecked ? `${t("Updated")} ${formatEventTime(Date.parse(lastChecked))}` : t("Feed status unavailable")}</span>
    </div>

    {notice && <p className="live-alerts-notice" role="status" aria-live="polite">{notice}</p>}
    {error && <p className="live-alert-error" role="alert">{t(error)}</p>}

    <div className="live-alerts-grid">
      <article className="live-alert-card typhoon-alert-card">
        <div className="live-alert-card-title"><span className="live-alert-icon"><Wind size={19} /></span><div><h3>{t("Typhoon tracks")}</h3><span>{alerts?.typhoon?.available ? `${tracks.length} ${t("track(s) in feed")}` : loading ? t("Checking UP NOAH…") : t("Feed unavailable")}</span></div></div>
        {tracks.length ? <ul>{tracks.slice(0, 4).map((track, index) => <li key={typhoonKey(track, index)}>{trackName(track, index)}</li>)}</ul> : <p>{alerts?.typhoon?.available ? t("No typhoon tracks are currently plotted. This does not predict whether a storm may form.") : t("Check the official PAGASA bulletin for current advisories.")}</p>}
        <div className="typhoon-map-heading"><b>{t("Typhoon path map")}</b><span>{t("Forecast tracks are informational; follow official advisories.")}</span></div>
        <TyphoonTrackMap tracks={tracks} label={t("Typhoon path map")} />
        <div className="live-alert-actions">
          {onNavigate && (
            <button type="button" className="alert-notify-button" onClick={() => onNavigate("typhoons")}>
              <Wind size={15} /> {t("Typhoon history")}
            </button>
          )}
          <button type="button" className={`alert-notify-button ${preferences.typhoonAlerts ? "enabled" : ""}`} onClick={() => togglePreference("typhoonAlerts", t("Typhoon alerts"))} disabled={Boolean(saving)} aria-pressed={Boolean(preferences.typhoonAlerts)}>
            {preferences.typhoonAlerts ? <Bell size={16} /> : <BellOff size={16} />}{saving === "typhoonAlerts" ? t("Saving…") : preferences.typhoonAlerts ? t("Typhoon alerts on") : t("Notify me")}
          </button>
          <a href={alerts?.typhoon?.sourceUrl || "https://noah.up.edu.ph/weather-updates"} target="_blank" rel="noreferrer">UP NOAH <ExternalLink size={13} /></a>
        </div>
      </article>

      <article className="live-alert-card earthquake-alert-card">
        <div className="live-alert-card-title"><span className="live-alert-icon"><Waves size={19} /></span><div><h3>{t("Recent earthquakes")}</h3><span>{alerts?.earthquake?.available ? `${earthquakes.length} ${t("event(s) · past 7 days")}` : loading ? t("Checking feeds…") : t("Feed unavailable")}</span></div></div>
        {earthquakes.length ? <ul>{earthquakes.slice(0, 4).map(event => <li key={earthquakeKey(event)}><a href={event.properties?.url || alerts?.earthquake?.sourceUrl} target="_blank" rel="noreferrer"><b>M{Number(event.properties?.mag).toFixed(1)}</b> · {earthquakeName(event)}</a><small>{formatEventTime(event.properties?.time)}</small></li>)}</ul> : <p>{alerts?.earthquake?.available ? t("No recent events in the Philippines-filtered feed.") : t("Check PHIVOLCS for official earthquake information.")}</p>}
        <div className="live-alert-actions">
          <button type="button" className={`alert-notify-button ${preferences.earthquakeAlerts ? "enabled" : ""}`} onClick={() => togglePreference("earthquakeAlerts", t("Earthquake updates"))} disabled={Boolean(saving)} aria-pressed={Boolean(preferences.earthquakeAlerts)}>
            {preferences.earthquakeAlerts ? <Bell size={16} /> : <BellOff size={16} />}{saving === "earthquakeAlerts" ? t("Saving…") : preferences.earthquakeAlerts ? t("Earthquake alerts on") : t("Notify me")}
          </button>
          <a href={alerts?.earthquake?.phivolcsUrl || "https://www.phivolcs.dost.gov.ph/"} target="_blank" rel="noreferrer">PHIVOLCS <ExternalLink size={13} /></a>
        </div>
      </article>
    </div>

    <p className="live-alerts-source">{t("Typhoon tracks")}: UP NOAH/PAGASA. {t("Earthquake activity")}: USGS catalog, geographically filtered to the Philippines. {t("Browser notifications require permission and only update while this app is open.")} <button type="button" className="alert-refresh-button" onClick={()=>{setLoading(true);setRefreshKey(current=>current+1);}} disabled={loading}><RefreshCw size={13}/> {t("Refresh feeds")}</button></p>
  </section>;
}
