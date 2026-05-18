from fastapi import APIRouter, HTTPException

from backend.schemas.problem import LinearProblemRequest, SolveResponse
from backend.services.solver_service import SolverService

router = APIRouter(prefix="/solver", tags=["solver"])
solver_service = SolverService()


@router.post("/solve", response_model=SolveResponse)
def solve_problem(problem: LinearProblemRequest) -> SolveResponse:
    try:
        return solver_service.solve(problem)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
