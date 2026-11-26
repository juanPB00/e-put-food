import Link from "next/link";
import { notFound } from "next/navigation";
import RestoMenu from "@/components/RestoMenu";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { q, q1 } from "@/lib/db";

export default async function RestoPage({ params }: { params: { id: string } }) {
  const s = await requireRole("user");
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const r = await q1(`SELECT r.*, (SELECT round(avg(rt.food)::numeric,1)::float FROM ratings rt JOIN orders o ON o.id=rt.order_id WHERE o.resto_id=r.id) AS rating,
      (SELECT count(*)::int FROM ratings rt JOIN orders o ON o.id=rt.order_id WHERE o.resto_id=r.id) AS reviews
      FROM restaurants r JOIN users u ON u.id=r.owner_id AND u.status='approved' WHERE r.id=$1`, [id]);
  if (!r) notFound();
  const [products, me] = await Promise.all([
    q("SELECT id,name,category,price,description,emoji FROM products WHERE resto_id=$1 AND available ORDER BY id", [id]),
    q1("SELECT details->>'address' AS address FROM users WHERE id=$1", [s.id]),
  ]);
  return (
    <Shell s={s} at="/beranda">
      <div className="stack">
        <small><Link href="/beranda">← Kembali ke beranda</Link></small>
        <section className="hello"><div style={{ fontSize: 80 }} aria-hidden>{r.emoji}</div>
          <div className="grow"><span className="badge g">Buka • {r.open_hours}</span><h1>{r.name}</h1><p className="muted">{r.category} • {r.address}</p><small>★ {r.rating ?? "Baru"}{r.reviews ? ` (${r.reviews} ulasan)` : ""} • 20–30 menit</small></div></section>
        <RestoMenu restoId={r.id} restoName={r.name} products={products} address={me?.address || ""} />
      </div>
    </Shell>
  );
}
