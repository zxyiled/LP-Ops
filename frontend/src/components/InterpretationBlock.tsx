interface InterpretationBlockProps {
  interpretation: string;
  objectiveValue: number | null;
  statusLabel: string;
  status: string;
}

export function InterpretationBlock({
  interpretation,
  objectiveValue,
  statusLabel,
  status,
}: InterpretationBlockProps) {
  const isOptimal = status === 'optimal';

  return (
    <div className="data-section">
      <h3 className="data-section-title">Resultados</h3>
      <div className="results-grid">
        <div className="result-stat">
          <span className="result-stat-label">Estado</span>
          <span className={`result-stat-value result-stat-value--${status}`}>
            {statusLabel}
          </span>
        </div>
        {objectiveValue !== null && (
          <div className="result-stat">
            <span className="result-stat-label">Valor Objetivo</span>
            <span className="result-stat-value result-stat-value--num">
              {objectiveValue.toFixed(2)}
            </span>
          </div>
        )}
        <div className="result-stat">
          <span className="result-stat-label">Óptima</span>
          <span className={`result-stat-value ${isOptimal ? 'result-stat-value--yes' : 'result-stat-value--no'}`}>
            {isOptimal ? 'Sí' : 'No'}
          </span>
        </div>
      </div>
      <p className="interpretation-text">{interpretation}</p>
    </div>
  );
}
