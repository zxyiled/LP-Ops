import RecommendationCard from "./RecommendationCard.jsx";

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value)))
    return "—";
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  }).format(value);
};

export default function ResultDashboard({ result }) {
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

  return (
    <section className="dashboard">
      <div className="dashboard-grid">
        <article className="metric-card highlight">
          <span>Valor óptimo</span>
          <strong>{formatNumber(result.objective_value)}</strong>
          <small>Función objetivo Z</small>
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
          <strong>{result.variables.length}</strong>
          <small>Decisiones del modelo</small>
        </article>
        <article className="metric-card">
          <span>Restricciones activas</span>
          <strong>
            {
              result.constraints.filter((constraint) => constraint.is_binding)
                .length
            }
          </strong>
          <small>Límites críticos</small>
        </article>
      </div>

      <article className="interpretation-card">
        <h2>Interpretación</h2>
        <p>{result.interpretation}</p>
      </article>

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
                {result.variables.map((variable) => (
                  <tr key={variable.name}>
                    <td>{variable.name}</td>
                    <td>{formatNumber(variable.value)}</td>
                    <td>{formatNumber(variable.objective_coefficient)}</td>
                    <td>{formatNumber(variable.contribution)}</td>
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
                {result.constraints.map((constraint) => (
                  <tr key={constraint.name}>
                    <td>{constraint.name}</td>
                    <td>{formatNumber(constraint.activity)}</td>
                    <td>{constraint.operator}</td>
                    <td>{formatNumber(constraint.rhs)}</td>
                    <td>{formatNumber(constraint.slack)}</td>
                    <td>
                      <span
                        className={
                          constraint.is_binding
                            ? "badge warning"
                            : "badge success"
                        }
                      >
                        {constraint.is_binding ? "Crítica" : "Con holgura"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      <article className="recommendations-section">
        <div className="section-heading">
          <h2>Recomendaciones inteligentes</h2>
          <p>Tarjetas de análisis generadas desde la solución obtenida.</p>
        </div>
        <div className="recommendation-strip">
          {result.recommendations.map((recommendation) => (
            <RecommendationCard
              key={`${recommendation.title}-${recommendation.description}`}
              recommendation={recommendation}
            />
          ))}
        </div>
      </article>
    </section>
  );
}
