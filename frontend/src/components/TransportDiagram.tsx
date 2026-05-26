import type { UnifiedSolveResponse } from '../types/api';

interface TransportDiagramProps {
  result: UnifiedSolveResponse;
}

interface Route {
  origin: string;
  destination: string;
  value: number;
  cost: number;
}

const ORIGIN_COLORS = [
  '#06b6d4',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#3b82f6',
  '#10b981',
];

function bezierPoint(
  t: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * x1 + t * t * x2,
    y: mt * mt * y0 + 2 * mt * t * y1 + t * t * y2,
  };
}

function bezierTangent(
  t: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
): { x: number; y: number } {
  return {
    x: 2 * (1 - t) * (x1 - x0) + 2 * t * (x2 - x1),
    y: 2 * (1 - t) * (y1 - y0) + 2 * t * (y2 - y1),
  };
}

function labelPos(
  t: number,
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  perpOffset: number,
): { x: number; y: number } {
  const pt = bezierPoint(t, x0, y0, x1, y1, x2, y2);
  const tan = bezierTangent(t, x0, y0, x1, y1, x2, y2);
  const len = Math.sqrt(tan.x * tan.x + tan.y * tan.y);
  if (len < 1) return pt;
  return {
    x: pt.x + (-tan.y / len) * perpOffset,
    y: pt.y + (tan.x / len) * perpOffset,
  };
}

