# LP-Ops · Linear Programming Optimization Solver

Aplicación web interactiva para resolver problemas de **Programación Lineal**, **Asignación** y **Transporte**. Desarrollada como Proyecto Integrador (PIA) para la unidad de aprendizaje de Investigación de Operaciones.

---

## Funcionalidades

- **Modelo Clásico (LP)** — Variables continuas, enteras y binarias; función objetivo _maximize_ / _minimize_; restricciones ≤, ≥, = con holgura y precio sombra.
- **Modelo de Asignación** — Asignación óptima uno-a-uno entre agentes y tareas minimizando costo total.
- **Modelo de Transporte** — Plan óptimo de distribución entre orígenes y destinos con visualización SVG.
- **Diagrama de Transporte** — Mapa de flujo interactivo con rutas activas/inactivas, barras de utilización.
- **AI Insights** — Análisis inteligente de la solución mediante agente autónomo (opencode) con sugerencias accionables.
- **Recomendaciones** — Tarjetas con recomendaciones automáticas para cada tipo de modelo.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.12+, FastAPI, Pydantic, PuLP (CBC solver) |
| Frontend | React 19, TypeScript 6, Vite 8 |
| UI | CSS modules con diseño glassmorphism |
| AI | opencode (agente autónomo para análisis de soluciones) |

---

## Estructura del Proyecto

```
backend/
├── main.py                         # Punto de entrada FastAPI
├── routers/
│   ├── solve.py                    # Endpoints unificados (/api/solve, /api/models, /api/solve/{id}/ai)
│   └── solver.py                   # Endpoint legacy (/api/solver/solve)
├── schemas/
│   ├── problem.py                  # Modelos Pydantic para LP clásico
│   └── unified.py                  # Modelos unificados (request/response)
├── services/
│   ├── solver_service.py           # Motor PuLP (construcción y solución de modelos)
│   ├── recommendations.py          # Generación de recomendaciones
│   └── ai/
│       ├── analyzer.py             # Orquestador de análisis AI
│       └── opencode_analyzer.py    # Integración con opencode CLI
├── adapters/ai/
│   └── build_context.py            # Construcción de contexto para AI
└── solvers/
    ├── base.py                     # Clase abstracta BaseSolver
    ├── registry.py                 # Registro de solvers
    ├── status.py                   # Mapeo de estados PuLP → español
    ├── classical/solver.py         # Solver de LP clásico
    ├── assignment/solver.py        # Solver de asignación
    └── transport/solver.py         # Solver de transporte

frontend/
├── src/
│   ├── main.tsx                    # Punto de entrada React
│   ├── App.tsx                     # Máquina de estados (select → form → solving → result)
│   ├── api/client.ts               # Cliente HTTP (solve, polling AI, health)
│   ├── types/api.ts                # Tipos TypeScript (request/response)
│   ├── hooks/usePollAi.ts          # Hook de polling para AI Insights
│   ├── constants.ts                # Iconos por severidad
│   ├── index.css                   # Estilos globales (glassmorphism, animaciones)
│   └── components/
│       ├── ModelCards.tsx          # Pantalla de selección de modelo
│       ├── ProblemForm.tsx         # Dispatching a formularios
│       ├── ClassicalForm.tsx       # Formulario de LP clásico
│       ├── AssignmentForm.tsx      # Formulario de asignación
│       ├── TransportForm.tsx       # Formulario de transporte
│       ├── ResultsPanel.tsx        # Panel de resultados
│       ├── InterpretationBlock.tsx # Interpretación textual
│       ├── VariableTable.tsx       # Tabla de variables
│       ├── ConstraintTable.tsx     # Tabla de restricciones
│       ├── TransportDiagram.tsx    # Diagrama SVG de transporte
│       ├── RecommendationsList.tsx # Lista de recomendaciones
│       ├── AiInsight.tsx           # AI Insights (polling + cards)
│       ├── Skeleton.tsx            # Estados de carga
│       ├── ErrorBoundary.tsx       # Manejo de errores
│       └── Header.tsx              # Barra superior
└── index.html, vite.config.ts, tsconfig.json, package.json
```

---

## Flujo de la Aplicación

