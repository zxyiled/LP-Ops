from __future__ import annotations

import json
import subprocess
from typing import Any

OPencode_RUN_ARGS = [
    "opencode",
    "run",
    "--format", "json",
    "--dangerously-skip-permissions",
]


def analyze_with_opencode(context: dict[str, Any]) -> dict[str, Any] | None:
    try:
        subprocess.run(["which", "opencode"], capture_output=True, check=True)
    except subprocess.CalledProcessError:
        return None

    prompt = _build_prompt(context)

    try:
        proc = subprocess.run(
            OPencode_RUN_ARGS,
            input=prompt,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except subprocess.TimeoutExpired:
        return _fallback(context)
    except Exception:
        return _fallback(context)

    if proc.returncode != 0:
        return _fallback(context)

    text = _extract_text_from_ndjson(proc.stdout)
    if not text:
        return _fallback(context)

    return _parse_insights(text, context)


def _build_prompt(context: dict[str, Any]) -> str:
    return f"""
Eres un analista experto en Investigación de Operaciones integrado como motor de análisis interno de una aplicación web.

Contexto completo del modelo:
```json
{json.dumps(context, indent=2, ensure_ascii=False)}
```

Analiza la solución y genera insights estructurados.

Debes responder ÚNICAMENTE con un objeto JSON válido, sin markdown, sin bloques ```, sin explicaciones adicionales.
No uses herramientas, no ejecutes código, solo analiza el contexto proporcionado.

Formato requerido (respetar exactamente):
{{"insights": [{{"title": "título corto", "description": "explicación detallada", "severity": "info|warning|success"}}]}}

Reglas:
- Entre 2 y 5 insights
- "severity" debe ser exactamente "info", "warning" o "success"
- "title" debe ser corto y descriptivo (max 60 chars)
- "description" debe ser útil y accionable (2-3 oraciones)
- Si la solución es óptima, incluye un insight de tipo "success" destacando el valor objetivo
- Si hay restricciones binding (críticas), incluye un insight "warning" señalándolas
- Si hay holgura en recursos, menciona cuáles están siendo infrautilizados
- Para problemas de asignación, destaca la asignación más costosa/menos eficiente
- Para problemas de transporte, menciona rutas con mayor flujo y eficiencia general
"""


def _extract_text_from_ndjson(output: str) -> str | None:
    for line in output.strip().splitlines():
        if not line.strip():
            continue
        try:
            event = json.loads(line)
            if event.get("type") == "text":
                return event.get("part", {}).get("text", "")
        except (json.JSONDecodeError, KeyError):
            continue
    return None


def _parse_insights(text: str, context: dict[str, Any]) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return _fallback(context)

    insights = data.get("insights", [])
    if not isinstance(insights, list) or len(insights) == 0:
        return _fallback(context)

    return {"insights": insights}


def _fallback(context: dict[str, Any]) -> dict[str, Any]:
    result = context.get("solution", {})
    insights = []

    if result.get("is_optimal"):
        insights.append({
            "title": "Solución óptima validada",
            "description": "El solver encontró una solución óptima. Los valores de las variables maximizan o minimizan la función objetivo dentro de las restricciones planteadas.",
            "severity": "success",
        })
    else:
        insights.append({
            "title": "Sin solución óptima",
            "description": "El modelo no pudo encontrar una solución óptima. Revisa restricciones contradictorias o variables sin acotar.",
            "severity": "warning",
        })

    constraints = result.get("constraint_analysis", [])
    binding = [c for c in constraints if c.get("is_binding")]
    if binding:
        names = ", ".join(c["name"] for c in binding[:3])
        insights.append({
            "title": "Restricciones críticas detectadas",
            "description": f"Las restricciones {names} están activas. Son los límites que determinan la solución actual.",
            "severity": "warning",
        })

    return {"insights": insights}
