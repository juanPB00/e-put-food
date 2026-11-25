"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Act from "./Act";
import FoodImage from "./FoodImage";

async function call(url: string, body: any, method = "POST") {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, d: await r.json().catch(() => ({})) };
}

export function Stars({ v, set, label }: { v: number; set: (n: number) => void; label: string }) {
  return (
    <div>
      <b>{label}</b>
      <div className="stars" style={{ marginTop: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={n <= v ? "on" : ""} onClick={() => set(n)} aria-label={`${n} bintang`}>
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function RatingForm({ orderId }: { orderId: number }) {
  const r = useRouter();
  const [food, setFood] = useState(0), [courier, setCourier] = useState(0), [comment, setComment] = useState(""), [err, setErr] = useState("");
  async function send() {
    const { ok, d } = await call(`/api/orders/${orderId}`, { action: "rate", food, courier, comment });
    ok ? r.refresh() : setErr(d.error);
  }
  return (
    <div className="card">
      <h2>Sudah Menikmati Hidangan? Ceritakan Pengalamanmu</h2>
      <div className="g2 mt"><Stars v={food} set={setFood} label="Kualitas & Rasa Makanan" /><Stars v={courier} set={setCourier} label="Kecepatan & Sikap Kurir" /></div>
      <textarea rows={2} placeholder="Tulis ulasan Anda untuk mitra restoran dan kurir…" value={comment} onChange={(e) => setComment(e.target.value)} style={{ marginTop: 12 }} />
      <div className="mt"><button className="btn" onClick={send}>Kirim Penilaian</button></div>
      {err && <small className="err">{err}</small>}
    </div>
  );
}

export function ComplaintForm({ orderId }: { orderId: number }) {
  const r = useRouter();
  const [open, setOpen] = useState(false), [title, setTitle] = useState(""), [body, setBody] = useState(""), [err, setErr] = useState("");
  if (!open) return <button className="btn ghost" onClick={() => setOpen(true)}>Ada masalah dengan pesanan? Ajukan Komplain</button>;
  async function send() {
    const { ok, d } = await call(`/api/orders/${orderId}`, { action: "complaint", title, body });
    ok ? r.refresh() : setErr(d.error);
  }
  return (
    <div className="card">
      <h2>Ajukan Komplain Pesanan</h2>
      <p className="muted">Admin E-put Food akan meninjau komplain Anda dan memproses pengembalian dana jika keluhan valid.</p>
      <input placeholder="Judul komplain, misal: Kemasan rusak / Makanan kurang 1 porsi" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginTop: 8 }} />
      <textarea rows={3} placeholder="Jelaskan detail kendala yang dialami secara rinci…" value={body} onChange={(e) => setBody(e.target.value)} style={{ marginTop: 10 }} />
      <div className="mt row"><button className="btn" onClick={send}>Kirim Komplain ke Admin</button><button className="btn ghost" onClick={() => setOpen(false)}>Batal</button></div>
      {err && <small className="err">{err}</small>}
    </div>
  );
}

export function RejectBox({ orderId }: { orderId: number }) {
  const [reason, setReason] = useState("");
  return (
    <div className="stack" style={{ gap: 10, marginTop: 12 }}>
      <Act url={`/api/orders/${orderId}`} body={{ action: "accept" }}>✓ Terima Pesanan & Mulai Masak</Act>
      <div className="row" style={{ gap: 8 }}>
        <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ flex: 1 }}>
          <option value="">Pilih alasan penolakan jika tidak bisa menerima…</option>
          <option>Bahan makanan / stok habis</option>
          <option>Dapur restoran sedang penuh</option>
          <option>Restoran tutup lebih awal</option>
        </select>
        <Act url={`/api/orders/${orderId}`} body={{ action: "reject", reason }} cls="btn danger" ask="Yakin ingin menolak pesanan pelanggan ini?">Tolak Pesanan</Act>
      </div>
    </div>
  );
}

