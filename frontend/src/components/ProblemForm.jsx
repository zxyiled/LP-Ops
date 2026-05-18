const makeVariable = (index) => ({
  name: `x${index}`,
  lower_bound: 0,
  upper_bound: "",
  category: "continuous",
});

const makeConstraint = (index, variables) => ({
  name: `R${index}`,
  coefficients: Object.fromEntries(
    variables.map((variable) => [variable.name, 0]),
  ),
  operator: "<=",
  rhs: 0,
});

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
  const updateProblem = (patch) =>
    setProblem((current) => ({ ...current, ...patch }));

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

  const updateVariable = (index, field, value) => {
    setProblem((current) => {
      const oldVariable = current.variables[index];
      const variables = current.variables.map((variable, variableIndex) =>
        variableIndex === index ? { ...variable, [field]: value } : variable,
      );

      if (field !== "name") {
        return { ...current, variables };
      }

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

  const addConstraint = () => {
    setProblem((current) => ({
      ...current,
      constraints: [
        ...current.constraints,
        makeConstraint(current.constraints.length + 1, current.variables),
      ],
    }));
  };

  const removeConstraint = (index) => {
    setProblem((current) => ({
      ...current,
      constraints: current.constraints.filter(
        (_, constraintIndex) => constraintIndex !== index,
      ),
    }));
  };

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

  const loadExample = () => {
    const variables = [makeVariable(1), makeVariable(2)];
    variables[0].name = "x";
    variables[1].name = "y";
    setProblem({
      title: "Maximización de producción",
      context:
        "Una empresa desea maximizar utilidad usando dos productos y recursos limitados.",
      variables,
      objective: {
        sense: "maximize",
        coefficients: { x: 5, y: 4 },
      },
      constraints: [
        {
          name: "Materia prima",
          coefficients: { x: 3, y: 2 },
          operator: "<=",
          rhs: 100,
        },
        {
          name: "Horas máquina",
          coefficients: { x: 2, y: 3 },
          operator: "<=",
          rhs: 90,
        },
        {
          name: "Demanda mínima",
          coefficients: { x: 1, y: 1 },
          operator: ">=",
          rhs: 10,
        },
      ],
    });
  };

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

  const handleSubmit = (event) => {
    event.preventDefault();
    onSolve(preparePayload());
  };

  const variableNames = problem.variables
    .map((variable) => variable.name.trim())
    .filter(Boolean);
  const hasDuplicateVariables =
    new Set(variableNames).size !== variableNames.length;

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
                <tr key={`${variable.name}-${index}`}>
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
            <label key={variable.name}>
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
                  <th key={variable.name}>{variable.name}</th>
                ))}
                <th>Operador</th>
                <th>Límite</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {problem.constraints.map((constraint, constraintIndex) => (
                <tr key={`${constraint.name}-${constraintIndex}`}>
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
                    <td key={variable.name}>
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

      {error && <div className="error-box">{error}</div>}

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
