"use client";
import Link from "next/link";
import { useState } from "react";
import { STATUS } from "@/lib/util";

export default function FloatingOrderNotification({ active }: { active: { id: number; code: string; status: string; resto: string } | null }) {
  const [closed, setClosed] = useState(false);
  if (!active || closed) return null;

  const statusLabel = STATUS[active.status] || active.status;
  const isDelivering = active.status === "delivering" || active.status === "arrived";

  return (
    <div className="floating-order" role="region" aria-label="Status Pesanan Aktif">
      <div className="pulse-dot" />
      <span style={{ fontSize: 26 }} aria-hidden>{isDelivering ? "🛵" : "🍳"}</span>
      <div className="grow" style={{ minWidth: 160 }}>
        <b style={{ fontSize: 13.5, display: "block" }}>
          {isDelivering ? "Pesanan sedang diantar!" : "Pesanan sedang diproses!"}
        </b>
        <small style={{ color: "#d1eae6", display: "block", marginTop: 2 }}>
          #{active.code} • {active.resto} • <b>{statusLabel}</b>
        </small>
      </div>
      <Link href={`/pesanan/${active.id}`} className="btn sm ghost" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
        Lacak
      </Link>
      <button 
        type="button" 
        onClick={() => setClosed(true)} 
        style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: "2px 4px" }}
        title="Tutup notifikasi"
      >
        ✕
      </button>
    </div>
  );
}
