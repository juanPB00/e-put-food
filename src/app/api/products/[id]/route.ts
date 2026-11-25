import { NextResponse } from "next/server";
import { q1 } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { myResto } from "@/lib/orders";

async function owned(id: string) {
  const s = await getSession();
  if (!s || s.role !== "resto") return null;
  const r = await myResto(s);
  return r ? { rid: r.id as number, pid: Number(id) } : null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const o = await owned(params.id);
  if (!o) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const b = await req.json();
  await q1(
    `UPDATE products SET name=COALESCE($1,name), category=COALESCE($2,category), price=COALESCE($3,price),
       description=COALESCE($4,description), emoji=COALESCE($5,emoji), available=COALESCE($6,available)
     WHERE id=$7 AND resto_id=$8`,
    [b.name ?? null, b.category ?? null, b.price ?? null, b.description ?? null, b.emoji ?? null, b.available ?? null, o.pid, o.rid]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const o = await owned(params.id);
  if (!o) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  await q1("DELETE FROM products WHERE id=$1 AND resto_id=$2", [o.pid, o.rid]);
  return NextResponse.json({ ok: true });
}
