from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from backend.schemas.unified import UnifiedSolveRequest, UnifiedSolveResponse


class BaseSolver(ABC):
    @abstractmethod
    def solve(self, request: UnifiedSolveRequest) -> UnifiedSolveResponse:
        pass

    @abstractmethod
    def validate(self, payload: dict[str, Any]) -> None:
        pass
