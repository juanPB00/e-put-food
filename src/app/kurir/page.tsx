import Link from "next/link";
import Act from "@/components/Act";
import AutoRefresh from "@/components/AutoRefresh";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { jam, rp, STATUS } from "@/lib/util";

export default async function Kurir() {
  const s = await requireRole("kurir");
  const [st, rating, active, offers, recent] = await Promise.all([
    q1(`SELECT COALESCE(sum(shipping),0)::int AS earn, count(*)::int AS n FROM orders WHERE kurir_id=$1 AND status='done'
        AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'`, [s.id]),
    q1("SELECT round(avg(courier)::numeric,1)::float AS avg FROM ratings rt JOIN orders o ON o.id=rt.order_id WHERE o.kurir_id=$1", [s.id]),
    q("SELECT o.id,o.code,o.status,r.name AS resto, u.name AS user_name FROM orders o JOIN restaurants r ON r.id=o.resto_id JOIN users u ON u.id=o.user_id WHERE o.kurir_id=$1 AND o.status NOT IN ('done','rejected') ORDER BY o.id", [s.id]),
    q(`SELECT o.id,o.code,o.status,o.shipping,o.total,o.address,r.name AS resto, r.address AS resto_address,
         (SELECT count(*)::int FROM order_items i WHERE i.order_id=o.id) AS n
       FROM orders o JOIN restaurants r ON r.id=o.resto_id WHERE o.kurir_id IS NULL AND o.status IN ('preparing','ready') ORDER BY o.id`),
    q("SELECT o.*, r.name AS resto FROM orders o JOIN restaurants r ON r.id=o.resto_id WHERE o.kurir_id=$1 AND o.status='done' ORDER BY o.id DESC LIMIT 5", [s.id]),
  ]);
  return (
    <Shell s={s} at="/kurir">
      <AutoRefresh ms={7000} />
      <div className="eyebrow">Mitra kurir • Bandung</div><h1>Semangat mengantar, {s.name.split(" ")[0]}!</h1>
      <p className="muted">Setiap perjalananmu membawa hangat ke meja makan seseorang.</p>
      <div className="g3 mt">
        <div className="card stat"><small>Pendapatan hari ini</small><b>{rp(st.earn)}</b><small>{st.n} pengantaran selesai</small></div>
        <div className="card stat"><small>Rating pelanggan</small><b>{rating.avg ?? "–"} / 5</b></div>
        <div className="card stat"><small>Pengantaran aktif</small><b>{active.length}</b></div>
      </div>
      {active.map((a) => (<div key={a.id} className="card dark row mt"><span style={{ fontSize: 26 }}>🛵</span><div className="grow"><b>Pengantaran aktif • #{a.code}</b><br /><small style={{ color: "#bcd" }}>{a.resto} → {a.user_name} • {STATUS[a.status]}</small></div><Link className="btn ghost" href={`/kurir/pesanan/${a.id}`}>Lanjutkan pengantaran</Link></div>))}
      <div className="card mt"><div className="row"><h2 className="grow">Tawaran order berikutnya</h2><span className="or">{offers.length} tawaran tersedia</span></div>
        {offers.length === 0 ? <div className="empty">Belum ada tawaran. Halaman ini diperbarui otomatis.</div> : (<div className="g2">{offers.map((o) => (
          <div key={o.id} className="card teal"><b>#{o.code}</b> <span className="badge">{STATUS[o.status]}</span>
            <p className="b" style={{ fontSize: 22, margin: "8px 0" }}>{rp(o.shipping)} <small>pendapatan antar</small></p>
            <p>🍴 <b>{o.resto}</b><br /><small>{o.resto_address}</small></p><p>📍 <small>{o.address}</small></p>
            <small>{o.n} item • Total transaksi {rp(o.total)} • QRIS lunas</small>
            <div className="mt"><Act url={`/api/orders/${o.id}`} body={{ action: "take" }}>Terima tawaran</Act></div></div>))}</div>)}
      </div>
      <div className="card mt"><h2>Pengantaran terakhir</h2>
        {recent.length === 0 ? <div className="empty">Belum ada pengantaran selesai.</div> : (<table><thead><tr><th>Pesanan</th><th>Resto</th><th>Waktu</th><th>Pendapatan</th></tr></thead><tbody>{recent.map((o) => (<tr key={o.id}><td><Link href={`/kurir/pesanan/${o.id}`} className="b">#{o.code}</Link></td><td>{o.resto}</td><td>{jam(o.created_at)}</td><td>{rp(o.shipping)}</td></tr>))}</tbody></table>)}
      </div>
    </Shell>
  );
}
