import Link from "next/link";
import { jam, rp, tgl, STATUS } from "@/lib/util";

export default function OrdersTable({ rows, base, empty }: { rows: any[]; base: string; empty: string }) {
  if (!rows.length) return <div className="empty">{empty}</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Kode Pesanan</th>
            <th>{base === "/pesanan" ? "Mitra Restoran" : "Pelanggan"}</th>
            <th>Total Transaksi</th>
            <th>Waktu Pemesanan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`${base}/${r.id}`} className="b link">
                  #{r.code}
                </Link>
              </td>
              <td><b>{base === "/pesanan" ? r.resto_name : r.user_name}</b></td>
              <td><b style={{ color: "var(--dark)" }}>{rp(r.total)}</b></td>
              <td>
                {tgl(r.created_at)} <small className="muted">({jam(r.created_at)} WIB)</small>
              </td>
              <td>
                <span className={"badge" + (r.status === "rejected" ? " r" : r.status === "done" ? " g" : " or")}>
                  {STATUS[r.status] || r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
