import { useState, useMemo } from 'react';
import type { AssignmentPayload } from '../types/api';

interface AssignmentFormProps {
  onSubmit: (payload: AssignmentPayload) => void;
  onBack: () => void;
  disabled?: boolean;
}

const EXAMPLE: AssignmentPayload = {
  title: 'Asignación de operarios a puestos',
  context: 'Tres operarios deben ser asignados a tres puestos de trabajo. Cada operario tiene un costo distinto según el puesto. Se busca minimizar el costo total de asignación.',
  agents: ['Operario1', 'Operario2', 'Operario3'],
  tasks: ['TareaA', 'TareaB', 'TareaC'],
  costs: { Operario1_TareaA: 10, Operario1_TareaB: 15, Operario1_TareaC: 12, Operario2_TareaA: 9, Operario2_TareaB: 11, Operario2_TareaC: 14, Operario3_TareaA: 13, Operario3_TareaB: 10, Operario3_TareaC: 11 },
  sense: 'minimize',
};

export function AssignmentForm({ onSubmit, onBack, disabled }: AssignmentFormProps) {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [agentsText, setAgentsText] = useState('Operario1, Operario2');
  const [tasksText, setTasksText] = useState('TareaA, TareaB');
  const [sense, setSense] = useState<'maximize' | 'minimize'>('minimize');
  const [touched, setTouched] = useState(false);

  const parseList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
  const agents = parseList(agentsText);
  const tasks = parseList(tasksText);

  const [costs, setCosts] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const a of ['Operario1', 'Operario2'])
      for (const t of ['TareaA', 'TareaB'])
        m[`${a}_${t}`] = '';
    return m;
  });

  const emptyCells = useMemo(() => {
    const keys: string[] = [];
    for (const a of agents)
      for (const t of tasks) {
        const key = `${a}_${t}`;
        if (!costs[key] || costs[key].trim() === '') keys.push(key);
      }
    return keys;
  }, [agents, tasks, costs]);

  const syncCosts = (ag: string[], ta: string[]) => {
    setCosts((prev) => {
      const next: Record<string, string> = {};
      for (const a of ag)
        for (const t of ta) {
          const key = `${a}_${t}`;
          next[key] = prev[key] ?? '';
        }
      return next;
    });
  };

  const handleAgentsChange = (v: string) => {
    setAgentsText(v);
    syncCosts(parseList(v), tasks);
  };
  const handleTasksChange = (v: string) => {
    setTasksText(v);
    syncCosts(agents, parseList(v));
  };

  const loadExample = () => {
    setTitle(EXAMPLE.title ?? '');
    setContext(EXAMPLE.context ?? '');
    setAgentsText(EXAMPLE.agents.join(', '));
    setTasksText(EXAMPLE.tasks.join(', '));
    setSense(EXAMPLE.sense ?? 'minimize');
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(EXAMPLE.costs)) m[k] = String(v);
    setCosts(m);
    setTouched(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (emptyCells.length > 0) return;
    const ag = parseList(agentsText);
    const ta = parseList(tasksText);
    const parsedCosts: Record<string, number> = {};
    for (const a of ag)
      for (const t of ta) parsedCosts[`${a}_${t}`] = Number(costs[`${a}_${t}`]) || 0;
    onSubmit({
      title: title || undefined,
      context: context || null,
      agents: ag,
      tasks: ta,
      costs: parsedCosts,
      sense,
    });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-top-bar">
        <button type="button" className="form-back-btn" onClick={onBack}>
          ← Volver
        </button>
        <button type="button" className="form-example-btn" onClick={loadExample}>
          ↻ Cargar ejemplo
        </button>
      </div>

      <div className="form-section form-section--intro">
        <h3 className="form-section-title--lg">Problema de Asignación</h3>
        <p className="form-section-desc">
          Asigna cada agente a una tarea distinta al menor costo posible. El número de agentes y tareas debe coincidir
          para que exista una asignación uno a uno completa.
        </p>
      </div>

      {touched && emptyCells.length > 0 && (
        <div className="form-warning">
          <span>⚠</span>
          <span>Hay {emptyCells.length} celda{emptyCells.length !== 1 ? 's' : ''} de costo sin completar. Llena todas antes de resolver.</span>
        </div>
      )}

      <div className="form-section">
        <h3 className="form-section-title">Información general</h3>
        <div className="form-row">
          <label className="form-field form-field--half">
            <span className="form-label">Título del problema</span>
            <input
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Asignación de personal mensual"
            />
          </label>
          <label className="form-field form-field--half">
            <span className="form-label">Contexto / descripción</span>
            <input
              className="form-input"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ej: Contexto del negocio, objetivo del modelo..."
            />
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Agentes y tareas</h3>
        <p className="form-section-helper">
          Escribe los nombres separados por coma. Debe haber la misma cantidad de agentes que de tareas.
        </p>
        <div className="form-row">
          <label className="form-field form-field--half">
            <span className="form-label">Agentes</span>
            <input
              className="form-input"
              value={agentsText}
              onChange={(e) => handleAgentsChange(e.target.value)}
              placeholder="Ej: Empleado1, Empleado2, Empleado3"
            />
            <span className="form-field-example">Ejemplo: Operario1, Operario2, Operario3</span>
          </label>
          <label className="form-field form-field--half">
            <span className="form-label">Tareas</span>
            <input
              className="form-input"
              value={tasksText}
              onChange={(e) => handleTasksChange(e.target.value)}
              placeholder="Ej: PuestoA, PuestoB, PuestoC"
            />
            <span className="form-field-example">Ejemplo: TareaA, TareaB, TareaC</span>
          </label>
        </div>
        <label className="form-field">
          <span className="form-label">Sentido de la optimización</span>
          <div className="form-radio-group">
            <label className={`form-radio ${sense === 'minimize' ? 'form-radio--active' : ''}`}>
              <input type="radio" name="sense" value="minimize" checked={sense === 'minimize'} onChange={() => setSense('minimize')} />
              <span>Minimizar <span className="form-radio-desc">(costos de asignación)</span></span>
            </label>
            <label className={`form-radio ${sense === 'maximize' ? 'form-radio--active' : ''}`}>
              <input type="radio" name="sense" value="maximize" checked={sense === 'maximize'} onChange={() => setSense('maximize')} />
              <span>Maximizar <span className="form-radio-desc">(eficiencia o ganancia)</span></span>
            </label>
          </div>
        </label>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Matriz de costos</h3>
        <p className="form-section-helper">
            Ingresa el costo (o valor) de asignar cada agente a cada tarea. Completa todas las celdas.
        </p>
        <div className="form-table-wrap">
          <table className="form-table">
            <thead>
              <tr>
                <th>Agente \ Tarea</th>
                {tasks.map((t) => <th key={t}>{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a}>
                  <td className="form-table-label">{a}</td>
                  {tasks.map((t) => {
                    const key = `${a}_${t}`;
                    const isEmpty = touched && (!costs[key] || costs[key].trim() === '');
                    return (
                      <td key={key}>
                        <input
                          className={`form-input form-input--sm${isEmpty ? ' form-input--error' : ''}`}
                          value={costs[key] ?? ''}
                          onChange={(e) => setCosts((c) => ({ ...c, [key]: e.target.value }))}
                          placeholder="0"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button type="submit" className="form-submit" disabled={disabled || (touched && emptyCells.length > 0)}>
        {disabled ? 'Resolviendo…' : 'Resolver asignación'}
      </button>
    </form>
  );
}
