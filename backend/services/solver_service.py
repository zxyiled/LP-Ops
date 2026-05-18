from __future__ import annotations

from typing import Dict, cast

import pulp

from backend.schemas.problem import (
    ConstraintResult,
    LinearProblemRequest,
    SolveResponse,
    VariableResult,
)
from backend.services.recommendations import build_recommendations

PULP_STATUS_LABELS: Dict[str, str] = {
    "Optimal": "Óptima",
    "Infeasible": "Infactible",
    "Unbounded": "Ilimitada",
    "Undefined": "No definida",
    "Not Solved": "No resuelta",
}


class SolverService:
    """Builds and solves linear programming models using PuLP/CBC."""

    def solve(self, request: LinearProblemRequest) -> SolveResponse:
        sense = (
            pulp.LpMaximize
            if request.objective.sense == "maximize"
            else pulp.LpMinimize
        )
        model = pulp.LpProblem(request.title, sense)

        pulp_variables = {}
        for variable in request.variables:
            category = self._map_category(variable.category)
            lower_bound = 0 if variable.category == "binary" else variable.lower_bound
            upper_bound = 1 if variable.category == "binary" else variable.upper_bound
            pulp_variables[variable.name] = pulp.LpVariable(
                variable.name,
                lowBound=lower_bound,
                upBound=upper_bound,
                cat=category,
            )

        objective_expression = pulp.lpSum(
            request.objective.coefficients.get(variable.name, 0.0)
            * pulp_variables[variable.name]
            for variable in request.variables
        )
        model += objective_expression, "Función objetivo"

        for constraint in request.constraints:
            expression = pulp.lpSum(
                constraint.coefficients.get(variable.name, 0.0)
                * pulp_variables[variable.name]
                for variable in request.variables
            )
            if constraint.operator == "<=":
                model += expression <= constraint.rhs, constraint.name
            elif constraint.operator == ">=":
                model += expression >= constraint.rhs, constraint.name
            else:
                model += expression == constraint.rhs, constraint.name

        solver = pulp.PULP_CBC_CMD(msg=False)
        model.solve(solver)

        status = pulp.LpStatus.get(model.status, "Undefined")
        status_label = PULP_STATUS_LABELS.get(status, status)
        is_optimal = status == "Optimal"

        variable_results: list[VariableResult] = []
        constraint_results: list[ConstraintResult] = []
        objective_value = None

        if is_optimal:
            objective_value = float(cast(float, pulp.value(model.objective)))
            variable_results = self._build_variable_results(request, pulp_variables)
            constraint_results = self._build_constraint_results(request, model)

        interpretation = self._build_interpretation(
            request, status_label, objective_value, variable_results
        )
        recommendations = build_recommendations(
            problem=request,
            status=status,
            objective_value=objective_value,
            variables=variable_results,
            constraints=constraint_results,
        )

        return SolveResponse(
            status=status.lower().replace(" ", "_"),
            status_label=status_label,
            is_optimal=is_optimal,
            objective_value=objective_value,
            variables=variable_results,
            constraints=constraint_results,
            interpretation=interpretation,
            recommendations=recommendations,
        )

    @staticmethod
    def _map_category(category: str) -> str:
        if category == "integer":
            return pulp.LpInteger
        if category == "binary":
            return pulp.LpBinary
        return pulp.LpContinuous

    @staticmethod
    def _build_variable_results(
        request: LinearProblemRequest, pulp_variables: dict
    ) -> list[VariableResult]:
        results = []
        for variable in request.variables:
            value = float(pulp.value(pulp_variables[variable.name]) or 0.0)
            coefficient = float(request.objective.coefficients.get(variable.name, 0.0))
            results.append(
                VariableResult(
                    name=variable.name,
                    value=value,
                    objective_coefficient=coefficient,
                    contribution=value * coefficient,
                )
            )
        return results

    @staticmethod
    def _build_constraint_results(
        request: LinearProblemRequest, model: pulp.LpProblem
    ) -> list[ConstraintResult]:
        results = []
        for constraint in request.constraints:
            activity = sum(
                constraint.coefficients.get(variable.name, 0.0)
                * float(model.variablesDict()[variable.name].value() or 0.0)
                for variable in request.variables
            )

            if constraint.operator == "<=":
                slack = constraint.rhs - activity
            elif constraint.operator == ">=":
                slack = activity - constraint.rhs
            else:
                slack = abs(activity - constraint.rhs)

            pulp_constraint = model.constraints.get(constraint.name)
            shadow_price = (
                getattr(pulp_constraint, "pi", None)
                if pulp_constraint is not None
                else None
            )

            results.append(
                ConstraintResult(
                    name=constraint.name,
                    operator=constraint.operator,
                    rhs=constraint.rhs,
                    activity=activity,
                    slack=slack,
                    is_binding=abs(slack) <= 1e-6,
                    shadow_price=None if shadow_price is None else float(shadow_price),
                )
            )
        return results

    @staticmethod
    def _build_interpretation(
        request: LinearProblemRequest,
        status_label: str,
        objective_value: float | None,
        variables: list[VariableResult],
    ) -> str:
        if objective_value is None:
            return (
                f"El modelo terminó con estado {status_label}. Revisa restricciones contradictorias, "
                "variables sin límites o recursos insuficientes para encontrar una solución óptima."
            )

        action = "maximizar" if request.objective.sense == "maximize" else "minimizar"
        top_variable = max(
            variables, key=lambda item: abs(item.contribution), default=None
        )
        top_text = ""
        if top_variable:
            top_text = (
                f" La variable {top_variable.name} aporta {top_variable.contribution:.2f} "
                "al valor de la función objetivo."
            )
        return (
            f"Para {action} el modelo, el valor óptimo de Z es {objective_value:.2f}. "
            "Los valores sugeridos para cada variable aparecen en la tabla de resultados."
            f"{top_text}"
        )