export function TransportDiagram({ result }: TransportDiagramProps) {
  const r = result.results as Record<string, unknown> | undefined;
  const visualization = result.visualization as Record<string, unknown> | undefined;

  const origins = ((r?.origins ?? visualization?.origins) as string[]) ?? [];
  const destinations = ((r?.destinations ?? visualization?.destinations) as string[]) ?? [];
  const supply = ((r?.supply ?? visualization?.supply) as Record<string, number>) ?? {};
  const demand = ((r?.demand ?? visualization?.demand) as Record<string, number>) ?? {};
  const routes = ((r?.routes ?? visualization?.routes) as Route[]) ?? [];
  const totalCost = (visualization?.total_cost as number) ?? result.objective_value;

  if (!origins.length || !destinations.length) {
    return (
      <div className="data-section">
        <h3 className="data-section-title">Diagrama de transporte</h3>
        <p className="interpretation-text" style={{ color: 'var(--text-muted)' }}>
          No hay datos suficientes para generar el diagrama.
        </p>
      </div>
    );
  }

  const activeRoutes = routes.filter((r) => r.value > 1e-6);
  const inactiveRoutes = routes.filter((r) => r.value < 1e-6);
  const origTotalSupply = Object.values(supply).reduce((a, b) => a + (b ?? 0), 0);
  const origTotalDemand = Object.values(demand).reduce((a, b) => a + (b ?? 0), 0);

  const originOutgoing = new Map<string, number>();
  for (const r of activeRoutes) {
    originOutgoing.set(r.origin, (originOutgoing.get(r.origin) ?? 0) + r.value);
  }
  const destIncoming = new Map<string, number>();
  for (const r of activeRoutes) {
    destIncoming.set(r.destination, (destIncoming.get(r.destination) ?? 0) + r.value);
  }

  const maxFlow = Math.max(...routes.map((r) => r.value), 1);

  // Build per-origin stagger map so labels from same origin don't overlap
  const originGroups = new Map<string, string[]>();
  for (const r of activeRoutes) {
    const list = originGroups.get(r.origin) ?? [];
    if (!list.includes(r.destination)) list.push(r.destination);
    originGroups.set(r.origin, list);
  }
  for (const [, dests] of originGroups) dests.sort();
  const staggerIdx = new Map<string, Map<string, number>>();
  for (const [origin, dests] of originGroups) {
    const m = new Map<string, number>();
    dests.forEach((d, i) => m.set(d, i));
    staggerIdx.set(origin, m);
  }

  const SVG_WIDTH = 880;
  const legendH = 70;
  const topMargin = 60;
  const nodeArea = Math.max(origins.length, destinations.length);
  const SVG_HEIGHT = Math.max(420, nodeArea * 110 + topMargin + legendH + 120);
  const colGap = 480;

  const leftX = 180;
  const rightX = leftX + colGap;
  const nodeW = 150;
  const nodeH = 48;
  const midX = (leftX + nodeW + rightX) / 2;

  function nodeCenterY(idx: number, total: number): number {
    const available = SVG_HEIGHT - topMargin - legendH;
    const spacing = Math.min(available / (total + 1), 120);
    return topMargin + spacing * (idx + 1) + 60;
  }

  const originY = origins.map((_, i) => nodeCenterY(i, origins.length));
  const destY = destinations.map((_, i) => nodeCenterY(i, destinations.length));

  return (
    <div className="data-section">
      <h3 className="data-section-title">Diagrama de transporte</h3>

      <div className="diagram-stats">
        <span className="diagram-stat">
          Costo total: <strong>{Number(totalCost).toFixed(2)}</strong>
        </span>
        <span className="diagram-stat">
          Rutas activas: <strong>{activeRoutes.length}</strong> / {routes.length}
        </span>
        <span className="diagram-stat">
          Oferta total: <strong>{origTotalSupply.toFixed(0)}</strong>
        </span>
        <span className="diagram-stat">
          Demanda total: <strong>{origTotalDemand.toFixed(0)}</strong>
        </span>
        <span className="diagram-stat">
          Utilización:{' '}
          <strong>
            {origTotalSupply > 0
              ? `${((activeRoutes.reduce((s, r) => s + r.value, 0) / origTotalSupply) * 100).toFixed(0)}%`
              : '—'}
          </strong>
        </span>
      </div>

      <div className="diagram-svg-wrap">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="diagram-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker id="arrow-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(6,182,212,0.8)" />
            </marker>
            <marker id="arrow-inactive" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(100,116,139,0.25)" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="transparent" rx="8" />

          {/* Column headers */}
          <text
            x={leftX + nodeW / 2}
            y={30}
            textAnchor="middle"
            fill="var(--cyan)"
            fontSize="13"
            fontWeight="700"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            ◇ Orígenes
          </text>
          <text
            x={leftX + nodeW / 2}
            y={46}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="10"
          >
            Oferta disponible
          </text>
          <text
            x={rightX + nodeW / 2}
            y={30}
            textAnchor="middle"
            fill="var(--emerald)"
            fontSize="13"
            fontWeight="700"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            ◆ Destinos
          </text>
          <text
            x={rightX + nodeW / 2}
            y={46}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="10"
          >
            Demanda requerida
          </text>

          {/* ================================================ */}
          {/* INACTIVE ROUTES                                  */}
          {/* ================================================ */}
          {inactiveRoutes.map((route, idx) => {
            const oIdx = origins.indexOf(route.origin);
            const dIdx = destinations.indexOf(route.destination);
            if (oIdx === -1 || dIdx === -1) return null;
            const y1 = originY[oIdx];
            const y2 = destY[dIdx];
            const path = `M${leftX + nodeW},${y1} Q${midX},${(y1 + y2) / 2} ${rightX},${y2}`;
            return (
              <g key={`inactive-${idx}`}>
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(148,163,184,0.15)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  markerEnd="url(#arrow-inactive)"
                />
              </g>
            );
          })}

          {/* ================================================ */}
          {/* ACTIVE ROUTES                                    */}
          {/* ================================================ */}
          {activeRoutes.map((route, idx) => {
            const oIdx = origins.indexOf(route.origin);
            const dIdx = destinations.indexOf(route.destination);
            if (oIdx === -1 || dIdx === -1) return null;

            const y1 = originY[oIdx];
            const y2 = destY[dIdx];
            const flow = route.value;
            const strokeW = Math.max(2.5, (flow / maxFlow) * 8 + 2);
            const color = ORIGIN_COLORS[oIdx % ORIGIN_COLORS.length];

            const ctrlY = (y1 + y2) / 2;
            const path = `M${leftX + nodeW},${y1} Q${midX},${ctrlY} ${rightX},${y2}`;

            // Stagger: routes from same origin alternate above/below
            const slot = staggerIdx.get(route.origin)?.get(route.destination) ?? 0;
            const perpDir = slot % 2 === 0 ? 1 : -1;
            const perpMag = 16 + Math.floor(slot / 2) * 12;

            // Flow label at t=0.30, cost label at t=0.70
            const flowP = labelPos(0.30, leftX + nodeW, y1, midX, ctrlY, rightX, y2, perpDir * perpMag);
            const costP = labelPos(0.70, leftX + nodeW, y1, midX, ctrlY, rightX, y2, -perpDir * perpMag);

            return (
              <g key={`active-${idx}`}>
                {/* Route curve */}
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeW}
                  strokeOpacity={0.7}
                  markerEnd="url(#arrow-active)"
                  filter="url(#glow)"
                />
                {/* Flow pill */}
                <rect
                  x={flowP.x - 30}
                  y={flowP.y - 10}
                  width={60}
                  height={20}
                  rx="5"
                  fill="rgba(8,12,20,0.92)"
                  stroke={color}
                  strokeWidth="0.5"
                />
                <text
                  x={flowP.x}
                  y={flowP.y + 5}
                  textAnchor="middle"
                  fill={color}
                  fontSize="12"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  fontWeight="700"
                >
                  {flow.toFixed(0)}
                </text>
                {/* Cost label (above or below pill) */}
                <text
                  x={costP.x}
                  y={costP.y + 4}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                  style={{ fontFamily: 'var(--font-mono)', paintOrder: 'stroke' }}
                  stroke="rgba(8,12,20,0.85)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  ${route.cost.toFixed(0)}/unidad
                </text>
                <text
                  x={costP.x}
                  y={costP.y + 4}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  ${route.cost.toFixed(0)}/unidad
                </text>
              </g>
            );
          })}

          {/* ================================================ */}
          {/* ORIGIN NODES                                     */}
          {/* ================================================ */}
          {origins.map((o, i) => {
            const y = originY[i];
            const sup = Number(supply[o] ?? 0);
            const out = originOutgoing.get(o) ?? 0;
            const pct = sup > 0 ? (out / sup) * 100 : 0;
            return (
              <g key={`origin-${o}`}>
                <rect
                  x={leftX}
                  y={y - nodeH / 2}
                  width={nodeW}
                  height={nodeH}
                  rx="8"
                  fill="var(--bg-surface)"
                  stroke="var(--cyan)"
                  strokeWidth="1.5"
                />
                <text
                  x={leftX + nodeW / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fill="var(--cyan)"
                  fontSize="14"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  fontWeight="700"
                >
                  {o}
                </text>
                <text
                  x={leftX + nodeW / 2}
                  y={y + 14}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Oferta: {sup.toFixed(0)}
                </text>
                {/* Utilization bar */}
                <rect
                  x={leftX}
                  y={y + nodeH / 2 + 8}
                  width={nodeW}
                  height="5"
                  rx="2.5"
                  fill="var(--bg-elevated)"
                />
                <rect
                  x={leftX}
                  y={y + nodeH / 2 + 8}
                  width={nodeW * Math.min(pct / 100, 1)}
                  height="5"
                  rx="2.5"
                  fill="var(--cyan)"
                  opacity={0.7}
                />
                <text
                  x={leftX + nodeW + 8}
                  y={y + nodeH / 2 + 13}
                  fill="var(--text-muted)"
                  fontSize="10"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {pct.toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* ================================================ */}
          {/* DESTINATION NODES                                */}
          {/* ================================================ */}
          {destinations.map((d, i) => {
            const y = destY[i];
            const dem = Number(demand[d] ?? 0);
            const inc = destIncoming.get(d) ?? 0;
            const pct = dem > 0 ? (inc / dem) * 100 : 0;
            return (
              <g key={`dest-${d}`}>
                <rect
                  x={rightX}
                  y={y - nodeH / 2}
                  width={nodeW}
                  height={nodeH}
                  rx="8"
                  fill="var(--bg-surface)"
                  stroke="var(--emerald)"
                  strokeWidth="1.5"
                />
                <text
                  x={rightX + nodeW / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fill="var(--emerald)"
                  fontSize="14"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  fontWeight="700"
                >
                  {d}
                </text>
                <text
                  x={rightX + nodeW / 2}
                  y={y + 14}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Demanda: {dem.toFixed(0)}
                </text>
                {/* Coverage bar */}
                <rect
                  x={rightX}
                  y={y + nodeH / 2 + 8}
                  width={nodeW}
                  height="5"
                  rx="2.5"
                  fill="var(--bg-elevated)"
                />
                <rect
                  x={rightX}
                  y={y + nodeH / 2 + 8}
                  width={nodeW * Math.min(pct / 100, 1)}
                  height="5"
                  rx="2.5"
                  fill="var(--emerald)"
                  opacity={0.7}
                />
                <text
                  x={rightX - 8}
                  y={y + nodeH / 2 + 13}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize="10"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {pct.toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* ================================================ */}
          {/* LEGEND                                           */}
          {/* ================================================ */}
          <g transform={`translate(20, ${SVG_HEIGHT - legendH - 10})`}>
            <rect
              x="0"
              y="0"
              width={SVG_WIDTH - 40}
              height={legendH}
              rx="8"
              fill="var(--bg-surface)"
              stroke="var(--border-subtle)"
              strokeWidth="1"
              opacity="0.95"
            />
            <text x="16" y="20" fill="var(--text-muted)" fontSize="10" fontWeight="700" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Leyenda
            </text>

            {/* Active route */}
            <line x1="16" y1="38" x2="56" y2="38" stroke={ORIGIN_COLORS[0]} strokeWidth="3" strokeOpacity="0.75" />
            <text x="62" y="42" fill="var(--text-secondary)" fontSize="11">Ruta activa — grosor proporcional al volumen</text>

            {/* Inactive route */}
            <line x1="300" y1="38" x2="340" y2="38" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x="346" y="42" fill="var(--text-secondary)" fontSize="11">Ruta sin flujo</text>

            {/* Flow pill */}
            <rect x="16" y="48" width="50" height="16" rx="4" fill="rgba(8,12,20,0.92)" stroke={ORIGIN_COLORS[0]} strokeWidth="0.5" />
            <text x="41" y="59" textAnchor="middle" fill={ORIGIN_COLORS[0]} fontSize="12" style={{ fontFamily: 'var(--font-mono)' }} fontWeight="700">42</text>
            <text x="72" y="59" fill="var(--text-secondary)" fontSize="11">Unidades enviadas (cantidad de flujo)</text>

            {/* Cost label */}
            <text x="300" y="59" fill="var(--text-muted)" fontSize="10" style={{ fontFamily: 'var(--font-mono)' }}>$15/unidad</text>
            <text x="376" y="59" fill="var(--text-secondary)" fontSize="11">Costo por unidad transportada</text>

            {/* Utilization bar */}
            <rect x="560" y="36" width="60" height="5" rx="2.5" fill="var(--bg-elevated)" />
            <rect x="560" y="36" width="36" height="5" rx="2.5" fill="var(--cyan)" opacity="0.7" />
            <text x="626" y="41" fill="var(--text-muted)" fontSize="10" style={{ fontFamily: 'var(--font-mono)' }}>60%</text>
            <text x="650" y="41" fill="var(--text-secondary)" fontSize="11">Utilización de oferta/cobertura de demanda</text>
          </g>
        </svg>
      </div>

      {/* Constraint summary below diagram */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <div className="formulation-block" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
          <span className="formulation-label">Restricciones del modelo</span>
          <div className="formulation-constraints">
            <code className="formulation-expr formulation-expr--con">
              ∑(envíos desde origen) ≤ oferta del origen
            </code>
            <code className="formulation-expr formulation-expr--con">
              ∑(envíos hacia destino) ≥ demanda del destino
            </code>
            <code className="formulation-expr formulation-expr--con">
              Todos los flujos ≥ 0 (no negatividad)
            </code>
          </div>
        </div>
        {result.is_optimal && totalCost != null && (
          <div className="formulation-block" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
            <span className="formulation-label">Resultado</span>
            <div className="formulation-constraints">
              <code className="formulation-expr" style={{ color: 'var(--emerald)' }}>
                Costo mínimo total = {Number(totalCost).toFixed(2)}
              </code>
              <code className="formulation-expr formulation-expr--var">
                {activeRoutes.length} de {routes.length} rutas utilizadas
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
