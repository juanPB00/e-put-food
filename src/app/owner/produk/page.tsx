import Link from "next/link";
import Act from "@/components/Act";
import FoodImage from "@/components/FoodImage";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { q } from "@/lib/db";
import { rp } from "@/lib/util";

export default async function ProdukPage() {
  const s = await requireRole("resto");
  const products = await q(
    `SELECT p.* 
     FROM products p 
     JOIN restaurants r ON r.id=p.resto_id 
     WHERE r.owner_id=$1 
     ORDER BY p.id DESC`, 
    [s.id]
  );

  return (
    <Shell s={s} at="/owner/produk">
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap2" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="eyebrow">Menu & Produk Mitra Restoran</div>
            <h1 style={{ marginTop: 4 }}>Daftar Menu Hidangan</h1>
            <p className="muted">Kelola hidangan, perbarui harga, dan atur ketersediaan menu untuk pelanggan.</p>
          </div>
          <Link href="/owner/produk/tambah" className="btn" style={{ padding: "12px 20px" }}>
            + Tambah Menu Baru
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="empty card" style={{ padding: 48 }}>
            <span style={{ fontSize: 44, display: "block", marginBottom: 10 }}>🍲</span>
            <h3>Belum ada menu hidangan</h3>
            <p className="muted" style={{ margin: "6px 0 16px" }}>Mulai tambahkan menu hidangan lezat restoran Anda agar pelanggan dapat memesan.</p>
            <Link href="/owner/produk/tambah" className="btn">
              + Tambah Menu Pertama
            </Link>
          </div>
        ) : (
          <div className="g3">
            {products.map((p) => (
              <div key={p.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative" }}>
                  <FoodImage 
                    src={p.image} 
                    alt={p.name} 
                    fallbackEmoji={p.emoji} 
                    className="food-img" 
                  />
                  <span 
                    className={"badge" + (p.available ? " g" : " r")} 
                    style={{ position: "absolute", top: 8, right: 8 }}
                  >
                    {p.available ? "Tersedia" : "Stok Habis"}
                  </span>
                </div>

                <div className="row" style={{ marginTop: 6, marginBottom: 2 }}>
                  <span className="badge" style={{ fontSize: 11 }}>{p.category}</span>
                  <span className="grow" />
                  <b style={{ fontSize: 16, color: "var(--dark)" }}>{rp(p.price)}</b>
                </div>

                <h3 style={{ fontSize: 16, marginTop: 4 }}>{p.name}</h3>
                <small className="muted" style={{ minHeight: 34, margin: "4px 0 14px", lineHeight: 1.4 }}>
                  {p.description || "Hidangan fresh disajikan hangat."}
                </small>

                <div className="row wrap2" style={{ marginTop: "auto", gap: 8, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <Link href={`/owner/produk/${p.id}/edit`} className="btn sm ghost" style={{ flex: 1, textAlign: "center" }}>
                    ✏️ Edit Menu
                  </Link>
                  <Act 
                    url={`/api/products/${p.id}`} 
                    method="PATCH" 
                    body={{ available: !p.available }} 
                    cls="btn sm ghost"
                  >
                    {p.available ? "Tandai Habis" : "Tandai Tersedia"}
                  </Act>
                  <Act 
                    url={`/api/products/${p.id}`} 
                    method="DELETE" 
                    cls="btn sm danger" 
                    ask={`Hapus ${p.name} secara permanen dari daftar menu?`}
                  >
                    Hapus
                  </Act>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
