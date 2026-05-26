import type { UnifiedSolveResponse } from '../types/api';
import { InterpretationBlock } from './InterpretationBlock';
import { VariableTable } from './VariableTable';
import { ConstraintTable } from './ConstraintTable';
import { RecommendationsList } from './RecommendationsList';
import { AiInsight } from './AiInsight';
import { ModelFormulation } from './ModelFormulation';
import { TransportDiagram } from './TransportDiagram';

interface ResultsPanelProps {
  result: UnifiedSolveResponse;
  onReset: () => void;
}

export function ResultsPanel({ result, onReset }: ResultsPanelProps) {
  return (
    <div className="results-panel">
      <div className="results-panel-head">
        <h2 className="results-panel-title">Solución</h2>
        <button className="form-btn" onClick={onReset}>
          ← Nuevo problema
        </button>
      </div>

      <ModelFormulation result={result} />

      <InterpretationBlock
        interpretation={result.interpretation}
        objectiveValue={result.objective_value}
        statusLabel={result.status_label}
        status={result.status}
      />

      <VariableTable modelType={result.modelType} variables={result.variables} />

      {result.modelType === 'classical' && (
        <ConstraintTable constraints={result.constraints} />
      )}

      {result.modelType === 'transport' && (
        <TransportDiagram result={result} />
      )}

      <RecommendationsList recommendations={result.recommendations} />

      <AiInsight solveId={result.solve_id} />
    </div>
  );
}
