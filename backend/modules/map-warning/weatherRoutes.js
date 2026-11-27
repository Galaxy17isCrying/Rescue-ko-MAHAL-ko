const express = require("express");
const router = express.Router();
const { TYPHOON_HISTORY } = require("./typhoonHistoryData");

const NOAH_TRACK_URL = "https://webgis-static.up.edu.ph/api/typhoon_track/pagasa_typhoon.geojson";
const NOAH_RAINFALL_URL = "https://webgis-static.up.edu.ph/api/contours/1hr_latest_rainfall_contour.png";
const NOAH_WEATHER_URL = "https://noah.up.edu.ph/weather-updates";
const PHIVOLCS_URL = "https://www.phivolcs.dost.gov.ph/";
const USGS_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";
const PHILIPPINES = { minLat: 4.3, maxLat: 21.5, minLon: 116, maxLon: 127.5 };
const PHILIPPINE_REGIONS = [
    { minLat: 12, maxLat: 21.5, minLon: 119, maxLon: 127.5 },
    { minLat: 7.5, maxLat: 12.5, minLon: 116.5, maxLon: 120.5 },
    { minLat: 9, maxLat: 12.8, minLon: 121.5, maxLon: 127.5 },
    { minLat: 4.5, maxLat: 9.5, minLon: 120.5, maxLon: 127.5 },
    { minLat: 4.5, maxLat: 7.8, minLon: 118.8, maxLon: 123.5 }
];
const ALERT_CACHE_MS = 5 * 60 * 1000;
let cachedAlerts = null;
let cachedAlertsAt = 0;

function isInPhilippines(lat, lon) {
    return PHILIPPINE_REGIONS.some(region =>
        lat >= region.minLat && lat <= region.maxLat
        && lon >= region.minLon && lon <= region.maxLon
    );
}

