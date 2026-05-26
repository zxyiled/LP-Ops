import { useState } from "react";

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const defaultExample = () => ({
  origins: ["Planta 1", "Planta 2", "Planta 3"],
  destinations: ["CD 1", "CD 2", "CD 3"],
  costData: {
    "Planta 1": [8, 6, 10],
    "Planta 2": [9, 12, 13],
    "Planta 3": [14, 9, 16],
  },
  supply: { "Planta 1": 120, "Planta 2": 80, "Planta 3": 100 },
  demand: { "CD 1": 150, "CD 2": 70, "CD 3": 80 },
});

export default function TransportForm({ onSolve, isLoading, error }) {
  const [origins, setOrigins] = useState(defaultExample().origins);
  const [destinations, setDestinations] = useState(defaultExample().destinations);
  const [costData, setCostData] = useState(defaultExample().costData);
  const [supply, setSupply] = useState(defaultExample().supply);
  const [demand, setDemand] = useState(defaultExample().demand);

  const totalSupply = Object.values(supply).reduce((a, b) => a + toNumber(b), 0);
  const totalDemand = Object.values(demand).reduce((a, b) => a + toNumber(b), 0);
  const balanced = Math.abs(totalSupply - totalDemand) < 1e-6;

  const loadExample = () => {
    const ex = defaultExample();
    setOrigins(ex.origins);
    setDestinations(ex.destinations);
    setCostData(ex.costData);
    setSupply(ex.supply);
    setDemand(ex.demand);
  };

  const updateCost = (oi, di, value) => {
    setCostData((prev) => ({
      ...prev,
      [origins[oi]]: prev[origins[oi]].map((c, i) => (i === di ? value : c)),
    }));
  };

  const addOrigin = () => {
    const name = `Origen ${origins.length + 1}`;
    setOrigins((prev) => [...prev, name]);
    setCostData((prev) => ({ ...prev, [name]: destinations.map(() => 0) }));
    setSupply((prev) => ({ ...prev, [name]: 0 }));
  };

  const removeOrigin = (idx) => {
    if (origins.length <= 1) return;
    const name = origins[idx];
    setOrigins((prev) => prev.filter((_, i) => i !== idx));
    setCostData((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setSupply((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const addDestination = () => {
    const name = `Destino ${destinations.length + 1}`;
    setDestinations((prev) => [...prev, name]);
    setCostData((prev) => {
      const next = { ...prev };
      origins.forEach((o) => {
        next[o] = [...(next[o] || []), 0];
      });
      return next;
    });
    setDemand((prev) => ({ ...prev, [name]: 0 }));
  };

  const removeDestination = (idx) => {
    if (destinations.length <= 1) return;
    const name = destinations[idx];
    setDestinations((prev) => prev.filter((_, i) => i !== idx));
    setCostData((prev) => {
      const next = { ...prev };
      origins.forEach((o) => {
        next[o] = next[o].filter((_, i) => i !== idx);
      });
      return next;
    });
    setDemand((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const costs = {};
    origins.forEach((o) =>
      destinations.forEach((d, di) => {
        costs[`${o}_${d}`] = toNumber(costData[o]?.[di] ?? 0);
      })
    );

    const supplyData = {};
    origins.forEach((o) => {
      supplyData[o] = toNumber(supply[o]);
    });

    const demandData = {};
    destinations.forEach((d) => {
      demandData[d] = toNumber(demand[d]);
    });

    onSolve({
      modelType: "transport",
      payload: {
        origins,
        destinations,
        costs,
        supply: supplyData,
        demand: demandData,
      },
    });
  };

  return (
    <form className="problem-form" onSubmit={handleSubmit}>
      <div className="form-card">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Transporte</p>
            <h2>Orígenes, destinos y costos</h2>
          </div>
          <button className="ghost-button" type="button" onClick={loadExample}>
            Cargar ejemplo
          </button>
        </div>

        {!balanced && (
          <div className="balance-alert">
            <strong>Problema desbalanceado</strong>
            <span>
              Oferta total: {totalSupply.toFixed(2)} | Demanda total:{" "}
              {totalDemand.toFixed(2)}
            </span>
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
            <button className="primary-button small" type="button" onClick={addOrigin}>
              + Origen
            </button>
            <button className="primary-button small" type="button" onClick={addDestination}>
              + Destino
            </button>
          </div>
        </div>

        <div className="table-wrapper editable">
          <table>
            <thead>
              <tr>
                <th>Origen \ Destino</th>
                {destinations.map((d, di) => (
                  <th key={di}>
                    {d}
                    <button
                      className="icon-button mini"
                      type="button"
                      onClick={() => removeDestination(di)}
                    >
                      ×
                    </button>
                  </th>
                ))}
                <th>Oferta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {origins.map((o, oi) => (
                <tr key={o}>
                  <td>{o}</td>
                  {destinations.map((d, di) => (
                    <td key={di}>
                      <input
                        type="number"
                        step="any"
                        value={costData[o]?.[di] ?? 0}
                        onChange={(e) => updateCost(oi, di, e.target.value)}
                      />
                    </td>
                  ))}
                  <td>
                    <input
                      type="number"
                      step="any"
                      value={supply[o] ?? 0}
                      onChange={(e) =>
                        setSupply((prev) => ({ ...prev, [o]: e.target.value }))
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => removeOrigin(oi)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Demanda</strong></td>
                {destinations.map((d, di) => (
                  <td key={di}>
                    <input
                      type="number"
                      step="any"
                      value={demand[d] ?? 0}
                      onChange={(e) =>
                        setDemand((prev) => ({ ...prev, [d]: e.target.value }))
                      }
                    />
                  </td>
                ))}
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <button className="solve-button" type="submit" disabled={isLoading}>
        {isLoading ? "Resolviendo..." : "Resolver transporte"}
      </button>
    </form>
  );
}
