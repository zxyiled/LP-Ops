import { useState, useMemo, useCallback } from "react";

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const defaultExample = () => ({
  origins: ["Planta 1", "Planta 2", "Planta 3"],
  destinations: ["CD 1", "CD 2", "CD 3"],
  costData: { "Planta 1": [8, 6, 10], "Planta 2": [9, 12, 13], "Planta 3": [14, 9, 16] },
  supply: { "Planta 1": 120, "Planta 2": 80, "Planta 3": 100 },
  demand: { "CD 1": 150, "CD 2": 70, "CD 3": 80 },
  context: "Una empresa tiene 3 plantas de producción y 3 centros de distribución. Debe determinar cuántas unidades enviar de cada planta a cada centro para minimizar el costo total de transporte, respetando la capacidad de oferta de cada planta y la demanda de cada centro.",
});

export default function TransportForm({ onSolve, isLoading, error }) {
  const [origins, setOrigins] = useState(defaultExample().origins);
  const [destinations, setDestinations] = useState(defaultExample().destinations);
  const [costData, setCostData] = useState(defaultExample().costData);
  const [supply, setSupply] = useState(defaultExample().supply);
  const [demand, setDemand] = useState(defaultExample().demand);
  const [context, setContext] = useState(defaultExample().context);

  const totalSupply = useMemo(() =>
    Object.values(supply).reduce((a, b) => a + toNumber(b), 0), [supply]);
  const totalDemand = useMemo(() =>
    Object.values(demand).reduce((a, b) => a + toNumber(b), 0), [demand]);
  const balanced = Math.abs(totalSupply - totalDemand) < 1e-6;

  const loadExample = useCallback(() => {
    const ex = defaultExample();
    setOrigins(ex.origins);
    setDestinations(ex.destinations);
    setCostData(ex.costData);
    setSupply(ex.supply);
    setDemand(ex.demand);
    setContext(ex.context);
  }, []);

  const updateCost = useCallback((oi, di, value) => {
    setCostData((prev) => ({
      ...prev,
      [origins[oi]]: prev[origins[oi]].map((c, i) => (i === di ? value : c)),
    }));
  }, [origins]);

  const addOrigin = useCallback(() => {
    const name = `Origen ${origins.length + 1}`;
    setOrigins((p) => [...p, name]);
    setCostData((p) => ({ ...p, [name]: destinations.map(() => 0) }));
    setSupply((p) => ({ ...p, [name]: 0 }));
  }, [origins, destinations]);

  const removeOrigin = useCallback((idx) => {
    if (origins.length <= 1) return;
    const name = origins[idx];
    setOrigins((p) => p.filter((_, i) => i !== idx));
    setCostData((p) => { const n = { ...p }; delete n[name]; return n; });
    setSupply((p) => { const n = { ...p }; delete n[name]; return n; });
  }, [origins]);

  const addDestination = useCallback(() => {
    const name = `Destino ${destinations.length + 1}`;
    setDestinations((p) => [...p, name]);
    setCostData((p) => {
      const n = { ...p };
      origins.forEach((o) => { n[o] = [...(n[o] || []), 0]; });
      return n;
    });
    setDemand((p) => ({ ...p, [name]: 0 }));
  }, [origins, destinations]);

  const removeDestination = useCallback((idx) => {
    if (destinations.length <= 1) return;
    const name = destinations[idx];
    setDestinations((p) => p.filter((_, i) => i !== idx));
    setCostData((p) => {
      const n = { ...p };
      origins.forEach((o) => { n[o] = n[o].filter((_, i) => i !== idx); });
      return n;
    });
    setDemand((p) => { const n = { ...p }; delete n[name]; return n; });
  }, [origins, destinations]);

  const supplyConstraintLines = useMemo(() =>
    origins.map((o) => {
      const terms = destinations.map((d) => `${o}_${d}`).join(" + ");
      return { label: `Oferta: ${o}`, text: `${terms} ≤ ${supply[o] ?? 0}` };
    }),
  [origins, destinations, supply]);

  const demandConstraintLines = useMemo(() =>
    destinations.map((d) => {
      const terms = origins.map((o) => `${o}_${d}`).join(" + ");
      return { label: `Demanda: ${d}`, text: `${terms} ≥ ${demand[d] ?? 0}` };
    }),
  [origins, destinations, demand]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    const costs = {};
    origins.forEach((o) => destinations.forEach((d, di) => {
      costs[`${o}_${d}`] = toNumber(costData[o]?.[di] ?? 0);
    }));

    const sData = {};
    origins.forEach((o) => { sData[o] = toNumber(supply[o]); });

    const dData = {};
    destinations.forEach((d) => { dData[d] = toNumber(demand[d]); });

    onSolve({
      modelType: "transport",
      payload: {
        origins,
        destinations,
        costs,
        supply: sData,
        demand: dData,
        context: context.trim() || undefined,
        constraints: [...supplyConstraintLines, ...demandConstraintLines].map((c) => c.text),
      },
    });
  }, [origins, destinations, costData, supply, demand, context, supplyConstraintLines, demandConstraintLines, onSolve]);

  return (
    <form className="problem-form" onSubmit={handleSubmit}>
      <div className="form-card">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Transporte</p>
            <h2>Orígenes, destinos y costos</h2>
          </div>
          <button className="ghost-button" type="button" onClick={loadExample}>Cargar ejemplo</button>
        </div>
        <label>
          Contexto breve
          <textarea value={context} onChange={(e) => setContext(e.target.value)}
            placeholder="Describe plantas, centros de distribución, costos y objetivo."
            rows={2} />
        </label>

        {!balanced && (
          <div className="balance-alert">
            <strong>Problema desbalanceado</strong>
            <span>Oferta total: {totalSupply.toFixed(2)} | Demanda total: {totalDemand.toFixed(2)}</span>
          </div>
        )}
        {balanced && (
          <div className="balance-ok">
            <strong>Problema balanceado</strong>
            <span>Oferta = Demanda = {totalSupply.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="form-card wide-card">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Matriz de costos</p>
            <h2>Costos de transporte</h2>
          </div>
          <div className="transport-toolbar">
            <button className="primary-button small" type="button" onClick={addOrigin}>+ Origen</button>
            <button className="primary-button small" type="button" onClick={addDestination}>+ Destino</button>
          </div>
        </div>

        <div className="table-wrapper editable">
          <table>
            <thead>
              <tr>
                <th>Origen \ Destino</th>
                {destinations.map((d, di) => (
                  <th key={di}>{d}
                    <button className="icon-button mini" type="button" onClick={() => removeDestination(di)}>×</button>
                  </th>
                ))}
                <th>Oferta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {origins.map((o, oi) => (
                <tr key={o}>
                  <td>{o}
                    <button className="icon-button mini" type="button" onClick={() => removeOrigin(oi)}>×</button>
                  </td>
                  {destinations.map((d, di) => (
                    <td key={di}>
                      <input type="number" step="any" value={costData[o]?.[di] ?? 0}
                        onChange={(e) => updateCost(oi, di, e.target.value)} />
                    </td>
                  ))}
                  <td>
                    <input type="number" step="any" value={supply[o] ?? 0}
                      onChange={(e) => setSupply((p) => ({ ...p, [o]: e.target.value }))} />
                  </td>
                  <td>
                    <button className="icon-button" type="button" onClick={() => removeOrigin(oi)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Demanda</strong></td>
                {destinations.map((d, di) => (
                  <td key={di}>
                    <input type="number" step="any" value={demand[d] ?? 0}
                      onChange={(e) => setDemand((p) => ({ ...p, [d]: e.target.value }))} />
                  </td>
                ))}
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="form-card">
        <div className="section-heading">
          <p className="eyebrow">Restricciones del modelo</p>
          <h2>Restricciones generadas automáticamente</h2>
        </div>
        <div className="constraints-list">
          {supplyConstraintLines.map((c, i) => (
            <div key={`s-${i}`} className="constraint-line">
              <code>{c.label}:</code>
              <span>{c.text}</span>
            </div>
          ))}
          {demandConstraintLines.map((c, i) => (
            <div key={`d-${i}`} className="constraint-line">
              <code>{c.label}:</code>
              <span>{c.text}</span>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <button className="solve-button" type="submit" disabled={isLoading}>
        {isLoading ? "Resolviendo..." : "Resolver transporte"}
      </button>
    </form>
  );
}