async function fetchJson(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}.`);
    return response.json();
}

function coordinatesInPhilippines(coordinates, pairs = []) {
    if (!Array.isArray(coordinates)) return pairs;
    if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
        pairs.push(coordinates);
        return pairs;
    }
    for (const coordinate of coordinates) coordinatesInPhilippines(coordinate, pairs);
    return pairs;
}

async function loadAlerts() {
    if (cachedAlerts && Date.now() - cachedAlertsAt < ALERT_CACHE_MS) return cachedAlerts;
    const starttime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const earthquakeUrl = `${USGS_URL}?format=geojson&starttime=${encodeURIComponent(starttime)}&minlatitude=${PHILIPPINES.minLat}&maxlatitude=${PHILIPPINES.maxLat}&minlongitude=${PHILIPPINES.minLon}&maxlongitude=${PHILIPPINES.maxLon}&orderby=time&limit=100`;
    const [typhoonResult, earthquakeResult] = await Promise.allSettled([
        fetchJson(NOAH_TRACK_URL),
        fetchJson(earthquakeUrl)
    ]);

    const typhoonData = typhoonResult.status === "fulfilled" ? typhoonResult.value : null;
    const earthquakeData = earthquakeResult.status === "fulfilled" ? earthquakeResult.value : null;
    const tracks = (Array.isArray(typhoonData?.features) ? typhoonData.features : [])
        .filter(feature => coordinatesInPhilippines(feature?.geometry?.coordinates).some(([lon, lat]) => isInPhilippines(lat, lon)));
    const earthquakes = (Array.isArray(earthquakeData?.features) ? earthquakeData.features : [])
        .filter(feature => {
            const [lon, lat] = feature?.geometry?.coordinates || [];
            return Number.isFinite(lat) && Number.isFinite(lon) && isInPhilippines(lat, lon);
        });

    if (!typhoonData) console.error("UP NOAH / PAGASA typhoon feed unavailable.");
    if (!earthquakeData) console.error("USGS earthquake feed unavailable.");
    if (!typhoonData && !earthquakeData) throw new Error("Live safety alert feeds are unavailable.");

    cachedAlerts = {
        checkedAt: new Date().toISOString(),
        typhoon: {
            available: Boolean(typhoonData),
            source: "UP NOAH / PAGASA typhoon-track feed",
            sourceUrl: NOAH_WEATHER_URL,
            tracks
        },
        earthquake: {
            available: Boolean(earthquakeData),
            source: "USGS earthquake catalog, filtered to the Philippines",
            sourceUrl: "https://earthquake.usgs.gov/earthquakes/map/",
            phivolcsUrl: PHIVOLCS_URL,
            events: earthquakes
        }
    };
    cachedAlertsAt = Date.now();
    return cachedAlerts;
}

router.get("/alerts", async (_req, res) => {
    try {
        res.json(await loadAlerts());
    } catch (error) {
        console.error("Live safety alert feeds unavailable.");
        res.status(502).json({ message: "Live safety alert feeds are temporarily unavailable." });
    }
});

router.get("/typhoon-history", (req, res) => {
    let list = [...TYPHOON_HISTORY];
    const q = String(req.query.q || "").trim().toLowerCase();
    const category = String(req.query.category || "").trim().toLowerCase();
    const year = Number(req.query.year);

    if (q) {
        list = list.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.internationalName.toLowerCase().includes(q) ||
            item.summary.toLowerCase().includes(q) ||
            item.affectedRegions.some(r => r.toLowerCase().includes(q)) ||
            item.affectedProvinces.some(p => p.toLowerCase().includes(q)) ||
            item.landfalls.some(l => l.name.toLowerCase().includes(q))
        );
    }

    if (category && category !== "all") {
        list = list.filter(item => item.category.toLowerCase().includes(category));
    }

    if (year && Number.isFinite(year)) {
        list = list.filter(item => item.year === year);
    }

    res.json({
        total: list.length,
        items: list
    });
});

router.get("/typhoon-history/:id", (req, res) => {
    const item = TYPHOON_HISTORY.find(t => t.id === req.params.id);
    if (!item) {
        return res.status(404).json({ message: "Typhoon record not found." });
    }
    res.json({ item });
});

router.get("/", async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !isInPhilippines(lat, lon)) {
        return res.status(400).json({ message: "Choose a location within the Philippines for local weather." });
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=3&timezone=auto`;
    const [weatherResult, noahResult] = await Promise.allSettled([
        fetchJson(weatherUrl),
        fetchJson(NOAH_TRACK_URL)
    ]);

    const weatherData = weatherResult.status === "fulfilled" ? weatherResult.value : null;
    const noahData = noahResult.status === "fulfilled" ? noahResult.value : null;
    if (!weatherData && !noahData) {
        console.error("Weather providers unavailable: Open-Meteo and UP NOAH.");
        return res.status(502).json({ message: "Weather and typhoon information are temporarily unavailable." });
    }
    if (!weatherData) console.error("Weather provider unavailable: Open-Meteo.");
    if (!noahData) console.error("Weather provider unavailable: UP NOAH typhoon feed.");

    const tracks = (Array.isArray(noahData?.features) ? noahData.features : [])
        .filter(feature => coordinatesInPhilippines(feature?.geometry?.coordinates).some(([trackLon, trackLat]) => isInPhilippines(trackLat, trackLon)));
    res.json({
        checkedAt: new Date().toISOString(),
        currentWeather: weatherData ? {
            source: "Open-Meteo",
            sourceUrl: "https://open-meteo.com/",
            data: weatherData
        } : null,
        noah: {
            available: Boolean(noahData),
            source: "UP NOAH / PAGASA typhoon-track feed",
            sourceUrl: NOAH_WEATHER_URL,
            trackDataUrl: NOAH_TRACK_URL,
            activeTrackCount: tracks.length,
            tracks,
            rainfallImageUrl: NOAH_RAINFALL_URL
        }
    });
});

module.exports = router;
