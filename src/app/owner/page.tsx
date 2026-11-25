import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import { RejectBox } from "@/components/Forms";
import OrdersTable from "@/components/OrdersTable";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { jam, rp } from "@/lib/util";
import { myResto } from "@/lib/orders";

export default async function OwnerPage() {
  const s = await requireRole("resto");
  const r = await myResto(s);
  if (!r) return <Shell s={s} at="/owner"><div className="empty">Data mitra restoran tidak ditemukan.</div></Shell>;
  
  const today = "o.created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'";
  const [st, rating, incoming, live] = await Promise.all([
    q1(`SELECT COALESCE(sum(subtotal) FILTER (WHERE status<>'rejected'),0)::int AS sales, count(*)::int AS n,
        count(*) FILTER (WHERE status='done')::int AS done, count(*) FILTER (WHERE status='pending')::int AS fresh FROM orders o WHERE resto_id=$1 AND ${today}`, [r.id]),
    q1("SELECT round(avg(food)::numeric,1)::float AS avg, count(*)::int AS n FROM ratings rt JOIN orders o ON o.id=rt.order_id WHERE o.resto_id=$1", [r.id]),
    q("SELECT o.*, u.name AS user_name FROM orders o JOIN users u ON u.id=o.user_id WHERE o.resto_id=$1 AND o.status='pending' ORDER BY o.id", [r.id]),
    q("SELECT o.*, u.name AS user_name FROM orders o JOIN users u ON u.id=o.user_id WHERE o.resto_id=$1 AND o.status IN ('preparing','ready','delivering','arrived') ORDER BY o.id DESC", [r.id]),
  ]);

  const itemsOf = async (id: number) => (await q("SELECT qty,name FROM order_items WHERE order_id=$1", [id])).map((i) => `${i.qty}× ${i.name}`).join(", ");
  const inc = await Promise.all(incoming.map(async (o) => ({ ...o, items: await itemsOf(o.id) })));

  return (
    <Shell s={s} at="/owner">
      <AutoRefresh ms={6000} />
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap2" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="eyebrow">{r.name} • {r.address || "Bandung"}</div>
            <h1 style={{ marginTop: 4 }}>Selamat datang, {s.name.split(" ")[0]}</h1>
            <p className="muted">
              {st.fresh ? `Ada ${st.fresh} pesanan baru menunggu konfirmasi dapur Anda.` : "Semua pesanan terkendali dengan baik."}
            </p>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <span className={`badge ${r.is_open !== false ? "g" : "r"}`} style={{ padding: "8px 14px", fontSize: 13 }}>
              ● {r.is_open !== false ? (r.morning_status || "Buka") : "Tutup Sementara"}
            </span>
            <Link href="/owner/edit" className="btn sm ghost">
              ⚙️ Pengaturan Resto
            </Link>
          </div>
        </div>

        <div className="g4">
          <div className="card stat">
            <small className="muted">Penjualan Hari Ini</small>
            <b>{rp(st.sales)}</b>
            <small className="muted">{st.done} pesanan selesai</small>
          </div>
          <div className="card stat">
            <small className="muted">Total Pesanan</small>
            <b>{st.n}</b>
            <small className="muted">Hari ini</small>
          </div>
          <div className="card stat" style={{ borderLeft: st.fresh ? "4px solid var(--or)" : undefined }}>
            <small className="muted">Pesanan Baru</small>
            <b style={{ color: st.fresh ? "var(--or)" : "inherit" }}>{st.fresh}</b>
            <small className="muted">{st.fresh ? "Konfirmasi sekarang" : "Belum ada antrean"}</small>
          </div>
          <div className="card stat">
            <small className="muted">Rating Restoran</small>
            <b>{rating.avg ?? "5.0"} / 5</b>
            <small className="muted">Dari {rating.n} ulasan</small>
          </div>
        </div>

        {/* Pesanan Masuk Menunggu Dapur */}
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <h2 className="grow" style={{ margin: 0 }}>Pesanan Masuk (Butuh Konfirmasi)</h2>
            <span className="badge or">{inc.length} antrean</span>
          </div>
          {inc.length === 0 ? (
            <div className="empty">
              <span style={{ fontSize: 32, display: "block", marginBottom: 6 }}>🍳</span>
              Belum ada pesanan masuk saat ini. Halaman akan menyegarkan data otomatis.
            </div>
          ) : (
            <div className="g2">
              {inc.map((o) => (
                <div key={o.id} className="card or" style={{ padding: 18 }}>
                  <div className="row">
                    <b className="grow" style={{ fontSize: 16 }}>#{o.code}</b>
                    <small className="muted">{jam(o.created_at)} WIB</small>
                  </div>
                  <b style={{ display: "block", marginTop: 4 }}>Pelanggan: {o.user_name}</b>
                  <p className="muted" style={{ margin: "6px 0" }}>{o.items}</p>
                  <div className="row" style={{ margin: "8px 0" }}>
                    <b style={{ fontSize: 16, color: "var(--dark)" }}>{rp(o.total)}</b>
                    <span className="grow" />
                    <span className="badge g" style={{ fontSize: 11 }}>{o.payment} • Lunas</span>
                  </div>
                  <div className="mt">
                    <RejectBox orderId={o.id} />
                  </div>
                  <p className="mt" style={{ marginBottom: 0 }}>
                    <Link className="link" href={`/owner/pesanan/${o.id}`}>
                      Buka rincian lengkap & percakapan chat →
                    </Link>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pesanan yang Sedang Berlangsung */}
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <h2 className="grow" style={{ margin: 0 }}>Pesanan yang Sedang Diproses</h2>
            <Link href="/owner/pesanan" className="or">Lihat Semua Pesanan</Link>
          </div>
          <OrdersTable rows={live} base="/owner/pesanan" empty="Tidak ada pesanan yang sedang diproses saat ini." />
        </div>
      </div>
    </Shell>
  );
}
