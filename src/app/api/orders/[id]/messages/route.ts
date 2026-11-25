import { NextResponse } from "next/server";
import { q, q1 } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { orderFor } from "@/lib/orders";

const CH: Record<string, string[]> = { "user-kurir": ["user", "kurir"], "user-resto": ["user", "resto"], "resto-kurir": ["resto", "kurir"] };
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function guard(id: string, channel: string) {
  const s = await getSession();
  if (!s) return { err: bad("Belum masuk.", 401) };
  const o = await orderFor(s, id);
  if (!o || !CH[channel]?.includes(s.role)) return { err: bad("Tidak ada akses ke percakapan ini.", 403) };
  if (channel.includes("kurir") && !o.kurir_id) return { err: bad("Kurir belum ditugaskan.", 409) };
  return { s, o };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const channel = new URL(req.url).searchParams.get("channel") || "";
  const g = await guard(params.id, channel);
  if (g.err) return g.err;
  const messages = await q(
    `SELECT m.id, m.sender_id, u.name, m.body, to_char(m.created_at AT TIME ZONE 'Asia/Jakarta','HH24.MI') AS at
     FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.order_id=$1 AND m.channel=$2 ORDER BY m.id`, [g.o!.id, channel]);
  return NextResponse.json({ messages });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { channel, body } = await req.json();
  const g = await guard(params.id, channel);
  if (g.err) return g.err;
  const text = String(body || "").trim().slice(0, 500);
  if (!text) return bad("Pesan kosong.");
  if (["done", "rejected"].includes(g.o!.status)) return bad("Pesanan sudah selesai, chat ditutup.", 409);
  await q1("INSERT INTO messages(order_id,channel,sender_id,body) VALUES($1,$2,$3,$4)", [g.o!.id, channel, g.s!.id, text]);
  return NextResponse.json({ ok: true });
}
