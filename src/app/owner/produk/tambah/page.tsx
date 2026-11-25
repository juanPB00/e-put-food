import Link from "next/link";
import { ProductForm } from "@/components/Forms";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";

export default async function TambahProdukPage() {
  const s = await requireRole("resto");

  return (
    <Shell s={s} at="/owner/produk">
      <div className="stack" style={{ gap: 16 }}>
        <small>
          <Link href="/owner/produk" className="link">
            ← Kembali ke daftar menu
          </Link>
        </small>
        <ProductForm />
      </div>
    </Shell>
  );
}
