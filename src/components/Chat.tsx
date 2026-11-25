"use client";
import { useEffect, useRef, useState } from "react";

export type Tab = { channel: string; label: string; off?: string };

export default function Chat({ orderId, me, tabs, closed }: { orderId: number; me: number; tabs: Tab[]; closed?: boolean }) {
  const [ch, setCh] = useState(tabs[0].channel);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const tab = tabs.find((t) => t.channel === ch) || tabs[0];

  async function load() {
    if (tab.off) return setMsgs([]);
    const r = await fetch(`/api/orders/${orderId}/messages?channel=${ch}`, { cache: "no-store" });
    if (r.ok) setMsgs((await r.json()).messages);
  }

  useEffect(() => { 
    load(); 
    const t = setInterval(load, 3000); 
    return () => clearInterval(t); 
  }, [ch, tab.off]); // eslint-disable-line

  useEffect(() => { 
    if (box.current) {
      box.current.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); 
    }
  }, [msgs.length, ch]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setErr("");
    const r = await fetch(`/api/orders/${orderId}/messages`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ channel: ch, body }) 
    });
    if (!r.ok) return setErr((await r.json()).error);
    setText(""); 
    load();
  }

  return (
    <div className="card chat" style={{ display: "flex", flexDirection: "column", height: 620, padding: 22 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <h2 className="grow" style={{ fontSize: 17, margin: 0 }}>Percakapan Langsung</h2>
        <span className="row" style={{ gap: 6, fontSize: 12, color: "var(--green)" }}>
          <span className="pulse-dot" style={{ width: 8, height: 8 }} />
          Terhubung
        </span>
      </div>

      {/* Tab Chat */}
      <div className="chips" style={{ margin: "0 0 14px", gap: 8 }}>
        {tabs.map((t) => (
          <button 
            key={t.channel} 
            type="button"
            className={"chip" + (t.channel === ch ? " on" : "")} 
            onClick={() => setCh(t.channel)}
            style={{ padding: "6px 14px", fontSize: 12 }}
          >
            💬 Chat {t.label}
          </button>
        ))}
      </div>

      {/* Stream Messages */}
      <div 
        className="msgs" 
        ref={box} 
        style={{ 
          flex: 1, 
          overflowY: "auto", 
          display: "flex", 
          flexDirection: "column", 
          gap: 14, 
          padding: "12px 6px",
          background: "var(--bg)",
          borderRadius: 12
        }}
      >
        {tab.off ? (
          <div className="empty" style={{ margin: "auto", padding: 20 }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>ℹ️</span>
            {tab.off}
          </div>
        ) : msgs.length === 0 ? (
          <div className="empty" style={{ margin: "auto", padding: 20 }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>👋</span>
            Belum ada pesan. Sapa {tab.label.toLowerCase()} lebih dulu untuk koordinasi pesanan.
          </div>
        ) : (
          msgs.map((m) => {
            const isMe = m.sender_id === me;
            return (
              <div 
                key={m.id} 
                className={"m" + (isMe ? " me" : "")}
                style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}
              >
                {!isMe && (
                  <b style={{ fontSize: 11.5, color: "var(--dark)", display: "block", marginBottom: 4 }}>
                    {m.name}
                  </b>
                )}
                <div style={{ wordBreak: "break-word", lineHeight: 1.45 }}>{m.body}</div>
                <small style={{ 
                  display: "block", 
                  textAlign: isMe ? "right" : "left", 
                  marginTop: 4, 
                  fontSize: 10.5, 
                  opacity: 0.7 
                }}>
                  {m.at}
                </small>
              </div>
            );
          })
        )}
      </div>

      {err && <small className="err" style={{ marginTop: 8 }}>{err}</small>}

      {closed ? (
        <div className="note" style={{ textAlign: "center", marginTop: 12, padding: 8 }}>
          Pesanan telah selesai. Percakapan ini telah diarsipkan.
        </div>
      ) : (
        <form onSubmit={send} style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <input 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder={tab.off ? "Chat terkunci" : `Ketik pesan untuk ${tab.label.toLowerCase()}…`} 
            disabled={!!tab.off} 
            maxLength={500} 
            style={{ padding: "10px 14px" }}
          />
          <button className="btn" disabled={!!tab.off || !text.trim()}>
            Kirim
          </button>
        </form>
      )}
    </div>
  );
}
