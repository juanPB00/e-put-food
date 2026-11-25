"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FoodImage from "./FoodImage";

const MORNING_STATUS_OPTIONS = [
  "Buka Pagi",
  "Buka Pagi & Siang",
  "Buka Siang - Malam",
  "Buka 24 Jam",
  "Khusus Sarapan (06.00 - 11.00)"
];

const PRESET_RESTO_IMAGES = [
  { label: "Warung Rumahan", url: "/images/resto/warung-mba-taza.jpg" },
  { label: "Kedai Tradisional", url: "/images/resto/soto-ayam-pak-darto.jpg" },
  { label: "Diner Modern", url: "/images/resto/nasi-goreng-sore.jpg" },
  { label: "Eatery Santai", url: "/images/resto/mie-ayam-mang-ujang.jpg" },
  { label: "Dapur Keluarga", url: "/images/resto/dapur-teh-rina.jpg" },
];

export default function RestoProfileForm({ initialResto }: { initialResto: any }) {
  const r = useRouter();
  const [f, setF] = useState({
    name: initialResto.name || "",
    address: initialResto.address || "",
    category: initialResto.category || "Masakan rumahan",
    open_hours: initialResto.open_hours || "08.00–21.00 WIB",
    promo: initialResto.promo || "",
    image: initialResto.image || "/images/resto/warung-mba-taza.jpg",
    is_open: initialResto.is_open !== false,
    morning_status: initialResto.morning_status || "Buka Pagi",
  });

  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    set("image", URL.createObjectURL(file));
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        set("image", data.url);
      } else {
        alert("Gagal mengunggah foto restoran: " + (data.error || "Gunakan file gambar lain."));
      }
    } catch {
      alert("Terjadi kendala saat upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");

    const res = await fetch("/api/owner/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f)
    });

    const data = await res.json();
    setBusy(false);

    if (res.ok) {
      setMsg("Pengaturan profil & status restoran berhasil diperbarui!");
      r.refresh();
    } else {
      setErr(data.error || "Gagal memperbarui profil.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack" style={{ gap: 20 }}>
      {/* Kartu Status Operasional Cepat */}
      <div className="card" style={{ background: f.is_open ? "var(--teal2)" : "var(--red2)", borderColor: f.is_open ? "var(--teal)" : "#fca5a5" }}>
        <div className="row wrap2" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span className={`pulse-dot`} style={{ background: f.is_open ? "#22c55e" : "#ef4444" }} />
              <b style={{ fontSize: 16 }}>Status Operasional: {f.is_open ? "Buka (Menerima Pesanan)" : "Tutup Sementara"}</b>
            </div>
            <small className="muted" style={{ display: "block", marginTop: 4 }}>
              {f.is_open 
                ? "Restoran Anda sedang aktif dan siap menerima pesanan dari pelanggan." 
                : "Restoran ditandai tutup. Pelanggan dapat melihat menu namun belum dapat membuat pesanan baru."}
            </small>
          </div>
          <button 
            type="button" 
            className={`btn sm ${f.is_open ? "danger" : ""}`}
            onClick={() => set("is_open", !f.is_open)}
          >
            {f.is_open ? "Ubah Menjadi Tutup" : "Buka Restoran Sekarang"}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Status Layanan & Jam Buka</h2>
        
        <div className="g2">
          <div>
            <label>Status Layanan Restoran (Status Pagi / Shift)</label>
            <select value={f.morning_status} onChange={(e) => set("morning_status", e.target.value)}>
              {MORNING_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <small className="muted">Status ini muncul sebagai label utama di halaman beranda pelanggan.</small>
          </div>

          <div>
            <label>Jam Buka Operasional</label>
            <input 
              value={f.open_hours} 
              onChange={(e) => set("open_hours", e.target.value)} 
              placeholder="Contoh: 07.00–21.00 WIB" 
              required
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Identitas & Lokasi Restoran</h2>
        
        <div>
          <label>Nama Mitra Restoran</label>
          <input 
            value={f.name} 
            onChange={(e) => set("name", e.target.value)} 
            placeholder="Contoh: Warung Mba Taza" 
            required 
          />
        </div>

        <div className="g2">
          <div>
            <label>Kategori Masakan</label>
            <select value={f.category} onChange={(e) => set("category", e.target.value)}>
              <option>Masakan rumahan</option>
              <option>Soto</option>
              <option>Nasi goreng</option>
              <option>Mie & bakso</option>
              <option>Camilan</option>
              <option>Minuman</option>
            </select>
          </div>
          <div>
            <label>Teks Promo / Badge Khusus (Opsional)</label>
            <input 
              value={f.promo} 
              onChange={(e) => set("promo", e.target.value)} 
              placeholder="Contoh: Diskon Rp10.000 / Gratis Ongkir" 
            />
          </div>
        </div>

        <div>
          <label>Alamat Lengkap Restoran</label>
          <textarea 
            rows={2} 
            value={f.address} 
            onChange={(e) => set("address", e.target.value)} 
            placeholder="Jl. Riau No. 42, Bandung (Sertakan patokan dapur/resto)" 
            required
          />
        </div>

        {/* Upload Foto Resto */}
        <label style={{ marginTop: 16 }}>Foto Profil Restoran (File Lokal)</label>
        <div style={{ display: "flex", gap: 18, alignItems: "center", margin: "8px 0 14px" }}>
          <div style={{ width: 140, height: 95, borderRadius: 10, overflow: "hidden", background: "var(--teal2)", flexShrink: 0 }}>
            <FoodImage src={f.image} alt={f.name} className="resto-img" style={{ width: "100%", height: "100%", margin: 0 }} />
          </div>
          <div className="grow">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              style={{ padding: 6, fontSize: 13 }}
            />
            <small className="muted" style={{ display: "block", marginTop: 4 }}>
              {uploading ? "Sedang mengunggah foto restoran..." : "Pilih foto gerai/dapur dari laptop atau komputer Anda."}
            </small>
          </div>
        </div>

        <label>Atau Pilih dari Galeri Foto Resto:</label>
        <div className="chips" style={{ gap: 6 }}>
          {PRESET_RESTO_IMAGES.map((img) => (
            <button 
              type="button" 
              key={img.label} 
              className={"chip" + (f.image === img.url ? " on" : "")} 
              onClick={() => set("image", img.url)}
              style={{ fontSize: 12, padding: "4px 12px" }}
            >
              {img.label}
            </button>
          ))}
        </div>

        <div className="mt row" style={{ gap: 10, marginTop: 24 }}>
          <button className="btn" disabled={busy || uploading} style={{ padding: "12px 24px" }}>
            {busy ? "Menyimpan..." : "Simpan Perubahan Pengaturan"}
          </button>
          <button type="button" className="btn ghost" onClick={() => r.push("/owner")}>
            Batal
          </button>
        </div>

        {msg && <small className="ok" style={{ marginTop: 10, fontSize: 13 }}>✓ {msg}</small>}
        {err && <small className="err" style={{ marginTop: 10, fontSize: 13 }}>✕ {err}</small>}
      </div>
    </form>
  );
}