```
Usuario → ModelCards → selecciona modelo
    │
    ▼
Formulario específico → completa datos → "Resolver"
    │
    ├─► POST /api/solve ──► Registry ──► Solver específico (PuLP)
    │                           │
    │                           ▼
    │                       UnifiedSolveResponse
    │                           │
    │                           ├─ solve_id ──────────────────► _ai_results[pending]
    │                           │                                  │
    │                           ▼                                  ▼
    │                       ResultsPanel ←──┬── Interpretation   asyncio.create_task()
    │                           │           ├── VariableTable        │
    │                           │           ├── ConstraintTable      ▼
    │                           │           ├── TransportDiagram  analyze_with_opencode()
    │                           │           ├── Recommendations       │
    │                           │           └── AiInsight            ▼
    │                           │                                    │
    │                           ▼                              _ai_results[done]
    │                     GET /api/solve/{id}/ai ◄────── polling cada 2s
    │                           │
    │                           ▼
    │                     Renderiza insights ───► InsightCard (severidad, título, descripción)
    │
    ▼
"← Nuevo problema" → reinicia al selector
```

### Detalle del flujo de AI Insights

1. `POST /api/solve` inicia `asyncio.create_task(_run_ai_analysis(solve_id, ...))`
2. `analyze_solution()` construye contexto y llama `analyze_with_opencode(context)` en un thread
3. El thread lanza `opencode run --format json` con un prompt que pide JSON estructurado
4. Un hilo lector consume stdout buscando el evento `"type":"text"` (streaming NDJSON)
5. Si opencode responde con JSON válido → `{"insights": [...]}`
6. Si falla o expira (30s) → fallback determinístico con `_fallback_analysis()`
7. El resultado se almacena en `_ai_results[solve_id]` con `status: "done"`
8. El frontend (vía `usePollAi`) detecta `status: "done"` y renderiza las tarjetas

---

## Cómo Ejecutar

### Requisitos

- Python 3.12+
- Node.js 22+
- pnpm 10+

### Backend

```bash
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Documentación interactiva en `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

Abrir `http://localhost:5173` en el navegador.

La URL del backend se configura con la variable de entorno `VITE_API_URL` (por defecto `http://localhost:8000`).

### AI Insights (opcional)

Instalar [opencode](https://opencode.ai) para habilitar el análisis inteligente:

```bash
curl -sSf https://raw.githubusercontent.com/anomalyco/opencode/main/install.sh | sh
```

Si opencode no está instalado, el sistema usa el fallback determinístico.

### Scripts disponibles (frontend)

| Comando | Descripción |
|---|---|---|
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run build` | Type-check + build producción |
| `pnpm run lint` | ESLint |
| `pnpm run preview` | Preview del build de producción |

---

## API

### `GET /health`
```json
{"status": "ok"}
```

### `GET /api/models`
```json
{"models": ["classical", "assignment", "transport"]}
```

### `POST /api/solve`

```json
{
  "modelType": "transport",
  "payload": {
    "context": "Dos fábricas deben enviar productos a dos tiendas.",
    "origins": ["Fabrica1", "Fabrica2"],
    "destinations": ["TiendaA", "TiendaB"],
    "supply": {"Fabrica1": 100, "Fabrica2": 150},
    "demand": {"TiendaA": 80, "TiendaB": 170},
    "costs": {"Fabrica1_TiendaA": 10, "Fabrica1_TiendaB": 12, "Fabrica2_TiendaA": 8, "Fabrica2_TiendaB": 15}
  }
}
```

### `GET /api/solve/{solve_id}/ai`

```json
{"status": "done", "insights": [{"title": "...", "description": "...", "severity": "success"}]}
```

El endpoint retorna `"status": "pending"` mientras el análisis AI se ejecuta en segundo plano.

---

## Tipos de Modelo

### Clásico (LP)
- Variables continuas, enteras o binarias
- Función objetivo lineal
- Restricciones lineales ≤, ≥, =
- Holgura, precio sombra, restricciones binding

### Asignación
- N agentes ←→ N tareas (balanceado)
- Matriz de costos cuadrada
- Variable binaria por asignación
- Solución óptima uno-a-uno

### Transporte
- M orígenes ←→ N destinos
- Oferta y demanda por nodo
- Costo unitario por ruta
- Soporta problemas balanceados y no balanceados
- Visualización SVG con rutas y flujos
