import { useEffect, useState } from "react";
import { Hospital, Siren, ClipboardList, TentTree, HandHeart, Package, CloudSun, Users, LayoutDashboard, ChevronLeft, ChevronRight, Megaphone, LifeBuoy, Wind, ScrollText, Inbox, KeyRound } from "lucide-react";
import { API_ORIGIN } from "../services/api";
import { useLanguage } from "../i18n/LanguageContext";

function initials(name) {
  return String(name || "ResQ User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("");
}

export default function Sidebar({ admin, employee, active, onSelect, open, onToggle, user }) {
  const { t } = useLanguage();
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 800px)").matches);
  const [sidebarHidden, setSidebarHidden] = useState(() => localStorage.getItem("resq_sidebar_hidden") === "true");
  const groups = admin
    ? [
      ["Dashboard", [["overview", "Overview", LayoutDashboard]]],
      ["Accounts & support", [["users", "User accounts", Users], ["support", "Help & support", LifeBuoy], ["password-resets", "Password resets", KeyRound], ["support-responses", "Support responses", Inbox], ["audit-log", "Audit log", ScrollText]]],
      ["Response", [["incidents", "Incident reports", ClipboardList], ["assistance", "Emergency assistance", HandHeart], ["relief-requests", "Relief requests", Package]]],
      ["Community services", [["announcements", "Announcements", Megaphone], ["healthcare", "Healthcare directory", Hospital], ["warnings", "Safety alerts", Siren], ["evacuation", "Evacuation centers", TentTree], ["relief", "Relief information", Package], ["weather", "Weather forecast", CloudSun], ["typhoons", "Typhoon history", Wind]]]
    ]
    : employee
    ? [
      ["Dashboard", [["overview", "Overview", LayoutDashboard]]],
      ["Accounts & support", [["support", "Help & support", LifeBuoy], ["password-resets", "Password resets", KeyRound], ["support-responses", "Support responses", Inbox]]],
      ["Response", [["incidents", "Incident reports", ClipboardList], ["assistance", "Emergency assistance", HandHeart], ["relief-requests", "Relief requests", Package]]]
    ]
    : [
      ["Dashboard", [["overview", "Overview", LayoutDashboard]]],
      ["Help & support", [["support", "Help & support", LifeBuoy]]],
      ["Community services", [["healthcare", "Healthcare directory", Hospital], ["warnings", "Safety alerts", Siren], ["weather", "Weather forecast", CloudSun], ["typhoons", "Typhoon history", Wind], ["incidents", "Incident reports", ClipboardList], ["evacuation", "Evacuation centers", TentTree], ["assistance", "Emergency assistance", HandHeart], ["relief", "Relief information", Package], ["announcements", "Announcements", Megaphone]]]
    ];

  useEffect(() => {
    const query = window.matchMedia("(max-width: 800px)");
    const update = event => setMobile(event.matches);
    query.addEventListener?.("change", update);
    if (!query.addEventListener) query.addListener(update);
    return () => {
      query.removeEventListener?.("change", update);
      if (!query.removeEventListener) query.removeListener(update);
    };
  }, []);

  const hidden = mobile ? !open : sidebarHidden;
  const select = id => {
    onSelect(id);
  };
  const toggleSidebar = () => setSidebarHidden(current => {
    const next = !current;
    localStorage.setItem("resq_sidebar_hidden", String(next));
    return next;
  });

  return <>
    {open && <button type="button" className="sidebar-scrim" onClick={onToggle} aria-label={t("Close navigation menu")} />}
    <aside id="portal-navigation" className={`sidebar${open ? " open" : ""}${!mobile && sidebarHidden ? " is-hidden" : ""}`} aria-label={t("Main navigation")} aria-hidden={hidden}>
      {!mobile && !sidebarHidden && <button type="button" className="sidebar-collapse-toggle" onClick={toggleSidebar} aria-label={t("Hide sidebar")} title={t("Hide sidebar")} aria-controls="portal-navigation-links" aria-expanded="true"><ChevronLeft size={19} aria-hidden="true" /></button>}
      <nav className="sidebar-menu" id="portal-navigation-links">
        {groups.map(([group, entries]) => (
          <section className="sidebar-group" key={group} aria-label={t(group)}>
            <h2>{t(group)}</h2>
            {entries.map(([id, label, Icon]) => (
              <button type="button" key={id} className={active === id ? "active" : ""} aria-label={t(label)} title={t(label)} aria-current={active === id ? "page" : undefined} tabIndex={hidden ? -1 : 0} onClick={() => select(id)}>
                <Icon size={19} aria-hidden="true" /><span>{t(label)}</span>
              </button>
            ))}
          </section>
        ))}
      </nav>
      <div className="sidebar-account">
        <button type="button" className={`sidebar-profile-button ${active === "profile" ? "active" : ""}`} onClick={() => select("profile")} aria-label={`${t("My profile")} ${user?.fullName || ""}`} title={t("My profile")} aria-current={active === "profile" ? "page" : undefined} tabIndex={hidden ? -1 : 0}>
          <span className="sidebar-avatar">
            {user?.profilePicture
              ? <img src={user.profilePicture.startsWith("http") ? user.profilePicture : `${API_ORIGIN}${user.profilePicture}`} alt="" />
              : initials(user?.fullName)}
          </span>
          <span className="sidebar-profile-copy"><b>{user?.fullName || t("My profile")}</b><small>{admin ? t("Administrator") : employee ? t("Employee") : t("Account & health details")}</small></span>
        </button>
      </div>
    </aside>
    {!mobile && sidebarHidden && <button type="button" className="sidebar-expand-toggle" onClick={toggleSidebar} aria-label={t("Show sidebar")} title={t("Show sidebar")} aria-controls="portal-navigation" aria-expanded="false"><ChevronRight size={20} aria-hidden="true" /></button>}
  </>;
}
