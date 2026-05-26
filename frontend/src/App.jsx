import { useEffect, useMemo, useRef, useState } from "react";
import ModelSelector from "./components/ModelSelector.jsx";
import ProblemForm from "./components/ProblemForm.jsx";
import AssignmentForm from "./components/AssignmentForm.jsx";
import TransportForm from "./components/TransportForm.jsx";
import ResultDashboard from "./components/ResultDashboard.jsx";
import { pollAiAnalysis, solveLinearProblem } from "./services/api.ts";

export default function App() {
  const [modelType, setModelType] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const pollRef = useRef(null);

  const handleSolve = async (payload) => {
    setIsLoading(true);
    setError("");
    setResult(null);
    setAiLoading(false);
    try {
      const response = await solveLinearProblem(payload);
      setResult(response);
      if (response.solve_id) {
        setAiLoading(true);
      }
    } catch (currentError) {
      setError(
        currentError.message || "Ocurrió un error al resolver el modelo.",
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!result?.solve_id) return;

    pollRef.current = setInterval(async () => {
      try {
        const data = await pollAiAnalysis(result.solve_id);
        if (data.status === "done") {
          setResult((prev) => ({
            ...prev,
            ai_analysis: data.insights,
          }));
          setAiLoading(false);
          clearInterval(pollRef.current);
        }
      } catch {
        setAiLoading(false);
        clearInterval(pollRef.current);
      }
    }, 1500);

    return () => clearInterval(pollRef.current);
  }, [result?.solve_id]);

  const handleBack = () => {
    setModelType(null);
    setResult(null);
    setError("");
  };

  const modelStats = useMemo(() => {
    if (!result) return [];
    return [
      { label: "Variables", value: result.variables?.length || 0 },
      { label: "Restricciones", value: result.constraints?.length || 0 },
      { label: "Solver", value: "PuLP + CBC" },
    ];
  }, [result]);

  if (!modelType) {
    return (
      <main className="app-shell">
        <ModelSelector onSelect={setModelType} />
      </main>
    );
  }

  const modelLabels = {
    classical: "Programación Lineal Clásica",
    assignment: "Problema de Asignación",
    transport: "Problema de Transporte",
  };

  const FormComponent = {
    classical: ProblemForm,
    assignment: AssignmentForm,
    transport: TransportForm,
  }[modelType];

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Investigación de Operaciones · PIA</p>
          <h1>LP-Ops</h1>
          <p>
            <button className="link-button" onClick={handleBack}>
              ← Cambiar modelo
            </button>
            <span className="hero-model"> {modelLabels[modelType]}</span>
          </p>
        </div>
        {modelStats.length > 0 && (
          <div className="hero-panel">
            {modelStats.map((stat) => (
              <article key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="workspace">
        <aside className="builder-panel">
          <FormComponent
            onSolve={handleSolve}
            isLoading={isLoading}
            error={error}
          />
        </aside>
        <section className="results-panel">
          <ResultDashboard result={result} aiLoading={aiLoading} />
        </section>
      </section>
    </main>
  );
}
