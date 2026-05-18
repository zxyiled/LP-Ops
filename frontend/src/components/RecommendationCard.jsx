const severityLabels = {
  success: "Excelente",
  warning: "Atención",
  info: "Análisis",
};

export default function RecommendationCard({ recommendation }) {
  return (
    <article className={`recommendation-card ${recommendation.severity}`}>
      <span>{severityLabels[recommendation.severity]}</span>
      <h3>{recommendation.title}</h3>
      <p>{recommendation.description}</p>
    </article>
  );
}
