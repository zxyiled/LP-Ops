from __future__ import annotations

import json
import os
from typing import Any

from backend.adapters.ai.build_context import build_solution_context


async def analyze_solution(
    model_type: str,
    payload: dict[str, Any],
    result: dict[str, Any],
) -> dict[str, Any] | None:
    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENCODE_API_KEY")
    if not api_key:
        return _fallback_analysis(result)

    context = build_solution_context(model_type, payload, result)
    prompt = _build_prompt(context)

    try:
        response = await _call_ai_service(prompt, api_key)
        return _parse_response(response)
    except Exception:
        return _fallback_analysis(result)


def _build_prompt(context: dict[str, Any]) -> str:
    return f"""
Eres un analista experto en Investigación de Operaciones. Analiza la siguiente solución de optimización lineal y genera insights.

Contexto del modelo:
```json
{json.dumps(context, indent=2, ensure_ascii=False)}
```

Genera un análisis estructurado con:
1. **Resumen ejecutivo**: explicación breve de la solución
2. **Cuellos de botella**: restricciones críticas que limitan el resultado
3. **Recomendaciones**: acciones concretas para mejorar
4. **Riesgos**: puntos a considerar

Responde en español con un JSON con la siguiente estructura:
{{"insights": [{{"title": "...", "description": "...", "severity": "info|warning|success"}}]}}
"""


async def _call_ai_service(prompt: str, api_key: str) -> str:
    import httpx

    endpoint = os.environ.get("AI_ENDPOINT", "https://api.openai.com/v1/chat/completions")
    model = os.environ.get("AI_MODEL", "gpt-4o-mini")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            endpoint,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


def _parse_response(response: str) -> dict[str, Any]:
    cleaned = response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())


def _fallback_analysis(result: dict[str, Any]) -> dict[str, Any]:
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

    constraints = result.get("constraints", [])
    binding = [c for c in constraints if c.get("is_binding")]

    if binding:
        names = ", ".join(c["name"] for c in binding[:3])
        insights.append({
            "title": "Restricciones críticas detectadas",
            "description": f"Las restricciones {names} están activas. Son los límites que determinan la solución actual.",
            "severity": "warning",
        })

    return {"insights": insights}
