import type { Recommendation } from '../types/api';
import { severityIcon } from '../constants';

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (!recommendations?.length) return null;

  return (
    <div className="data-section">
      <h3 className="data-section-title">Recomendaciones</h3>
      <div className="recs-list">
        {recommendations.map((r, i) => (
          <div key={i} className={`rec-card rec-card--${r.severity}`}>
            <span className="rec-icon">{severityIcon[r.severity] ?? '●'}</span>
            <div>
              <strong className="rec-title">{r.title}</strong>
              <p className="rec-desc">{r.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
