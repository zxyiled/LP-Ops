import { useState, useCallback } from "react";

const makeId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const makeVariable = (index) => ({
  id: makeId("variable"),
  name: `x${index}`,
  lower_bound: 0,
  upper_bound: "",
  category: "continuous",
});

const makeConstraint = (index, variables) => ({
  id: makeId("constraint"),
  name: `R${index}`,
  coefficients: Object.fromEntries(
    variables.map((v) => [v.name, 0])
  ),
  operator: "<=",
  rhs: 0,
});

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createInitialProblem = () => ({
  title: "Modelo de programación lineal",
  context: "",
  variables: [
    { id: makeId("variable"), name: "x1", lower_bound: 0, upper_bound: "", category: "continuous" },
    { id: makeId("variable"), name: "x2", lower_bound: 0, upper_bound: "", category: "continuous" },
  ],
  objective: { sense: "maximize", coefficients: { x1: 0, x2: 0 } },
  constraints: [
    { id: makeId("constraint"), name: "R1", coefficients: { x1: 0, x2: 0 }, operator: "<=", rhs: 0 },
  ],
});

const furnitureExample = () => {
  const names = ["Mesa", "Silla", "Armario", "Estante", "Escritorio", "Cama", "Librero", "Cajonera", "Banco"];
  const coeffs = { Mesa: 45, Silla: 32, Armario: 28, Estante: 51, Escritorio: 37, Cama: 19, Librero: 42, Cajonera: 55, Banco: 30 };
  const variables = names.map((name) => ({ ...makeVariable(0), name }));
  return {
    title: "Optimización de mezcla de producción — 9 productos",
    context: "Una fábrica de muebles produce 9 productos distintos y debe decidir cuántas unidades fabricar de cada uno para maximizar la ganancia total, sujeto a restricciones de mano de obra, materias primas, capacidad de máquina, almacenamiento y demanda del mercado.",
    variables,
    objective: { sense: "maximize", coefficients: { ...coeffs } },
    constraints: [
      { id: makeId("constraint"), name: "Mano de obra", coefficients: { Mesa: 3, Silla: 2, Armario: 4, Estante: 5, Escritorio: 3, Cama: 2, Librero: 4, Cajonera: 6, Banco: 3 }, operator: "<=", rhs: 1000 },
      { id: makeId("constraint"), name: "Materia prima A", coefficients: { Mesa: 2, Silla: 3, Armario: 1, Estante: 4, Escritorio: 2, Cama: 3, Librero: 2, Cajonera: 1, Banco: 4 }, operator: "<=", rhs: 750 },
      { id: makeId("constraint"), name: "Materia prima B", coefficients: { Mesa: 4, Silla: 1, Armario: 3, Estante: 2, Escritorio: 5, Cama: 1, Librero: 3, Cajonera: 2, Banco: 2 }, operator: "<=", rhs: 900 },
      { id: makeId("constraint"), name: "Capacidad máquina", coefficients: { Mesa: 5, Silla: 4, Armario: 2, Estante: 3, Escritorio: 4, Cama: 5, Librero: 1, Cajonera: 3, Banco: 2 }, operator: "<=", rhs: 1200 },
      { id: makeId("constraint"), name: "Almacenamiento", coefficients: { Mesa: 2, Silla: 2, Armario: 3, Estante: 2, Escritorio: 1, Cama: 2, Librero: 3, Cajonera: 2, Banco: 2 }, operator: "<=", rhs: 500 },
      { id: makeId("constraint"), name: "Demanda mínima total", coefficients: { Mesa: 1, Silla: 1, Armario: 1, Estante: 1, Escritorio: 1, Cama: 1, Librero: 1, Cajonera: 1, Banco: 1 }, operator: ">=", rhs: 30 },
      { id: makeId("constraint"), name: "Mix de producción", coefficients: { Mesa: 2, Silla: 1, Armario: 3, Estante: 2, Escritorio: 1, Cama: 2, Librero: 3, Cajonera: 2, Banco: 1 }, operator: "<=", rhs: 400 },
    ],
  };
};

