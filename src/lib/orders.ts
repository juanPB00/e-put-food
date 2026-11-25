import { q, q1 } from "./db";
import type { Session } from "./auth";

export async function ev(orderId: number, status: string) {
  await q("INSERT INTO order_events(order_id,status) VALUES($1,$2)", [orderId, status]);
}
export async function myResto(s: Session) {
  return q1("SELECT * FROM restaurants WHERE owner_id=$1", [s.id]);
}
/** Ambil pesanan hanya jika peran ini berhak melihatnya. */
export async function orderFor(s: Session, id: string | number) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  const o = await q1(
    `SELECT o.*, r.name AS resto_name, r.address AS resto_address, r.owner_id,
            u.name AS user_name, k.name AS kurir_name, k.details AS kurir_details
     FROM orders o JOIN restaurants r ON r.id=o.resto_id JOIN users u ON u.id=o.user_id
     LEFT JOIN users k ON k.id=o.kurir_id WHERE o.id=$1`, [n]);
  if (!o) return null;
  const ok = s.role === "admin" || (s.role === "user" && o.user_id === s.id) ||
    (s.role === "resto" && o.owner_id === s.id) || (s.role === "kurir" && o.kurir_id === s.id);
  return ok ? o : null;
}
