import Link from "next/link";
import Shell from "@/components/Shell";
import PrintButton from "@/components/PrintButton";
import { requireRole } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { jam, rp, tgl } from "@/lib/util";
import { myResto } from "@/lib/orders";

export default async function LaporanOwnerPage({ searchParams }: { searchParams: { p?: string } }) {
  const s = await requireRole("resto");
  const r = await myResto(s);
  if (!r) return <Shell s={s} at="/owner/laporan"><div className="empty">Data mitra restoran tidak ditemukan.</div></Shell>;

  const period = searchParams.p || "7d";
  let filterClause = "1=1";
  if (period === "today") {
    filterClause = "(o.created_at AT TIME ZONE 'Asia/Jakarta')::date = (now() AT TIME ZONE 'Asia/Jakarta')::date";
  } else if (period === "7d") {
    filterClause = "o.created_at >= (now() - interval '7 days')";
  } else if (period === "30d") {
    filterClause = "o.created_at >= (now() - interval '30 days')";
  }

  const [summary, topProducts, trend, transactions] = await Promise.all([
    q1(`SELECT 
          COALESCE(sum(subtotal) FILTER (WHERE status='done'), 0)::int AS net_sales,
          COALESCE(sum(total) FILTER (WHERE status='done'), 0)::int AS gross_sales,
          count(*) FILTER (WHERE status='done')::int AS total_done,
          count(*) FILTER (WHERE status='rejected')::int AS total_rejected,
          count(*)::int AS total_orders
        FROM orders o 
        WHERE resto_id=$1 AND ${filterClause}`, [r.id]),

    q(`SELECT oi.name, sum(oi.qty)::int AS qty_sold, sum(oi.qty * oi.price)::int AS total_amount
       FROM order_items oi
       JOIN orders o ON o.id=oi.order_id
       WHERE o.resto_id=$1 AND o.status='done' AND ${filterClause}
       GROUP BY oi.name
       ORDER BY qty_sold DESC
       LIMIT 5`, [r.id]),

    q(`SELECT to_char(d, 'DD/MM') AS lbl, 
              COALESCE(sum(o.subtotal) FILTER (WHERE o.status='done'), 0)::int AS v,
              count(o.id) FILTER (WHERE o.status='done')::int AS n
       FROM generate_series((now() AT TIME ZONE 'Asia/Jakarta')::date - 6, (now() AT TIME ZONE 'Asia/Jakarta')::date, '1 day') d
       LEFT JOIN orders o ON (o.created_at AT TIME ZONE 'Asia/Jakarta')::date = d::date AND o.resto_id=$1
       GROUP BY d ORDER BY d`, [r.id]),

    q(`SELECT o.id, o.code, o.created_at, o.subtotal, o.total, o.payment, o.status, u.name AS user_name,
              (SELECT string_agg(qty || 'x ' || name, ', ') FROM order_items WHERE order_id=o.id) AS items
       FROM orders o
       JOIN users u ON u.id=o.user_id
       WHERE o.resto_id=$1 AND ${filterClause}
       ORDER BY o.id DESC`, [r.id]),
  ]);

  const maxTrend = Math.max(1, ...trend.map((t) => t.v));
  const avgOrder = summary.total_done > 0 ? Math.round(summary.net_sales / summary.total_done) : 0;

  return (
    <Shell s={s} at="/owner/laporan">
      <div className="stack" style={{ gap: 24 }}>
        <div className="row wrap2" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="eyebrow">Laporan Keuangan & Penjualan</div>
            <h1 style={{ marginTop: 4 }}>Analitik Bisnis {r.name}</h1>
            <p className="muted">Pantau omset, performa hidangan menu terlaris, dan rincian transaksi penjualan.</p>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <PrintButton />
          </div>
        </div>

        {/* Filter Periode */}
        <div className="chips" style={{ margin: 0 }}>
          <Link className={"chip" + (period === "today" ? " on" : "")} href="/owner/laporan?p=today">Hari Ini</Link>
          <Link className={"chip" + (period === "7d" ? " on" : "")} href="/owner/laporan?p=7d">7 Hari Terakhir</Link>
          <Link className={"chip" + (period === "30d" ? " on" : "")} href="/owner/laporan?p=30d">30 Hari Terakhir</Link>
          <Link className={"chip" + (period === "all" ? " on" : "")} href="/owner/laporan?p=all">Semua Riwayat</Link>
        </div>

        {/* Ringkasan KPI Cards */}
        <div className="g4">
          <div className="card stat" style={{ borderTop: "4px solid var(--green)" }}>
            <small className="muted">Pendapatan Bersih Resto</small>
            <b style={{ color: "var(--green)" }}>{rp(summary.net_sales)}</b>
            <small className="muted">Dari pesanan berstatus selesai</small>
          </div>

          <div className="card stat" style={{ borderTop: "4px solid var(--or)" }}>
            <small className="muted">Pesanan Berhasil Selesai</small>
            <b>{summary.total_done}</b>
            <small className="muted">Dari total {summary.total_orders} pesanan masuk</small>
          </div>

          <div className="card stat" style={{ borderTop: "4px solid var(--dark)" }}>
            <small className="muted">Rata-rata Nilai Pesanan</small>
            <b>{rp(avgOrder)}</b>
            <small className="muted">Per transaksi pelanggan</small>
          </div>

          <div className="card stat" style={{ borderTop: "4px solid var(--red)" }}>
            <small className="muted">Pesanan Ditolak/Batal</small>
            <b>{summary.total_rejected}</b>
            <small className="muted">Tingkat sukses: {summary.total_orders ? Math.round((summary.total_done / summary.total_orders) * 100) : 100}%</small>
          </div>
        </div>

        {/* Grafik & Produk Terlaris */}
        <div className="split">
          <div className="card">
            <h2>Tren Penjualan 7 Hari Terakhir</h2>
            <div className="bars" style={{ height: 160, marginTop: 16 }}>
              {trend.map((t) => (
                <div key={t.lbl}>
                  <i style={{ height: `${Math.max(6, (t.v / maxTrend) * 110)}px` }} />
                  {t.lbl}<br />
                  <b>{t.v ? Math.round(t.v / 1000) + "rb" : "0"}</b>
                </div>
              ))}
            </div>
            <small className="muted" style={{ display: "block", marginTop: 12, textAlign: "center" }}>
              Total pendapatan bersih hidangan harian dalam ribuan rupiah (rb)
            </small>
          </div>

          <div className="card">
            <h2>Hidangan Terlaris</h2>
            {topProducts.length === 0 ? (
              <div className="empty">Belum ada hidangan terjual pada periode ini.</div>
            ) : (
              <div className="stack" style={{ gap: 12, marginTop: 12 }}>
                {topProducts.map((p, idx) => (
                  <div key={p.name} className="row" style={{ justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
                    <div>
                      <b>#{idx + 1} {p.name}</b>
                      <small className="muted" style={{ display: "block" }}>{p.qty_sold} porsi terjual</small>
                    </div>
                    <b style={{ color: "var(--dark)" }}>{rp(p.total_amount)}</b>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabel Rincian Transaksi */}
        <div className="card">
          <div className="row" style={{ marginBottom: 14 }}>
            <h2 className="grow">Daftar Rincian Transaksi Penjualan</h2>
            <small className="muted">{transactions.length} baris data</small>
          </div>

          {transactions.length === 0 ? (
            <div className="empty">Tidak ada transaksi tercatat pada periode ini.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>ID Pesanan</th>
                    <th>Waktu</th>
                    <th>Pelanggan</th>
                    <th>Menu Dipesan</th>
                    <th>Metode Bayar</th>
                    <th>Pendapatan Resto</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <Link href={`/owner/pesanan/${t.id}`} className="b link">
                          #{t.code}
                        </Link>
                      </td>
                      <td>
                        {tgl(t.created_at)}<br />
                        <small className="muted">{jam(t.created_at)} WIB</small>
                      </td>
                      <td><b>{t.user_name}</b></td>
                      <td style={{ maxWidth: 260 }}>
                        <small>{t.items || "1x Hidangan"}</small>
                      </td>
                      <td><span className="badge">{t.payment}</span></td>
                      <td><b style={{ color: "var(--dark)" }}>{rp(t.subtotal)}</b></td>
                      <td>
                        <span className={"badge" + (t.status === "done" ? " g" : t.status === "rejected" ? " r" : "")}>
                          {t.status === "done" ? "Selesai" : t.status === "rejected" ? "Ditolak" : t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
