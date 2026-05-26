const models = [
  {
    id: "classical",
    title: "Programación Lineal Clásica",
    description:
      "Resuelve problemas de optimización con función objetivo lineal, variables de decisión y restricciones lineales.",
    when: "Úsalo cuando necesites maximizar ganancias o minimizar costos sujeto a recursos limitados.",
    data: "Variables de decisión, coeficientes de función objetivo, restricciones con operadores ≤, ≥, =.",
    icon: "Z",
  },
  {
    id: "assignment",
    title: "Problema de Asignación",
    description:
      "Asigna un conjunto de agentes a un conjunto de tareas al mínimo costo o máxima ganancia.",
    when: "Úsalo cuando cada agente debe realizar exactamente una tarea y cada tarea debe ser realizada por exactamente un agente.",
    data: "Matriz de costos/beneficios entre cada agente y cada tarea.",
    icon: "A",
  },
  {
    id: "transport",
    title: "Problema de Transporte",
    description:
      "Determina el plan óptimo de envío desde orígenes a destinos minimizando el costo total.",
    when: "Úsalo cuando tengas múltiples fuentes de oferta y múltiples puntos de demanda con costos de envío variables.",
    data: "Orígenes con su oferta, destinos con su demanda, matriz de costos de transporte.",
    icon: "T",
  },
];

export default function ModelSelector({ onSelect }) {
  return (
    <section className="model-selector">
      <div className="selector-header">
        <p className="eyebrow">LP-Ops v2</p>
        <h1>¿Qué modelo deseas resolver?</h1>
        <p>
          Selecciona el tipo de problema de optimización lineal que necesitas
          resolver.
        </p>
      </div>
      <div className="selector-grid">
        {models.map((model) => (
          <article
            key={model.id}
            className="model-card"
            onClick={() => onSelect(model.id)}
          >
            <div className="model-icon">{model.icon}</div>
            <h2>{model.title}</h2>
            <p className="model-desc">{model.description}</p>
            <div className="model-meta">
              <div className="model-meta-row">
                <span className="meta-label">¿Cuándo usarlo?</span>
                <span>{model.when}</span>
              </div>
              <div className="model-meta-row">
                <span className="meta-label">Datos necesarios</span>
                <span>{model.data}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
