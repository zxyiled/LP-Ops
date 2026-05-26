from __future__ import annotations

from typing import Any

import pulp

from backend.solvers.base import BaseSolver
from backend.schemas.unified import UnifiedSolveRequest, UnifiedSolveResponse

PULP_STATUS_LABELS: dict[str, str] = {
    "Optimal": "Óptima",
    "Infeasible": "Infactible",
    "Unbounded": "Ilimitada",
    "Undefined": "No definida",
    "Not Solved": "No resuelta",
}


class AssignmentSolver(BaseSolver):
    def validate(self, payload: dict[str, Any]) -> None:
        agents = payload.get("agents", [])
        tasks = payload.get("tasks", [])
        costs = payload.get("costs", {})

        if not agents:
            raise ValueError("Se requiere al menos un agente.")
        if not tasks:
            raise ValueError("Se requiere al menos una tarea.")
        if len(agents) != len(tasks):
            raise ValueError(
                f"El número de agentes ({len(agents)}) debe coincidir con el de tareas ({len(tasks)})."
            )

        for agent in agents:
            for task in tasks:
                key = f"{agent}_{task}"
                if key not in costs:
                    raise ValueError(f"Falta el costo para {agent} → {task}")

    def solve(self, request: UnifiedSolveRequest) -> UnifiedSolveResponse:
        payload = request.payload
        self.validate(payload)

        agents: list[str] = payload["agents"]
        tasks: list[str] = payload["tasks"]
        costs: dict[str, float] = payload["costs"]
        sense: str = payload.get("sense", "minimize")

        pulp_sense = pulp.LpMinimize if sense == "minimize" else pulp.LpMaximize
        model = pulp.LpProblem("Asignación", pulp_sense)

        x = {}
        for agent in agents:
            for task in tasks:
                name = f"{agent}_{task}"
                x[name] = pulp.LpVariable(name, cat=pulp.LpBinary)

        model += pulp.lpSum(costs.get(f"{a}_{t}", 0) * x[f"{a}_{t}"] for a in agents for t in tasks)

        for agent in agents:
            model += pulp.lpSum(x[f"{agent}_{t}"] for t in tasks) == 1, f"agent_{agent}"

        for task in tasks:
            model += pulp.lpSum(x[f"{a}_{task}"] for a in agents) == 1, f"task_{task}"

        solver = pulp.PULP_CBC_CMD(msg=False)
        model.solve(solver)

        status = pulp.LpStatus.get(model.status, "Undefined")
        status_label = PULP_STATUS_LABELS.get(status, status)
        is_optimal = status == "Optimal"

        variable_results = []
        objective_value = None

        if is_optimal:
            objective_value = float(pulp.value(model.objective))
            assignments = []
            for agent in agents:
                for task in tasks:
                    name = f"{agent}_{task}"
                    val = float(pulp.value(x[name]) or 0)
                    variable_results.append({
                        "name": name,
                        "agent": agent,
                        "task": task,
                        "value": val,
                        "cost": costs.get(name, 0),
                    })
                    if val > 0.5:
                        assignments.append({"agent": agent, "task": task, "cost": costs.get(name, 0)})

        interpretation = self._build_interpretation(
            sense, status_label, objective_value, variable_results
        )

        recommendations = self._build_recommendations(
            status, is_optimal, variable_results
        )

        return UnifiedSolveResponse(
            modelType="assignment",
            status=status.lower().replace(" ", "_"),
            status_label=status_label,
            is_optimal=is_optimal,
            objective_value=objective_value,
            variables=variable_results,
            interpretation=interpretation,
            recommendations=recommendations,
            results={
                "assignments": [
                    v for v in variable_results if v["value"] > 0.5
                ] if is_optimal else [],
                "agents": agents,
                "tasks": tasks,
            },
        )

    @staticmethod
    def _build_interpretation(
        sense: str, status_label: str, objective_value: float | None,
        variables: list[dict],
    ) -> str:
        if objective_value is None:
            return (
                f"El modelo terminó con estado {status_label}. Revisa que los costos "
                "sean correctos y que el problema esté bien formulado."
            )
        action = "maximizar" if sense == "maximize" else "minimizar"
        return (
            f"Para {action} la asignación, el valor óptimo es {objective_value:.2f}. "
            "Cada agente ha sido asignado a una tarea distinta."
        )

    @staticmethod
    def _build_recommendations(
        status: str, is_optimal: bool, variables: list[dict],
    ) -> list[dict]:
        recs = []
        if not is_optimal:
            recs.append({
                "title": "Sin solución óptima",
                "description": "El modelo no pudo encontrar una asignación óptima. Verifica los datos.",
                "severity": "warning",
            })
            return recs

        recs.append({
            "title": "Asignación óptima encontrada",
            "description": "Se encontró la combinación óptima de asignaciones que minimiza el costo total.",
            "severity": "success",
        })

        assigned = [v for v in variables if v["value"] > 0.5]
        if assigned:
            max_cost = max(assigned, key=lambda v: v["cost"])
            recs.append({
                "title": "Asignación más costosa",
                "description": (
                    f"{max_cost['agent']} → {max_cost['task']} tiene el costo más alto "
                    f"({max_cost['cost']:.2f}). Evaluar si se puede renegociar."
                ),
                "severity": "info",
            })

        return recs
