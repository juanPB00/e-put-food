import { notFound } from "next/navigation";
import OrderView from "@/components/OrderView";
import Shell from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { orderFor } from "@/lib/orders";

export default async function Detail({ params }: { params: { id: string } }) {
  const s = await requireRole("kurir");
  const o = await orderFor(s, params.id);
  if (!o) notFound();
  return (<Shell s={s} at="/kurir/aktif"><OrderView o={o} s={s} /></Shell>);
}
