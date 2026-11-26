import OrdersTable from "@/components/OrdersTable";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { q } from "@/lib/db";

export default async function Pesanan() {
  const s = await requireRole("user");
  const rows = await q("SELECT o.*, r.name AS resto_name FROM orders o JOIN restaurants r ON r.id=o.resto_id WHERE o.user_id=$1 ORDER BY o.id DESC", [s.id]);
  return (<Shell s={s} at="/pesanan"><h1>Pesanan saya</h1><div className="card"><OrdersTable rows={rows} base="/pesanan" empty="Belum ada pesanan. Pilih resto di beranda untuk mulai." /></div></Shell>);
}
