from __future__ import annotations

import json
import os
from typing import Any


def build_solution_context(
    model_type: str,
    payload: dict[str, Any],
    result: dict[str, Any],
) -> dict[str, Any]:
    context = {
        "modelType": model_type,
        "objective": payload.get("objective", {}),
        "variables": payload.get("variables", []),
        "constraints": payload.get("constraints", []),
        "solution": {
            "status": result.get("status"),
            "objective_value": result.get("objective_value"),
            "variable_values": result.get("variables", []),
            "constraint_analysis": result.get("constraints", []),
        },
    }

    if model_type == "assignment":
        context["agents"] = payload.get("agents", [])
        context["tasks"] = payload.get("tasks", [])
        context["costs"] = payload.get("costs", {})

    if model_type == "transport":
        context["origins"] = payload.get("origins", [])
        context["destinations"] = payload.get("destinations", [])
        context["supply"] = payload.get("supply", {})
        context["demand"] = payload.get("demand", {})

    return context
