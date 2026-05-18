import { useMemo, useState } from "react";
import ProblemForm from "./components/ProblemForm.jsx";
import ResultDashboard from "./components/ResultDashboard.jsx";
import { solveLinearProblem } from "./services/api.ts";

const initialProblem = {
  title: "Modelo de programación lineal",
  context: "",
  variables: [
    { name: "x1", lower_bound: 0, upper_bound: "", category: "continuous" },
    { name: "x2", lower_bound: 0, upper_bound: "", category: "continuous" },
  ],
  objective: {
    sense: "maximize",
    coefficients: { x1: 0, x2: 0 },
  },
  constraints: [
    { name: "R1", coefficients: { x1: 0, x2: 0 }, operator: "<=", rhs: 0 },
  ],
};

export default function App() {
  const [problem, setProblem] = useState(initialProblem);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const modelStats = useMemo(
    () => [
      { label: "Variables dinámicas", value: problem.variables.length },
      { label: "Restricciones", value: problem.constraints.length },
      { label: "Solver", value: "PuLP + CBC" },
    ],
    [problem.variables.length, problem.constraints.length],
  );

  const handleSolve = async (payload) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await solveLinearProblem(payload);
      setResult(response);
    } catch (currentError) {
      setError(
        currentError.message || "Ocurrió un error al resolver el modelo.",
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Investigación de Operaciones · PIA</p>
          <h1>LP-Ops</h1>
          <p>
            Solver web para programación lineal con variables y restricciones
            dinámicas, dashboard de resultados e interpretación inteligente.
          </p>
        </div>
        <div className="hero-panel">
          {modelStats.map((stat) => (
            <article key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace">
        <aside className="builder-panel">
          <ProblemForm
            problem={problem}
            setProblem={setProblem}
            onSolve={handleSolve}
            isLoading={isLoading}
            error={error}
          />
        </aside>
        <section className="results-panel">
          <ResultDashboard result={result} />
        </section>
      </section>
    </main>
  );
}
