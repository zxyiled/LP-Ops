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


class TransportSolver(BaseSolver):
    def validate(self, payload: dict[str, Any]) -> None:
        origins = payload.get("origins", [])
        destinations = payload.get("destinations", [])
        costs = payload.get("costs", {})
        supply = payload.get("supply", {})
        demand = payload.get("demand", {})

        if not origins:
            raise ValueError("Se requiere al menos un origen.")
        if not destinations:
            raise ValueError("Se requiere al menos un destino.")

        for o in origins:
            if o not in supply:
                raise ValueError(f"Falta la oferta para el origen '{o}'")
            for d in destinations:
                key = f"{o}_{d}"
                if key not in costs:
                    raise ValueError(f"Falta el costo para {o} → {d}")

        for d in destinations:
            if d not in demand:
                raise ValueError(f"Falta la demanda para el destino '{d}'")

    def solve(self, request: UnifiedSolveRequest) -> UnifiedSolveResponse:
        payload = request.payload
        self.validate(payload)

        origins: list[str] = payload["origins"]
        destinations: list[str] = payload["destinations"]
        costs: dict[str, float] = payload["costs"]
        supply: dict[str, float] = payload["supply"]
        demand: dict[str, float] = payload["demand"]

        total_supply = sum(supply.values())
        total_demand = sum(demand.values())
        balanced = abs(total_supply - total_demand) < 1e-6

        model = pulp.LpProblem("Transporte", pulp.LpMinimize)

        x = {}
        for o in origins:
            for d in destinations:
                name = f"{o}_{d}"
                x[name] = pulp.LpVariable(name, lowBound=0)

        model += pulp.lpSum(
            costs.get(f"{o}_{d}", 0) * x[f"{o}_{d}"]
            for o in origins for d in destinations
        )

        for o in origins:
            model += (
                pulp.lpSum(x[f"{o}_{d}"] for d in destinations) <= supply[o],
                f"supply_{o}",
            )

        for d in destinations:
            model += (
                pulp.lpSum(x[f"{o}_{d}"] for o in origins) >= demand[d],
                f"demand_{d}",
            )

        solver = pulp.PULP_CBC_CMD(msg=False)
        model.solve(solver)

        status = pulp.LpStatus.get(model.status, "Undefined")
        status_label = PULP_STATUS_LABELS.get(status, status)
        is_optimal = status == "Optimal"

        variable_results = []
        objective_value = None

        if is_optimal:
            objective_value = float(pulp.value(model.objective))
            for o in origins:
                for d in destinations:
                    name = f"{o}_{d}"
                    val = float(pulp.value(x[name]) or 0)
                    variable_results.append({
                        "name": name,
                        "origin": o,
                        "destination": d,
                        "value": val,
                        "cost": costs.get(name, 0),
                    })

        total_shipped = sum(
            v["value"] for v in variable_results
        ) if variable_results else 0

        interpretation = self._build_interpretation(
            status_label, objective_value, balanced, total_supply, total_demand, total_shipped
        )

        recommendations = self._build_recommendations(
            status, is_optimal, balanced, variable_results
        )

        routes = [
            v for v in variable_results if v["value"] > 1e-6
        ] if is_optimal else []

        return UnifiedSolveResponse(
            modelType="transport",
            status=status.lower().replace(" ", "_"),
            status_label=status_label,
            is_optimal=is_optimal,
            objective_value=objective_value,
            variables=variable_results,
            interpretation=interpretation,
            recommendations=recommendations,
            results={
                "routes": routes,
                "origins": origins,
                "destinations": destinations,
                "supply": supply,
                "demand": demand,
                "balanced": balanced,
                "total_supply": total_supply,
                "total_demand": total_demand,
            },
            visualization={
                "origins": origins,
                "destinations": destinations,
                "supply": supply,
                "demand": demand,
                "routes": routes,
                "total_cost": objective_value,
            },
        )

    @staticmethod
    def _build_interpretation(
        status_label: str,
        objective_value: float | None,
        balanced: bool,
        total_supply: float,
        total_demand: float,
        total_shipped: float,
    ) -> str:
        if objective_value is None:
            msg = f"El modelo terminó con estado {status_label}."
            if not balanced:
                msg += (
                    f" El problema está desbalanceado: oferta total={total_supply:.2f}, "
                    f"demanda total={total_demand:.2f}. Agrega un origen o destino ficticio."
                )
            return msg

        balance_msg = (
            "El problema está balanceado."
            if balanced
            else f"El problema está desbalanceado (oferta={total_supply:.2f}, demanda={total_demand:.2f})."
        )
        return (
            f"El costo óptimo de transporte es {objective_value:.2f}. "
            f"Se transportan {total_shipped:.2f} unidades en total. {balance_msg}"
        )

    @staticmethod
    def _build_recommendations(
        status: str, is_optimal: bool, balanced: bool, variables: list[dict],
    ) -> list[dict]:
        recs = []
        if not is_optimal:
            recs.append({
                "title": "Sin solución óptima",
                "description": "El modelo no pudo encontrar una solución óptima. Verifica ofertas, demandas y costos.",
                "severity": "warning",
            })
            return recs

        recs.append({
            "title": "Solución óptima encontrada",
            "description": f"Se encontró el plan óptimo de transporte con costo mínimo.",
            "severity": "success",
        })

        if not balanced:
            recs.append({
                "title": "Problema desbalanceado",
                "description": (
                    "La oferta total no iguala la demanda total. "
                    "Considera agregar orígenes o destinos ficticios para balancear."
                ),
                "severity": "warning",
            })

        routes = [v for v in variables if v["value"] > 1e-6]
        if routes:
            max_route = max(routes, key=lambda v: v["value"])
            recs.append({
                "title": "Ruta con mayor flujo",
                "description": (
                    f"{max_route['origin']} → {max_route['destination']} "
                    f"tiene el mayor flujo ({max_route['value']:.2f} unidades). "
                    "Asegúrate de que la capacidad sea suficiente."
                ),
                "severity": "info",
            })

            max_cost_route = max(routes, key=lambda v: v["cost"])
            recs.append({
                "title": "Ruta más costosa",
                "description": (
                    f"{max_cost_route['origin']} → {max_cost_route['destination']} "
                    f"tiene el costo unitario más alto ({max_cost_route['cost']:.2f}). "
                    "Evalúa rutas alternativas."
                ),
                "severity": "info",
            })

        return recs
