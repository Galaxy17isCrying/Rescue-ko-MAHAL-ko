import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Bell, CalendarClock, CheckCircle2, Clock3, LifeBuoy, MapPin, Megaphone, PackageCheck, RefreshCw, Search, Send, ShieldCheck, X, ScrollText, KeyRound } from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../i18n/LanguageContext";

const reliefCategories = ["Food", "Drinking water", "Medicine", "Hygiene", "Infant supplies", "Shelter", "Clothing", "Other"];
const reliefStatuses = ["Pending", "Verified", "Assigned", "Distributed", "Rejected"];
const announcementSeverities = ["Information", "Advisory", "Urgent", "Emergency"];

function dateLabel(value, t) {
    if (!value) return t("Time not provided");
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? t("Time not provided") : date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

function dateTimeInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = number => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function messageFromError(error, fallback) {
    return error?.response?.data?.message
        || (error?.request ? "Unable to reach the ResQ API. Check that the backend is running and try again." : fallback);
}

export function AdminTriageQueue({ onNavigate }) {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        api.get("/admin/triage")
            .then(response => {
                if (active) setItems(Array.isArray(response.data?.items) ? response.data.items : []);
            })
            .catch(error => {
                if (active) setError(messageFromError(error, "Unable to load the triage queue."));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [retry]);

    return (
        <section className="dashboard-section admin-triage" aria-labelledby="admin-triage-title">
            <div className="dashboard-section-heading">
                <div>
                    <h2 id="admin-triage-title">{t("Urgency triage")}</h2>
                    <p>{t("Review reported urgency first. Incident reports are not automatically assigned a severity.")}</p>
                </div>
                <button type="button" className="secondary-button dashboard-retry" onClick={() => setRetry(value => value + 1)} disabled={loading}>
                    <RefreshCw size={15} />{loading ? t("Loading…") : t("Refresh")}
                </button>
            </div>
            {loading ? <div className="dashboard-state" role="status"><RefreshCw size={18} />{t("Loading triage queue…")}</div>
                : error ? <div className="dashboard-state dashboard-state-error" role="alert"><AlertTriangle size={18} /><span>{t(error)}</span></div>
                    : items.length === 0 ? <div className="dashboard-state dashboard-state-empty"><CheckCircle2 size={19} /><span>{t("No open assistance requests or incident reports.")}</span></div>
                        : <div className="triage-list">{items.slice(0, 8).map(item => (
                            <article className={`triage-item${item.urgency === "Life-threatening" ? " is-critical" : item.urgency === "Urgent" ? " is-urgent" : ""}`} key={`${item.type}-${item.id}`}>
                                <span className="triage-item-icon">{item.urgency === "Life-threatening" ? <AlertTriangle size={19} /> : item.type === "incident" ? <ShieldCheck size={19} /> : <Bell size={19} />}</span>
                                <div className="triage-item-copy">
                                    <div className="triage-item-heading"><b>{item.title}</b><span>{t(item.type === "incident" ? "Incident report" : "Emergency assistance")}</span></div>
                                    <p><MapPin size={14} />{item.location || t("Location not provided")}{item.barangay ? ` · ${item.barangay}` : ""}</p>
                                    <small>{t("Reported by")} {item.requesterName || t("Community member")} · {dateLabel(item.createdAt, t)}</small>
                                </div>
                                <div className="triage-item-actions">
                                    <strong className={`urgency-label${item.urgency === "Life-threatening" ? " critical" : item.urgency === "Urgent" ? " urgent" : ""}`}>
                                        {item.urgency ? t(item.urgency) : t("Urgency not reported")}
                                    </strong>
                                    <span>{t(item.status)}</span>
                                    <button type="button" className="text-button" onClick={() => onNavigate?.(item.type === "incident" ? "incidents" : "assistance")}>{t("Open queue")} <ArrowRight size={14} /></button>
                                </div>
                            </article>
                        ))}</div>}
            {items.length > 8 && !loading && <button type="button" className="dashboard-text-link" onClick={() => onNavigate?.("assistance")}>{t("View all open requests")} <ArrowRight size={15} /></button>}
        </section>
    );
}

export function AnnouncementPreview({ onNavigate }) {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/announcements")
            .then(response => {
                if (active) setItems(Array.isArray(response.data?.items) ? response.data.items.slice(0, 3) : []);
            })
            .catch(error => {
                if (active) setError(messageFromError(error, "Unable to load announcements."));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    return (
        <section className="dashboard-section" aria-labelledby="announcement-preview-title">
            <div className="dashboard-section-heading">
                <div><h2 id="announcement-preview-title">{t("Community announcements")}</h2><p>{t("Updates published by ResQ administrators.")}</p></div>
                <button type="button" className="dashboard-text-link" onClick={() => onNavigate?.("announcements")}>{t("View announcements")} <ArrowRight size={15} /></button>
            </div>
            {loading ? <div className="dashboard-state" role="status"><RefreshCw size={18} />{t("Loading announcements…")}</div>
                : error ? <div className="dashboard-state dashboard-state-error" role="alert"><AlertTriangle size={18} /><span>{t(error)}</span></div>
                    : items.length === 0 ? <div className="dashboard-state dashboard-state-empty"><Megaphone size={19} /><span>{t("No active announcements.")}</span></div>
                        : <div className="announcement-preview-grid">{items.map(item => (
                            <article className={`announcement-card severity-${String(item.severity || "information").toLowerCase()}`} key={item.id}>
                                <div className="announcement-card-heading"><Megaphone size={17} /><span>{t(item.severity)}</span></div>
                                <h3>{item.title}</h3>
                                <p>{item.body}</p>
                                <small>{item.audience === "Barangay" ? `${t("For")} ${item.target_barangay}` : t("For all app users")} · {t("By")} {item.source_name}</small>
                                {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer">{t("View source")}</a>}
                            </article>
                        ))}</div>}
        </section>
    );
}

export function AdminActivityPanel() {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/admin/activity")
            .then(response => {
                if (active) setItems(Array.isArray(response.data?.items) ? response.data.items.slice(0, 6) : []);
            })
            .catch(error => {
                if (active) setError(messageFromError(error, "Unable to load administrator activity."));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    return (
        <section className="admin-activity-panel" aria-labelledby="admin-activity-title">
            <div className="admin-panel-heading"><h2 id="admin-activity-title">{t("Recent admin actions")}</h2><span>{t("Audit log")}</span></div>
            {loading ? <p role="status">{t("Loading activity…")}</p>
                : error ? <p className="admin-inline-error" role="alert">{t(error)}</p>
                    : items.length === 0 ? <p className="admin-inline-empty">{t("No administrator actions have been recorded yet.")}</p>
                        : <ul>{items.map(item => <li key={item.id}><span><b>{item.performedBy}</b> {t(item.action)} <small>{item.recordType} #{item.recordId}</small></span><time>{dateLabel(item.createdAt, t)}</time>{item.reason && <small className="admin-activity-reason">{item.reason}</small>}</li>)}</ul>}
        </section>
    );
}

export function ReliefRequestIntake() {
    const { t } = useLanguage();
    const [requests, setRequests] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [form, setForm] = useState({ household_size: "1", location: "", barangay: "", contact_number: "", notes: "" });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        api.get("/relief-requests")
            .then(response => {
                if (active) setRequests(Array.isArray(response.data?.items) ? response.data.items : []);
            })
            .catch(error => {
                if (active) setError(messageFromError(error, "Unable to load your relief requests."));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [retry]);

    function updateForm(event) {
        setForm(current => ({ ...current, [event.target.name]: event.target.value }));
    }

    function toggleCategory(category) {
        setSelectedItems(current => current.some(item => item.category === category)
            ? current.filter(item => item.category !== category)
            : [...current, { category, quantity: 1 }]);
    }

    function updateQuantity(category, quantity) {
        setSelectedItems(current => current.map(item => item.category === category ? { ...item, quantity: Number(quantity) } : item));
    }

    async function submit(event) {
        event.preventDefault();
        setError("");
        setNotice("");
        setSubmitting(true);
        try {
            await api.post("/relief-requests", { ...form, household_size: Number(form.household_size), items: selectedItems });
            setNotice("Relief request submitted. You can track its status below.");
            setSelectedItems([]);
            setForm(current => ({ ...current, notes: "" }));
            setRetry(value => value + 1);
        } catch (error) {
            setError(messageFromError(error, "Unable to submit relief request."));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="relief-intake-panel" aria-labelledby="relief-intake-title">
            <div className="workspace-heading"><div><h2 id="relief-intake-title">{t("Request relief")}</h2><p>{t("Tell local coordinators what your household needs. This request does not guarantee immediate delivery.")}</p></div></div>
            {error && <div className="alert error" role="alert">{t(error)}</div>}
            {notice && <div className="alert success" role="status">{t(notice)}</div>}
            <form className="record-form relief-request-form" onSubmit={submit}>
                <label className="field">{t("Barangay")}<input name="barangay" value={form.barangay} onChange={updateForm} maxLength="120" required /></label>
                <label className="field">{t("Delivery or pickup location")}<input name="location" value={form.location} onChange={updateForm} maxLength="255" required /></label>
                <label className="field">{t("Household size")}<input type="number" name="household_size" value={form.household_size} onChange={updateForm} min="1" max="50" required /></label>
                <label className="field">{t("Contact number (optional)")}<input type="tel" name="contact_number" value={form.contact_number} onChange={updateForm} maxLength="40" /></label>
                <fieldset className="relief-category-fieldset">
                    <legend>{t("Items needed")}</legend>
                    <div className="relief-category-grid">{reliefCategories.map(category => {
                        const selected = selectedItems.find(item => item.category === category);
                        return <label className="relief-category-option" key={category}><input type="checkbox" checked={Boolean(selected)} onChange={() => toggleCategory(category)} /><span>{t(category)}</span>{selected && <input aria-label={`${t("Quantity for")} ${t(category)}`} type="number" min="1" max="50" value={selected.quantity} onChange={event => updateQuantity(category, event.target.value)} />}</label>;
                    })}</div>
                </fieldset>
                <label className="field relief-notes-field">{t("Additional details (optional)")}<textarea name="notes" value={form.notes} onChange={updateForm} maxLength="1000" placeholder={t("Share only information coordinators need to arrange the requested items.")} /></label>
                <p className="relief-privacy-note">{t("Your request details and contact number are visible to administrators for coordination. Do not include passwords or unnecessary medical details.")}</p>
                <button className="primary-button" disabled={submitting || selectedItems.length === 0}>{submitting ? t("Submitting…") : t("Submit relief request")}</button>
            </form>
            <div className="relief-request-history">
                <div className="admin-panel-heading"><h3>{t("My relief requests")}</h3><button type="button" className="text-button" onClick={() => setRetry(value => value + 1)} disabled={loading}><RefreshCw size={15} />{t("Refresh")}</button></div>
                {loading ? <p role="status">{t("Loading your relief requests…")}</p>
                    : requests.length === 0 ? <p className="admin-inline-empty">{t("You have not submitted any relief requests yet.")}</p>
                        : requests.map(request => <article className="relief-request-history-card" key={request.id}><div><b>{request.requested_items.map(item => `${t(item.category)} × ${item.quantity}`).join(", ")}</b><p>{request.location} · {request.barangay}</p><small>{t("Submitted")}: {dateLabel(request.created_at, t)}</small></div><strong className={`relief-status status-${String(request.status).toLowerCase().replace(/\s+/g, "-")}`}>{t(request.status)}</strong></article>)}
            </div>
        </section>
    );
}

export function ReliefRequestsWorkspace() {
    const { t } = useLanguage();
    const [requests, setRequests] = useState([]);
    const [notes, setNotes] = useState({});
    const [statusFilter, setStatusFilter] = useState("Open");
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        api.get("/relief-requests")
            .then(response => {
                if (active) setRequests(Array.isArray(response.data?.items) ? response.data.items : []);
            })
            .catch(error => {
                if (active) setError(messageFromError(error, "Unable to load relief requests."));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [retry]);

    const filtered = requests.filter(request => statusFilter === "All" || (statusFilter === "Open" ? ["Pending", "Verified", "Assigned"].includes(request.status) : request.status === statusFilter));

    async function updateStatus(request, status) {
        setError("");
        setNotice("");
        setUpdatingId(request.id);
        try {
            await api.patch(`/relief-requests/${request.id}/status`, { status, admin_notes: notes[request.id] ?? request.admin_notes ?? "" });
            setNotice("Relief request updated.");
            setRetry(value => value + 1);
        } catch (error) {
            setError(messageFromError(error, "Unable to update relief request."));
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <section className="workspace relief-admin-workspace">
            <div className="workspace-heading"><div><h1>{t("Relief requests")}</h1><p>{t("Review household needs, coordinate distribution, and record each status change.")}</p></div><button type="button" className="secondary-button" onClick={() => setRetry(value => value + 1)} disabled={loading}><RefreshCw size={16} />{t("Refresh")}</button></div>
            {error && <div className="alert error" role="alert">{t(error)}</div>}
            {notice && <div className="alert success" role="status">{t(notice)}</div>}
            <div className="relief-admin-summary">
                <article><span>{t("Open requests")}</span><strong>{requests.filter(request => ["Pending", "Verified", "Assigned"].includes(request.status)).length}</strong></article>
                <article><span>{t("Pending verification")}</span><strong>{requests.filter(request => request.status === "Pending").length}</strong></article>
                <article><span>{t("Distributed")}</span><strong>{requests.filter(request => request.status === "Distributed").length}</strong></article>
            </div>
            <div className="relief-filter-row"><label className="field">{t("Filter requests")}<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>{["Open", "All", ...reliefStatuses].map(status => <option key={status} value={status}>{t(status)}</option>)}</select></label></div>
            {loading ? <div className="dashboard-state" role="status"><RefreshCw size={18} />{t("Loading relief requests…")}</div>
                : filtered.length === 0 ? <div className="dashboard-state dashboard-state-empty"><PackageCheck size={19} /><span>{t("No relief requests match this filter.")}</span></div>
                    : <div className="relief-admin-list">{filtered.map(request => (
                        <article className="relief-admin-card" key={request.id}>
                            <div className="relief-admin-card-heading"><div><span className="relief-requester">{request.requester_name}</span><h2>{request.barangay}</h2></div><strong className={`relief-status status-${String(request.status).toLowerCase().replace(/\s+/g, "-")}`}>{t(request.status)}</strong></div>
                            <p><MapPin size={15} />{request.location}</p>
                            <p><b>{t("Household size")}:</b> {request.household_size} · <b>{t("Contact")}:</b> {request.contact_number || t("Not provided")}</p>
                            <ul className="relief-request-items">{request.requested_items.map(item => <li key={item.category}>{t(item.category)} <b>× {item.quantity}</b></li>)}</ul>
                            {request.notes && <p className="relief-user-notes"><b>{t("User note")}:</b> {request.notes}</p>}
                            <small>{t("Submitted")}: {dateLabel(request.created_at, t)}{request.updated_at ? ` · ${t("Updated")}: ${dateLabel(request.updated_at, t)}` : ""}</small>
                            <label className="field">{t("Admin coordination note")}<textarea value={notes[request.id] ?? request.admin_notes ?? ""} maxLength="1000" onChange={event => setNotes(current => ({ ...current, [request.id]: event.target.value }))} /></label>
                            <label className="field">{t("Update status")}<select value={request.status} disabled={updatingId === request.id} onChange={event => updateStatus(request, event.target.value)}>{reliefStatuses.map(status => <option key={status} value={status}>{t(status)}</option>)}</select></label>
                            <button type="button" className="secondary-button" onClick={() => updateStatus(request, request.status)} disabled={updatingId === request.id}>{updatingId === request.id ? t("Saving…") : t("Save note")}</button>
                        </article>
                    ))}</div>}
            <AdminActivityPanel />
        </section>
    );
}

const emptyAnnouncement = () => ({
    title: "",
    body: "",
    severity: "Information",
    audience: "All",
    target_barangay: "",
    source_name: "ResQ Ko Admin",
    source_url: "",
    starts_at: dateTimeInput(new Date()),
    expires_at: "",
});

export function AnnouncementsWorkspace({ admin }) {
    const { t } = useLanguage();
    const formRef = useRef(null);
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(emptyAnnouncement);
    const [barangayFilter, setBarangayFilter] = useState("");
    const [appliedBarangay, setAppliedBarangay] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        const request = admin
            ? api.get("/announcements/admin")
            : api.get("/announcements", { params: appliedBarangay ? { barangay: appliedBarangay } : undefined });
        request.then(response => {
            if (active) setItems(Array.isArray(response.data?.items) ? response.data.items : []);
        }).catch(error => {
            if (active) setError(messageFromError(error, "Unable to load announcements."));
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [admin, retry, appliedBarangay]);

    function updateForm(event) {
        setForm(current => ({ ...current, [event.target.name]: event.target.value }));
    }

    async function save(status) {
        if (!formRef.current?.reportValidity()) return;
        setError("");
        setNotice("");
        setSaving(true);
        const payload = { ...form, status, target_barangay: form.audience === "Barangay" ? form.target_barangay : null };
        try {
            if (editingId) await api.put(`/announcements/${editingId}`, payload);
            else await api.post("/announcements", payload);
            setNotice(status === "Published" ? "Announcement published." : "Draft saved.");
            setForm(emptyAnnouncement());
            setEditingId(null);
            setRetry(value => value + 1);
        } catch (error) {
            setError(messageFromError(error, "Unable to save announcement."));
        } finally {
            setSaving(false);
        }
    }

    function edit(item) {
        setEditingId(item.id);
        setForm({
            title: item.title || "",
            body: item.body || "",
            severity: item.severity || "Information",
            audience: item.audience || "All",
            target_barangay: item.target_barangay || "",
            source_name: item.source_name || "",
            source_url: item.source_url || "",
            starts_at: dateTimeInput(item.starts_at),
            expires_at: dateTimeInput(item.expires_at),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function cancelAnnouncement(item) {
        setError("");
        setNotice("");
        try {
            await api.patch(`/announcements/${item.id}/status`, { status: "Cancelled" });
            setNotice("Announcement cancelled.");
            setRetry(value => value + 1);
        } catch (error) {
            setError(messageFromError(error, "Unable to cancel announcement."));
        }
    }

    return (
        <section className="workspace announcements-workspace">
            <div className="workspace-heading"><div><h1>{t("Announcements")}</h1><p>{t(admin ? "Publish sourced, time-limited updates for all users or a selected barangay." : "Read current updates published by ResQ administrators.")}</p></div>{admin && <button type="button" className="secondary-button" onClick={() => setRetry(value => value + 1)} disabled={loading}><RefreshCw size={16} />{t("Refresh")}</button>}</div>
            {error && <div className="alert error" role="alert">{t(error)}</div>}
            {notice && <div className="alert success" role="status">{t(notice)}</div>}
            {!admin && <form className="announcement-area-filter" onSubmit={event => { event.preventDefault(); setAppliedBarangay(barangayFilter.trim()); setRetry(value => value + 1); }}><label className="field">{t("Filter by barangay (optional)")}<input value={barangayFilter} onChange={event => setBarangayFilter(event.target.value)} maxLength="120" placeholder={t("Enter a barangay")} /></label><button className="secondary-button"><Search size={16} />{t("Filter")}</button></form>}
            {admin && <form ref={formRef} className="record-form announcement-form" onSubmit={event => event.preventDefault()}>
                <h2>{t(editingId ? "Edit announcement" : "Create announcement")}</h2>
                <label className="field">{t("Title")}<input name="title" value={form.title} onChange={updateForm} maxLength="180" required /></label>
                <label className="field">{t("Severity")}<select name="severity" value={form.severity} onChange={updateForm}>{announcementSeverities.map(severity => <option key={severity} value={severity}>{t(severity)}</option>)}</select></label>
                <label className="field announcement-body-field">{t("Message")}<textarea name="body" value={form.body} onChange={updateForm} maxLength="5000" required /></label>
                <label className="field">{t("Audience")}<select name="audience" value={form.audience} onChange={updateForm}><option value="All">{t("All users")}</option><option value="Barangay">{t("Selected barangay")}</option></select></label>
                {form.audience === "Barangay" && <label className="field">{t("Target barangay")}<input name="target_barangay" value={form.target_barangay} onChange={updateForm} maxLength="120" required /></label>}
                <label className="field">{t("Source or issuing office")}<input name="source_name" value={form.source_name} onChange={updateForm} maxLength="120" required /></label>
                <label className="field">{t("Source link (optional)")}<input type="url" name="source_url" value={form.source_url} onChange={updateForm} maxLength="500" placeholder="https://" /></label>
                <label className="field">{t("Starts at")}<input type="datetime-local" name="starts_at" value={form.starts_at} onChange={updateForm} /></label>
                <label className="field">{t("Expires at (required to publish)")}<input type="datetime-local" name="expires_at" value={form.expires_at} onChange={updateForm} /></label>
                <p className="announcement-safety-note"><ShieldCheck size={17} />{t("An announcement is an in-app notice, not an official emergency alert. Verify urgent information before publishing.")}</p>
                <div className="announcement-form-actions"><button type="button" className="secondary-button" onClick={() => save("Draft")} disabled={saving}>{saving ? t("Saving…") : t("Save draft")}</button><button type="button" className="primary-button" onClick={() => save("Published")} disabled={saving}><Send size={15} />{saving ? t("Publishing…") : t("Publish")}</button>{editingId && <button type="button" className="text-button" onClick={() => { setEditingId(null); setForm(emptyAnnouncement()); }}>{t("Cancel edit")}</button>}</div>
            </form>}
            <section className="announcement-list" aria-labelledby="announcement-list-title">
                <div className="admin-panel-heading"><h2 id="announcement-list-title">{t(admin ? "Announcement management" : "Current announcements")}</h2>{admin && <span>{items.length} {t("records")}</span>}</div>
                {loading ? <div className="dashboard-state" role="status"><RefreshCw size={18} />{t("Loading announcements…")}</div>
                    : items.length === 0 ? <div className="dashboard-state dashboard-state-empty"><Megaphone size={19} /><span>{t(admin ? "No announcements have been created." : "No active announcements.")}</span></div>
                        : <div className="announcement-list-grid">{items.map(item => {
                            const expired = item.status === "Published" && item.expires_at && new Date(item.expires_at).getTime() <= Date.now();
                            const displayStatus = expired ? "Expired" : item.status;
                            return <article className={`announcement-card severity-${String(item.severity || "information").toLowerCase()}`} key={item.id}>
                                <div className="announcement-card-heading"><Megaphone size={17} /><span>{t(item.severity)}</span>{admin && <strong className={`announcement-status status-${displayStatus.toLowerCase()}`}>{t(displayStatus)}</strong>}</div>
                                <h3>{item.title}</h3>
                                <p className="announcement-body">{item.body}</p>
                                <small>{item.audience === "Barangay" ? `${t("For")} ${item.target_barangay}` : t("For all app users")} · {t("By")} {item.source_name}</small>
                                <small><CalendarClock size={14} />{t("Expires")}: {item.expires_at ? dateLabel(item.expires_at, t) : t("No expiry set")}</small>
                                {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer">{t("View source")}</a>}
                                {admin && <div className="announcement-admin-actions"><button type="button" className="text-button" onClick={() => edit(item)}>{t("Edit")}</button>{item.status !== "Cancelled" && <button type="button" className="text-button danger" onClick={() => cancelAnnouncement(item)}><X size={14} />{t("Cancel announcement")}</button>}</div>}
                            </article>;
                        })}</div>}
            </section>
            {admin && <AdminActivityPanel />}
        </section>
    );
}

export function PasswordResetWorkspace({ admin }) {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [searchDraft, setSearchDraft] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    async function load() {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("/support");
            setItems((response.data?.items || []).filter(item => item.category === "Password/access help"));
        } catch (error) {
            setError(messageFromError(error, "Unable to load password reset requests."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function resetPassword(ticket) {
        if (!admin) return;
        const password = window.prompt(`Enter a temporary password for ${ticket.requesterName} (at least 8 characters):`);
        if (!password) return;
        if (password.length < 8) {
            setError("The temporary password must be at least 8 characters.");
            return;
        }
        setError("");
        setNotice("");
        try {
            await api.post(`/admin/users/${ticket.userId}/reset-password`, { newPassword: password });
            await api.patch(`/support/${ticket.id}`, {
                status: "Resolved",
                adminReply: "Password reset completed by an administrator.",
            });
            setNotice(`Password reset completed for ${ticket.requesterName}.`);
            await load();
        } catch (error) {
            setError(messageFromError(error, "Unable to reset the password."));
        }
    }

    const filteredItems = items.filter(ticket => {
        const query = searchQuery.trim().toLocaleLowerCase();
        if (!query) return true;
        return [ticket.requesterName, ticket.requesterEmail, ticket.subject, ticket.message, ticket.status]
            .some(value => String(value || "").toLocaleLowerCase().includes(query));
    });

    return <section className="workspace password-reset-workspace">
        <div className="workspace-heading">
            <div><h1>{t("Password reset requests")}</h1><p>{t("Only password and account-access help requests appear on this page.")}</p></div>
            <button type="button" className="secondary-button" onClick={load} disabled={loading}><RefreshCw size={16}/>{loading ? t("Loading…") : t("Refresh")}</button>
        </div>
        {error && <div className="alert error" role="alert">{t(error)}</div>}
        {notice && <div className="alert success" role="status">{t(notice)}</div>}
        <form className="password-reset-search" onSubmit={event => { event.preventDefault(); setSearchQuery(searchDraft); }}>
            <label className="field">{t("Search password requests")}
                <input type="search" value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder={t("Search name, email, subject, or status")} />
            </label>
            <button type="submit" className="secondary-button"><Search size={16}/>{t("Search")}</button>
        </form>
        {loading ? <div className="dashboard-state" role="status"><RefreshCw size={18}/>{t("Loading password requests…")}</div>
            : filteredItems.length === 0 ? <div className="dashboard-state dashboard-state-empty"><KeyRound size={19}/><span>{t("No password reset requests match this page or search.")}</span></div>
            : <div className="support-ticket-grid">{filteredItems.map(ticket => <article className="support-ticket-card" key={ticket.id}>
                <div className="support-ticket-heading">
                    <div><span className="support-ticket-category">{t("Password/access help")}</span><h3>{ticket.subject}</h3></div>
                    <strong className={`support-ticket-status status-${String(ticket.status).toLowerCase().replace(/\s+/g, "-")}`}>{t(ticket.status === "Open" ? "Open request" : ticket.status)}</strong>
                </div>
                <p className="support-ticket-requester"><b>{t("Name")}:</b> {ticket.requesterName}</p>
                {ticket.requesterEmail && <p className="support-ticket-requester"><b>{t("Email")}:</b> {ticket.requesterEmail}</p>}
                <p className="support-ticket-message"><b>{t("Request")}:</b> {ticket.message}</p>
                <small>{t("Submitted")}: {dateLabel(ticket.createdAt, t)}</small>
                {admin && ticket.status !== "Resolved" && <button type="button" className="primary-button" onClick={() => resetPassword(ticket)}><KeyRound size={15}/>{t("Reset password")}</button>}
            </article>)}</div>}
    </section>;
}

export function SupportResponsesWorkspace({ onNavigate }) {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/support")
            .then(response => { if (active) setItems((response.data?.items || []).filter(item => item.status === "In Progress")); })
            .catch(error => { if (active) setError(messageFromError(error, "Unable to load support responses.")); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    return <section className="workspace support-responses-workspace">
        <div className="workspace-heading"><div><h1>{t("Support responses")}</h1><p>{t("Cases currently assigned to staff and under review.")}</p></div></div>
        {error && <div className="alert error" role="alert">{t(error)}</div>}
        {loading ? <div className="dashboard-state" role="status"><RefreshCw size={18}/>{t("Loading responses…")}</div>
            : items.length === 0 ? <div className="dashboard-state dashboard-state-empty"><LifeBuoy size={19}/><span>{t("There are no support cases currently in progress.")}</span></div>
            : <div className="support-ticket-grid">{items.map(ticket => <article className="support-ticket-card" key={ticket.id}>
                <div className="support-ticket-heading"><div><span className="support-ticket-category">{t(ticket.category)}</span><h3>{ticket.subject}</h3></div><strong className="support-ticket-status status-in-progress">{t("In Progress")}</strong></div>
                <p className="support-ticket-requester"><b>{t("Name")}:</b> {ticket.requesterName}</p>
                <p className="support-ticket-message"><b>{t("Issue")}:</b> {ticket.message}</p>
                <small>{t("Submitted")}: {dateLabel(ticket.createdAt, t)}</small>
                {ticket.adminReply && <div className="support-ticket-reply"><b>{t("Current reply")}</b><p>{ticket.adminReply}</p></div>}
                <button type="button" className="text-button" onClick={() => onNavigate?.("support")}>{t("Open support inbox")} <ArrowRight size={14}/></button>
            </article>)}</div>}
    </section>;
}

export function AdminAuditLog() {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        api.get("/admin/activity")
            .then(response => { if (active) setItems(response.data?.items || []); })
            .catch(error => { if (active) setError(messageFromError(error, "Unable to load audit log.")); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);
    return <section className="workspace audit-log-workspace">
        <div className="workspace-heading"><div><h1>{t("Audit log")}</h1><p>{t("Administrative and employee actions recorded by the system.")}</p></div></div>
        {error && <div className="alert error" role="alert">{t(error)}</div>}
        {loading ? <div className="dashboard-state" role="status"><RefreshCw size={18}/>{t("Loading audit log…")}</div>
            : items.length === 0 ? <div className="dashboard-state dashboard-state-empty"><ScrollText size={19}/><span>{t("No administrator actions have been recorded yet.")}</span></div>
            : <div className="audit-log-list">{items.map(item => <article className="audit-log-card" key={item.id}>
                <div><b>{item.performedBy}</b><span>{t(item.action)}</span></div>
                <small>{item.recordType} #{item.recordId}</small>
                {item.reason && <p>{item.reason}</p>}
                <time>{dateLabel(item.createdAt, t)}</time>
            </article>)}</div>}
    </section>;
}

export function SupportWorkspace({ admin, onNavigate }) {
    const { t } = useLanguage();
    const statusLabel = status => t(status === "Open" ? "Open request" : status);
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({ category: "Complaint", subject: "", message: "" });
    const [replies, setReplies] = useState({});
    const [statuses, setStatuses] = useState({});
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [searchDraft, setSearchDraft] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        api.get("/support")
            .then(response => {
                if (active) setItems(Array.isArray(response.data?.items) ? response.data.items : []);
            })
            .catch(error => {
                if (active) setError(messageFromError(error, "Unable to load support requests."));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [retry]);

    async function submit(event) {
        event.preventDefault();
        setError("");
        setNotice("");
        setSaving(true);
        try {
            await api.post("/support", form);
            setNotice("Your support request has been sent to staff.");
            setForm({ category: "Complaint", subject: "", message: "" });
            setRetry(value => value + 1);
        } catch (error) {
            setError(messageFromError(error, "Unable to submit your support request."));
        } finally {
            setSaving(false);
        }
    }

    async function updateTicket(ticket) {
        setError("");
        setNotice("");
        setUpdatingId(ticket.id);
        try {
            await api.patch(`/support/${ticket.id}`, {
                status: statuses[ticket.id] || ticket.status,
                adminReply: replies[ticket.id] ?? ticket.adminReply ?? "",
            });
            setNotice("Support request updated.");
            setRetry(value => value + 1);
        } catch (error) {
            setError(messageFromError(error, "Unable to update the support request."));
        } finally {
            setUpdatingId(null);
        }
    }

    const filteredItems = items.filter(ticket => {
        if (admin && categoryFilter !== "All" && ticket.category !== categoryFilter) return false;
        if (!admin) return true;
        const query = searchQuery.trim().toLocaleLowerCase();
        if (!query) return true;
        return [ticket.requesterName, ticket.category, ticket.subject, ticket.message, ticket.status]
            .some(value => String(value || "").toLocaleLowerCase().includes(query));
    });

    return (
        <section className="workspace support-workspace">
            <div className="workspace-heading">
                <div>
                    <h1>{t("Help & support")}</h1>
                    <p>{t(admin ? "Review complaints, technical issues, and account-help requests from users." : "Send a complaint, report a technical issue, or ask staff for account help.")}</p>
                </div>
                <button type="button" className="secondary-button" onClick={() => setRetry(value => value + 1)} disabled={loading}><RefreshCw size={16} />{t("Refresh")}</button>
            </div>
            {error && <div className="alert error" role="alert">{t(error)}</div>}
            {notice && <div className="alert success" role="status">{t(notice)}</div>}
            {!admin && <form className="record-form support-request-form" onSubmit={submit}>
                <h2>{t("Contact staff")}</h2>
                <label className="field">{t("Request type")}<select value={form.category} onChange={event => setForm(current => ({ ...current, category: event.target.value }))}>
                    {["Complaint", "Technical issue", "Password/access help", "Other"].map(category => <option key={category} value={category}>{t(category)}</option>)}
                </select></label>
                <label className="field">{t("Subject")}<input value={form.subject} onChange={event => setForm(current => ({ ...current, subject: event.target.value }))} maxLength="160" required /></label>
                <label className="field support-message-field">{t("Details")}<textarea value={form.message} onChange={event => setForm(current => ({ ...current, message: event.target.value }))} maxLength="4000" required /></label>
                <p className="support-privacy-note">{t("Never include your password. If you can sign in, change it in Settings → Security. Staff will not ask you to share your password.")}</p>
                <button type="button" className="secondary-button support-security-link" onClick={() => onNavigate?.("settings")}>{t("Open account security settings")}</button>
                <button className="primary-button" disabled={saving}>{saving ? t("Sending…") : t("Send to staff")}</button>
            </form>}
            <section className="support-ticket-list" aria-labelledby="support-ticket-list-title">
                <div className="admin-panel-heading">
                    <h2 id="support-ticket-list-title">{t(admin ? "Support inbox" : "Your support requests")}</h2>
                    <span>{filteredItems.length} {t("requests")}</span>
                </div>
                {admin && <div className="support-inbox-controls">
                    <label className="field">{t("Filter request type")}
                        <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
                            <option value="All">{t("All requests")}</option>
                            {["Password/access help", "Complaint", "Technical issue", "Other"].map(category => <option key={category} value={category}>{t(category)}</option>)}
                        </select>
                    </label>
                    <form className="support-search-form" onSubmit={event => { event.preventDefault(); setSearchQuery(searchDraft); }}>
                        <label className="field">{t("Search support")}
                            <input type="search" value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder={t("Search name, issue, status, or subject")} />
                        </label>
                        <button type="submit" className="secondary-button"><Search size={16}/>{t("Search")}</button>
                    </form>
                </div>}
                {loading ? <div className="dashboard-state" role="status"><RefreshCw size={18} />{t("Loading support requests…")}</div>
                    : filteredItems.length === 0 ? <div className="dashboard-state dashboard-state-empty"><LifeBuoy size={19} /><span>{t(admin ? "No support requests match this filter." : "You have not sent a support request yet.")}</span></div>
                        : <div className="support-ticket-grid">{filteredItems.map(ticket => (
                            <article className="support-ticket-card" key={ticket.id}>
                                <div className="support-ticket-heading">
                                    <div><span className="support-ticket-category">{t(ticket.category)}</span><h3>{ticket.subject}</h3></div>
                                    <strong className={`support-ticket-status status-${String(statuses[ticket.id] || ticket.status).toLowerCase().replace(/\s+/g, "-")}`}>{statusLabel(statuses[ticket.id] || ticket.status)}</strong>
                                </div>
                                {admin && <p className="support-ticket-requester"><b>{t("From")}:</b> {ticket.requesterName}</p>}
                                <p className="support-ticket-message">{ticket.message}</p>
                                <small>{t("Submitted")}: {dateLabel(ticket.createdAt, t)}{ticket.updatedAt ? ` · ${t("Updated")}: ${dateLabel(ticket.updatedAt, t)}` : ""}</small>
                                {ticket.adminReply && !admin && <div className="support-ticket-reply"><b>{t("Staff reply")}</b><p>{ticket.adminReply}</p></div>}
                                {admin && <div className="support-ticket-controls">
                                    <label className="field">{t("Reply to user")}<textarea value={replies[ticket.id] ?? ticket.adminReply ?? ""} maxLength="4000" onChange={event => setReplies(current => ({ ...current, [ticket.id]: event.target.value }))} /></label>
                                    <label className="field">{t("Update status")}<select value={statuses[ticket.id] || ticket.status} onChange={event => setStatuses(current => ({ ...current, [ticket.id]: event.target.value }))}>
                                        {["Open", "In Progress", "Resolved"].map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
                                    </select></label>
                                    <button type="button" className="primary-button" onClick={() => updateTicket(ticket)} disabled={updatingId === ticket.id}>{updatingId === ticket.id ? t("Saving…") : t("Save reply & status")}</button>
                                </div>}
                            </article>
                        ))}</div>}
            </section>
        </section>
    );
}