export default function ProblemForm({ onSolve, isLoading, error }) {
  const [problem, setProblem] = useState(createInitialProblem);

  const updateProblem = useCallback((patch) =>
    setProblem((c) => ({ ...c, ...patch })), []);

  const updateObjectiveCoefficient = useCallback((name, value) => {
    setProblem((c) => ({
      ...c,
      objective: { ...c.objective, coefficients: { ...c.objective.coefficients, [name]: value } },
    }));
  }, []);

  const updateVariable = useCallback((index, field, value) => {
    setProblem((c) => {
      const old = c.variables[index];
      const vars = c.variables.map((v, i) => (i === index ? { ...v, [field]: value } : v));
      if (field !== "name") return { ...c, variables: vars };

      const nextName = value.trim() || old.name;
      const oc = { ...c.objective.coefficients };
      oc[nextName] = oc[old.name] ?? 0;
      if (nextName !== old.name) delete oc[old.name];

      const cons = c.constraints.map((con) => {
        const cc = { ...con.coefficients };
        cc[nextName] = cc[old.name] ?? 0;
        if (nextName !== old.name) delete cc[old.name];
        return { ...con, coefficients: cc };
      });

      return { ...c, variables: vars, objective: { ...c.objective, coefficients: oc }, constraints: cons };
    });
  }, []);

  const addVariable = useCallback(() => {
    setProblem((c) => {
      const nv = makeVariable(c.variables.length + 1);
      return {
        ...c,
        variables: [...c.variables, nv],
        objective: { ...c.objective, coefficients: { ...c.objective.coefficients, [nv.name]: 0 } },
        constraints: c.constraints.map((con) => ({
          ...con, coefficients: { ...con.coefficients, [nv.name]: 0 },
        })),
      };
    });
  }, []);

  const removeVariable = useCallback((name) => {
    setProblem((c) => {
      if (c.variables.length <= 1) return c;
      const oc = { ...c.objective.coefficients };
      delete oc[name];
      return {
        ...c,
        variables: c.variables.filter((v) => v.name !== name),
        objective: { ...c.objective, coefficients: oc },
        constraints: c.constraints.map((con) => {
          const cc = { ...con.coefficients };
          delete cc[name];
          return { ...con, coefficients: cc };
        }),
      };
    });
  }, []);

  const addConstraint = useCallback(() => {
    setProblem((c) => ({
      ...c,
      constraints: [...c.constraints, makeConstraint(c.constraints.length + 1, c.variables)],
    }));
  }, []);

  const removeConstraint = useCallback((index) => {
    setProblem((c) => ({
      ...c,
      constraints: c.constraints.filter((_, i) => i !== index),
    }));
  }, []);

  const updateConstraint = useCallback((index, field, value) => {
    setProblem((c) => ({
      ...c,
      constraints: c.constraints.map((con, i) => (i === index ? { ...con, [field]: value } : con)),
    }));
  }, []);

  const updateConstraintCoefficient = useCallback((index, varName, value) => {
    setProblem((c) => ({
      ...c,
      constraints: c.constraints.map((con, i) =>
        i === index ? { ...con, coefficients: { ...con.coefficients, [varName]: value } } : con
      ),
    }));
  }, []);

  const loadExample = useCallback(() => setProblem(furnitureExample()), []);

  const preparePayload = () => ({
    modelType: "classical",
    payload: {
      title: problem.title.trim() || "Modelo de programación lineal",
      context: problem.context?.trim() || undefined,
      variables: problem.variables.map((v) => ({
        name: v.name.trim(),
        lower_bound: v.category === "binary" ? 0 : toNumber(v.lower_bound),
        upper_bound: v.category === "binary" || v.upper_bound === "" ? null : toNumber(v.upper_bound),
        category: v.category,
      })),
      objective: {
        sense: problem.objective.sense,
        coefficients: Object.fromEntries(
          problem.variables.map((v) => [v.name.trim(), toNumber(problem.objective.coefficients[v.name])])
        ),
      },
      constraints: problem.constraints.map((con) => ({
        name: con.name.trim(),
        operator: con.operator,
        rhs: toNumber(con.rhs),
        coefficients: Object.fromEntries(
          problem.variables.map((v) => [v.name.trim(), toNumber(con.coefficients[v.name])])
        ),
      })),
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSolve(preparePayload());
  };

  const varNames = problem.variables.map((v) => v.name.trim()).filter(Boolean);
  const hasDups = new Set(varNames).size !== varNames.length;

  return (
    <form className="problem-form" onSubmit={handleSubmit}>
      <div className="form-card">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Modelo</p>
            <h2>Datos generales</h2>
          </div>
          <button className="ghost-button" type="button" onClick={loadExample}>
            Cargar ejemplo
          </button>
        </div>
        <label>
          Nombre del problema
          <input value={problem.title} onChange={(e) => updateProblem({ title: e.target.value })} placeholder="Ej. Plan óptimo de producción" />
        </label>
        <label>
          Contexto breve
          <textarea value={problem.context} onChange={(e) => updateProblem({ context: e.target.value })} placeholder="Describe recursos, productos, costos o ganancias para enriquecer las recomendaciones." rows={3} />
        </label>
      </div>

      <div className="form-card">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Variables</p>
            <h2>Variables de decisión</h2>
          </div>
          <button className="primary-button small" type="button" onClick={addVariable}>+ Variable</button>
        </div>
        <div className="table-wrapper editable">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Mínimo</th>
                <th>Máximo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {problem.variables.map((v, i) => (
                <tr key={v.id ?? i}>
                  <td><input value={v.name} onChange={(e) => updateVariable(i, "name", e.target.value)} /></td>
                  <td>
                    <select value={v.category} onChange={(e) => updateVariable(i, "category", e.target.value)}>
                      <option value="continuous">Continua</option>
                      <option value="integer">Entera</option>
                      <option value="binary">Binaria</option>
                    </select>
                  </td>
                  <td>
                    <input type="number" step="any" value={v.lower_bound}
                      disabled={v.category === "binary"}
                      onChange={(e) => updateVariable(i, "lower_bound", e.target.value)} />
                  </td>
                  <td>
                    <input type="number" step="any"
                      value={v.category === "binary" ? 1 : v.upper_bound}
                      disabled={v.category === "binary"} placeholder="Sin límite"
                      onChange={(e) => updateVariable(i, "upper_bound", e.target.value)} />
                  </td>
                  <td>
                    <button className="icon-button" type="button"
                      onClick={() => removeVariable(v.name)} disabled={problem.variables.length === 1}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasDups && <p className="form-warning">Los nombres de variables deben ser únicos.</p>}
      </div>

      <div className="form-card">
        <div className="section-heading">
          <p className="eyebrow">Función objetivo</p>
          <h2>Z = coeficientes × variables</h2>
        </div>
        <div className="objective-toolbar">
          <label className="inline-label">
            Sentido
            <select value={problem.objective.sense}
              onChange={(e) => setProblem((c) => ({ ...c, objective: { ...c.objective, sense: e.target.value } }))}>
              <option value="maximize">Maximizar</option>
              <option value="minimize">Minimizar</option>
            </select>
          </label>
        </div>
        <div className="coefficient-grid">
          {problem.variables.map((v) => (
            <label key={v.id ?? v.name}>
              Coef. {v.name}
              <input type="number" step="any" value={problem.objective.coefficients[v.name] ?? 0}
                onChange={(e) => updateObjectiveCoefficient(v.name, e.target.value)} />
            </label>
          ))}
        </div>
      </div>

      <div className="form-card wide-card">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Restricciones</p>
            <h2>Matriz dinámica de coeficientes</h2>
          </div>
          <button className="primary-button small" type="button" onClick={addConstraint}>+ Restricción</button>
        </div>
        <div className="table-wrapper editable constraints-table">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                {problem.variables.map((v) => <th key={v.id ?? v.name}>{v.name || "Variable"}</th>)}
                <th>Operador</th>
                <th>Límite</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {problem.constraints.map((con, ci) => (
                <tr key={con.id ?? ci}>
                  <td><input value={con.name} onChange={(e) => updateConstraint(ci, "name", e.target.value)} /></td>
                  {problem.variables.map((v) => (
                    <td key={v.id ?? v.name}>
                      <input type="number" step="any" value={con.coefficients[v.name] ?? 0}
                        onChange={(e) => updateConstraintCoefficient(ci, v.name, e.target.value)} />
                    </td>
                  ))}
                  <td>
                    <select value={con.operator} onChange={(e) => updateConstraint(ci, "operator", e.target.value)}>
                      <option value="<=">≤</option>
                      <option value=">=">≥</option>
                      <option value="=">=</option>
                    </select>
                  </td>
                  <td><input type="number" step="any" value={con.rhs} onChange={(e) => updateConstraint(ci, "rhs", e.target.value)} /></td>
                  <td><button className="icon-button" type="button" onClick={() => removeConstraint(ci)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <button className="solve-button" type="submit" disabled={isLoading || hasDups}>
        {isLoading ? "Resolviendo modelo..." : "Resolver con PuLP"}
      </button>
    </form>
  );
}
