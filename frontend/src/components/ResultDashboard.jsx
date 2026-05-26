import RecommendationCard from "./RecommendationCard.jsx";
import TransportVisualization from "./TransportVisualization.jsx";
import AIInsights from "./AIInsights.jsx";

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "—";
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  }).format(value);
};

function ClassicalResults({ result }) {
  return (
    <>
      {result.variables.length > 0 && (
        <article className="table-card">
          <div className="section-heading">
            <h2>Valores de variables</h2>
            <p>Resumen de la decisión óptima y su aportación a Z.</p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Valor</th>
                  <th>Coef. objetivo</th>
                  <th>Contribución</th>
                </tr>
              </thead>
              <tbody>
                {result.variables.map((v) => (
                  <tr key={v.name}>
                    <td>{v.name}</td>
                    <td>{formatNumber(v.value)}</td>
                    <td>{formatNumber(v.objective_coefficient)}</td>
                    <td>{formatNumber(v.contribution)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {result.constraints.length > 0 && (
        <article className="table-card">
          <div className="section-heading">
            <h2>Análisis de restricciones</h2>
            <p>Actividad, holgura y restricciones críticas del modelo.</p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Restricción</th>
                  <th>Actividad</th>
                  <th>Operador</th>
                  <th>Límite</th>
                  <th>Holgura</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {result.constraints.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{formatNumber(c.activity)}</td>
                    <td>{c.operator}</td>
                    <td>{formatNumber(c.rhs)}</td>
                    <td>{formatNumber(c.slack)}</td>
                    <td>
                      <span className={c.is_binding ? "badge warning" : "badge success"}>
                        {c.is_binding ? "Crítica" : "Con holgura"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </>
  );
}

function AssignmentResults({ result }) {
  const assignments = result.results?.assignments || [];
  return (
    <>
      {assignments.length > 0 && (
        <article className="table-card">
          <div className="section-heading">
            <h2>Asignaciones óptimas</h2>
            <p>Cada agente asignado a una tarea distinta.</p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Agente</th>
                  <th>Tarea</th>
                  <th>Costo</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => (
                  <tr key={i}>
                    <td>{a.agent}</td>
                    <td>{a.task}</td>
                    <td>{formatNumber(a.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* Assignment matrix */}
      <article className="table-card">
        <div className="section-heading">
          <h2>Matriz de asignación</h2>
          <p>1 = asignado, 0 = no asignado.</p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Agente \ Tarea</th>
                {result.results?.tasks?.map((t, i) => <th key={i}>{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.results?.agents?.map((a) => (
                <tr key={a}>
                  <td>{a}</td>
                  {result.results?.tasks?.map((t) => {
                    const v = result.variables.find(
                      (v) => v.agent === a && v.task === t
                    );
                    return (
                      <td key={t}>
                        <span className={v?.value > 0.5 ? "badge success" : "badge"}>
                          {v?.value > 0.5 ? "1" : "0"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}

function TransportResults({ result }) {
  const routes = result.results?.routes || [];
  return (
    <>
      {routes.length > 0 && (
        <article className="table-card">
          <div className="section-heading">
            <h2>Plan óptimo de envío</h2>
            <p>Rutas activas con cantidades a transportar.</p>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Unidades</th>
                  <th>Costo unitario</th>
                  <th>Costo total</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r, i) => (
                  <tr key={i}>
                    <td>{r.origin}</td>
                    <td>{r.destination}</td>
                    <td>{formatNumber(r.value)}</td>
                    <td>{formatNumber(r.cost)}</td>
                    <td>{formatNumber(r.value * r.cost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}><strong>Costo total</strong></td>
                  <td><strong>{formatNumber(result.objective_value)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </article>
      )}

      <TransportVisualization data={result.visualization} />
    </>
  );
}

export default function ResultDashboard({ result, aiLoading }) {
  if (!result) {
    return (
      <section className="empty-state">
        <div className="empty-state-icon">Σ</div>
        <h2>Construye tu modelo</h2>
        <p>
          Agrega variables, define la función objetivo y captura restricciones
          para obtener el resultado óptimo.
        </p>
      </section>
    );
  }

  const bindingCount = result.constraints
    ? result.constraints.filter((c) => c.is_binding).length
    : 0;

  return (
    <section className="dashboard">
      <div className="dashboard-grid">
        <article className="metric-card highlight">
          <span>Valor óptimo</span>
          <strong>{formatNumber(result.objective_value)}</strong>
          <small>Función objetivo</small>
        </article>
        <article className="metric-card">
          <span>Estado</span>
          <strong>{result.status_label}</strong>
          <small>
            {result.is_optimal
              ? "Solución validada por CBC/PuLP"
              : "Revisar formulación"}
          </small>
        </article>
        <article className="metric-card">
          <span>Variables</span>
          <strong>{result.variables?.length || 0}</strong>
          <small>Decisiones del modelo</small>
        </article>
        <article className="metric-card">
          <span>Restricciones activas</span>
          <strong>{bindingCount}</strong>
          <small>Límites críticos</small>
        </article>
      </div>

      <article className="interpretation-card">
        <h2>Interpretación</h2>
        <p>{result.interpretation}</p>
      </article>

      {result.modelType === "classical" && <ClassicalResults result={result} />}
      {result.modelType === "assignment" && <AssignmentResults result={result} />}
      {result.modelType === "transport" && <TransportResults result={result} />}

      {result.recommendations?.length > 0 && (
        <article className="recommendations-section">
          <div className="section-heading">
            <h2>Recomendaciones inteligentes</h2>
            <p>Tarjetas de análisis generadas desde la solución obtenida.</p>
          </div>
          <div className="recommendation-strip">
            {result.recommendations.map((r, i) => (
              <RecommendationCard
                key={`${r.title}-${i}`}
                recommendation={r}
              />
            ))}
          </div>
        </article>
      )}

      {aiLoading && !result.ai_analysis && (
        <article className="ai-insights-section">
          <div className="section-heading">
            <p className="eyebrow">IA · Análisis inteligente</p>
            <h2>Insights y recomendaciones</h2>
          </div>
          <div className="ai-insights-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="insight-card skeleton">
                <div className="skeleton-badge" />
                <div className="skeleton-title" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))}
          </div>
          <p className="ai-loading-text">
            Generando análisis inteligente con IA…
          </p>
        </article>
      )}
      {result.ai_analysis && <AIInsights analysis={result.ai_analysis} />}
    </section>
  );
}
