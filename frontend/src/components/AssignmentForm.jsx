import { useState, useMemo, useCallback } from "react";

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const defaultExample = () => ({
  agents: ["A", "B", "C", "D"],
  tasks: ["T1", "T2", "T3", "T4"],
  costData: { A: [9, 2, 7, 8], B: [6, 4, 3, 7], C: [5, 8, 1, 8], D: [7, 6, 9, 4] },
  sense: "minimize",
  context: "Una empresa debe asignar 4 trabajadores (A, B, C, D) a 4 tareas distintas (T1, T2, T3, T4). Cada trabajador debe realizar exactamente una tarea y cada tarea debe ser asignada a exactamente un trabajador. El objetivo es minimizar el costo total de asignación.",
});

export default function AssignmentForm({ onSolve, isLoading, error }) {
  const [agents, setAgents] = useState(["A", "B", "C", "D"]);
  const [tasks, setTasks] = useState(["T1", "T2", "T3", "T4"]);
  const [costData, setCostData] = useState({ A: [9, 2, 7, 8], B: [6, 4, 3, 7], C: [5, 8, 1, 8], D: [7, 6, 9, 4] });
  const [sense, setSense] = useState("minimize");
  const [context, setContext] = useState(defaultExample().context);

  const loadExample = useCallback(() => {
    const ex = defaultExample();
    setAgents(ex.agents);
    setTasks(ex.tasks);
    setCostData(ex.costData);
    setSense(ex.sense);
    setContext(ex.context);
  }, []);

  const updateCost = useCallback((ai, ti, value) => {
    setCostData((prev) => {
      const next = { ...prev, [agents[ai]]: [...prev[agents[ai]]] };
      next[agents[ai]][ti] = value;
      return next;
    });
  }, [agents]);

  const addAgent = useCallback(() => {
    const name = String.fromCharCode(65 + agents.length);
    setAgents((p) => [...p, name]);
    setCostData((p) => ({ ...p, [name]: tasks.map(() => 0) }));
  }, [agents, tasks]);

  const removeAgent = useCallback((idx) => {
    if (agents.length <= 1) return;
    const name = agents[idx];
    setAgents((p) => p.filter((_, i) => i !== idx));
    setCostData((p) => { const n = { ...p }; delete n[name]; return n; });
  }, [agents]);

  const addTask = useCallback(() => {
    const name = `T${tasks.length + 1}`;
    setTasks((p) => [...p, name]);
    setCostData((p) => {
      const n = { ...p };
      agents.forEach((a) => { n[a] = [...(n[a] || []), 0]; });
      return n;
    });
  }, [agents, tasks]);

  const removeTask = useCallback((idx) => {
    if (tasks.length <= 1) return;
    setTasks((p) => p.filter((_, i) => i !== idx));
    setCostData((p) => {
      const n = { ...p };
      agents.forEach((a) => { n[a] = n[a].filter((_, i) => i !== idx); });
      return n;
    });
  }, [agents, tasks]);

  const hasSquare = agents.length === tasks.length;

  const constraintsText = useMemo(() => {
    if (!hasSquare) return [];
    const lines = [];
    agents.forEach((a) => {
      const terms = tasks.map((t) => `${a}_${t}`).join(" + ");
      lines.push({ text: `${terms} = 1`, label: `${a} — una tarea` });
    });
    tasks.forEach((t) => {
      const terms = agents.map((a) => `${a}_${t}`).join(" + ");
      lines.push({ text: `${terms} = 1`, label: `${t} — un trabajador` });
    });
    return lines;
  }, [agents, tasks, hasSquare]);

  const constraintLines = useMemo(() => {
    if (!hasSquare) return [];
    return constraintsText.map((c) => c.text);
  }, [constraintsText, hasSquare]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!hasSquare) return;

    const costs = {};
    agents.forEach((a) => tasks.forEach((t, ti) => { costs[`${a}_${t}`] = toNumber(costData[a][ti]); }));

    onSolve({
      modelType: "assignment",
      payload: {
        agents,
        tasks,
        costs,
        sense,
        context: context.trim() || undefined,
        constraints: constraintLines,
      },
    });
  }, [agents, tasks, costData, sense, context, hasSquare, constraintLines, onSolve]);

  return (
    <form className="problem-form" onSubmit={handleSubmit}>
      <div className="form-card">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Asignación</p>
            <h2>Agentes y tareas</h2>
          </div>
          <button className="ghost-button" type="button" onClick={loadExample}>Cargar ejemplo</button>
        </div>
        <label>
          Contexto breve
          <textarea value={context} onChange={(e) => setContext(e.target.value)}
            placeholder="Describe el problema de asignación, agentes, tareas y objetivo."
            rows={2} />
        </label>
        <label className="inline-label">
          Sentido
          <select value={sense} onChange={(e) => setSense(e.target.value)}>
            <option value="minimize">Minimizar costos</option>
            <option value="maximize">Maximizar beneficios</option>
          </select>
        </label>
        <div className="assignment-toolbar">
          <button className="primary-button small" type="button" onClick={addAgent}>+ Agente</button>
          <button className="primary-button small" type="button" onClick={addTask}>+ Tarea</button>
        </div>
        {!hasSquare && (
          <p className="form-warning">
            El número de agentes ({agents.length}) debe coincidir con el de tareas ({tasks.length}).
          </p>
        )}
      </div>

      <div className="form-card wide-card">
        <div className="section-heading">
          <p className="eyebrow">Matriz de costos</p>
          <h2>Costos por asignación</h2>
        </div>
        <div className="table-wrapper editable">
          <table>
            <thead>
              <tr>
                <th>Agente \ Tarea</th>
                {tasks.map((t, ti) => (
                  <th key={ti}>{t}
                    <button className="icon-button mini" type="button" onClick={() => removeTask(ti)}>×</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((a, ai) => (
                <tr key={a}>
                  <td>{a}
                    <button className="icon-button mini" type="button" onClick={() => removeAgent(ai)}>×</button>
                  </td>
                  {tasks.map((t, ti) => (
                    <td key={ti}>
                      <input type="number" step="any" value={costData[a]?.[ti] ?? 0}
                        onChange={(e) => updateCost(ai, ti, e.target.value)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasSquare && (
        <div className="form-card">
          <div className="section-heading">
            <p className="eyebrow">Restricciones del modelo</p>
            <h2>Restricciones generadas automáticamente</h2>
          </div>
          <div className="constraints-list">
            {constraintsText.map((c, i) => (
              <div key={i} className="constraint-line">
                <code>{c.label}:</code>
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      <button className="solve-button" type="submit" disabled={isLoading || !hasSquare}>
        {isLoading ? "Resolviendo..." : "Resolver asignación"}
      </button>
    </form>
  );
}
