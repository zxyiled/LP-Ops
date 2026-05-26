from __future__ import annotations

from backend.solvers.base import BaseSolver
from backend.solvers.classical.solver import ClassicalSolver
from backend.solvers.assignment.solver import AssignmentSolver
from backend.solvers.transport.solver import TransportSolver

_registry: dict[str, type[BaseSolver]] = {
    "classical": ClassicalSolver,
    "assignment": AssignmentSolver,
    "transport": TransportSolver,
}


def get_solver(model_type: str) -> BaseSolver:
    solver_cls = _registry.get(model_type)
    if solver_cls is None:
        valid = ", ".join(_registry.keys())
        raise ValueError(
            f"Tipo de modelo desconocido: '{model_type}'. Válidos: {valid}"
        )
    return solver_cls()


def register_solver(model_type: str, solver_cls: type[BaseSolver]) -> None:
    _registry[model_type] = solver_cls


def list_model_types() -> list[str]:
    return list(_registry.keys())
