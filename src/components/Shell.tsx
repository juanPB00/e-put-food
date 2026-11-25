import Link from "next/link";
import Act from "./Act";
import type { Session } from "@/lib/auth";
import { q1 } from "@/lib/db";
import FloatingOrderNotification from "./FloatingOrderNotification";

export const Logo = () => (
  <Link href="/" className="logo">
    <span className="logo-i">🍴</span>
    <span>E-put Food</span>
  </Link>
);

export const Foot = () => (
  <footer className="foot">
    <span>© 2026 E-put Food. Hangat sampai tujuan.</span>
    <span className="row" style={{ gap: 14 }}>
      <Link href="/kebijakan-privasi" className="link" style={{ color: "var(--muted)" }}>Kebijakan Privasi</Link>
      <span>•</span>
      <Link href="/syarat-ketentuan" className="link" style={{ color: "var(--muted)" }}>Syarat & Ketentuan</Link>
      <span>•</span>
      <Link href="/komplain" className="link" style={{ color: "var(--muted)" }}>Bantuan & Komplain</Link>
    </span>
  </footer>
);

const NAV: Record<string, [string, string][]> = {
  user: [
    ["/beranda", "Beranda"], 
    ["/pesanan", "Pesanan Saya"],
    ["/komplain", "Bantuan & Komplain"]
  ],
  resto: [
    ["/owner", "Ringkasan"], 
    ["/owner/pesanan", "Pesanan"], 
    ["/owner/produk", "Kelola Menu"],
    ["/owner/laporan", "Laporan Penjualan"],
    ["/owner/edit", "Pengaturan Resto"]
  ],
  kurir: [
    ["/kurir", "Ringkasan"], 
    ["/kurir/aktif", "Pengantaran Aktif"]
  ],
  admin: [
    ["/admin", "Ringkasan"], 
    ["/admin/verifikasi", "Verifikasi Akun"],
    ["/admin/laporan", "Laporan Transaksi"]
  ],
};

const WHO: Record<string, string> = { 
  resto: "Ruang Mitra Restoran", 
  kurir: "Ruang Mitra Kurir", 
  admin: "Pusat Kendali Admin" 
};

export default async function Shell({ s, at, children }: { s: Session; at: string; children: React.ReactNode }) {
  const links = (NAV[s.role] || []).map(([h, l]) => (
    <Link key={h} href={h} className={at === h || (h !== "/owner" && at.startsWith(h)) ? "on" : ""}>
      {l}
    </Link>
  ));

  let activeOrder = null;
  if (s.role === "user") {
    activeOrder = await q1(
      "SELECT o.id,o.code,o.status,r.name AS resto FROM orders o JOIN restaurants r ON r.id=o.resto_id WHERE o.user_id=$1 AND o.status NOT IN ('done','rejected') ORDER BY o.id DESC LIMIT 1", 
      [s.id]
    );
  }

  if (s.role === "user") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header className="top">
          <Logo />
          <nav className="tabs">{links}</nav>
          <span className="grow" />
          <span className="badge g" style={{ marginRight: 6 }}>User</span>
          <b>{s.name}</b>
          <Act url="/api/auth/logout" cls="link red" style={{ marginLeft: 12 }}>Keluar</Act>
        </header>
        <main className="wrap">{children}</main>
        <Foot />
        <FloatingOrderNotification active={activeOrder} />
      </div>
    );
  }

  let sub = s.name;
  if (s.role === "resto") {
    sub = (await q1("SELECT name FROM restaurants WHERE owner_id=$1", [s.id]))?.name || s.name;
  }

  return (
    <div className="shell">
      <aside className="side">
        <Logo />
        <small style={{ marginTop: 14, color: "var(--or)", fontWeight: 700 }}>{WHO[s.role]}</small>
        <b style={{ fontSize: 16 }}>{sub}</b>
        <nav>{links}</nav>
        <span className="grow" />
        <div className="who">
          <small className="muted" style={{ display: "block" }}>Masuk sebagai</small>
          {s.name}
        </div>
        <div style={{ padding: "0 14px 10px" }}>
          <Act url="/api/auth/logout" cls="link red">Keluar dari akun</Act>
        </div>
      </aside>
      <div className="shell-content">
        <main className="main">{children}</main>
        <Foot />
      </div>
    </div>
  );
}
