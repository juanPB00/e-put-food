import OrdersTable from "@/components/OrdersTable";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { q } from "@/lib/db";

export default async function List() {
  const s = await requireRole("resto");
  const rows = await q("SELECT o.*, u.name AS user_name FROM orders o JOIN restaurants r ON r.id=o.resto_id JOIN users u ON u.id=o.user_id WHERE r.owner_id=$1 ORDER BY o.id DESC", [s.id]);
  return (<Shell s={s} at="/owner/pesanan"><h1>Pesanan</h1><div className="card"><OrdersTable rows={rows} base="/owner/pesanan" empty="Belum ada pesanan." /></div></Shell>);
}
