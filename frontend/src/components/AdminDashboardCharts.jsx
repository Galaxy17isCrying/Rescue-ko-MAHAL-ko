import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../i18n/LanguageContext";

const chartColors = {
    Pending: "#e7a33e",
    "Under Review": "#7185d5",
    "Unverified - Evidence Pending": "#b37ac5",
    Verified: "#43a578",
    Resolved: "#4b9cb2",
    Rejected: "#d65e5e",
    Accepted: "#4d83bb",
    "In Progress": "#7774c7",
    Completed: "#50a17e",
};
const fallbackColors = ["#4c91c4", "#e7a33e", "#8d78c8", "#50a17e", "#d65e5e", "#48a6a0"];
function PiePanel({ title, description, items }) {
    const { t } = useLanguage();
    const values = items.filter(item => Number(item.value) > 0);
    const total = values.reduce((sum, item) => sum + Number(item.value), 0);
    let offset = 0;

    return (
        <section className="admin-chart-panel" aria-label={t(title)}>
            <header><h2>{t(title)}</h2><p>{t(description)}</p></header>
            {total === 0
                ? <p className="admin-chart-empty">{t("No records to chart yet.")}</p>
                : <div className="admin-pie-layout">
                    <div className="admin-pie-visual">
                        <svg viewBox="0 0 120 120" role="img" aria-label={`${t(title)}: ${total} ${t("total")}`}>
                            <circle cx="60" cy="60" r="42" fill="none" stroke="var(--border)" strokeWidth="16" />
                            {values.map((item, index) => {
                                const percent = Number(item.value) / total * 100;
                                const segmentOffset = offset;
                                offset += percent;
                                return <circle
                                    key={item.label}
                                    cx="60"
                                    cy="60"
                                    r="42"
                                    fill="none"
                                    stroke={chartColors[item.label] || fallbackColors[index % fallbackColors.length]}
                                    strokeWidth="16"
                                    strokeDasharray={`${percent} ${100 - percent}`}
                                    strokeDashoffset={-segmentOffset}
                                    pathLength="100"
                                    transform="rotate(-90 60 60)"
                                />;
                            })}
                        </svg>
                        <strong aria-hidden="true">{total}</strong>
                    </div>
                    <ul className="admin-chart-legend">
                        {values.map((item, index) => (
                            <li key={item.label}>
                                <span style={{ "--chart-color": chartColors[item.label] || fallbackColors[index % fallbackColors.length] }} />
                                <b>{t(item.label)}</b><strong>{Number(item.value)}</strong>
                            </li>
                        ))}
                    </ul>
                </div>}
        </section>
    );
}

function ActivityPanel({ items }) {
    const { t } = useLanguage();
    const maxValue = Math.max(1, ...items.flatMap(item => [item.incidentReports, item.assistanceRequests]));
    const chartTop = 24;
    const chartBottom = 176;
    const chartHeight = chartBottom - chartTop;
    const groupWidth = 82;
    const labelDate = value => {
        const date = new Date(`${value}T12:00:00`);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-PH", { weekday: "short" });
    };

    return (
        <section className="admin-chart-panel admin-activity-chart" aria-label={t("Reports and assistance · last 7 days")}>
            <header><h2>{t("Reports and assistance · last 7 days")}</h2><p>{t("Daily incident reports and assistance requests submitted to ResQ.")}</p></header>
            <div className="admin-bar-chart-wrap">
                <svg className="admin-bar-chart" viewBox="0 0 640 220" role="img" aria-label={t("Daily incident reports and assistance requests over the last 7 days")}>
                    {[0, 0.5, 1].map(fraction => {
                        const y = chartBottom - chartHeight * fraction;
                        return <g key={fraction}>
                            <line x1="42" x2="630" y1={y} y2={y} className="admin-chart-gridline" />
                            <text x="34" y={y + 4} textAnchor="end" className="admin-chart-axis-label">{Math.round(maxValue * fraction)}</text>
                        </g>;
                    })}
                    {items.map((item, index) => {
                        const center = 55 + index * groupWidth;
                        const incidentHeight = Number(item.incidentReports) / maxValue * chartHeight;
                        const assistanceHeight = Number(item.assistanceRequests) / maxValue * chartHeight;
                        return <g key={item.day}>
                            <rect x={center - 17} y={chartBottom - incidentHeight} width="18" height={incidentHeight} rx="4" fill="#4c91c4" />
                            <rect x={center + 5} y={chartBottom - assistanceHeight} width="18" height={assistanceHeight} rx="4" fill="#e7a33e" />
                            <text x={center + 3} y="202" textAnchor="middle" className="admin-chart-axis-label">{labelDate(item.day)}</text>
                        </g>;
                    })}
                </svg>
            </div>
            <div className="admin-bar-legend"><span><i className="incident" />{t("Incident reports")}</span><span><i className="assistance" />{t("Assistance requests")}</span></div>
        </section>
    );
}

export default function AdminDashboardCharts() {
    const { t } = useLanguage();
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        api.get("/admin/charts")
            .then(response => {
                if (!response.data?.charts) throw new Error("The dashboard chart response is missing chart data.");
                if (active) setCharts(response.data.charts);
            })
            .catch(error => {
                if (active) setError(error.response?.data?.message || error.message || "Unable to load dashboard charts.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [retry]);

    if (!charts) {
        return <section className="admin-dashboard-charts" aria-label={t("Dashboard charts")} aria-busy={loading}>
            <section className="admin-chart-panel admin-chart-load-error">
                {loading
                    ? <p className="admin-chart-empty" role="status"><RefreshCw size={17} />{t("Loading dashboard charts…")}</p>
                    : <div className="admin-chart-error" role="alert"><AlertTriangle size={18} /><span>{t(error)}</span><button type="button" className="secondary-button" onClick={() => setRetry(value => value + 1)}>{t("Retry")}</button></div>}
            </section>
        </section>;
    }

    return (
        <div className="admin-dashboard-charts" aria-label={t("Dashboard charts")} aria-busy={loading}>
            <PiePanel title="Incident reports by status" description="Current incident report status breakdown." items={charts.incidentStatuses || []} />
            <PiePanel title="Assistance requests by status" description="Current assistance request status breakdown." items={charts.assistanceStatuses || []} />
            <ActivityPanel items={charts.weeklyActivity || []} />
        </div>
    );
}
