import { useState, useEffect } from 'react';
import type { ModelType } from '../types/api';
import { fetchModels } from '../api/client';

interface ModelCardInfo {
  value: ModelType;
  icon: string;
  title: string;
  desc: string;
  how: string;
  when: string;
}

const MODELS_INFO: Record<string, ModelCardInfo> = {
  classical: {
    value: 'classical',
    icon: '≡',
    title: 'Programación Lineal Clásica',
    desc: 'Define un problema de optimización con variables de decisión, una función objetivo lineal y restricciones lineales. El solver encuentra los valores óptimos maximizando o minimizando el resultado.',
    how: 'Cada variable representa una decisión (ej. producción de un producto). La función objetivo expresa la meta (ej. maximizar ganancia). Las restricciones limitan los recursos disponibles (ej. horas máquina, materiales).',
    when: 'Mezcla de productos, planificación de producción, optimización de carteras, dietas, logística.',
  },
  assignment: {
    value: 'assignment',
    icon: '⇉',
    title: 'Problema de Asignación',
    desc: 'Asigna un conjunto de agentes a un conjunto de tareas al mínimo costo posible. Cada agente realiza exactamente una tarea y cada tarea es realizada por exactamente un agente.',
    how: 'Ingresa los agentes y tareas como listas separadas por coma. Llena la matriz con el costo de asignar cada agente a cada tarea. El solver encuentra la combinación óptima uno a uno.',
    when: 'Asignar empleados a puestos, trabajadores a máquinas, vendedores a territorios, proyectos a equipos.',
  },
  transport: {
    value: 'transport',
    icon: '⤵',
    title: 'Problema de Transporte',
    desc: 'Determina la cantidad óptima de bienes a enviar desde orígenes hasta destinos, minimizando el costo total de transporte, respetando la oferta disponible y la demanda requerida.',
    how: 'Define los orígenes con su oferta (capacidad) y los destinos con su demanda. La matriz de costos representa el costo unitario de envío entre cada par origen-destino.',
    when: 'Cadenas de suministro, distribución de productos, logística de almacenes, rutas de entrega.',
  },
};

interface ModelCardsProps {
  onSelect: (m: ModelType) => void;
}

export function ModelCards({ onSelect }: ModelCardsProps) {
  const [available, setAvailable] = useState<ModelType[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels()
      .then((data) => {
        setAvailable(data.models);
        setLoading(false);
      })
      .catch(() => {
        setAvailable(null);
        setLoading(false);
      });
  }, []);

  const models = (available ?? Object.keys(MODELS_INFO) as ModelType[])
    .filter((m) => m in MODELS_INFO)
    .map((m) => MODELS_INFO[m]);

  if (loading) {
    return (
      <section className="model-cards">
        <div className="model-cards-head">
          <h2 className="model-cards-title">¿Qué problema quieres resolver?</h2>
          <p className="model-cards-desc">Cargando modelos disponibles…</p>
        </div>
        <div className="model-cards-grid">
          {[0, 1, 2].map((i) => (
            <article key={i} className="model-card">
              <div className="model-card-header">
                <div className="skeleton" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '8px' }} />
                <div className="skeleton" style={{ width: '60%', height: '1.25rem' }} />
              </div>
              <div className="skeleton" style={{ width: '100%', height: '3rem', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ width: '100%', height: '4rem' }} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="model-cards">
      <div className="model-cards-head">
        <h2 className="model-cards-title">¿Qué problema quieres resolver?</h2>
        <p className="model-cards-desc">
          Selecciona el tipo de modelo de optimización lineal. Cada uno incluye una descripción,
          cómo funciona y cuándo utilizarlo.
        </p>
      </div>
      <div className="model-cards-grid">
        {models.map((m) => (
          <article key={m.value} className="model-card">
            <div className="model-card-header">
              <span className="model-card-icon">{m.icon}</span>
              <h3 className="model-card-title">{m.title}</h3>
            </div>
            <p className="model-card-desc">{m.desc}</p>
            <div className="model-card-details">
              <div className="model-card-detail">
                <span className="model-card-detail-label">Cómo funciona</span>
                <p className="model-card-detail-text">{m.how}</p>
              </div>
              <div className="model-card-detail">
                <span className="model-card-detail-label">Cuándo usarlo</span>
                <p className="model-card-detail-text">{m.when}</p>
              </div>
            </div>
            <button className="model-card-btn" onClick={() => onSelect(m.value)}>
              Seleccionar modelo
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
