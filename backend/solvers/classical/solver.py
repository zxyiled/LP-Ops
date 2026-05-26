from __future__ import annotations

from typing import Any, Dict, cast

import pulp

from backend.schemas.problem import LinearProblemRequest
from backend.services.solver_service import SolverService
from backend.services.recommendations import build_recommendations
from backend.solvers.base import BaseSolver
from backend.schemas.unified import UnifiedSolveRequest, UnifiedSolveResponse


class ClassicalSolver(BaseSolver):
    def validate(self, payload: dict[str, Any]) -> None:
        LinearProblemRequest(**payload)

    def solve(self, request: UnifiedSolveRequest) -> UnifiedSolveResponse:
        payload = request.payload
        self.validate(payload)

        problem = LinearProblemRequest(**payload)
        service = SolverService()
        result = service.solve(problem)

        return UnifiedSolveResponse(
            modelType="classical",
            status=result.status,
            status_label=result.status_label,
            is_optimal=result.is_optimal,
            objective_value=result.objective_value,
            variables=[v.model_dump() for v in result.variables],
            constraints=[c.model_dump() for c in result.constraints],
            interpretation=result.interpretation,
            recommendations=[r.model_dump() for r in result.recommendations],
            results={
                "objective_value": result.objective_value,
                "binding_constraints": [
                    c.name for c in result.constraints if c.is_binding
                ],
            },
        )
