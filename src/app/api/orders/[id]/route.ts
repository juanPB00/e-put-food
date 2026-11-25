import { NextResponse } from "next/server";
import { q, q1 } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ev } from "@/lib/orders";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) return bad("Belum masuk.", 401);
  const b = await req.json();
  const id = Number(params.id);
  const o = await q1("SELECT o.*, r.owner_id FROM orders o JOIN restaurants r ON r.id=o.resto_id WHERE o.id=$1", [id]);
  if (!o) return bad("Pesanan tidak ditemukan.", 404);
  const move = async (from: string[], to: string) => {
    if (!from.includes(o.status)) return bad("Status pesanan sudah berubah. Muat ulang halaman.", 409);
    await q("UPDATE orders SET status=$1 WHERE id=$2", [to, id]);
    await ev(id, to);
    return NextResponse.json({ ok: true });
  };

  if (s.role === "resto" && o.owner_id === s.id) {
    if (b.action === "accept") return move(["pending"], "preparing");
    if (b.action === "ready") return move(["preparing"], "ready");
    if (b.action === "reject") {
      if (!b.reason) return bad("Pilih alasan penolakan.");
      await q("UPDATE orders SET reject_reason=$1 WHERE id=$2", [b.reason, id]);
      return move(["pending"], "rejected");
    }
  }
  if (s.role === "kurir") {
    if (b.action === "take") {
      const r = await q1("UPDATE orders SET kurir_id=$1 WHERE id=$2 AND kurir_id IS NULL AND status IN ('preparing','ready') RETURNING id", [s.id, id]);
      return r ? NextResponse.json({ redirect: `/kurir/pesanan/${id}` }) : bad("Tawaran sudah diambil kurir lain.", 409);
    }
    if (o.kurir_id === s.id) {
      if (b.action === "pickup") return move(["ready"], "delivering");
      if (b.action === "arrive") return move(["delivering"], "arrived");
      if (b.action === "done") return move(["arrived"], "done");
    }
  }
  if (s.role === "user" && o.user_id === s.id && o.status === "done") {
    if (b.action === "rate") {
      const f = Number(b.food), c = Number(b.courier);
      if (!(f >= 1 && f <= 5 && c >= 1 && c <= 5)) return bad("Beri bintang 1–5 untuk makanan dan kurir.");
      await q("INSERT INTO ratings(order_id,food,courier,comment) VALUES($1,$2,$3,$4) ON CONFLICT (order_id) DO NOTHING", [id, f, c, b.comment || null]);
      return NextResponse.json({ ok: true });
    }
    if (b.action === "complaint") {
      if (!String(b.title || "").trim()) return bad("Tulis judul komplain.");
      await q("INSERT INTO complaints(order_id,user_id,title,body) VALUES($1,$2,$3,$4)", [id, s.id, b.title, b.body || null]);
      return NextResponse.json({ ok: true });
    }
  }
  return bad("Aksi tidak diizinkan.", 403);
}
