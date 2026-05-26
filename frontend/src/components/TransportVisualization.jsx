const COLORS = [
  "#2563eb", "#14b8a6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

export default function TransportVisualization({ data }) {
  if (!data || !data.routes || data.routes.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay rutas para visualizar.</p>
      </div>
    );
  }

  const { origins, destinations, supply, demand, routes, total_cost } = data;

  const originLabels = origins.map((o) => `${o}\n(${supply[o]})`);
  const destLabels = destinations.map((d) => `${d}\n(${demand[d]})`);

  const maxFlow = Math.max(...routes.map((r) => r.value), 1);
  const activeRoutes = routes.filter((r) => r.value > 1e-6);

  return (
    <article className="visualization-card">
      <div className="section-heading">
        <h2>Diagrama de flujo de transporte</h2>
        <p>
          {activeRoutes.length} rutas activas · Costo total: {total_cost?.toFixed(2) ?? "—"}
        </p>
      </div>
      <div className="transport-diagram">
        <svg viewBox="0 0 800 500" className="transport-svg">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
          </defs>

          {/* Origins column */}
          {originLabels.map((label, i) => {
            const y = 60 + i * (380 / Math.max(origins.length - 1, 1));
            return (
              <g key={`origin-${i}`}>
                <rect x="20" y={y - 18} width="140" height="36" rx="18" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
                <text x="90" y={y + 1} textAnchor="middle" fontSize="11" fill="#1e40af" fontWeight="700">
                  {origins[i]}
                </text>
                <text x="90" y={y + 14} textAnchor="middle" fontSize="9" fill="#64748b">
                  Oferta: {supply[origins[i]]}
                </text>
              </g>
            );
          })}

          {/* Destinations column */}
          {destLabels.map((label, i) => {
            const y = 60 + i * (380 / Math.max(destinations.length - 1, 1));
            return (
              <g key={`dest-${i}`}>
                <rect x="640" y={y - 18} width="140" height="36" rx="18" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                <text x="710" y={y + 1} textAnchor="middle" fontSize="11" fill="#166534" fontWeight="700">
                  {destinations[i]}
                </text>
                <text x="710" y={y + 14} textAnchor="middle" fontSize="9" fill="#64748b">
                  Demanda: {demand[destinations[i]]}
                </text>
              </g>
            );
          })}

          {/* Routes */}
          {activeRoutes.map((route, i) => {
            const oi = origins.indexOf(route.origin);
            const di = destinations.indexOf(route.destination);
            const y1 = 60 + oi * (380 / Math.max(origins.length - 1, 1));
            const y2 = 60 + di * (380 / Math.max(destinations.length - 1, 1));
            const thickness = Math.max(2, (route.value / maxFlow) * 12);
            const color = COLORS[i % COLORS.length];
            const midY = (y1 + y2) / 2;

            return (
              <g key={`route-${i}`}>
                <line
                  x1="160" y1={y1} x2="640" y2={y2}
                  stroke={color} strokeWidth={thickness} opacity="0.5"
                  markerEnd="url(#arrowhead)"
                />
                <rect
                  x={390 - 40} y={midY - 10} width="80" height="20" rx="10"
                  fill="white" stroke={color} strokeWidth="1"
                />
                <text
                  x="390" y={midY + 4} textAnchor="middle" fontSize="10"
                  fill={color} fontWeight="700"
                >
                  {route.value.toFixed(1)}u
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </article>
  );
}
