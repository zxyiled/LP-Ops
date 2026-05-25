from __future__ import annotations

from backend.schemas.problem import (
    ConstraintResult,
    LinearProblemRequest,
    Recommendation,
    VariableResult,
)


# --- Deterministic recommendation engine ---
# Analyzes the solution and generates up to 5 insight cards
# useful for decision-making.
def build_recommendations(
    problem: LinearProblemRequest,
    status: str,
    objective_value: float | None,
    variables: list[VariableResult],
    constraints: list[ConstraintResult],
) -> list[Recommendation]:
    if status != "Optimal":
        return _recommend_for_non_optimal_status(status)

    # Always show the optimal value achieved
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

    # Identify the variable that contributes most to the objective
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
        # All variables at zero may indicate a formulation issue
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

    # Binding constraints: the ones that limit the solution
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

    # Resource with the largest slack (most leftover)
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

    # If the user provided context, suggest a contextual interpretation
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


# Recommendations when the solver did not find an optimal solution
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
