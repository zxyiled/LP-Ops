# Refactorización completa de aplicación de Programación Lineal (Frontend + Backend)

## Objetivo general

Refactorizar toda la aplicación para convertirla en una plataforma modular, escalable y guiada para resolver distintos tipos de modelos de Programación Lineal.

La aplicación debe iniciar preguntándole al usuario qué tipo de modelo desea resolver.

Debe soportar inicialmente:

- Programación Lineal Clásica
- Problema de Asignación
- Problema de Transporte

La arquitectura debe quedar preparada para agregar nuevos modelos en el futuro sin reescribir la lógica principal.

Además, integrar un agente IA (Opencode/OpenAI) capaz de analizar el modelo matemático, interpretar resultados, generar recomendaciones y devolver insights inteligentes al frontend.

---

# Requerimientos funcionales

## 1. Pantalla inicial de selección de modelo

Al entrar a la aplicación, mostrar una pantalla clara e intuitiva donde el usuario pueda seleccionar:

- Programación Lineal Clásica
- Asignación
- Transporte

La interfaz debe explicar brevemente:
- Qué resuelve cada modelo
- Cuándo se utiliza
- Qué datos necesitará ingresar el usuario

Usar tarjetas/cards visuales o un selector moderno y responsive.

---

# 2. Layout dinámico según el modelo seleccionado

El frontend debe renderizar formularios y layouts distintos dependiendo del modelo elegido.

---

## A. Modelo clásico

Debe permitir:

- Definir función objetivo
- Elegir maximización o minimización
- Agregar variables dinámicamente
- Agregar restricciones dinámicamente
- Elegir operadores (`<=`, `>=`, `=`)

La UI debe:
- Guiar paso a paso
- Explicar cómo ingresar coeficientes
- Validar entradas numéricas
- Permitir agregar/eliminar filas y columnas fácilmente

---

## B. Modelo de asignación

Debe permitir:

- Definir matriz de costos/beneficios
- Definir agentes y tareas dinámicamente
- Seleccionar minimización o maximización

La interfaz debe:
- Mostrar una tabla editable tipo spreadsheet
- Explicar qué representa cada fila y columna
- Permitir agregar/eliminar agentes y tareas
- Validar dimensiones correctamente

---

## C. Modelo de transporte

Debe permitir:

- Definir orígenes y destinos
- Definir costos de transporte
- Definir oferta y demanda
- Detectar automáticamente si el problema está balanceado

La UI debe:
- Mostrar matriz interactiva
- Explicar claramente:
  - costos
  - oferta
  - demanda
- Permitir agregar/eliminar orígenes y destinos
- Mostrar alertas visuales si existe desbalance

Además:

- Generar automáticamente una representación visual/gráfica del modelo de transporte
- Mostrar nodos de origen y destino conectados visualmente
- Representar costos, oferta y demanda dentro del diagrama
- Resaltar visualmente la solución óptima encontrada
- Permitir visualizar rutas activas de transporte
- Actualizar dinámicamente la imagen/diagrama cuando el usuario cambie los datos

La visualización debe ser moderna, clara y educativa.

---

# 3. Modelos precargados (ejemplos)

Cada tipo de modelo debe incluir:

- Un ejemplo precargado funcional
- Datos reales o académicos entendibles
- Explicación del ejemplo

IMPORTANTE:

La aplicación NO debe limitarse a resolver únicamente el ejemplo precargado.

El usuario debe poder:
- Modificar el ejemplo
- Crear un modelo completamente nuevo desde cero
- Limpiar los datos
- Guardar configuraciones temporalmente

---

# 4. Experiencia de usuario (UX/UI)

La aplicación debe:

- Explicar al usuario qué hacer en cada paso
- Mostrar placeholders útiles
- Incluir tooltips o ayudas contextuales
- Tener mensajes de error claros
- Ser responsive
- Tener diseño moderno y limpio

Agregar:

- Indicadores visuales
- Steps/wizard si es necesario
- Botones claros:
  - Resolver
  - Limpiar
  - Cargar ejemplo
  - Agregar restricción
  - Agregar variable

---

# 5. Backend modular

Refactorizar el backend para que:

- Cada tipo de modelo tenga su propio módulo/solver
- Exista una interfaz común de resolución
- Sea sencillo agregar nuevos modelos en el futuro

Ejemplo conceptual:

```txt
/solvers
  /classical
  /assignment
  /transport
```

Crear:

- Validadores independientes
- Transformadores de datos
- Estructuras tipadas
- Manejo de errores robusto

---

# 6. API unificada

Crear una API consistente:

```http
POST /solve
```

El body debe indicar:

```json
{
  "modelType": "classical | assignment | transport",
  "payload": {}
}
```

El backend debe:
- Detectar el tipo de modelo
- Validar estructura
- Ejecutar el solver correcto
- Retornar resultados normalizados

---

# 7. Integración de Inteligencia Artificial (BONUS)

Integrar un agente IA (Opencode/OpenAI) para realizar análisis avanzados del modelo y la solución obtenida.

La aplicación debe:

