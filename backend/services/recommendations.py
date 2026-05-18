from __future__ import annotations

from backend.schemas.problem import (
    ConstraintResult,
    LinearProblemRequest,
    Recommendation,
    VariableResult,
)


def build_recommendations(
    problem: LinearProblemRequest,
    status: str,
    objective_value: float | None,
    variables: list[VariableResult],
    constraints: list[ConstraintResult],
) -> list[Recommendation]:
    """Generate deterministic, explainable recommendations for academic LP analysis."""

    if status != "Optimal":
        return _recommend_for_non_optimal_status(status)

    recommendations: list[Recommendation] = [
        Recommendation(
            title="Solución óptima encontrada",
            description=(
                f"El modelo encontró una solución factible y óptima con Z = {objective_value:.2f}. "
                "Puedes usar estos valores como plan recomendado de decisión."
            ),
            severity="success",
        )
    ]

    positive_variables = [item for item in variables if abs(item.value) > 1e-6]
    if positive_variables:
        highest_impact = max(
            positive_variables, key=lambda item: abs(item.contribution)
        )
        recommendations.append(
            Recommendation(
                title="Variable con mayor impacto",
                description=(
                    f"{highest_impact.name} es la variable que más influye en Z, con una contribución "
                    f"aproximada de {highest_impact.contribution:.2f}. Analiza si conviene priorizarla "
                    "en la toma de decisiones."
                ),
                severity="info",
            )
        )
    else:
        recommendations.append(
            Recommendation(
                title="Variables en cero",
                description=(
                    "La solución óptima mantiene todas las variables en cero. Esto puede ocurrir cuando "
                    "los beneficios son bajos, los costos son altos o las restricciones son muy estrictas."
                ),
                severity="warning",
            )
        )

    binding_constraints = [
        constraint for constraint in constraints if constraint.is_binding
    ]
    if binding_constraints:
        names = ", ".join(constraint.name for constraint in binding_constraints[:3])
        recommendations.append(
            Recommendation(
                title="Restricciones críticas detectadas",
                description=(
                    f"Las restricciones {names} están activas o sin holgura. Son los límites que más "
                    "condicionan el resultado; si representan recursos, considera aumentarlos para evaluar mejoras."
                ),
                severity="warning",
            )
        )
    else:
        recommendations.append(
            Recommendation(
                title="Hay holgura disponible",
                description=(
                    "Ninguna restricción quedó completamente ajustada. Esto indica que existen recursos no utilizados "
                    "o margen operativo dentro del modelo planteado."
                ),
                severity="info",
            )
        )

    largest_slack = max(
        constraints, key=lambda constraint: constraint.slack, default=None
    )
    if largest_slack and largest_slack.slack > 1e-6:
        recommendations.append(
            Recommendation(
                title="Recurso con mayor holgura",
                description=(
                    f"{largest_slack.name} tiene una holgura aproximada de {largest_slack.slack:.2f}. "
                    "Ese recurso no se está usando por completo en la solución óptima."
                ),
                severity="info",
            )
        )

    if problem.context:
        recommendations.append(
            Recommendation(
                title="Interpretación contextual",
                description=(
                    "Relaciona la solución con el contexto ingresado: verifica si las cantidades óptimas son "
                    "realistas, implementables y consistentes con el escenario del problema."
                ),
                severity="info",
            )
        )

    return recommendations[:5]


def _recommend_for_non_optimal_status(status: str) -> list[Recommendation]:
    if status == "Infeasible":
        return [
            Recommendation(
                title="Modelo infactible",
                description=(
                    "No existe una combinación de variables que cumpla todas las restricciones. Revisa límites, "
                    "signos de desigualdad y recursos mínimos/máximos contradictorios."
                ),
                severity="warning",
            )
        ]

    if status == "Unbounded":
        return [
            Recommendation(
                title="Modelo ilimitado",
                description=(
                    "La función objetivo puede mejorar indefinidamente. Agrega restricciones de capacidad, demanda "
                    "o disponibilidad para acotar las variables."
                ),
                severity="warning",
            )
        ]

    return [
        Recommendation(
            title="Revisar formulación",
            description=(
                "El solver no pudo confirmar una solución óptima. Comprueba que todos los coeficientes estén completos "
                "y que el modelo tenga suficientes restricciones."
            ),
            severity="warning",
        )
    ]
