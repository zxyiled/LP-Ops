from fastapi import APIRouter, HTTPException

from backend.schemas.unified import UnifiedSolveRequest, UnifiedSolveResponse
from backend.solvers.registry import get_solver, list_model_types
from backend.services.ai.analyzer import analyze_solution

router = APIRouter(tags=["solve"])


@router.get("/models")
def list_models() -> dict[str, list[str]]:
    return {"models": list_model_types()}


@router.post("/solve", response_model=UnifiedSolveResponse)
async def solve_problem(request: UnifiedSolveRequest) -> UnifiedSolveResponse:
    try:
        solver = get_solver(request.modelType)
        result = solver.solve(request)

        try:
            ai_result = await analyze_solution(
                model_type=request.modelType,
                payload=request.payload,
                result=result.model_dump(),
            )
            result.ai_analysis = ai_result
        except Exception:
            pass

        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