1. Resolver matemáticamente el modelo
2. Construir automáticamente un contexto estructurado
3. Enviar dicho contexto al agente IA
4. Procesar la respuesta
5. Renderizar recomendaciones e insights en el frontend

---

## Información que debe enviarse al agente IA

Enviar un objeto estructurado con:

- Tipo de modelo
- Función objetivo
- Variables
- Restricciones
- Resultado óptimo
- Variables activas
- Costos
- Holguras
- Sensibilidad (si existe)
- Contexto de negocio opcional

Ejemplo:

```json
{
  "modelType": "transport",
  "objective": "Minimizar costos de distribución",
  "objectiveFunction": "10x11 + 12x12 + 8x21 + 15x22",
  "constraints": [
    "x11 + x12 <= 100",
    "x21 + x22 <= 150",
    "x11 + x21 >= 80",
    "x12 + x22 >= 170"
  ],
  "solution": {
    "optimalCost": 2450,
    "variables": {
      "x11": 80,
      "x12": 20,
      "x21": 0,
      "x22": 150
    }
  }
}
```

---

## El agente IA debe ser capaz de:

### Explicar la solución
Ejemplo:
- Explicar por qué ciertas variables fueron utilizadas
- Interpretar restricciones activas
- Explicar el comportamiento del modelo

### Detectar cuellos de botella
Ejemplo:
- Restricciones críticas
- Recursos saturados
- Dependencias fuertes

### Generar recomendaciones
Ejemplo:
- Reducir costos
- Redistribuir recursos
- Mejorar capacidad
- Minimizar riesgos

### Generar insights ejecutivos
Ejemplo:
- Dependencia excesiva de una ruta
- Infrautilización de recursos
- Oportunidades de optimización

---

## Renderizado de análisis IA en frontend

Mostrar visualmente:

- Cards de recomendaciones
- Insights automáticos
- Alertas
- KPIs
- Resumen ejecutivo
- Explicaciones paso a paso
- Riesgos detectados

La interfaz debe sentirse como una plataforma inteligente de apoyo a decisiones.

---

## Arquitectura recomendada para IA

NO enviar directamente el estado completo del frontend.

Crear una capa desacoplada:

```txt
/adapters
   /ai
      buildPrompt()
      normalizeResults()
      extractInsights()
```

Además:

```txt
/services
   /ai
      analyzeSolution()
      generateRecommendations()
      buildExecutiveSummary()
```

---

# 8. Resultados

Mostrar resultados de forma visual y educativa.

## Para modelo clásico:
- Valor óptimo
- Variables óptimas
- Estado de solución
- Tabla simplex si aplica

## Para asignación:
- Asignaciones óptimas
- Costo total
- Matriz resaltada

## Para transporte:
- Plan óptimo de envío
- Costo total
- Tabla de distribución
- Visualización gráfica del flujo de transporte
- Resaltado visual de rutas óptimas
- Imagen/diagrama actualizado dinámicamente

Además:
- Insights IA
- Recomendaciones automáticas
- Interpretación del resultado
- Alertas inteligentes

---

# 9. Arquitectura y calidad del código

Refactorizar siguiendo:

- Clean Architecture
- SOLID
- Componentización reutilizable
- Separación clara frontend/backend

## Frontend:
- Componentes reutilizables
- Formularios desacoplados
- Estado centralizado limpio
- Manejo correcto de formularios dinámicos

## Backend:
- Servicios desacoplados
- DTOs
- Validaciones
- Manejo de excepciones

---

# 10. Escalabilidad futura

La arquitectura debe permitir agregar fácilmente:

- Método gráfico
- Redes
- Programación entera
- Programación binaria
- Método dual
- Sensibilidad
- Simulación de escenarios
- Interpretación en lenguaje natural
- Generación automática de reportes PDF

Sin modificar significativamente la estructura existente.

---

# 11. Entregables esperados

El refactor debe incluir:

- Código limpio y documentado
- Mejoras visuales
- Arquitectura modular
- Formularios dinámicos
- Ejemplos precargados
- Validaciones robustas
- Explicaciones para el usuario
- Compatibilidad responsive
- Backend extensible
- Frontend mantenible
- Visualización gráfica del modelo de transporte
- Integración con IA
- Sistema de recomendaciones automáticas
- Insights inteligentes renderizados en frontend

Además:

- Explicar brevemente las decisiones arquitectónicas tomadas
- Documentar cómo agregar nuevos modelos en el futuro
- Mantener compatibilidad con la lógica actual siempre que sea posible
- Optimizar mantenibilidad y escalabilidad del proyecto

---

# Resultado esperado

La aplicación debe sentirse como una plataforma profesional e interactiva para resolver distintos tipos de problemas de optimización, guiando al usuario durante toda la construcción y resolución del modelo matemático.

El sistema debe combinar:

1. Solver matemático
2. Motor IA de interpretación
3. Visualización interactiva
4. Recomendaciones inteligentes

El modelo de transporte debe incluir además una representación visual dinámica y educativa del flujo entre orígenes y destinos.

