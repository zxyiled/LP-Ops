export default function AIInsights({ analysis }) {
  if (!analysis) return null;

  return (
    <article className="ai-insights-section">
      <div className="section-heading">
        <p className="eyebrow">IA · Análisis inteligente</p>
        <h2>Insights y recomendaciones</h2>
      </div>
      <div className="ai-insights-grid">
        {analysis.insights?.map((insight, i) => (
          <div key={i} className={`insight-card ${insight.severity || "info"}`}>
            <span className="insight-badge">
              {insight.severity === "warning" ? "⚠" : insight.severity === "success" ? "✓" : "ℹ"}
            </span>
            <h4>{insight.title}</h4>
            <p>{insight.description}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
