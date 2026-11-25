import { NextResponse } from "next/server";
import { q, q1 } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { myResto } from "@/lib/orders";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "resto") return NextResponse.json({ error: "Khusus mitra restoran." }, { status: 403 });
  const r = await myResto(s);
  if (!r) return NextResponse.json({ error: "Resto tidak ditemukan." }, { status: 404 });
  return NextResponse.json(r);
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "resto") return NextResponse.json({ error: "Khusus mitra restoran." }, { status: 403 });
  const r = await myResto(s);
  if (!r) return NextResponse.json({ error: "Resto tidak ditemukan." }, { status: 404 });

  const b = await req.json();
  const name = b.name !== undefined ? String(b.name).trim() : r.name;
  const address = b.address !== undefined ? String(b.address).trim() : r.address;
  const category = b.category !== undefined ? b.category : r.category;
  const open_hours = b.open_hours !== undefined ? b.open_hours : r.open_hours;
  const promo = b.promo !== undefined ? b.promo : r.promo;
  const image = b.image !== undefined ? b.image : r.image;
  const is_open = b.is_open !== undefined ? Boolean(b.is_open) : r.is_open;
  const morning_status = b.morning_status !== undefined ? b.morning_status : r.morning_status;

  if (!name) return NextResponse.json({ error: "Nama restoran tidak boleh kosong." }, { status: 400 });

  await q(
    `UPDATE restaurants 
     SET name=$1, address=$2, category=$3, open_hours=$4, promo=$5, image=$6, is_open=$7, morning_status=$8 
     WHERE id=$9`,
    [name, address, category, open_hours, promo, image, is_open, morning_status, r.id]
  );

  return NextResponse.json({ ok: true });
}
