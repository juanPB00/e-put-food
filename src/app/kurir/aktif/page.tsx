import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { q } from "@/lib/db";
import { STATUS } from "@/lib/util";

export default async function Aktif() {
  const s = await requireRole("kurir");
  const rows = await q("SELECT o.id,o.code,o.status,r.name AS resto,u.name AS user_name FROM orders o JOIN restaurants r ON r.id=o.resto_id JOIN users u ON u.id=o.user_id WHERE o.kurir_id=$1 AND o.status NOT IN ('done','rejected') ORDER BY o.id", [s.id]);
  if (rows.length === 1) redirect(`/kurir/pesanan/${rows[0].id}`);
  return (
    <Shell s={s} at="/kurir/aktif"><h1>Pengantaran aktif</h1>
      {rows.length === 0 ? <div className="card empty">Belum ada pengantaran aktif. <Link href="/kurir" className="or">Lihat tawaran order</Link></div>
        : <div className="stack">{rows.map((o) => (<Link key={o.id} href={`/kurir/pesanan/${o.id}`} className="card"><b>#{o.code}</b> • {o.resto} → {o.user_name} <span className="badge">{STATUS[o.status]}</span></Link>))}</div>}
    </Shell>
  );
}
