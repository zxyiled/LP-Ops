import { useEffect, useRef } from 'react';
import type { AiInsight as AiInsightType } from '../types/api';
import { usePollAi } from '../hooks/usePollAi';
import { AiSkeleton } from './Skeleton';
import { severityIcon } from '../constants';

interface AiInsightProps {
  solveId: string | null;
}

function InsightCard({ insight }: { insight: AiInsightType }) {
  return (
    <div className={`insight-card insight-card--${insight.severity}`}>
      <div className="insight-card-head">
        <span className="insight-icon">{severityIcon[insight.severity] ?? '●'}</span>
        <span className="insight-title">{insight.title}</span>
        <span className={`insight-badge insight-badge--${insight.severity}`}>
          {insight.severity === 'success'
            ? 'Recomendado'
            : insight.severity === 'warning'
              ? 'Precaución'
              : 'Informativo'}
        </span>
      </div>
      <p className="insight-desc">{insight.description}</p>
    </div>
  );
}

function AiHeader({ count }: { count: number }) {
  return (
    <div className="ai-header">
      <div className="ai-header-left">
        <span className="ai-header-icon">◇</span>
        <h3 className="data-section-title" style={{ margin: 0 }}>
          AI Insights
        </h3>
      </div>
      <span className="ai-header-count">{count} hallazgos</span>
    </div>
  );
}

export function AiInsight({ solveId }: AiInsightProps) {
  const { insights, status, error, start, reset } = usePollAi();
  const prevSolveId = useRef<string | null>(null);

  useEffect(() => {
    if (solveId && solveId !== prevSolveId.current) {
      prevSolveId.current = solveId;
      start(solveId);
    } else if (!solveId) {
      prevSolveId.current = null;
      reset();
    }
  }, [solveId, start, reset]);

  if (!solveId) return null;

  return (
    <div className="ai-section">
      {/* Polling state — show skeleton */}
      {status === 'polling' && (
        <>
          <AiHeader count={0} />
          <div className="ai-polling-banner">
            <span className="ai-pulse-dot" />
            Analizando con IA…
          </div>
          <AiSkeleton />
        </>
      )}

      {/* Error state */}
      {status === 'error' && (
        <>
          <AiHeader count={0} />
          <div className="insight-card insight-card--warning">
            <p className="insight-desc">
              No se pudo completar el análisis automático: {error}
            </p>
          </div>
        </>
      )}

      {/* Done state — insights is an array (may be empty) */}
      {status === 'done' && insights !== null && (
        <>
          <AiHeader count={insights.length} />
          {insights.length === 0 ? (
            <div className="insight-card insight-card--info">
              <p className="insight-desc">
                No se generaron insights adicionales para esta solución.
              </p>
            </div>
          ) : (
            <div className="insight-list">
              {insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Done state — insights is null (fallback analysis returned nothing) */}
      {status === 'done' && insights === null && (
        <>
          <AiHeader count={0} />
          <div className="insight-card insight-card--info">
            <p className="insight-desc">
              El análisis automático no produjo resultados adicionales.
            </p>
          </div>
        </>
      )}

    </div>
  );
}
