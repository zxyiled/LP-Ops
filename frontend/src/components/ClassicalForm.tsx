import { useState } from 'react';
import type { ClassicalPayload } from '../types/api';

interface ClassicalFormProps {
  onSubmit: (payload: ClassicalPayload) => void;
  onBack: () => void;
  disabled?: boolean;
}

interface VarRow {
  id: number;
  name: string;
  lowerBound: string;
  upperBound: string;
  category: 'continuous' | 'integer' | 'binary';
}

interface ConRow {
  id: number;
  name: string;
  operator: '<=' | '>=' | '=';
  rhs: string;
  coefficients: Record<string, string>;
}

let nextId = 1;

const defaultCoefs = (vars: VarRow[]) =>
  Object.fromEntries(vars.map((v) => [v.name, '']));

const EXAMPLE: ClassicalPayload = {
  title: 'Ejemplo de producción',
  context:
    'Una fábrica produce dos productos (x1, x2). Cada producto requiere horas de máquina y materiales. Se busca maximizar la ganancia total dados los recursos limitados.',
  variables: [
    { name: 'x1', lowerBound: 0, upperBound: null, category: 'continuous' },
    { name: 'x2', lowerBound: 0, upperBound: null, category: 'continuous' },
  ],
  objective: { sense: 'maximize', coefficients: { x1: 3, x2: 2 } },
  constraints: [
    { name: 'materiales', coefficients: { x1: 1, x2: 1 }, operator: '<=', rhs: 100 },
    { name: 'maquina', coefficients: { x1: 2, x2: 1 }, operator: '<=', rhs: 150 },
  ],
};

const varRowFromPayload = (v: ClassicalPayload['variables'][0]): VarRow => ({
  id: nextId++,
  name: v.name,
  lowerBound: String(v.lowerBound ?? ''),
  upperBound: v.upperBound != null ? String(v.upperBound) : '',
  category: v.category ?? 'continuous',
});

const conRowFromPayload = (
  c: ClassicalPayload['constraints'][0],
  vars: VarRow[],
): ConRow => ({
  id: nextId++,
  name: c.name,
  coefficients: Object.fromEntries(vars.map((v) => [v.name, String(c.coefficients[v.name] ?? '')])),
  operator: c.operator,
  rhs: String(c.rhs),
});

