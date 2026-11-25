import Act from "./Act";
import AutoRefresh from "./AutoRefresh";
import Chat, { Tab } from "./Chat";
import MapMock from "./MapMock";
import { RatingForm, ComplaintForm, RejectBox } from "./Forms";
import { q, q1 } from "@/lib/db";
import type { Session } from "@/lib/auth";
import { FEES, jam, RANK, rp, STATUS, tgl, TITLE } from "@/lib/util";

const STEPS: [string, string][] = [
  ["Dikonfirmasi mitra restoran", "preparing"], 
  ["Makanan selesai disiapkan", "ready"], 
  ["Kurir dalam perjalanan", "delivering"], 
  ["Kurir tiba di alamat tujuan", "arrived"]
];
const PROGRESS: Record<string, number> = { pending: 0, preparing: 0, ready: 0, delivering: 0.55, arrived: 1, done: 1, rejected: 0 };

/** Detail pesanan untuk user, pemilik mitra resto, dan kurir. Chat di kolom kiri dengan jarak lega. */
export default async function OrderView({ o, s }: { o: any; s: Session }) {
  const [items, evs, rating, complaint] = await Promise.all([
    q("SELECT * FROM order_items WHERE order_id=$1 ORDER BY id", [o.id]),
    q("SELECT status, created_at FROM order_events WHERE order_id=$1 ORDER BY id", [o.id]),
    q1("SELECT * FROM ratings WHERE order_id=$1", [o.id]),
    q1("SELECT * FROM complaints WHERE order_id=$1 ORDER BY id DESC LIMIT 1", [o.id]),
  ]);
  
  const timeOf = (st: string) => { 
    const e = evs.find((x) => x.status === st); 
    return e ? jam(e.created_at) : ""; 
  };
  
  const rk = RANK[o.status];
  const noKurir = "Kurir belum ditugaskan. Chat otomatis terbuka setelah mitra kurir menerima tawaran pesanan.";
  
  const tabs: Tab[] =
    s.role === "user" ? [
      { channel: "user-kurir", label: "Kurir", off: o.kurir_id ? undefined : noKurir }, 
      { channel: "user-resto", label: "Mitra Resto" }
    ]
    : s.role === "resto" ? [
      { channel: "user-resto", label: "Pelanggan" }, 
      { channel: "resto-kurir", label: "Kurir", off: o.kurir_id ? undefined : noKurir }
    ]
    : [
      { channel: "user-kurir", label: "Pelanggan" }, 
      { channel: "resto-kurir", label: "Mitra Resto" }
    ];

  const finished = o.status === "done" || o.status === "rejected";
  const kd = o.kurir_details || {};
  const act = (action: string, label: string) => (<Act url={`/api/orders/${o.id}`} body={{ action }}>{label}</Act>);

  return (
    <div className="ov">
      {!finished && <AutoRefresh ms={5000} />}
      
      {/* Kolom Kiri: Chat dengan layout lega */}
      <div className="chatcol">
        {o.status === "rejected" ? (
          <div className="card empty">
            <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>🚫</span>
            Pesanan telah dibatalkan/ditolak. Ruang chat dinonaktifkan.
          </div>
        ) : (
          <Chat orderId={o.id} me={s.id} tabs={tabs} closed={o.status === "done"} />
        )}
      </div>

      {/* Kolom Kanan: Rincian Pesanan */}
      <div className="stack" style={{ gap: 20 }}>
        <div className="row wrap2">
          <div className="grow">
            <div className="eyebrow">Pesanan #{o.code}</div>
            <h1 style={{ marginTop: 4 }}>{TITLE[o.status] || "Status Pesanan"}</h1>
            <small className="muted">
              {tgl(o.created_at)} • {jam(o.created_at)} WIB • <b>{o.resto_name}</b> → <b>{o.user_name}</b>
            </small>
          </div>
          <span className={"badge" + (o.status === "rejected" ? " r" : o.status === "done" ? " g" : " or")} style={{ fontSize: 13, padding: "6px 14px" }}>
            {STATUS[o.status] || o.status}
          </span>
        </div>

        {o.status === "rejected" ? (
          <div className="card or">
            <b>Pesanan ditolak oleh mitra restoran.</b>
            <p className="muted" style={{ marginTop: 4 }}>Alasan penolakan: {o.reject_reason || "Dapur penuh / stok habis"}</p>
          </div>
        ) : (
          <div className="card">
            <h2>Lacak Pengantaran</h2>
            <MapMock from={o.resto_name} to={s.role === "user" ? "Rumahmu" : o.user_name} progress={PROGRESS[o.status]} />
            <div className="g2 mt">
              <div>
                <small className="muted">Alamat Pengantaran Pelanggan</small><br />
                <b>{o.user_name}</b><br />
                <small>{o.address}</small>
              </div>
              <div>
                <small className="muted">Informasi Mitra Kurir</small><br />
                {o.kurir_id ? (
                  <>
                    <b>{o.kurir_name}</b><br />
                    <small>{kd.vehicle || "Motor"} • {kd.plate || "D 1234 AB"}</small>
                  </>
                ) : (
                  <span className="badge or" style={{ marginTop: 4 }}>
                    Sedang mencari kurir terdekat…
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="g2">
          <div className="card">
            <h2>Riwayat Perjalanan Pesanan</h2>
            <ol className="steps" style={{ marginTop: 14 }}>
              {STEPS.map(([label, st]) => {
                const now = rk === RANK[st];
                const done = rk > RANK[st];
                return (
                  <li key={st} className={now ? "now" : done ? "done" : ""}>
                    <i>{done ? "✓" : ""}</i>
                    <div>
                      {label}
                      <br />
                      <small>{timeOf(st) ? timeOf(st) + " WIB" : ""}</small>
                    </div>
                  </li>
                );
              })}
            </ol>
            {rk === 0 && <small className="muted" style={{ display: "block", marginTop: 12 }}>Menunggu konfirmasi penerimaan dari mitra restoran.</small>}
          </div>

          <div className="card sum">
            <h2>Rincian Pembayaran</h2>
            <div style={{ margin: "10px 0" }}>
              {items.map((i) => (
                <div key={i.id}>
                  <span>{i.qty}× {i.name}</span>
                  <span>{rp(i.price * i.qty)}</span>
                </div>
              ))}
              <div><span>Ongkos kirim kurir</span><span>{rp(o.shipping)}</span></div>
              <div><span>Biaya layanan E-put</span><span>{rp(o.service_fee)}</span></div>
              {o.discount > 0 && <div><span>Potongan voucher</span><span style={{ color: "var(--green)" }}>−{rp(o.discount)}</span></div>}
              <div className="tot"><span>Total Pembayaran</span><span style={{ color: "var(--dark)" }}>{rp(o.total)}</span></div>
            </div>
            <span className="badge g" style={{ alignSelf: "flex-start", marginTop: 8 }}>
              ✓ Terbayar • {o.payment || "QRIS"}
            </span>
          </div>
        </div>

        {o.note && (
          <div className="card or">
            <b>Catatan Pelanggan:</b> {o.note}
          </div>
        )}

        {/* Tombol Aksi Resto */}
        {s.role === "resto" && o.status === "pending" && (
          <div className="card">
            <h2>Konfirmasi Pesanan Masuk</h2>
            <p className="muted">Periksa kesiapan dapur dan terima pesanan untuk mulai memasak.</p>
            <RejectBox orderId={o.id} />
          </div>
        )}
        {s.role === "resto" && o.status === "preparing" && (
          <div className="card">
            <h2>Makanan sudah siap diambil kurir?</h2>
            <p className="muted">Klik tombol di bawah jika masakan sudah selesai dikemas dan siap diantar.</p>
            <div className="mt">
              {act("ready", "Tandai Siap Diambil Kurir")}
            </div>
          </div>
        )}

        {/* Tombol Aksi Kurir */}
        {s.role === "kurir" && (
          <div className="card">
            <h2>Perbarui Status Pengantaran</h2>
            <p className="muted">Ongkos kirim untukmu: <b>{rp(o.shipping)}</b></p>
            {o.status === "preparing" && (
              <div className="note">
                Dapur mitra restoran sedang menyiapkan hidangan. Tombol ambil akan aktif setelah ditandai siap.
              </div>
            )}
            <div className="mt">
              {o.status === "ready" && act("pickup", "🛵 Ambil Pesanan dari Restoran & Mulai Antar")}
              {o.status === "delivering" && act("arrive", "📍 Tandai Tiba di Alamat Tujuan")}
              {o.status === "arrived" && act("done", "✓ Selesaikan & Serahkan Pesanan ke Pelanggan")}
              {o.status === "done" && <span className="badge g">Pengantaran Selesai Sempurna</span>}
            </div>
          </div>
        )}

        {/* User Rating & Komplain */}
        {s.role === "user" && o.status === "done" && (
          rating ? (
            <div className="card">
              <h2>Terima Kasih atas Ulasanmu</h2>
              <p>Rasa Makanan: {"★".repeat(rating.food)} • Layanan Kurir: {"★".repeat(rating.courier)}</p>
              {rating.comment && <p className="muted">“{rating.comment}”</p>}
            </div>
          ) : (
            <RatingForm orderId={o.id} />
          )
        )}
        
        {s.role === "user" && o.status === "done" && (
          complaint ? (
            <div className="card or">
              <b>Komplain: {complaint.title}</b>
              <p className="muted">
                Status: {complaint.status === "open" ? "Sedang ditinjau oleh Admin E-put Food" : complaint.status === "refunded" ? "Refund disetujui admin" : "Klaim ditolak"}
              </p>
            </div>
          ) : (
            <ComplaintForm orderId={o.id} />
          )
        )}
      </div>
    </div>
  );
}
