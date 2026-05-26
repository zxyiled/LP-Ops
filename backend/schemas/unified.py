from __future__ import annotations

from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, Field

ModelType = Literal["classical", "assignment", "transport"]


class UnifiedSolveRequest(BaseModel):
    modelType: ModelType
    payload: Dict[str, Any] = Field(..., description="Model-specific payload")


class UnifiedSolveResponse(BaseModel):
    modelType: ModelType
    status: str
    status_label: str
    is_optimal: bool
    objective_value: Optional[float] = None
    results: Dict[str, Any] = Field(default_factory=dict)
    variables: list[Dict[str, Any]] = Field(default_factory=list)
    constraints: list[Dict[str, Any]] = Field(default_factory=list)
    interpretation: str = ""
    recommendations: list[Dict[str, Any]] = Field(default_factory=list)
    ai_analysis: Optional[Dict[str, Any]] = None
    visualization: Optional[Dict[str, Any]] = None
    solve_id: Optional[str] = None
