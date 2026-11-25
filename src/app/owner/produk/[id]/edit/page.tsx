import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/Forms";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { q1 } from "@/lib/db";
import { myResto } from "@/lib/orders";

export default async function EditProdukPage({ params }: { params: { id: string } }) {
  const s = await requireRole("resto");
  const r = await myResto(s);
  if (!r) notFound();

  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const p = await q1("SELECT * FROM products WHERE id=$1 AND resto_id=$2", [id, r.id]);
  if (!p) notFound();

  return (
    <Shell s={s} at="/owner/produk">
      <div className="stack" style={{ gap: 16 }}>
        <small>
          <Link href="/owner/produk" className="link">
            ← Kembali ke daftar menu
          </Link>
        </small>
        <ProductForm p={p} />
      </div>
    </Shell>
  );
}
