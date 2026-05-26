import { useState, useMemo } from 'react';
import type { TransportPayload } from '../types/api';

interface TransportFormProps {
  onSubmit: (payload: TransportPayload) => void;
  onBack: () => void;
  disabled?: boolean;
}

const EXAMPLE: TransportPayload = {
  title: 'Distribución regional desde almacenes',
  context: 'Tres almacenes regionales deben distribuir productos a cuatro centros de distribución. Cada almacén tiene una capacidad limitada y cada centro requiere una cantidad específica. La oferta total supera la demanda total, por lo que el sistema agregará un destino ficticio. Se busca minimizar el costo total de transporte.',
  origins: ['AlmacenNorte', 'AlmacenCentro', 'AlmacenSur'],
  destinations: ['CDMX', 'Guadalajara', 'Monterrey', 'Puebla'],
  costs: {
    AlmacenNorte_CDMX: 12, AlmacenNorte_Guadalajara: 18, AlmacenNorte_Monterrey: 25, AlmacenNorte_Puebla: 20,
    AlmacenCentro_CDMX: 22, AlmacenCentro_Guadalajara: 14, AlmacenCentro_Monterrey: 19, AlmacenCentro_Puebla: 24,
    AlmacenSur_CDMX: 17, AlmacenSur_Guadalajara: 23, AlmacenSur_Monterrey: 13, AlmacenSur_Puebla: 18,
  },
  supply: { AlmacenNorte: 200, AlmacenCentro: 150, AlmacenSur: 180 },
  demand: { CDMX: 120, Guadalajara: 100, Monterrey: 140, Puebla: 90 },
};

