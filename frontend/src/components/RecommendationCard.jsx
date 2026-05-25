// --- Severity labels for recommendation cards ---
const severityLabels = {
  success: "Excelente",
  warning: "Atención",
  info: "Análisis",
};

// --- Individual recommendation card with severity badge ---
export default function RecommendationCard({ recommendation }) {
  return (
    <article className={`recommendation-card ${recommendation.severity}`}>
      <span>{severityLabels[recommendation.severity]}</span>
      <h3>{recommendation.title}</h3>
      <p>{recommendation.description}</p>
    </article>
  );
}
