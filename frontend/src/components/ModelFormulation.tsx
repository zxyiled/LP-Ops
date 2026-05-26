import type { UnifiedSolveResponse } from '../types/api';

interface ModelFormulationProps {
  result: UnifiedSolveResponse;
}

function fmtCoeff(val: unknown): string {
  const n = Number(val);
  if (!isFinite(n)) return '';
  if (n === 1) return '';
  if (n === -1) return '-';
  return String(n);
}

function buildObjExpr(
  variables: Record<string, unknown>[],
  sense: string,
): string {
  const parts: string[] = [];
  for (const v of variables) {
    const coef = Number(v.objective_coefficient);
    if (!isFinite(coef) || coef === 0) continue;
    const sign = coef > 0 ? (parts.length > 0 ? ' + ' : '') : ' - ';
    const absCoef = Math.abs(coef);
    const name = String(v.name ?? '?');
    parts.push(`${sign}${fmtCoeff(absCoef)}${name}`);
  }
  const expr = parts.join('') || '0';
  return sense === 'maximize' ? `Max Z = ${expr}` : `Min Z = ${expr}`;
}

function buildConExpr(
  name: string,
  coefficients: Record<string, unknown>,
  operator: string,
  rhs: unknown,
  allVars: string[],
): string {
  const parts: string[] = [];
  for (const vn of allVars) {
    const coef = Number(coefficients[vn]);
    if (!isFinite(coef) || coef === 0) continue;
    const sign = coef > 0 ? (parts.length > 0 ? ' + ' : '') : ' - ';
    const absCoef = Math.abs(coef);
    parts.push(`${sign}${fmtCoeff(absCoef)}${vn}`);
  }
  const expr = parts.join('') || '0';
  const op = operator === '==' ? '=' : operator;
  return `${name}: ${expr} ${op} ${rhs}`;
}

export function ModelFormulation({ result }: ModelFormulationProps) {
  const { modelType, variables } = result;

  if (modelType === 'classical') {
    const varNames = variables.map((v) => String(v.name ?? ''));
    const constraints = result.constraints as Record<string, unknown>[];
    const r = result.results as Record<string, unknown> | undefined;
    const sense = String(r?.sense ?? 'maximize');

    return (
      <div className="data-section">
        <h3 className="data-section-title">Formulación del modelo</h3>

        <div className="formulation-block">
          <span className="formulation-label">Función objetivo</span>
          <code className="formulation-expr">
            {buildObjExpr(variables, sense)}
          </code>
        </div>

        <div className="formulation-block">
          <span className="formulation-label">Sujeto a:</span>
          <div className="formulation-constraints">
            {constraints.map((c, i) => (
              <code key={i} className="formulation-expr formulation-expr--con">
                {buildConExpr(
                  String(c.name ?? ''),
                  (c.coefficients as Record<string, unknown>) ?? {},
                  String(c.operator ?? '<='),
                  c.rhs,
                  varNames,
                )}
              </code>
            ))}
          </div>
        </div>

        <div className="formulation-block">
          <span className="formulation-label">Variables</span>
          <div className="formulation-constraints">
            {variables.map((v, i) => {
              const lb = v.lowerBound != null ? Number(v.lowerBound) : null;
              const ub = v.upperBound != null ? Number(v.upperBound) : null;
              const bounds =
                ub !== null
                  ? `${lb ?? 0} ≤ ${v.name} ≤ ${ub}`
                  : `${lb ?? 0} ≤ ${v.name}`;
              return (
                <code key={i} className="formulation-expr formulation-expr--var">
                  {bounds} {v.category !== 'continuous' ? `<${v.category}>` : ''}
                </code>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (modelType === 'assignment') {
    const r = result.results as Record<string, unknown> | undefined;
    const agents = (r?.agents as string[]) ?? [];
    const tasks = (r?.tasks as string[]) ?? [];
    const sense = String(r?.sense ?? 'minimize');

    return (
      <div className="data-section">
        <h3 className="data-section-title">Formulación del modelo</h3>

        <div className="formulation-block">
          <span className="formulation-label">Tipo</span>
          <code className="formulation-expr">
            Problema de Asignación — {sense === 'minimize' ? 'Minimizar' : 'Maximizar'} costo total
          </code>
        </div>

        <div className="formulation-block">
          <span className="formulation-label">Agentes</span>
          <div className="formulation-vars">
            {agents.map((a) => (
              <code key={a} className="formulation-tag">{a}</code>
            ))}
          </div>
        </div>

        <div className="formulation-block">
          <span className="formulation-label">Tareas</span>
          <div className="formulation-vars">
            {tasks.map((t) => (
              <code key={t} className="formulation-tag">{t}</code>
            ))}
          </div>
        </div>

        <div className="formulation-block">
          <span className="formulation-label">Restricciones</span>
          <div className="formulation-constraints">
            <code className="formulation-expr formulation-expr--con">
              Cada agente realiza exactamente una tarea
            </code>
            <code className="formulation-expr formulation-expr--con">
              Cada tarea es asignada a exactamente un agente
            </code>
            <code className="formulation-expr formulation-expr--con">
              Todas las variables son binarias (0 = no asignado, 1 = asignado)
            </code>
          </div>
        </div>
      </div>
    );
  }

  if (modelType === 'transport') {
    const r = result.results as Record<string, unknown> | undefined;
    const origins = (r?.origins as string[]) ?? [];
    const destinations = (r?.destinations as string[]) ?? [];
    const supply = (r?.supply as Record<string, number>) ?? {};
    const demand = (r?.demand as Record<string, number>) ?? {};

    return (
      <div className="data-section">
        <h3 className="data-section-title">Formulación del modelo</h3>

        <div className="formulation-block">
          <span className="formulation-label">Tipo</span>
          <code className="formulation-expr">
            Problema de Transporte — Minimizar costo total de envío
          </code>
        </div>

        <div className="formulation-block">
          <span className="formulation-label">Orígenes (oferta)</span>
          <div className="formulation-vars">
            {origins.map((o) => (
              <code key={o} className="formulation-tag">
                {o}: {Number(supply[o] ?? 0).toFixed(0)} uds.
              </code>
            ))}
          </div>
        </div>

        <div className="formulation-block">
          <span className="formulation-label">Destinos (demanda)</span>
          <div className="formulation-vars">
            {destinations.map((d) => (
              <code key={d} className="formulation-tag">
                {d}: {Number(demand[d] ?? 0).toFixed(0)} uds.
              </code>
            ))}
          </div>
        </div>

        <div className="formulation-block">
          <span className="formulation-label">Restricciones</span>
          <div className="formulation-constraints">
            <code className="formulation-expr formulation-expr--con">
              La cantidad enviada desde cada origen no puede superar su oferta disponible
            </code>
            <code className="formulation-expr formulation-expr--con">
              La cantidad recibida en cada destino debe cubrir su demanda requerida
            </code>
            <code className="formulation-expr formulation-expr--con">
              Los flujos de transporte son continuos y no negativos
            </code>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
