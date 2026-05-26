from __future__ import annotations

import asyncio
import logging
from typing import Any

from backend.adapters.ai.build_context import build_solution_context
from backend.services.ai.opencode_analyzer import analyze_with_opencode

logger = logging.getLogger(__name__)


async def analyze_solution(
    model_type: str,
    payload: dict[str, Any],
    result: dict[str, Any],
) -> dict[str, Any] | None:
    context = build_solution_context(model_type, payload, result)

    try:
        ai_result = await asyncio.to_thread(analyze_with_opencode, context)
        if ai_result is not None:
            return ai_result
    except Exception:
        logger.exception("Error in AI analysis thread")

    return _fallback_analysis(result)


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
