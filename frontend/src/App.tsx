import { useState, useCallback } from 'react';
import type { ModelType, UnifiedSolveResponse } from './types/api';
import type { ClassicalPayload, AssignmentPayload, TransportPayload } from './types/api';
import { solveProblem } from './api/client';
import { Header } from './components/Header';
import { ModelCards } from './components/ModelCards';
import { ProblemForm } from './components/ProblemForm';
import { ResultsPanel } from './components/ResultsPanel';
import { ResultsSkeleton } from './components/Skeleton';

type Payload = ClassicalPayload | AssignmentPayload | TransportPayload;

type Screen =
  | { type: 'select' }
  | { type: 'form'; modelType: ModelType }
  | { type: 'solving'; modelType: ModelType }
  | { type: 'result'; result: UnifiedSolveResponse };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ type: 'select' });
  const [error, setError] = useState<string | null>(null);

  const handleSelectModel = useCallback((modelType: ModelType) => {
    setScreen({ type: 'form', modelType });
    setError(null);
  }, []);

  const handleSolve = useCallback(
    async (payload: Payload) => {
      if (screen.type !== 'form') return;
      const modelType = screen.modelType;
      setScreen({ type: 'solving', modelType });
      setError(null);
      try {
        const res = await solveProblem({ modelType, payload });
        setScreen({ type: 'result', result: res });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al resolver');
        setScreen({ type: 'form', modelType });
      }
    },
    [screen],
  );

  const handleBack = useCallback(() => {
    setScreen({ type: 'select' });
    setError(null);
  }, []);

  const handleReset = useCallback(() => {
    setScreen({ type: 'select' });
    setError(null);
  }, []);

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="container">
          {screen.type === 'select' && (
            <ModelCards onSelect={handleSelectModel} />
          )}

          {screen.type === 'form' && (
            <section className="solve-section">
              {error && (
                <div className="error-banner">
                  <span className="error-icon">⚠</span>
                  <span>{error}</span>
                </div>
              )}
              <ProblemForm
                modelType={screen.modelType}
                onSolve={handleSolve}
                onBack={handleBack}
                disabled={false}
              />
            </section>
          )}

          {screen.type === 'solving' && (
            <section className="solve-section">
              <div className="form-top-bar">
                <button type="button" className="form-back-btn" onClick={handleBack}>
                  ← Volver
                </button>
              </div>
              <ResultsSkeleton />
            </section>
          )}

          {screen.type === 'result' && (
            <ResultsPanel result={screen.result} onReset={handleReset} />
          )}
        </div>
      </main>
    </div>
  );
}
