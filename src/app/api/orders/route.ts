import { NextResponse } from "next/server";
import { q, q1 } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ev } from "@/lib/orders";
import { FEES } from "@/lib/util";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "user") return NextResponse.json({ error: "Masuk sebagai user dulu." }, { status: 401 });
  const b = await req.json();
  const address = String(b.address || "").trim();
  if (!address) return NextResponse.json({ error: "Isi alamat pengantaran." }, { status: 400 });
  const want: Record<number, number> = {};
  for (const i of b.items || []) if (i.qty > 0) want[Number(i.id)] = Math.min(Number(i.qty), 50);
  const prods = await q("SELECT id,name,price FROM products WHERE resto_id=$1 AND available AND id=ANY($2::int[])", [Number(b.restoId), Object.keys(want).map(Number)]);
  if (!prods.length) return NextResponse.json({ error: "Keranjang masih kosong." }, { status: 400 });
  const subtotal = prods.reduce((a, p) => a + p.price * want[p.id], 0);
  const discount = Math.min(FEES.voucher[String(b.voucher || "").toUpperCase()] || 0, subtotal);
  const total = subtotal + FEES.shipping + FEES.service - discount;
  const o = await q1(
    `INSERT INTO orders(user_id,resto_id,note,address,subtotal,shipping,service_fee,discount,total)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [s.id, Number(b.restoId), b.note || null, address, subtotal, FEES.shipping, FEES.service, discount, total]);
  await q("UPDATE orders SET code='RB-'||to_char(now(),'YYMMDD')||'-'||lpad(id::text,4,'0') WHERE id=$1", [o.id]);
  for (const p of prods) await q("INSERT INTO order_items(order_id,product_id,name,price,qty) VALUES($1,$2,$3,$4,$5)", [o.id, p.id, p.name, p.price, want[p.id]]);
  await q("UPDATE users SET details = details || jsonb_build_object('address',$1::text) WHERE id=$2", [address, s.id]);
  await ev(o.id, "pending");
  return NextResponse.json({ redirect: `/pesanan/${o.id}` });
}
