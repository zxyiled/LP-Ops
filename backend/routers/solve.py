import asyncio
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from backend.schemas.unified import UnifiedSolveRequest, UnifiedSolveResponse
from backend.solvers.registry import get_solver, list_model_types
from backend.services.ai.analyzer import analyze_solution

router = APIRouter(tags=["solve"])

# In-memory store for pending AI analyses
_ai_results: dict[str, dict[str, Any]] = {}


@router.get("/models")
def list_models() -> dict[str, list[str]]:
    return {"models": list_model_types()}


@router.post("/solve", response_model=UnifiedSolveResponse)
async def solve_problem(request: UnifiedSolveRequest) -> UnifiedSolveResponse:
    try:
        solver = get_solver(request.modelType)
        result = solver.solve(request)

        solve_id = str(uuid.uuid4())
        result.solve_id = solve_id
        _ai_results[solve_id] = {"status": "pending", "insights": None}

        asyncio.create_task(
            _run_ai_analysis(
                solve_id,
                request.modelType,
                request.payload,
                result.model_dump(),
            )
        )

        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


async def _run_ai_analysis(
    solve_id: str,
    model_type: str,
    payload: dict[str, Any],
    result: dict[str, Any],
) -> None:
    try:
        ai_result = await analyze_solution(
            model_type=model_type,
            payload=payload,
            result=result,
        )
        _ai_results[solve_id] = {"status": "done", "insights": ai_result}
    except Exception:
        _ai_results[solve_id] = {"status": "done", "insights": None}


@router.get("/solve/{solve_id}/ai")
def get_ai_analysis(solve_id: str) -> dict[str, Any]:
    entry = _ai_results.get(solve_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="solve_id not found")
    return entry
