import type { ModelType } from '../types/api';

interface VariableTableProps {
  modelType: ModelType;
  variables: Record<string, unknown>[];
}

export function VariableTable({ modelType, variables }: VariableTableProps) {
  if (!variables.length) return null;

  const columns =
    modelType === 'classical'
      ? ['name', 'value', 'objective_coefficient', 'contribution']
      : modelType === 'assignment'
        ? ['name', 'agent', 'task', 'value', 'cost']
        : ['name', 'origin', 'destination', 'value', 'cost'];

  const headerLabels: Record<string, string> = {
    name: 'Variable',
    value: 'Valor',
    objective_coefficient: 'C(o)',
    contribution: 'Contrib.',
    agent: 'Agente',
    task: 'Tarea',
    cost: 'Costo',
    origin: 'Origen',
    destination: 'Destino',
  };

  return (
    <div className="data-section">
      <h3 className="data-section-title">Variables de Decisión</h3>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{headerLabels[c] ?? c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variables.map((v, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c}>
                    {typeof v[c] === 'number'
                      ? Number(v[c]).toFixed(2)
                      : String(v[c] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
