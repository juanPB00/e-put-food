const P: [number, number][] = [[70, 60], [250, 60], [250, 170], [500, 170]];
function at(progress: number): [number, number] {
  const seg = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1]));
  let d = progress * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) { const t = Math.min(d / seg[i], 1); return [P[i][0] + (P[i + 1][0] - P[i][0]) * t, P[i][1] + (P[i + 1][1] - P[i][1]) * t]; }
    d -= seg[i];
  }
  return P[0];
}

/** Peta ilustrasi (statis) — posisi kurir mengikuti progres status pesanan. */
export default function MapMock({ from, to, progress }: { from: string; to: string; progress: number }) {
  const [x, y] = at(progress);
  const pct = (n: number, max: number) => `${(n / max) * 100}%`;
  return (
    <div className="map">
      <svg viewBox="0 0 570 230" role="img" aria-label="Peta pengantaran">
        {[[10, 10, 100, 70], [130, 10, 100, 70], [270, 10, 130, 70], [420, 10, 140, 70], [10, 110, 100, 100], [130, 110, 100, 100], [270, 110, 130, 100], [420, 110, 140, 40], [420, 190, 140, 24]].map(([a, b, w, h], i) => (<rect key={i} x={a} y={b} width={w} height={h} rx="8" fill="#dbe6dd" />))}
        <polyline points={P.map((p) => p.join(",")).join(" ")} fill="none" stroke="#c4663a" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className="pin" style={{ left: pct(P[0][0], 570), top: pct(P[0][1] - 26, 230) }}>🍴 {from}</span>
      <span className="pin dk" style={{ left: pct(P[3][0] - 10, 570), top: pct(P[3][1] + 24, 230) }}>📍 {to}</span>
      <span className="pin bike" style={{ left: pct(x, 570), top: pct(y, 230) }}>🛵</span>
    </div>
  );
}
