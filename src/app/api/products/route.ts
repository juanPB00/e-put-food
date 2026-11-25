import { NextResponse } from "next/server";
import { q1 } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { myResto } from "@/lib/orders";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "resto") return NextResponse.json({ error: "Khusus pemilik resto." }, { status: 403 });
  const r = await myResto(s);
  const b = await req.json();
  const price = Number(b.price);
  if (!r || !String(b.name || "").trim() || !(price >= 0)) return NextResponse.json({ error: "Isi nama dan harga produk." }, { status: 400 });
  await q1("INSERT INTO products(resto_id,name,category,price,description,emoji,available) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [r.id, b.name.trim(), b.category || "Makanan", price, b.description || null, b.emoji || "🍛", b.available !== false]);
  return NextResponse.json({ ok: true });
}
