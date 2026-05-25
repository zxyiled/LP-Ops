from fastapi import APIRouter, HTTPException

from backend.schemas.problem import LinearProblemRequest, SolveResponse
from backend.services.solver_service import SolverService

router = APIRouter(prefix="/solver", tags=["solver"])
solver_service = SolverService()


# --- Single endpoint: receives the LP model and returns the solution ---
@router.post("/solve", response_model=SolveResponse)
def solve_problem(problem: LinearProblemRequest) -> SolveResponse:
    try:
        return solver_service.solve(problem)
    except ValueError as exc:
        # Validation error (duplicate variables, invalid references, etc.)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
