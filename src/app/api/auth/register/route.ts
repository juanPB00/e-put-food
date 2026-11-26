import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { q1 } from "@/lib/db";
import { createSession } from "@/lib/auth";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const b = await req.json();
  const role = b.role as string;
  if (!["user", "kurir", "resto"].includes(role)) return bad("Peran tidak valid.");
  const name = String(b.name || "").trim(), email = String(b.email || "").trim().toLowerCase(), pw = String(b.password || "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return bad("Isi nama dan email yang valid.");
  if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return bad("Kata sandi minimal 8 karakter, gabungkan huruf dan angka.");
  if (pw !== b.confirm) return bad("Konfirmasi kata sandi tidak sama.");
  if (!b.agree) return bad("Setujui Syarat & Ketentuan dulu.");
  let details: Record<string, string> = {};
  if (role === "kurir") {
    if (!b.ktp || !b.sim || !b.stnk || !b.vehicle || !b.plate) return bad("Lengkapi KTP, SIM C, STNK, kendaraan, dan plat nomor.");
    details = { vehicle: b.vehicle, plate: b.plate, ktp: b.ktp, sim: b.sim, stnk: b.stnk };
  }
  if (role === "resto") {
    if (!b.resto_name || !b.address || !b.ktp || !b.nib) return bad("Lengkapi nama resto, alamat, KTP, dan NIB.");
    details = { ktp: b.ktp, nib: b.nib, alamat: b.address };
  }
  if (await q1("SELECT 1 FROM users WHERE email=$1", [email])) return bad("Email sudah terdaftar.", 409);
  const status = role === "user" ? "approved" : "pending";
  const u = await q1(
    "INSERT INTO users(name,email,phone,password_hash,role,status,details) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,role",
    [name, email, b.phone || null, await bcrypt.hash(pw, 10), role, status, details]);
  if (role === "resto")
    await q1("INSERT INTO restaurants(owner_id,name,address,category) VALUES($1,$2,$3,$4)", [u.id, b.resto_name, b.address, b.category || "Masakan rumahan"]);
  if (role === "user") {
    await createSession({ id: u.id, name: u.name, role: "user" });
    return NextResponse.json({ redirect: "/beranda" });
  }
  return NextResponse.json({ message: "Pendaftaran terkirim. Admin akan meninjau dokumenmu dalam 1–2 hari kerja." });
}