export function TransportForm({ onSubmit, onBack, disabled }: TransportFormProps) {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [originsText, setOriginsText] = useState('Fabrica1, Fabrica2');
  const [destText, setDestText] = useState('TiendaA, TiendaB');
  const [touched, setTouched] = useState(false);

  const parseList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
  const origins = parseList(originsText);
  const dests = parseList(destText);

  const [costs, setCosts] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const o of ['Fabrica1', 'Fabrica2'])
      for (const d of ['TiendaA', 'TiendaB'])
        m[`${o}_${d}`] = '';
    return m;
  });
  const [supply, setSupply] = useState<Record<string, string>>({ Fabrica1: '', Fabrica2: '' });
  const [demand, setDemand] = useState<Record<string, string>>({ TiendaA: '', TiendaB: '' });

  const emptyCells = useMemo(() => {
    const keys: string[] = [];
    for (const o of origins)
      for (const d of dests) {
        const key = `${o}_${d}`;
        if (!costs[key] || costs[key].trim() === '') keys.push(key);
      }
    return keys;
  }, [origins, dests, costs]);

  const totalSupply = useMemo(() => {
    let sum = 0;
    for (const o of origins) sum += Number(supply[o]) || 0;
    return sum;
  }, [origins, supply]);

  const totalDemand = useMemo(() => {
    let sum = 0;
    for (const d of dests) sum += Number(demand[d]) || 0;
    return sum;
  }, [dests, demand]);

  const supplyOk = useMemo(() => {
    for (const o of origins) if (!supply[o] || supply[o].trim() === '') return false;
    return true;
  }, [origins, supply]);

  const demandOk = useMemo(() => {
    for (const d of dests) if (!demand[d] || demand[d].trim() === '') return false;
    return true;
  }, [dests, demand]);

  const balanceType = useMemo<'balanced' | 'excess_supply' | 'excess_demand' | 'unknown'>(() => {
    if (!supplyOk || !demandOk) return 'unknown';
    const eps = 1e-6;
    if (Math.abs(totalSupply - totalDemand) < eps) return 'balanced';
    if (totalSupply > totalDemand) return 'excess_supply';
    return 'excess_demand';
  }, [totalSupply, totalDemand, supplyOk, demandOk]);

  const syncCosts = (or: string[], de: string[]) => {
    setCosts((prev) => {
      const next: Record<string, string> = {};
      for (const o of or)
        for (const d of de) {
          const key = `${o}_${d}`;
          next[key] = prev[key] ?? '';
        }
      return next;
    });
  };

  const handleOriginsChange = (v: string) => {
    setOriginsText(v);
    const or = parseList(v);
    syncCosts(or, dests);
    setSupply((prev) => {
      const next: Record<string, string> = {};
      for (const o of or) next[o] = prev[o] ?? '';
      return next;
    });
  };
  const handleDestsChange = (v: string) => {
    setDestText(v);
    const de = parseList(v);
    syncCosts(origins, de);
    setDemand((prev) => {
      const next: Record<string, string> = {};
      for (const d of de) next[d] = prev[d] ?? '';
      return next;
    });
  };

  const loadExample = () => {
    setTitle(EXAMPLE.title ?? '');
    setContext(EXAMPLE.context ?? '');
    setOriginsText(EXAMPLE.origins.join(', '));
    setDestText(EXAMPLE.destinations.join(', '));
    const cm: Record<string, string> = {};
    for (const [k, v] of Object.entries(EXAMPLE.costs)) cm[k] = String(v);
    setCosts(cm);
    const sm: Record<string, string> = {};
    for (const [k, v] of Object.entries(EXAMPLE.supply)) sm[k] = String(v);
    setSupply(sm);
    const dm: Record<string, string> = {};
    for (const [k, v] of Object.entries(EXAMPLE.demand)) dm[k] = String(v);
    setDemand(dm);
    setTouched(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (emptyCells.length > 0 || !supplyOk || !demandOk) return;
    const or = parseList(originsText);
    const de = parseList(destText);
    const parsedCosts: Record<string, number> = {};
    for (const o of or)
      for (const d of de) parsedCosts[`${o}_${d}`] = Number(costs[`${o}_${d}`]) || 0;
    const parsedSupply: Record<string, number> = {};
    for (const o of or) parsedSupply[o] = Number(supply[o]) || 0;
    const parsedDemand: Record<string, number> = {};
    for (const d of de) parsedDemand[d] = Number(demand[d]) || 0;
    onSubmit({
      title: title || undefined,
      context: context || null,
      origins: or,
      destinations: de,
      costs: parsedCosts,
      supply: parsedSupply,
      demand: parsedDemand,
    });
  };

  const hasErrors = touched && (emptyCells.length > 0 || !supplyOk || !demandOk);

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
        <h3 className="form-section-title--lg">Problema de Transporte</h3>
        <p className="form-section-desc">
          Determina cómo enviar productos desde orígenes (con oferta limitada) hacia destinos
          (con demanda específica) al menor costo posible. El sistema balancea oferta y demanda automáticamente.
        </p>
      </div>

      {touched && emptyCells.length > 0 && (
        <div className="form-warning">
          <span>⚠</span>
          <span>Hay {emptyCells.length} celda{emptyCells.length !== 1 ? 's' : ''} de costo sin completar. Llena todas antes de resolver.</span>
        </div>
      )}

      {touched && (!supplyOk || !demandOk) && emptyCells.length === 0 && (
        <div className="form-warning">
          <span>⚠</span>
          <span>Completa todos los valores de oferta y demanda antes de resolver.</span>
        </div>
      )}

      {touched && supplyOk && demandOk && (
        <div className={`form-balance form-balance--${balanceType}`}>
          {balanceType === 'balanced' && (
            <><span>✓</span><span>Problema balanceado: oferta total ({totalSupply}) = demanda total ({totalDemand})</span></>
          )}
          {balanceType === 'excess_supply' && (
            <><span>▲</span><span>Oferta excedente: oferta total ({totalSupply}) &gt; demanda total ({totalDemand}) por {totalSupply - totalDemand} unidades. Se agregará un destino ficticio.</span></>
          )}
          {balanceType === 'excess_demand' && (
            <><span>▲</span><span>Demanda insatisfecha: oferta total ({totalSupply}) &lt; demanda total ({totalDemand}) por {totalDemand - totalSupply} unidades. Se agregará un origen ficticio.</span></>
          )}
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
              placeholder="Ej: Distribución de productos mensual"
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
        <h3 className="form-section-title">Orígenes y destinos</h3>
        <p className="form-section-helper">
          Define los puntos de partida (fábricas, almacenes) y los puntos de llegada (tiendas, clientes).
          La oferta total debe ser al menos igual a la demanda total.
        </p>
        <div className="form-row">
          <label className="form-field form-field--half">
            <span className="form-label">Orígenes (oferta)</span>
            <input
              className="form-input"
              value={originsText}
              onChange={(e) => handleOriginsChange(e.target.value)}
              placeholder="Ej: Fabrica1, Fabrica2, Fabrica3"
            />
            <span className="form-field-example">Cada origen tiene una capacidad de oferta</span>
          </label>
          <label className="form-field form-field--half">
            <span className="form-label">Destinos (demanda)</span>
            <input
              className="form-input"
              value={destText}
              onChange={(e) => handleDestsChange(e.target.value)}
              placeholder="Ej: TiendaA, TiendaB, TiendaC"
            />
            <span className="form-field-example">Cada destino tiene un requerimiento de demanda</span>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Matriz de costos de envío</h3>
        <p className="form-section-helper">
          Costo unitario de transportar desde cada origen a cada destino.
        </p>
        <div className="form-table-wrap">
          <table className="form-table">
            <thead>
              <tr>
                <th>Origen \ Destino</th>
                {dests.map((d) => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {origins.map((o) => (
                <tr key={o}>
                  <td className="form-table-label">{o}</td>
                  {dests.map((d) => {
                    const key = `${o}_${d}`;
                    const isEmpty = touched && (!costs[key] || costs[key].trim() === '');
                    return (
                      <td key={key}>
                        <input
                          className={`form-input form-input--sm${isEmpty ? ' form-input--error' : ''}`}
                          value={costs[key] ?? ''}
                          onChange={(e) => setCosts((c) => ({ ...c, [key]: e.target.value }))}
                          placeholder="Costo"
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

      <div className="form-row">
        <label className="form-field form-field--half">
          <span className="form-label">Oferta por origen</span>
          <p className="form-section-helper" style={{ marginBottom: '0.5rem' }}>
            Capacidad disponible en cada origen.
          </p>
          {origins.map((o) => {
            const isEmpty = touched && (!supply[o] || supply[o].trim() === '');
            return (
              <div key={o} className="form-inline">
                <span className="form-coef-name">{o}:</span>
                <input
                  className={`form-input form-input--sm${isEmpty ? ' form-input--error' : ''}`}
                  value={supply[o] ?? ''}
                  onChange={(e) => setSupply((s) => ({ ...s, [o]: e.target.value }))}
                  placeholder="Cantidad disponible"
                />
              </div>
            );
          })}
        </label>
        <label className="form-field form-field--half">
          <span className="form-label">Demanda por destino</span>
          <p className="form-section-helper" style={{ marginBottom: '0.5rem' }}>
            Cantidad requerida en cada destino.
          </p>
          {dests.map((d) => {
            const isEmpty = touched && (!demand[d] || demand[d].trim() === '');
            return (
              <div key={d} className="form-inline">
                <span className="form-coef-name">{d}:</span>
                <input
                  className={`form-input form-input--sm${isEmpty ? ' form-input--error' : ''}`}
                  value={demand[d] ?? ''}
                  onChange={(e) => setDemand((s) => ({ ...s, [d]: e.target.value }))}
                  placeholder="Cantidad demandada"
                />
              </div>
            );
          })}
        </label>
      </div>

      <button type="submit" className="form-submit" disabled={disabled || hasErrors}>
        {disabled ? 'Resolviendo…' : 'Resolver transporte'}
      </button>
    </form>
  );
}
