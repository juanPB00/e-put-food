import Link from "next/link";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { STATUS, rp } from "@/lib/util";

export default async function Beranda({ searchParams }: { searchParams: { q?: string; c?: string } }) {
  const s = await requireRole("user");
  const term = (searchParams.q || "").trim(), cat = searchParams.c || "";
  const rate = `(SELECT round(avg(rt.food)::numeric,1)::float FROM ratings rt JOIN orders o ON o.id=rt.order_id WHERE o.resto_id=r.id)`;
  const [restos, cats, products, active] = await Promise.all([
    q(`SELECT r.*, ${rate} AS rating FROM restaurants r JOIN users u ON u.id=r.owner_id AND u.status='approved'
       WHERE ($1='' OR r.name ILIKE '%'||$1||'%' OR EXISTS(SELECT 1 FROM products p WHERE p.resto_id=r.id AND p.available AND p.name ILIKE '%'||$1||'%'))
       AND ($2='' OR r.category=$2) ORDER BY r.id`, [term, cat]),
    q("SELECT DISTINCT r.category FROM restaurants r JOIN users u ON u.id=r.owner_id AND u.status='approved' ORDER BY 1"),
    term ? q(`SELECT p.*, r.name AS resto FROM products p JOIN restaurants r ON r.id=p.resto_id JOIN users u ON u.id=r.owner_id AND u.status='approved'
              WHERE p.available AND p.name ILIKE '%'||$1||'%' LIMIT 8`, [term]) : Promise.resolve([]),
    q1("SELECT o.id,o.code,o.status,r.name AS resto FROM orders o JOIN restaurants r ON r.id=o.resto_id WHERE o.user_id=$1 AND o.status NOT IN ('done','rejected') ORDER BY o.id DESC LIMIT 1", [s.id]),
  ]);
  const first = s.name.split(" ")[0];
  return (
    <Shell s={s} at="/beranda">
      <div className="stack">
        <section className="hello">
          <div><span className="badge g">Makan enak, nggak perlu jauh</span><h1 style={{ marginTop: 10 }}>Halo, {first}.<br />Mau makan apa hari ini?</h1><p className="muted">Dari dapur tetangga ke meja makanmu. Temukan rasa lokal yang bikin kangen.</p><span className="badge">Pakai kode HANGAT10 — hemat Rp10.000</span></div>
          <div style={{ fontSize: 120 }} aria-hidden>🍗</div>
        </section>
        <form className="row"><input name="q" defaultValue={term} placeholder="Cari nasi ayam, camilan, atau resto favoritmu…" />{cat && <input type="hidden" name="c" value={cat} />}<button className="btn">Cari</button></form>
        <div className="chips" style={{ margin: 0 }}>
          <Link className={"chip" + (!cat ? " on" : "")} href={term ? `/beranda?q=${encodeURIComponent(term)}` : "/beranda"}>Semua</Link>
          {cats.map((c) => (<Link key={c.category} className={"chip" + (cat === c.category ? " on" : "")} href={`/beranda?c=${encodeURIComponent(c.category)}${term ? `&q=${encodeURIComponent(term)}` : ""}`}>{c.category}</Link>))}
        </div>
        {products.length > 0 && (<div><h2>Produk yang cocok dengan “{term}”</h2><div className="g4">{products.map((p) => (<Link key={p.id} href={`/resto/${p.resto_id}`} className="card"><div className="row"><div className="tile sm">{p.emoji}</div><div><b>{p.name}</b><br /><small>{p.resto} • {rp(p.price)}</small></div></div></Link>))}</div></div>)}
        <div>
          <h2>{term ? `Resto untuk “${term}”` : "Favorit di sekitarmu"}</h2>
          {restos.length === 0 ? <div className="empty card">Belum ada resto yang cocok. Coba kata kunci lain.</div> : (
            <div className="g4">{restos.map((r) => (
              <div key={r.id} className="card">
                <div className="tile">{r.emoji}</div>
                {r.promo && <span className="badge">{r.promo}</span>}
                <h3 style={{ marginTop: 8 }}>{r.name}</h3><small>{r.category}</small>
                <p><small>{r.rating ? `★ ${r.rating}` : "Baru"} • 20–30 menit • Ongkir mulai Rp8.000</small></p>
                <Link href={`/resto/${r.id}`} className="btn ghost full">Lihat menu</Link>
              </div>))}</div>)}
        </div>
        {active && (<div className="card dark row"><span style={{ fontSize: 28 }}>🛵</span><div className="grow"><b>Makan siangmu sedang di jalan!</b><br /><small style={{ color: "#bcd" }}>#{active.code} • {active.resto} • {STATUS[active.status]}</small></div><Link href={`/pesanan/${active.id}`} className="btn ghost">Lacak pesanan</Link></div>)}
      </div>
    </Shell>
  );
}
