import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Eye,
  Filter,
  Gauge,
  Info,
  Layers,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  SkipBack,
  SkipForward,
  Wind
} from "lucide-react";
import api from "../services/api";
import { TYPHOON_HISTORY as LOCAL_TYPHOON_HISTORY } from "../data/typhoonHistoryData";
import { useLanguage } from "../i18n/LanguageContext";
import "leaflet/dist/leaflet.css";

const CATEGORY_COLORS = {
  "Super Typhoon": "#dc2626", // Red
  "Typhoon": "#ea580c",        // Orange
  "Severe Tropical Storm": "#d97706", // Amber
  "Tropical Storm": "#2563eb", // Blue
  "Tropical Depression": "#0284c7" // Light blue
};

const MULTI_TRACK_PALETTE = [
  "#dc2626", // Yolanda - Red
  "#7c3aed", // Odette - Purple
  "#ea580c", // Rolly - Orange
  "#059669", // Pepito - Emerald
  "#0284c7", // Kristine - Cyan
  "#d97706", // Ulysses - Amber
  "#db2777", // Ondoy - Pink
  "#4f46e5", // Ompong - Indigo
  "#16a34a", // Pablo - Green
  "#0891b2"  // Carina - Teal
];

function createLandfallIcon(sequence, isSelected = false) {
  return L.divIcon({
    className: "typhoon-landfall-div-icon",
    html: `
      <div class="landfall-pin ${isSelected ? "selected" : ""}" title="Landfall #${sequence}">
        <span class="landfall-badge">${sequence}</span>
        <span class="landfall-pulse"></span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
}

function createActiveEyeIcon(windKmH) {
  return L.divIcon({
    className: "typhoon-eye-div-icon",
    html: `
      <div class="typhoon-eye-marker">
        <span class="typhoon-eye-core"></span>
        <span class="typhoon-eye-ripple"></span>
        <span class="typhoon-eye-label">${windKmH}kph</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
}

function FitTyphoonBounds({ positions, focusPoint }) {
  const map = useMap();
  useEffect(() => {
    if (focusPoint) {
      map.flyTo(focusPoint, 9, { duration: 1.2 });
      return;
    }
    if (!positions || positions.length === 0) return;
    try {
      const bounds = L.latLngBounds(positions);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
      }
    } catch (e) {
      console.warn("Could not fit map bounds:", e);
    }
  }, [map, positions, focusPoint]);
  return null;
}

export default function TyphoonHistoryWorkspace({ onNavigate }) {
  const { t } = useLanguage();
  const [typhoons, setTyphoons] = useState(LOCAL_TYPHOON_HISTORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(LOCAL_TYPHOON_HISTORY[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [focusPoint, setFocusPoint] = useState(null);
  const [activeLandfallIndex, setActiveLandfallIndex] = useState(null);
  const playTimerRef = useRef(null);

  // Fetch updated records from backend with local fallback
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/weather/typhoon-history")
      .then(res => {
        if (mounted && Array.isArray(res.data?.items) && res.data.items.length > 0) {
          setTyphoons(res.data.items);
        }
      })
      .catch(err => {
        console.warn("Backend typhoon history endpoint unavailable, using bundled data.", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const selectedTyphoon = useMemo(() => {
    return typhoons.find(t => t.id === selectedId) || typhoons[0];
  }, [typhoons, selectedId]);

  // Reset playback and focus when selected typhoon changes
  useEffect(() => {
    setActiveStep(0);
    setIsPlaying(false);
    setFocusPoint(null);
    setActiveLandfallIndex(null);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
  }, [selectedId]);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setActiveStep(prev => {
          const maxStep = (selectedTyphoon?.track?.length || 1) - 1;
          if (prev >= maxStep) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, selectedTyphoon]);

  // Filter typhoons list
  const filteredTyphoons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return typhoons.filter(item => {
      const matchesSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        item.internationalName.toLowerCase().includes(q) ||
        item.year.toString().includes(q) ||
        item.affectedRegions.some(r => r.toLowerCase().includes(q)) ||
        item.affectedProvinces.some(p => p.toLowerCase().includes(q)) ||
        item.landfalls.some(l => l.name.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === "all" ||
        item.category.toLowerCase().includes(categoryFilter.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [typhoons, searchQuery, categoryFilter]);

  const allMapPositions = useMemo(() => {
    if (showAllTracks) {
      return typhoons.flatMap(item => (item.track || []).map(p => p.coordinates));
    }
    return (selectedTyphoon?.track || []).map(p => p.coordinates);
  }, [showAllTracks, typhoons, selectedTyphoon]);

  const currentTrackPoint = selectedTyphoon?.track?.[activeStep] || selectedTyphoon?.track?.[0];

  function handleSelectTyphoon(id) {
    setSelectedId(id);
    setShowAllTracks(false);
  }

  function handleLandfallClick(landfall, index) {
    setFocusPoint(landfall.coordinates);
    setActiveLandfallIndex(index);
  }

  function togglePlay() {
    setIsPlaying(prev => !prev);
  }

  const categoryColor = CATEGORY_COLORS[selectedTyphoon?.category] || "#dc2626";

  return (
    <section className="workspace typhoon-history-workspace" aria-labelledby="typhoon-history-title">
      <div className="workspace-heading">
        <div>
          <span className="live-alerts-eyebrow">
            <Wind size={15} aria-hidden="true" /> {t("PHILIPPINES TROPICAL CYCLONE ARCHIVE")}
          </span>
          <h1 id="typhoon-history-title">{t("History of Typhoons")}</h1>
          <p>
            {t("Explore historical typhoons, the parts of the Philippines they hit, landfall sequences, and disaster preparedness lessons.")}
          </p>
        </div>
        <div className="typhoon-history-nav-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate?.("weather")}
            title={t("View current weather")}
          >
            {t("Current weather")}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate?.("warnings")}
            title={t("View live safety alerts")}
          >
            <ShieldAlert size={16} /> {t("Safety alerts")}
          </button>
        </div>
      </div>

      {error && <div className="alert error" role="alert">{t(error)}</div>}

      {/* Search and Filters Bar */}
      <div className="typhoon-filters-bar">
        <label className="typhoon-search-input-wrap">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t("Search by name (e.g. Yolanda, Odette, Kristine), province, or region hit…")}
            aria-label={t("Search typhoons")}
          />
        </label>

        <div className="typhoon-filter-pills" role="toolbar" aria-label={t("Filter by category")}>
          <button
            type="button"
            className={`filter-pill ${categoryFilter === "all" ? "active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            {t("All")} ({typhoons.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${categoryFilter === "super typhoon" ? "active" : ""}`}
            onClick={() => setCategoryFilter("super typhoon")}
          >
            {t("Super Typhoons")}
          </button>
          <button
            type="button"
            className={`filter-pill ${categoryFilter === "typhoon" ? "active" : ""}`}
            onClick={() => setCategoryFilter("typhoon")}
          >
            {t("Typhoons")}
          </button>
          <button
            type="button"
            className={`filter-pill ${categoryFilter === "severe tropical storm" ? "active" : ""}`}
            onClick={() => setCategoryFilter("severe tropical storm")}
          >
            {t("Severe Tropical Storms")}
          </button>
        </div>

        <button
          type="button"
          className={`multi-track-toggle ${showAllTracks ? "active" : ""}`}
          onClick={() => setShowAllTracks(prev => !prev)}
          title={t("Compare all typhoon paths on the map")}
        >
          <Layers size={16} />
          {showAllTracks ? t("Showing all paths") : t("Show all storm paths")}
        </button>
      </div>

      {/* Main Grid: Map & Controls on Left/Top, Typhoon Selector & Details on Right/Bottom */}
      <div className="typhoon-history-layout">
        {/* Left Column: Interactive Map & Step Player */}
        <div className="typhoon-map-section">
          <div className="typhoon-map-card">
            <div className="typhoon-map-header">
              <div className="typhoon-map-title-row">
                <h3>
                  {showAllTracks
                    ? t("All Major Historical Typhoon Tracks")
                    : `${selectedTyphoon.name} (${selectedTyphoon.internationalName}) — ${selectedTyphoon.year}`}
                </h3>
                <span
                  className="typhoon-category-badge"
                  style={{ backgroundColor: showAllTracks ? "#15314b" : categoryColor }}
                >
                  {showAllTracks ? `${typhoons.length} ${t("Storms")}` : selectedTyphoon.category}
                </span>
              </div>
              <p className="typhoon-map-subtitle">
                {showAllTracks
                  ? t("Comparing major tracks across Luzon, Visayas, and Mindanao. Click any track or select a typhoon below.")
                  : t("Path across the Philippine Area of Responsibility (PAR). Landfall points numbered.")}
              </p>
            </div>

            <div className="typhoon-interactive-map-container" style={{ height: "460px", width: "100%", borderRadius: "12px", overflow: "hidden" }}>
              <MapContainer
                center={[12.8797, 121.774]}
                zoom={6}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitTyphoonBounds positions={allMapPositions} focusPoint={focusPoint} />

                {/* Multi-Track Mode */}
                {showAllTracks && typhoons.map((storm, idx) => {
                  const color = MULTI_TRACK_PALETTE[idx % MULTI_TRACK_PALETTE.length];
                  const positions = (storm.track || []).map(p => p.coordinates);
                  return (
                    <div key={storm.id}>
                      <Polyline
                        positions={positions}
                        pathOptions={{
                          color,
                          weight: selectedId === storm.id ? 5 : 3,
                          opacity: selectedId === storm.id ? 1 : 0.7,
                          dashArray: storm.category === "Super Typhoon" ? undefined : "6 4"
                        }}
                        eventHandlers={{
                          click: () => {
                            setSelectedId(storm.id);
                            setShowAllTracks(false);
                          }
                        }}
                      >
                        <Tooltip sticky>
                          <b>{storm.name} ({storm.internationalName})</b> — {storm.year}<br />
                          <span>{storm.category} · Max {storm.maxWindsKmH} km/h</span>
                        </Tooltip>
                      </Polyline>

                      {/* Landfalls for each storm */}
                      {storm.landfalls.map((landfall, lIdx) => (
                        <Marker
                          key={`${storm.id}-lf-${lIdx}`}
                          position={landfall.coordinates}
                          icon={createLandfallIcon(landfall.sequence, false)}
                        >
                          <Popup>
                            <strong>{storm.name} — Landfall #{landfall.sequence}</strong><br />
                            <b>{landfall.name}</b><br />
                            <small>{landfall.date}</small>
                            <p style={{ margin: "4px 0 0", fontSize: "12px" }}>{landfall.details}</p>
                          </Popup>
                        </Marker>
                      ))}
                    </div>
                  );
                })}

                {/* Single Selected Typhoon Mode */}
                {!showAllTracks && selectedTyphoon && (
                  <>
                    {/* Track Line */}
                    <Polyline
                      positions={(selectedTyphoon.track || []).map(p => p.coordinates)}
                      pathOptions={{
                        color: categoryColor,
                        weight: 4,
                        opacity: 0.9
                      }}
                    />

                    {/* Waypoint circle markers */}
                    {(selectedTyphoon.track || []).map((point, index) => {
                      const isCurrentStep = activeStep === index;
                      return (
                        <CircleMarker
                          key={`pt-${index}`}
                          center={point.coordinates}
                          radius={isCurrentStep ? 9 : 5}
                          pathOptions={{
                            color: isCurrentStep ? "#1e293b" : categoryColor,
                            fillColor: isCurrentStep ? "#facc15" : "#ffffff",
                            fillOpacity: 1,
                            weight: isCurrentStep ? 3 : 2
                          }}
                          eventHandlers={{
                            click: () => {
                              setActiveStep(index);
                              setFocusPoint(point.coordinates);
                            }
                          }}
                        >
                          <Popup>
                            <div className="typhoon-point-popup">
                              <strong>{selectedTyphoon.name} ({selectedTyphoon.year})</strong>
                              <div><b>{point.stage}</b></div>
                              <div><small>{point.time}</small></div>
                              <div>Winds: <b>{point.windKmH} km/h</b> | Pressure: <b>{point.pressureHpa} hPa</b></div>
                              <p style={{ margin: "6px 0 0", fontSize: "12px" }}>{point.note}</p>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}

                    {/* Landfall Markers with numbered badges */}
                    {(selectedTyphoon.landfalls || []).map((landfall, index) => (
                      <Marker
                        key={`landfall-${index}`}
                        position={landfall.coordinates}
                        icon={createLandfallIcon(landfall.sequence, activeLandfallIndex === index)}
                      >
                        <Popup>
                          <div className="typhoon-landfall-popup">
                            <span className="landfall-pill">
                              {t("Landfall")} #{landfall.sequence}
                            </span>
                            <h4>{landfall.name}</h4>
                            <div className="landfall-time"><Calendar size={13} /> {landfall.date}</div>
                            <p>{landfall.details}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Active eye marker at active step */}
                    {currentTrackPoint && (
                      <Marker
                        position={currentTrackPoint.coordinates}
                        icon={createActiveEyeIcon(currentTrackPoint.windKmH)}
                      >
                        <Popup>
                          <div>
                            <strong>{selectedTyphoon.name} — {currentTrackPoint.stage}</strong>
                            <div>Time: {currentTrackPoint.time}</div>
                            <div>Wind: <b>{currentTrackPoint.windKmH} km/h</b></div>
                            <div>Note: {currentTrackPoint.note}</div>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </>
                )}
              </MapContainer>
            </div>

            {/* Track Playback & Scrub Bar (when single typhoon selected) */}
            {!showAllTracks && selectedTyphoon.track && selectedTyphoon.track.length > 0 && (
              <div className="typhoon-track-player">
                <div className="player-controls">
                  <button
                    type="button"
                    className="player-btn"
                    onClick={() => {
                      setActiveStep(0);
                      setFocusPoint(selectedTyphoon.track[0]?.coordinates);
                    }}
                    title={t("Restart track")}
                    aria-label={t("Restart track")}
                  >
                    <RotateCcw size={15} />
                  </button>

                  <button
                    type="button"
                    className="player-btn"
                    onClick={() => {
                      setActiveStep(prev => Math.max(0, prev - 1));
                      setFocusPoint(selectedTyphoon.track[Math.max(0, activeStep - 1)]?.coordinates);
                    }}
                    disabled={activeStep === 0}
                    title={t("Previous waypoint")}
                    aria-label={t("Previous waypoint")}
                  >
                    <SkipBack size={15} />
                  </button>

                  <button
                    type="button"
                    className={`player-btn player-play-btn ${isPlaying ? "playing" : ""}`}
                    onClick={togglePlay}
                    title={isPlaying ? t("Pause path playback") : t("Play storm path across the Philippines")}
                    aria-label={isPlaying ? t("Pause") : t("Play")}
                  >
                    {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                  </button>

                  <button
                    type="button"
                    className="player-btn"
                    onClick={() => {
                      const next = Math.min(selectedTyphoon.track.length - 1, activeStep + 1);
                      setActiveStep(next);
                      setFocusPoint(selectedTyphoon.track[next]?.coordinates);
                    }}
                    disabled={activeStep >= selectedTyphoon.track.length - 1}
                    title={t("Next waypoint")}
                    aria-label={t("Next waypoint")}
                  >
                    <SkipForward size={15} />
                  </button>
                </div>

                <div className="player-slider-wrap">
                  <input
                    type="range"
                    min="0"
                    max={selectedTyphoon.track.length - 1}
                    value={activeStep}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setActiveStep(val);
                      setFocusPoint(selectedTyphoon.track[val]?.coordinates);
                    }}
                    className="player-slider"
                    aria-label={t("Scrub typhoon path timeline")}
                  />
                  <div className="player-step-info">
                    <span>
                      <b>{currentTrackPoint?.time}</b> · {currentTrackPoint?.stage}
                    </span>
                    <span>
                      {currentTrackPoint?.windKmH} km/h · {currentTrackPoint?.pressureHpa} hPa
                    </span>
                  </div>
                  {currentTrackPoint?.note && (
                    <small className="player-note">{currentTrackPoint.note}</small>
                  )}
                </div>
              </div>
            )}

            {/* Map Legend */}
            <div className="typhoon-map-legend">
              <span className="legend-title">{t("Intensity & Markers")}:</span>
              <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS["Super Typhoon"] }} /> {t("Super Typhoon")}</span>
              <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS["Typhoon"] }} /> {t("Typhoon")}</span>
              <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS["Severe Tropical Storm"] }} /> {t("Severe Tropical Storm")}</span>
              <span className="legend-item"><span className="legend-landfall-badge">1</span> {t("Landfall Site")}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Typhoon Selector List & In-Depth Details */}
        <div className="typhoon-sidebar-section">
          {/* Typhoons Quick Selector List */}
          <div className="typhoon-selector-box">
            <div className="selector-heading">
              <h3>{t("Select Typhoon")}</h3>
              <span>{filteredTyphoons.length} {t("recorded")}</span>
            </div>

            <div className="typhoon-scroll-list" role="listbox" aria-label={t("Typhoon records")}>
              {filteredTyphoons.map(storm => {
                const isSelected = selectedTyphoon.id === storm.id && !showAllTracks;
                return (
                  <button
                    type="button"
                    key={storm.id}
                    className={`typhoon-card-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectTyphoon(storm.id)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="card-item-top">
                      <strong className="storm-name">
                        {storm.name} <span className="intl-name">({storm.internationalName})</span>
                      </strong>
                      <span className="storm-year">{storm.year}</span>
                    </div>

                    <div className="card-item-meta">
                      <span
                        className="category-pill"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[storm.category] || "#dc2626"}1a`,
                          color: CATEGORY_COLORS[storm.category] || "#dc2626",
                          border: `1px solid ${CATEGORY_COLORS[storm.category] || "#dc2626"}40`
                        }}
                      >
                        {storm.category}
                      </span>
                      <span className="winds-tag">{storm.maxWindsKmH} km/h winds</span>
                    </div>

                    <p className="card-item-summary">
                      {storm.landfalls.length > 0
                        ? `${storm.landfalls.length} landfall(s): ${storm.landfalls.map(l => l.name.split(",")[0]).join(" → ")}`
                        : storm.summary.slice(0, 85) + "..."}
                    </p>
                  </button>
                );
              })}

              {filteredTyphoons.length === 0 && (
                <div className="typhoon-empty-state">
                  <p>{t("No typhoons match your search or filter.")}</p>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }}
                  >
                    {t("Reset filters")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deep-Dive Typhoon Detail Showcase */}
      {selectedTyphoon && !showAllTracks && (
        <article className="typhoon-details-panel">
          <div className="panel-main-header">
            <div>
              <span className="panel-eyebrow">
                {selectedTyphoon.category} · {selectedTyphoon.dates}
              </span>
              <h2>
                {selectedTyphoon.name} ({selectedTyphoon.internationalName})
              </h2>
              <p className="panel-summary">{selectedTyphoon.summary}</p>
            </div>
            <div className="panel-intensity-box">
              <span className="stat-label">{t("Peak Sustained Winds")}</span>
              <strong className="stat-number">{selectedTyphoon.maxWindsKmH} <small>km/h</small></strong>
              <span className="stat-gusts">{t("Gusts up to")} {selectedTyphoon.gustsKmH} km/h</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="typhoon-metrics-grid">
            <div className="metric-card">
              <span className="metric-icon"><Gauge size={18} /></span>
              <div>
                <small>{t("Lowest Pressure")}</small>
                <strong>{selectedTyphoon.pressureHpa} hPa</strong>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-icon"><Wind size={18} /></span>
              <div>
                <small>{t("Highest Signal")}</small>
                <strong>{selectedTyphoon.highestSignal}</strong>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-icon"><AlertTriangle size={18} /></span>
              <div>
                <small>{t("Casualties / Impact")}</small>
                <strong>{selectedTyphoon.impactMetrics.casualties}</strong>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-icon"><ShieldAlert size={18} /></span>
              <div>
                <small>{t("Damage Estimate")}</small>
                <strong>{selectedTyphoon.impactMetrics.damageCost}</strong>
              </div>
            </div>
          </div>

          {/* "What Part It Hits" Breakdown */}
          <div className="impact-areas-section">
            <div className="impact-block">
              <h3>
                <MapPin size={17} aria-hidden="true" /> {t("Regions Directly Hit & Affected")}
              </h3>
              <div className="region-pills">
                {selectedTyphoon.affectedRegions.map(region => (
                  <span className="region-pill" key={region}>{region}</span>
                ))}
              </div>
            </div>

            <div className="impact-block">
              <h3>
                <MapPin size={17} aria-hidden="true" /> {t("Key Provinces & Cities Hit")}
              </h3>
              <div className="province-pills">
                {selectedTyphoon.affectedProvinces.map(prov => (
                  <span className="province-pill" key={prov}>{prov}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Landfall Timeline */}
          {selectedTyphoon.landfalls && selectedTyphoon.landfalls.length > 0 && (
            <div className="landfall-timeline-section">
              <div className="timeline-header">
                <h3>{t("Landfall Sequence & Timeline")}</h3>
                <span>{t("Click any landfall site to zoom into that location on the map")}</span>
              </div>
              <div className="landfall-cards-grid">
                {selectedTyphoon.landfalls.map((landfall, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`landfall-step-card ${activeLandfallIndex === index ? "active" : ""}`}
                    onClick={() => handleLandfallClick(landfall, index)}
                  >
                    <div className="step-card-num">#{landfall.sequence}</div>
                    <div className="step-card-content">
                      <strong>{landfall.name}</strong>
                      <span className="step-card-date"><Calendar size={13} /> {landfall.date}</span>
                      <p>{landfall.details}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Storm Surge & Impact Details */}
          {selectedTyphoon.impactMetrics.stormSurge && (
            <div className="storm-surge-callout">
              <span className="surge-icon"><Wind size={20} /></span>
              <div>
                <strong>{t("Storm Surge & Wave Action")}:</strong> {selectedTyphoon.impactMetrics.stormSurge}
                {selectedTyphoon.impactMetrics.familiesAffected && (
                  <div><small>{t("Families affected")}: {selectedTyphoon.impactMetrics.familiesAffected}</small></div>
                )}
              </div>
            </div>
          )}

          {/* Preparedness & Safety Takeaways */}
          {selectedTyphoon.preparednessLessons && selectedTyphoon.preparednessLessons.length > 0 && (
            <div className="preparedness-lessons-section">
              <h3>
                <CheckCircle2 size={18} aria-hidden="true" /> {t("Disaster Preparedness Lessons & Community Takeaways")}
              </h3>
              <ul className="lessons-list">
                {selectedTyphoon.preparednessLessons.map((lesson, idx) => (
                  <li key={idx}>{lesson}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}

      {/* Helpful Source Footer */}
      <footer className="typhoon-history-footer">
        <p>
          {t("Meteorological records sourced from PAGASA Tropical Cyclone Annual Publications, Joint Typhoon Warning Center (JTWC), and NDRRMC Situational Reports.")}
          {" "}
          <a
            href="https://www.pagasa.dost.gov.ph/tropical-cyclone/tropical-cyclone-summary"
            target="_blank"
            rel="noreferrer"
          >
            PAGASA Cyclone Summaries <ExternalLink size={13} />
          </a>
        </p>
      </footer>
    </section>
  );
}
