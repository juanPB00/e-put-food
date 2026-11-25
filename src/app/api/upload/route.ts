import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique name
    const ext = path.extname(file.name) || ".jpg";
    const base = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${Date.now()}-${base}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({ 
      ok: true, 
      url: `/uploads/${filename}` 
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Gagal mengunggah file." }, { status: 500 });
  }
}
