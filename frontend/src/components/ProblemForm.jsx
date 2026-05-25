// --- Generates unique IDs for each form row ---
const makeId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// --- Creates a default decision variable ---
const makeVariable = (index) => ({
  id: makeId("variable"),
  name: `x${index}`,
  lower_bound: 0,
  upper_bound: "",
  category: "continuous",
});

// --- Creates a default constraint with zero coefficients ---
const makeConstraint = (index, variables) => ({
  id: makeId("constraint"),
  name: `R${index}`,
  coefficients: Object.fromEntries(
    variables.map((variable) => [variable.name, 0]),
  ),
  operator: "<=",
  rhs: 0,
});

// --- Converts a string to a number, returning 0 if invalid ---
const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function ProblemForm({
  problem,
  setProblem,
  onSolve,
  isLoading,
  error,
}) {
  // --- Updates general problem fields (title, context) ---
  const updateProblem = (patch) =>
    setProblem((current) => ({ ...current, ...patch }));

  // --- Updates a single objective function coefficient ---
  const updateObjectiveCoefficient = (variableName, value) => {
    setProblem((current) => ({
      ...current,
      objective: {
        ...current.objective,
        coefficients: {
          ...current.objective.coefficients,
          [variableName]: value,
        },
      },
    }));
  };

  // --- Updates a variable and syncs its name across objective and constraints ---
  const updateVariable = (index, field, value) => {
    setProblem((current) => {
      const oldVariable = current.variables[index];
      const variables = current.variables.map((variable, variableIndex) =>
        variableIndex === index ? { ...variable, [field]: value } : variable,
      );

      if (field !== "name") {
        return { ...current, variables };
      }

      // When the name changes, carry the coefficient to the new key
      const oldName = oldVariable.name;
      const nextName = value.trim() || oldName;
      const objectiveCoefficients = { ...current.objective.coefficients };
      objectiveCoefficients[nextName] = objectiveCoefficients[oldName] ?? 0;
      if (nextName !== oldName) delete objectiveCoefficients[oldName];

      const constraints = current.constraints.map((constraint) => {
        const coefficients = { ...constraint.coefficients };
        coefficients[nextName] = coefficients[oldName] ?? 0;
        if (nextName !== oldName) delete coefficients[oldName];
        return { ...constraint, coefficients };
      });

      return {
        ...current,
        variables,
        objective: {
          ...current.objective,
          coefficients: objectiveCoefficients,
        },
        constraints,
      };
    });
  };

  // --- Adds a new variable (propagates to objective and constraints) ---
  const addVariable = () => {
    setProblem((current) => {
      const nextVariable = makeVariable(current.variables.length + 1);
      return {
        ...current,
        variables: [...current.variables, nextVariable],
        objective: {
          ...current.objective,
          coefficients: {
            ...current.objective.coefficients,
            [nextVariable.name]: 0,
          },
        },
        constraints: current.constraints.map((constraint) => ({
          ...constraint,
          coefficients: {
            ...constraint.coefficients,
            [nextVariable.name]: 0,
          },
        })),
      };
    });
  };

  // --- Removes a variable from objective and constraints ---
  const removeVariable = (variableName) => {
    setProblem((current) => {
      if (current.variables.length === 1) return current;

      const objectiveCoefficients = { ...current.objective.coefficients };
      delete objectiveCoefficients[variableName];

      return {
        ...current,
        variables: current.variables.filter(
          (variable) => variable.name !== variableName,
        ),
        objective: {
          ...current.objective,
          coefficients: objectiveCoefficients,
        },
        constraints: current.constraints.map((constraint) => {
          const coefficients = { ...constraint.coefficients };
          delete coefficients[variableName];
          return { ...constraint, coefficients };
        }),
      };
    });
  };

  // --- Adds a new constraint ---
  const addConstraint = () => {
    setProblem((current) => ({
      ...current,
      constraints: [
        ...current.constraints,
        makeConstraint(current.constraints.length + 1, current.variables),
      ],
    }));
  };

  // --- Removes a constraint by index ---
  const removeConstraint = (index) => {
    setProblem((current) => ({
      ...current,
      constraints: current.constraints.filter(
        (_, constraintIndex) => constraintIndex !== index,
      ),
    }));
  };

  // --- Updates a constraint field (name, operator, RHS) ---
  const updateConstraint = (index, field, value) => {
    setProblem((current) => ({
      ...current,
      constraints: current.constraints.map((constraint, constraintIndex) =>
        constraintIndex === index
          ? { ...constraint, [field]: value }
          : constraint,
      ),
    }));
  };

  // --- Updates a specific coefficient inside a constraint ---
  const updateConstraintCoefficient = (index, variableName, value) => {
    setProblem((current) => ({
      ...current,
      constraints: current.constraints.map((constraint, constraintIndex) =>
        constraintIndex === index
          ? {
              ...constraint,
              coefficients: {
                ...constraint.coefficients,
                [variableName]: value,
              },
            }
          : constraint,
      ),
    }));
  };

  // --- Loads the 9-product (furniture) example problem ---
  const loadExample = () => {
    const variableNames = [
      "Mesa", "Silla", "Armario", "Estante", "Escritorio",
      "Cama", "Librero", "Cajonera", "Banco",
    ];
    const variables = variableNames.map((name, i) => ({
      ...makeVariable(i + 1),
      name,
    }));
    const coeffs = {
      Mesa: 45, Silla: 32, Armario: 28, Estante: 51, Escritorio: 37,
      Cama: 19, Librero: 42, Cajonera: 55, Banco: 30,
    };

    setProblem({
      title: "Optimización de mezcla de producción — 9 productos",
      context:
        "Una fábrica de muebles produce 9 productos distintos y debe decidir cuántas unidades fabricar de cada uno para maximizar la ganancia total, sujeto a restricciones de mano de obra, materias primas, capacidad de máquina, almacenamiento y demanda del mercado.",
      variables,
      objective: {
        sense: "maximize",
        coefficients: { ...coeffs },
      },
      constraints: [
        {
          id: makeId("constraint"),
          name: "Mano de obra",
          coefficients: { Mesa: 3, Silla: 2, Armario: 4, Estante: 5, Escritorio: 3, Cama: 2, Librero: 4, Cajonera: 6, Banco: 3 },
          operator: "<=",
          rhs: 1000,
        },
        {
          id: makeId("constraint"),
          name: "Materia prima A",
          coefficients: { Mesa: 2, Silla: 3, Armario: 1, Estante: 4, Escritorio: 2, Cama: 3, Librero: 2, Cajonera: 1, Banco: 4 },
          operator: "<=",
          rhs: 750,
        },
        {
          id: makeId("constraint"),
          name: "Materia prima B",
          coefficients: { Mesa: 4, Silla: 1, Armario: 3, Estante: 2, Escritorio: 5, Cama: 1, Librero: 3, Cajonera: 2, Banco: 2 },
          operator: "<=",
          rhs: 900,
        },
        {
          id: makeId("constraint"),
          name: "Capacidad máquina",
          coefficients: { Mesa: 5, Silla: 4, Armario: 2, Estante: 3, Escritorio: 4, Cama: 5, Librero: 1, Cajonera: 3, Banco: 2 },
          operator: "<=",
          rhs: 1200,
        },
        {
          id: makeId("constraint"),
          name: "Almacenamiento",
          coefficients: { Mesa: 2, Silla: 2, Armario: 3, Estante: 2, Escritorio: 1, Cama: 2, Librero: 3, Cajonera: 2, Banco: 2 },
          operator: "<=",
          rhs: 500,
        },
        {
          id: makeId("constraint"),
          name: "Demanda mínima total",
          coefficients: { Mesa: 1, Silla: 1, Armario: 1, Estante: 1, Escritorio: 1, Cama: 1, Librero: 1, Cajonera: 1, Banco: 1 },
          operator: ">=",
          rhs: 30,
        },
        {
          id: makeId("constraint"),
          name: "Mix de producción",
          coefficients: { Mesa: 2, Silla: 1, Armario: 3, Estante: 2, Escritorio: 1, Cama: 2, Librero: 3, Cajonera: 2, Banco: 1 },
          operator: "<=",
          rhs: 400,
        },
      ],
    });
  };

  // --- Prepares the payload by cleaning values before sending to the backend ---
  const preparePayload = () => ({
    title: problem.title.trim() || "Modelo de programación lineal",
    context: problem.context?.trim() || undefined,
    variables: problem.variables.map((variable) => ({
      name: variable.name.trim(),
      lower_bound:
        variable.category === "binary" ? 0 : toNumber(variable.lower_bound),
      upper_bound:
        variable.category === "binary" || variable.upper_bound === ""
          ? null
          : toNumber(variable.upper_bound),
      category: variable.category,
    })),
    objective: {
      sense: problem.objective.sense,
      coefficients: Object.fromEntries(
        problem.variables.map((variable) => [
          variable.name.trim(),
          toNumber(problem.objective.coefficients[variable.name]),
        ]),
      ),
    },
    constraints: problem.constraints.map((constraint) => ({
      name: constraint.name.trim(),
      operator: constraint.operator,
      rhs: toNumber(constraint.rhs),
      coefficients: Object.fromEntries(
        problem.variables.map((variable) => [
          variable.name.trim(),
          toNumber(constraint.coefficients[variable.name]),
        ]),
      ),
    })),
  });

  // --- Submits the form ---
  const handleSubmit = (event) => {
    event.preventDefault();
    onSolve(preparePayload());
  };

  // --- Detects duplicate variable names to block submission ---
  const variableNames = problem.variables
    .map((variable) => variable.name.trim())
    .filter(Boolean);
  const hasDuplicateVariables =
    new Set(variableNames).size !== variableNames.length;

  return (
    <form className="problem-form" onSubmit={handleSubmit}>
      {/* Section: general model data */}
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
          <input
            value={problem.title}
            onChange={(event) => updateProblem({ title: event.target.value })}
            placeholder="Ej. Plan óptimo de producción"
          />
        </label>

        <label>
          Contexto breve
          <textarea
            value={problem.context}
            onChange={(event) => updateProblem({ context: event.target.value })}
            placeholder="Describe recursos, productos, costos o ganancias para enriquecer las recomendaciones."
            rows={3}
          />
        </label>
      </div>

      {/* Section: decision variables table */}
      <div className="form-card">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Variables</p>
            <h2>Variables de decisión</h2>
          </div>
          <button
            className="primary-button small"
            type="button"
            onClick={addVariable}
          >
            + Variable
          </button>
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
              {problem.variables.map((variable, index) => (
                <tr key={variable.id ?? index}>
                  <td>
                    <input
                      value={variable.name}
                      onChange={(event) =>
                        updateVariable(index, "name", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={variable.category}
                      onChange={(event) =>
                        updateVariable(index, "category", event.target.value)
                      }
                    >
                      <option value="continuous">Continua</option>
                      <option value="integer">Entera</option>
                      <option value="binary">Binaria</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      value={variable.lower_bound}
                      disabled={variable.category === "binary"}
                      onChange={(event) =>
                        updateVariable(index, "lower_bound", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      value={
                        variable.category === "binary"
                          ? 1
                          : variable.upper_bound
                      }
                      disabled={variable.category === "binary"}
                      placeholder="Sin límite"
                      onChange={(event) =>
                        updateVariable(index, "upper_bound", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => removeVariable(variable.name)}
                      disabled={problem.variables.length === 1}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasDuplicateVariables && (
          <p className="form-warning">
            Los nombres de variables deben ser únicos.
          </p>
        )}
      </div>

      {/* Section: objective function (sense + coefficients) */}
      <div className="form-card">
        <div className="section-heading">
          <p className="eyebrow">Función objetivo</p>
          <h2>Z = coeficientes × variables</h2>
        </div>

        <div className="objective-toolbar">
          <label className="inline-label">
            Sentido
            <select
              value={problem.objective.sense}
              onChange={(event) =>
                setProblem((current) => ({
                  ...current,
                  objective: {
                    ...current.objective,
                    sense: event.target.value,
                  },
                }))
              }
            >
              <option value="maximize">Maximizar</option>
              <option value="minimize">Minimizar</option>
            </select>
          </label>
        </div>

        <div className="coefficient-grid">
          {problem.variables.map((variable) => (
            <label key={variable.id ?? variable.name}>
              Coef. {variable.name}
              <input
                type="number"
                step="any"
                value={problem.objective.coefficients[variable.name] ?? 0}
                onChange={(event) =>
                  updateObjectiveCoefficient(variable.name, event.target.value)
                }
              />
            </label>
          ))}
        </div>
      </div>

      {/* Section: dynamic constraint matrix */}
      <div className="form-card wide-card">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Restricciones</p>
            <h2>Matriz dinámica de coeficientes</h2>
          </div>
          <button
            className="primary-button small"
            type="button"
            onClick={addConstraint}
          >
            + Restricción
          </button>
        </div>

        <div className="table-wrapper editable constraints-table">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                {problem.variables.map((variable) => (
                  <th key={variable.id ?? variable.name}>
                    {variable.name || "Variable"}
                  </th>
                ))}
                <th>Operador</th>
                <th>Límite</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {problem.constraints.map((constraint, constraintIndex) => (
                <tr key={constraint.id ?? constraintIndex}>
                  <td>
                    <input
                      value={constraint.name}
                      onChange={(event) =>
                        updateConstraint(
                          constraintIndex,
                          "name",
                          event.target.value,
                        )
                      }
                    />
                  </td>
                  {problem.variables.map((variable) => (
                    <td key={variable.id ?? variable.name}>
                      <input
                        type="number"
                        step="any"
                        value={constraint.coefficients[variable.name] ?? 0}
                        onChange={(event) =>
                          updateConstraintCoefficient(
                            constraintIndex,
                            variable.name,
                            event.target.value,
                          )
                        }
                      />
                    </td>
                  ))}
                  <td>
                    <select
                      value={constraint.operator}
                      onChange={(event) =>
                        updateConstraint(
                          constraintIndex,
                          "operator",
                          event.target.value,
                        )
                      }
                    >
                      <option value="<=">≤</option>
                      <option value=">=">≥</option>
                      <option value="=">=</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      value={constraint.rhs}
                      onChange={(event) =>
                        updateConstraint(
                          constraintIndex,
                          "rhs",
                          event.target.value,
                        )
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => removeConstraint(constraintIndex)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {problem.constraints.length === 0 && (
          <p className="hint">
            Agrega al menos una restricción para representar recursos, demanda o
            capacidad.
          </p>
        )}
      </div>

      {/* Backend error message */}
      {error && <div className="error-box">{error}</div>}

      {/* Main solve button */}
      <button
        className="solve-button"
        type="submit"
        disabled={isLoading || hasDuplicateVariables}
      >
        {isLoading ? "Resolviendo modelo..." : "Resolver con PuLP"}
      </button>
    </form>
  );
}


