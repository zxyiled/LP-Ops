import { useState } from "react";

const makeId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const defaultExample = () => {
  const agents = ["A", "B", "C", "D"];
  const tasks = ["T1", "T2", "T3", "T4"];
  const costData = {
    A: [9, 2, 7, 8],
    B: [6, 4, 3, 7],
    C: [5, 8, 1, 8],
    D: [7, 6, 9, 4],
  };
  return { agents, tasks, costData, sense: "minimize" };
};

export default function AssignmentForm({ onSolve, isLoading, error }) {
  const [agents, setAgents] = useState(["A", "B", "C", "D"]);
  const [tasks, setTasks] = useState(["T1", "T2", "T3", "T4"]);
  const [costData, setCostData] = useState({
    A: [9, 2, 7, 8],
    B: [6, 4, 3, 7],
    C: [5, 8, 1, 8],
    D: [7, 6, 9, 4],
  });
  const [sense, setSense] = useState("minimize");

  const loadExample = () => {
    const ex = defaultExample();
    setAgents(ex.agents);
    setTasks(ex.tasks);
    setCostData(ex.costData);
    setSense(ex.sense);
  };

  const updateCost = (agentIdx, taskIdx, value) => {
    setCostData((prev) => {
      const next = { ...prev };
      next[agents[agentIdx]] = [...next[agents[agentIdx]]];
      next[agents[agentIdx]][taskIdx] = value;
      return next;
    });
  };

  const addAgent = () => {
    const name = String.fromCharCode(65 + agents.length);
    setAgents((prev) => [...prev, name]);
    setCostData((prev) => ({
      ...prev,
      [name]: tasks.map(() => 0),
    }));
  };

  const removeAgent = (idx) => {
    if (agents.length <= 1) return;
    const name = agents[idx];
    setAgents((prev) => prev.filter((_, i) => i !== idx));
    setCostData((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const addTask = () => {
    const name = `T${tasks.length + 1}`;
    setTasks((prev) => [...prev, name]);
    setCostData((prev) => {
      const next = { ...prev };
      agents.forEach((a) => {
        next[a] = [...(next[a] || []), 0];
      });
      return next;
    });
  };

  const removeTask = (idx) => {
    if (tasks.length <= 1) return;
    setTasks((prev) => prev.filter((_, i) => i !== idx));
    setCostData((prev) => {
      const next = { ...prev };
      agents.forEach((a) => {
        next[a] = next[a].filter((_, i) => i !== idx);
      });
      return next;
    });
  };

  const hasSquare = agents.length === tasks.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasSquare) return;

    const costs = {};
    agents.forEach((a) =>
      tasks.forEach((t, ti) => {
        costs[`${a}_${t}`] = toNumber(costData[a][ti]);
      })
    );

    onSolve({
      modelType: "assignment",
      payload: {
        agents,
        tasks,
        costs,
        sense,
      },
    });
  };

  return (
    <form className="problem-form" onSubmit={handleSubmit}>
      <div className="form-card">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Asignación</p>
            <h2>Agentes y tareas</h2>
          </div>
          <button className="ghost-button" type="button" onClick={loadExample}>
            Cargar ejemplo
          </button>
        </div>

        <label className="inline-label">
          Sentido
          <select value={sense} onChange={(e) => setSense(e.target.value)}>
            <option value="minimize">Minimizar costos</option>
            <option value="maximize">Maximizar beneficios</option>
          </select>
        </label>

        <div className="assignment-toolbar">
          <button className="primary-button small" type="button" onClick={addAgent}>
            + Agente
          </button>
          <button className="primary-button small" type="button" onClick={addTask}>
            + Tarea
          </button>
        </div>

        {!hasSquare && (
          <p className="form-warning">
            El número de agentes ({agents.length}) debe coincidir con el de
            tareas ({tasks.length}).
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
                  <th key={ti}>
                    {t}
                    <button
                      className="icon-button mini"
                      type="button"
                      onClick={() => removeTask(ti)}
                    >
                      ×
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((a, ai) => (
                <tr key={a}>
                  <td>
                    {a}
                    <button
                      className="icon-button mini"
                      type="button"
                      onClick={() => removeAgent(ai)}
                    >
                      ×
                    </button>
                  </td>
                  {tasks.map((t, ti) => (
                    <td key={ti}>
                      <input
                        type="number"
                        step="any"
                        value={costData[a]?.[ti] ?? 0}
                        onChange={(e) => updateCost(ai, ti, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <button
        className="solve-button"
        type="submit"
        disabled={isLoading || !hasSquare}
      >
        {isLoading ? "Resolviendo..." : "Resolver asignación"}
      </button>
    </form>
  );
}
