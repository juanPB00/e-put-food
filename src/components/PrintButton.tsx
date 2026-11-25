"use client";

export default function PrintButton({ label = "🖨️ Cetak / Unduh PDF" }: { label?: string }) {
  return (
    <button 
      type="button" 
      className="btn ghost sm" 
      onClick={() => window.print()} 
      style={{ padding: "8px 16px" }}
    >
      {label}
    </button>
  );
}