export function ClassicalForm({ onSubmit, onBack, disabled }: ClassicalFormProps) {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [sense, setSense] = useState<'maximize' | 'minimize'>('maximize');
  const [vars, setVars] = useState<VarRow[]>([
    { id: nextId++, name: 'x1', lowerBound: '0', upperBound: '', category: 'continuous' },
    { id: nextId++, name: 'x2', lowerBound: '0', upperBound: '', category: 'continuous' },
  ]);
  const [objCoefs, setObjCoefs] = useState<Record<string, string>>({ x1: '', x2: '' });
  const [constraints, setConstraints] = useState<ConRow[]>([
    { id: nextId++, name: 'c1', coefficients: { x1: '', x2: '' }, operator: '<=', rhs: '' },
  ]);

  const syncCoefs = (newVars: VarRow[]) => {
    const update = (coefs: Record<string, string>) => {
      const next = { ...coefs };
      newVars.forEach((v) => { if (!(v.name in next)) next[v.name] = ''; });
      Object.keys(next).forEach((k) => { if (!newVars.find((v) => v.name === k)) delete next[k]; });
      return next;
    };
    setObjCoefs(update(objCoefs));
    setConstraints((cs) => cs.map((c) => ({ ...c, coefficients: update(c.coefficients) })));
  };

  const loadExample = () => {
    const newVars = EXAMPLE.variables.map(varRowFromPayload);
    const newObjCoefs: Record<string, string> = {};
    for (const [k, v] of Object.entries(EXAMPLE.objective.coefficients)) {
      newObjCoefs[k] = String(v);
    }
    setTitle(EXAMPLE.title ?? '');
    setContext(EXAMPLE.context ?? '');
    setSense(EXAMPLE.objective.sense);
    setVars(newVars);
    setObjCoefs(newObjCoefs);
    setConstraints(EXAMPLE.constraints.map((c) => conRowFromPayload(c, newVars)));
  };

  const addVar = () => {
    const name = `x${vars.length + 1}`;
    const newVars = [...vars, { id: nextId++, name, lowerBound: '0', upperBound: '', category: 'continuous' as const }];
    setVars(newVars);
    syncCoefs(newVars);
  };

  const removeVar = (id: number) => {
    if (vars.length <= 1) return;
    const newVars = vars.filter((v) => v.id !== id);
    setVars(newVars);
    syncCoefs(newVars);
  };

  const updateVar = (id: number, field: keyof VarRow, value: string) => {
    setVars((vs) => vs.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const addConstraint = () => {
    const name = `c${constraints.length + 1}`;
    setConstraints([...constraints, {
      id: nextId++, name, coefficients: { ...defaultCoefs(vars) }, operator: '<=', rhs: '',
    }]);
  };

  const removeConstraint = (id: number) => {
    if (constraints.length <= 0) return;
    setConstraints((cs) => cs.filter((c) => c.id !== id));
  };

  const updateConstraint = (id: number, field: string, value: string) => {
    setConstraints((cs) =>
      cs.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const updateCoef = (which: 'obj' | 'con', conId: number | null, varName: string, value: string) => {
    if (which === 'obj') {
      setObjCoefs((o) => ({ ...o, [varName]: value }));
    } else if (conId !== null) {
      setConstraints((cs) =>
        cs.map((c) =>
          c.id === conId
            ? { ...c, coefficients: { ...c.coefficients, [varName]: value } }
            : c,
        ),
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const variables = vars.map((v) => ({
      name: v.name,
      lowerBound: v.lowerBound ? Number(v.lowerBound) : 0,
      upperBound: v.upperBound ? Number(v.upperBound) : null,
      category: v.category,
    }));
    const objective = {
      sense,
      coefficients: Object.fromEntries(
        Object.entries(objCoefs).map(([k, v]) => [k, Number(v)]),
      ),
    };
    const parsedConstraints = constraints
      .filter((c) => c.rhs !== '')
      .map((c) => ({
        name: c.name,
        coefficients: Object.fromEntries(
          Object.entries(c.coefficients).map(([k, v]) => [k, Number(v)]),
        ),
        operator: c.operator,
        rhs: Number(c.rhs),
      }));
    onSubmit({
      title: title || undefined,
      context: context || null,
      variables,
      objective,
      constraints: parsedConstraints,
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
        <h3 className="form-section-title--lg">Programación Lineal Clásica</h3>
        <p className="form-section-desc">
          Define las variables de decisión, la función objetivo y las restricciones lineales.
          El sistema encontrará los valores óptimos que maximicen o minimicen el resultado.
        </p>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Información general</h3>
        <div className="form-row">
          <label className="form-field form-field--half">
            <span className="form-label">Título del problema</span>
            <input
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Optimización de producción mensual"
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
        <label className="form-field">
          <span className="form-label">Sentido de la optimización</span>
          <div className="form-radio-group">
            <label className={`form-radio ${sense === 'maximize' ? 'form-radio--active' : ''}`}>
              <input
                type="radio"
                name="sense"
                value="maximize"
                checked={sense === 'maximize'}
                onChange={() => setSense('maximize')}
              />
              <span>Maximizar <span className="form-radio-desc">(ganancia, producción, eficiencia)</span></span>
            </label>
            <label className={`form-radio ${sense === 'minimize' ? 'form-radio--active' : ''}`}>
              <input
                type="radio"
                name="sense"
                value="minimize"
                checked={sense === 'minimize'}
                onChange={() => setSense('minimize')}
              />
              <span>Minimizar <span className="form-radio-desc">(costos, tiempo, desperdicio)</span></span>
            </label>
          </div>
        </label>
      </div>

      <div className="form-section">
        <div className="form-section-header">
          <div>
            <h3 className="form-section-title">Variables de decisión</h3>
            <p className="form-section-helper">
              Cada variable representa una cantidad a decidir (ej. unidades a producir de cada producto).
            </p>
          </div>
          <button type="button" className="form-btn form-btn--sm" onClick={addVar}>+ Añadir variable</button>
        </div>
        <div className="form-table-wrap">
          <table className="form-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Límite inferior</th>
                <th>Límite superior</th>
                <th>Tipo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vars.map((v) => (
                <tr key={v.id}>
                  <td>
                    <input className="form-input form-input--sm" value={v.name} onChange={(e) => updateVar(v.id, 'name', e.target.value)} placeholder="x1" />
                  </td>
                  <td>
                    <input className="form-input form-input--sm" value={v.lowerBound} onChange={(e) => updateVar(v.id, 'lowerBound', e.target.value)} placeholder="0" />
                  </td>
                  <td>
                    <input className="form-input form-input--sm" value={v.upperBound} onChange={(e) => updateVar(v.id, 'upperBound', e.target.value)} placeholder="∞ (sin límite)" />
                  </td>
                  <td>
                    <select className="form-input form-input--sm" value={v.category} onChange={(e) => updateVar(v.id, 'category', e.target.value)}>
                      <option value="continuous">Continua (valor real)</option>
                      <option value="integer">Entera (unidades enteras)</option>
                      <option value="binary">Binaria (0 o 1)</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" className="form-btn form-btn--danger form-btn--sm" onClick={() => removeVar(v.id)} disabled={vars.length <= 1}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Función objetivo</h3>
        <p className="form-section-helper">
          Expresa matemáticamente lo que quieres optimizar. Asigna un coeficiente a cada variable.
        </p>
        <div className="form-coefs">
          {vars.map((v) => (
            <label key={v.id} className="form-coef">
              <span className="form-coef-name">{v.name}</span>
              <input
                className="form-input form-input--sm"
                value={objCoefs[v.name] ?? ''}
                onChange={(e) => updateCoef('obj', null, v.name, e.target.value)}
                placeholder="Coeficiente"
              />
            </label>
          ))}
          <span className="form-coef-hint">
            {sense === 'maximize' ? 'Max Z = coeficiente₁·x₁ + coeficiente₂·x₂ + …' : 'Min Z = coeficiente₁·x₁ + coeficiente₂·x₂ + …'}
          </span>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-header">
          <div>
            <h3 className="form-section-title">Restricciones</h3>
            <p className="form-section-helper">
              Limitaciones del problema. Cada restricción combina variables con un operador y un valor del lado derecho (RHS).
            </p>
          </div>
          <button type="button" className="form-btn form-btn--sm" onClick={addConstraint}>+ Añadir restricción</button>
        </div>
        {constraints.map((c) => (
          <div key={c.id} className="form-constraint">
            <div className="form-constraint-header">
              <input
                className="form-input form-input--sm"
                value={c.name}
                onChange={(e) => updateConstraint(c.id, 'name', e.target.value)}
                placeholder="Nombre (ej: materiales, horas)"
                style={{ width: '160px' }}
              />
              <button type="button" className="form-btn form-btn--danger form-btn--sm" onClick={() => removeConstraint(c.id)}>✕</button>
            </div>
            <div className="form-coefs">
              {vars.map((v) => (
                <label key={v.id} className="form-coef">
                  <span className="form-coef-name">{v.name}</span>
                  <input
                    className="form-input form-input--sm"
                    value={c.coefficients[v.name] ?? ''}
                    onChange={(e) => updateCoef('con', c.id, v.name, e.target.value)}
                    placeholder="Coef."
                  />
                </label>
              ))}
              <select
                className="form-input form-input--sm"
                value={c.operator}
                onChange={(e) => updateConstraint(c.id, 'operator', e.target.value)}
                style={{ width: '70px' }}
              >
                <option value="<=">≤</option>
                <option value=">=">≥</option>
                <option value="=">=</option>
              </select>
              <input
                className="form-input form-input--sm"
                value={c.rhs}
                onChange={(e) => updateConstraint(c.id, 'rhs', e.target.value)}
                placeholder="RHS (lado derecho)"
                style={{ width: '120px' }}
              />
            </div>
          </div>
        ))}
      </div>

      <button type="submit" className="form-submit" disabled={disabled}>
        {disabled ? 'Resolviendo…' : 'Resolver modelo'}
      </button>
    </form>
  );
}