const PRESET_IMAGES = [
  { label: "Ayam Bakar", url: "/images/food/nasi-ayam-bakar.jpg" },
  { label: "Soto Ayam", url: "/images/food/soto-ayam-kampung.jpg" },
  { label: "Nasi Goreng", url: "/images/food/nasi-goreng-kampung.jpg" },
  { label: "Mie Ayam", url: "/images/food/mie-ayam-bakso.jpg" },
  { label: "Soto Betawi", url: "/images/food/soto-betawi.jpg" },
  { label: "Es Teh", url: "/images/food/es-teh-manis.jpg" },
  { label: "Kerupuk", url: "/images/food/kerupuk-udang.jpg" },
];

export function ProductForm({ p }: { p?: any }) {
  const r = useRouter();
  const blank = { name: "", category: "Makanan", price: "", description: "", emoji: "🍛", image: "/images/food/nasi-ayam-bakar.jpg", available: true };
  const [f, setF] = useState<any>(p ? { ...p, price: String(p.price), description: p.description || "", image: p.image || "/images/food/nasi-ayam-bakar.jpg" } : blank);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show temporary preview
    const previewUrl = URL.createObjectURL(file);
    set("image", previewUrl);

    // Upload to server
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        set("image", data.url);
      } else {
        alert("Gagal mengunggah foto: " + (data.error || "Coba file gambar lain."));
      }
    } catch (error) {
      alert("Terjadi kesalahan saat upload gambar.");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setErr("Nama menu wajib diisi.");
    if (!f.price || Number(f.price) < 0) return setErr("Harga menu tidak valid.");

    setBusy(true);
    setErr("");
    const body = { ...f, price: Number(f.price) };
    const { ok, d } = p ? await call(`/api/products/${p.id}`, body, "PATCH") : await call("/api/products", body);
    setBusy(false);
    
    if (!ok) return setErr(d.error || "Gagal menyimpan menu.");
    r.push("/owner/produk");
    r.refresh();
  }

  return (
    <div className="card" style={{ maxWidth: 700, margin: "0 auto" }}>
      <div className="row" style={{ marginBottom: 16 }}>
        <h2 className="grow" style={{ fontSize: 20 }}>{p ? "Edit Hidangan Menu" : "Tambah Menu Hidangan Baru"}</h2>
        <a className="btn sm ghost" href="/owner/produk">Kembali ke Menu</a>
      </div>

      <form onSubmit={save}>
        <label>Nama Hidangan / Produk</label>
        <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Contoh: Nasi Bebek Goreng Kremes" required />

        <div className="g2">
          <div>
            <label>Kategori Menu</label>
            <select value={f.category} onChange={(e) => set("category", e.target.value)}>
              <option>Makanan</option>
              <option>Minuman</option>
              <option>Camilan</option>
              <option>Paket Hemat</option>
            </select>
          </div>
          <div>
            <label>Harga Jual (Rp)</label>
            <input type="number" min={0} value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="Contoh: 25000" required />
          </div>
        </div>

        <label>Deskripsi Menu</label>
        <textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Jelaskan isi hidangan, porsi, atau keistimewaan rasa…" />

        {/* Upload Gambar dari File Lokal */}
        <label style={{ marginTop: 16 }}>Foto Makanan (Gambar Nyata)</label>
        <div style={{ display: "flex", gap: 18, alignItems: "center", margin: "8px 0 14px" }}>
          <div style={{ width: 120, height: 90, borderRadius: 10, overflow: "hidden", background: "var(--teal2)", flexShrink: 0 }}>
            <FoodImage src={f.image} alt={f.name || "Preview"} fallbackEmoji={f.emoji} className="food-img" style={{ width: "100%", height: "100%", margin: 0 }} />
          </div>
          <div className="grow">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              style={{ padding: 6, fontSize: 13 }}
            />
            <small className="muted" style={{ display: "block", marginTop: 4 }}>
              {uploading ? "Sedang mengunggah foto ke server..." : "Pilih file foto dari galeri/laptop Anda (JPG, PNG, WebP)."}
            </small>
          </div>
        </div>

        {/* Pilihan Cepat Galeri Gambar */}
        <label>Atau Pilih dari Galeri Foto Rekomendasi:</label>
        <div className="chips" style={{ gap: 6 }}>
          {PRESET_IMAGES.map((img) => (
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

        <div style={{ marginTop: 14 }}>
          <label style={{ fontWeight: 400, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={f.available} 
              onChange={(e) => set("available", e.target.checked)} 
              style={{ width: "auto" }} 
            />
            <b>Menu ini langsung tersedia untuk dipesan pelanggan</b>
          </label>
        </div>

        <div className="mt row" style={{ gap: 10, marginTop: 24 }}>
          <button className="btn" disabled={busy || uploading}>
            {busy ? "Menyimpan..." : p ? "Simpan Perubahan Menu" : "Terbitkan Menu Baru"}
          </button>
          <a className="btn ghost" href="/owner/produk">Batal</a>
        </div>

        {err && <small className="err">{err}</small>}
      </form>
    </div>
  );
}

export function ReviewBox({ id, kind, status }: { id: number; kind: string; status?: string }) {
  const r = useRouter();
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [busy, setBusy] = useState(false);

  async function decide(decision: string) {
    setBusy(true);
    setErr("");
    const { ok, d } = await call("/api/admin/verify", { id, decision, note });
    setBusy(false);
    if (ok) {
      setShowDeleteModal(false);
      r.push("/admin/verifikasi");
      r.refresh();
    } else {
      setErr(d.error || "Gagal memproses tindakan.");
    }
  }

  const isApproved = status === "approved";

  return (
    <div style={{ marginTop: 14 }}>
      <label>Catatan Peninjauan / Alasan</label>
      <input 
        value={note} 
        onChange={(e) => setNote(e.target.value)} 
        placeholder={isApproved ? "Alasan penghapusan akun mitra (opsional)" : "Identitas dan dokumen mitra sesuai standar."} 
      />

      <div className="mt stack" style={{ gap: 10 }}>
        {isApproved ? (
          // Jika sudah disetujui, tombol bertuliskan "Hapus Akun" dengan konfirmasi modal/alert!
          <div>
            <button 
              type="button" 
              className="btn danger full" 
              onClick={() => setShowDeleteModal(true)}
              style={{ padding: "12px 18px", fontSize: 14 }}
            >
              🗑️ Hapus Akun Mitra
            </button>
            <small className="muted" style={{ display: "block", textAlign: "center", marginTop: 6 }}>
              Menghapus akun mitra yang sudah disetujui dari sistem.
            </small>
          </div>
        ) : (
          <>
            <button className="btn full" disabled={busy} onClick={() => decide("approved")}>
              ✓ Setujui & Aktifkan Akun {kind === "resto" ? "Mitra Restoran" : "Mitra Kurir"}
            </button>
            <div className="g2">
              <button className="btn ghost" disabled={busy} onClick={() => decide("revision")}>
                Minta Revisi Dokumen
              </button>
              <button 
                className="btn danger" 
                disabled={busy} 
                onClick={() => {
                  if (confirm("Apakah Anda yakin ingin menolak pendaftaran akun mitra ini?")) {
                    decide("rejected");
                  }
                }}
              >
                Tolak Pendaftaran
              </button>
            </div>
            <small className="muted">Penolakan dan permintaan revisi wajib disertai catatan/alasan.</small>
          </>
        )}
      </div>

      {err && <small className="err">{err}</small>}

      {/* Pop-up Konfirmasi Hapus Akun (Sesuai Permintaan User) */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: 36, display: "block", marginBottom: 8 }}>⚠️</span>
            <h2>Konfirmasi Hapus Akun Mitra</h2>
            <p className="muted" style={{ margin: "10px 0 16px", lineHeight: 1.5 }}>
              Apakah Anda yakin ingin <b>menghapus akun mitra</b> ini? Akun dan data terkait akan dihapus secara permanen dari sistem E-put Food. Tindakan ini tidak dapat dibatalkan.
            </p>
            {note && (
              <div className="card or" style={{ padding: 10, fontSize: 12, marginBottom: 16 }}>
                <b>Catatan penghapusan:</b> {note}
              </div>
            )}
            <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="btn ghost" onClick={() => setShowDeleteModal(false)}>
                Batal
              </button>
              <button 
                type="button" 
                className="btn danger-solid" 
                disabled={busy}
                onClick={() => decide("delete")}
              >
                {busy ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
