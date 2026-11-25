import Shell from "@/components/Shell";
import RestoProfileForm from "@/components/RestoProfileForm";
import { requireRole } from "@/lib/auth";
import { myResto } from "@/lib/orders";

export default async function EditRestoPage() {
  const s = await requireRole("resto");
  const r = await myResto(s);

  if (!r) {
    return (
      <Shell s={s} at="/owner/edit">
        <div className="empty card">Data mitra restoran tidak ditemukan.</div>
      </Shell>
    );
  }

  return (
    <Shell s={s} at="/owner/edit">
      <div className="stack" style={{ gap: 20 }}>
        <div>
          <div className="eyebrow">Pengaturan Resto & Layanan</div>
          <h1 style={{ marginTop: 4 }}>Profil Mitra Restoran</h1>
          <p className="muted">
            Atur status buka-tutup, status layanan pagi, jam operasional, dan informasi gerai restoran Anda.
          </p>
        </div>

        <RestoProfileForm initialResto={r} />
      </div>
    </Shell>
  );
}
