interface ConstraintTableProps {
  constraints: Record<string, unknown>[];
}

function fmt(val: unknown, fallback = '—'): string {
  if (typeof val !== 'number') return fallback;
  if (!isFinite(val)) return fallback;
  return val.toFixed(2);
}

export function ConstraintTable({ constraints }: ConstraintTableProps) {
  if (!constraints?.length) return null;

  return (
    <div className="data-section">
      <h3 className="data-section-title">Restricciones</h3>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Op.</th>
              <th>RHS</th>
              <th>Actividad</th>
              <th>Holgura</th>
              <th>Binding</th>
              <th>P. Sombra</th>
            </tr>
          </thead>
          <tbody>
            {constraints.map((c, i) => (
              <tr key={i}>
                <td>{String(c.name ?? '')}</td>
                <td>{String(c.operator ?? '')}</td>
                <td>{fmt(c.rhs)}</td>
                <td>{fmt(c.activity)}</td>
                <td>{fmt(c.slack)}</td>
                <td>
                  <span className={`badge ${c.is_binding ? 'badge--warn' : 'badge--muted'}`}>
                    {c.is_binding ? 'Sí' : 'No'}
                  </span>
                </td>
                <td>
                  {fmt(c.shadow_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
