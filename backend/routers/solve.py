import asyncio
import logging
import time
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from backend.schemas.unified import UnifiedSolveRequest, UnifiedSolveResponse
from backend.solvers.registry import get_solver, list_model_types
from backend.services.ai.analyzer import analyze_solution

logger = logging.getLogger(__name__)

router = APIRouter(tags=["solve"])

# In-memory store for pending AI analyses (TTL: 5 min)
_ai_results: dict[str, dict[str, Any]] = {}
_AI_RESULT_TTL = 300


def _evict_expired_ai_results() -> None:
    now = time.monotonic()
    expired = [
        k for k, v in list(_ai_results.items())
        if now - v.get("_ts", 0) > _AI_RESULT_TTL
    ]
    for k in expired:
        del _ai_results[k]


def _store_ai_result(solve_id: str, data: dict[str, Any]) -> None:
    _evict_expired_ai_results()
    data["_ts"] = time.monotonic()
    _ai_results[solve_id] = data


@router.get("/models")
def list_models() -> dict[str, list[str]]:
    return {"models": list_model_types()}


@router.post("/solve", response_model=UnifiedSolveResponse)
async def solve_problem(request: UnifiedSolveRequest) -> UnifiedSolveResponse:
    try:
        solver = get_solver(request.modelType)
        result = await asyncio.to_thread(solver.solve, request)

        solve_id = str(uuid.uuid4())
        result.solve_id = solve_id
        _store_ai_result(solve_id, {"status": "pending", "insights": None})

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
        _store_ai_result(solve_id, {
            "status": "done",
            "insights": ai_result.get("insights", []) if ai_result else None,
        })
        logger.info("AI analysis completed for solve %s", solve_id)
    except Exception:
        logger.exception("AI analysis failed for solve %s", solve_id)
        _store_ai_result(solve_id, {"status": "done", "insights": None})


@router.get("/solve/{solve_id}/ai")
def get_ai_analysis(solve_id: str) -> dict[str, Any]:
    entry = _ai_results.get(solve_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="solve_id not found")
    now = time.monotonic()
    if now - entry.get("_ts", 0) > _AI_RESULT_TTL:
        del _ai_results[solve_id]
        raise HTTPException(status_code=404, detail="solve_id expired")
    return entry
