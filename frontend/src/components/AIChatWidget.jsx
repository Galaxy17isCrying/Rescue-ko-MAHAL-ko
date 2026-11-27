import { useState } from "react";
import { MessageCircle, RefreshCw, Send, X } from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../i18n/LanguageContext";

export default function AIChatWidget() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReply(text, retryIndex = null) {
    if (retryIndex !== null) {
      setMessages((current) => current.filter((_, index) => index !== retryIndex));
    }
    setLoading(true);
    try {
      const response = await api.post("/ai-chat", { message: text });
      setMessages((current) => [...current, { role: "assistant", text: response.data.reply }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: error.response?.data?.message || "ResQ AI is unavailable right now.",
          isError: true,
          retryText: text,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || loading) return;

    setMessages((current) => [...current, { role: "user", text }]);
    setMessage("");
    await requestReply(text);
  }

  return (
    <div className="ai-chat-widget">
      {open && (
        <section className="ai-chat-panel" aria-label={t("ResQ AI chat")}>
          <div className="ai-chat-panel-header">
            <span className="ai-chat-avatar"><img src="/resq-bot-avatar.png" alt="" /></span>
            <span className="ai-chat-heading"><b>ResQ AI</b><small>{t("Community safety assistant")}</small></span>
            <button type="button" className="ai-chat-close" onClick={() => setOpen(false)} aria-label={t("Close chat")}><X size={18} /></button>
          </div>
          <div className={`ai-chat-messages${messages.length ? " has-messages" : ""}`} aria-live="polite">
            {messages.length === 0 ? (
              <div className="ai-chat-empty">
                <MessageCircle size={22} />
                <b>{t("How can I help?")}</b>
                <span>{t("Ask about safety, healthcare, evacuation, or using ResQ Ko.")}</span>
              </div>
            ) : messages.map((item, index) => (
              <div className={`ai-chat-message ${item.role}${item.isError ? " error" : ""}`} key={index}>
                {item.text}
                {item.retryText && (
                  <button
                    type="button"
                    className="ai-chat-retry"
                    onClick={() => requestReply(item.retryText, index)}
                    disabled={loading}
                  >
                    <RefreshCw size={14} />
                    {t("Try again")}
                  </button>
                )}
              </div>
            ))}
            {loading && <div className="ai-chat-message assistant">{t("Thinking…")}</div>}
          </div>
          <form className="ai-chat-form" onSubmit={sendMessage}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("Ask ResQ AI…")}
              maxLength={2000}
              aria-label={t("Message ResQ AI")}
            />
            <button type="submit" disabled={!message.trim() || loading} aria-label={t("Send message")}><Send size={17} /></button>
          </form>
          <small className="ai-chat-disclaimer">{t("Not a substitute for professional care. Call 911 for life-threatening emergencies.")}</small>
        </section>
      )}
      <button
        type="button"
        className="ai-chat-launcher"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? t("Close ResQ AI chat") : t("Open ResQ AI chat")}
        aria-expanded={open}
        title={t("ResQ AI")}
      >
        {open ? <X size={22} /> : <img src="/resq-bot-avatar.png" alt="" />}
      </button>
    </div>
  );
}
