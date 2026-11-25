"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AutoRefresh({ ms = 6000 }: { ms?: number }) {
  const r = useRouter();
  useEffect(() => { const t = setInterval(() => r.refresh(), ms); return () => clearInterval(t); }, [r, ms]);
  return null;
}
