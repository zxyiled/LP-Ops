from __future__ import annotations

from typing import Dict, Literal, Optional

from pydantic import BaseModel, Field, model_validator

# --- Literal types for constrained values ---
OptimizationSense = Literal["maximize", "minimize"]
ConstraintOperator = Literal["<=", ">=", "="]
VariableCategory = Literal["continuous", "integer", "binary"]


# --- A single decision variable ---
class DecisionVariable(BaseModel):
    name: str = Field(..., min_length=1, max_length=40)
    lower_bound: Optional[float] = 0
    upper_bound: Optional[float] = None
    category: VariableCategory = "continuous"

    # Validates that upper bound is not lower than lower bound
    @model_validator(mode="after")
    def validate_bounds(self) -> "DecisionVariable":
        if self.upper_bound is not None and self.lower_bound is not None:
            if self.upper_bound < self.lower_bound:
                raise ValueError(
                    "upper_bound must be greater than or equal to lower_bound"
                )
        return self


# --- Objective function (maximize or minimize) ---
class ObjectiveFunction(BaseModel):
    sense: OptimizationSense = "maximize"
    coefficients: Dict[str, float] = Field(default_factory=dict)


# --- A single linear constraint ---
class Constraint(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    coefficients: Dict[str, float] = Field(default_factory=dict)
    operator: ConstraintOperator
    rhs: float


# --- Full user request ---
class LinearProblemRequest(BaseModel):
    title: str = Field(default="Modelo de programación lineal", max_length=120)
    context: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional business context used by recommendations.",
    )
    variables: list[DecisionVariable] = Field(..., min_length=1)
    objective: ObjectiveFunction
    constraints: list[Constraint] = Field(default_factory=list)

    # Cross-validation: duplicate names and references to nonexistent variables
    @model_validator(mode="after")
    def validate_references(self) -> "LinearProblemRequest":
        names = [variable.name for variable in self.variables]
        duplicated = {name for name in names if names.count(name) > 1}
        if duplicated:
            raise ValueError(
                f"Duplicated variable names are not allowed: {', '.join(sorted(duplicated))}"
            )

        variable_names = set(names)
        referenced = set(self.objective.coefficients.keys())
        for constraint in self.constraints:
            referenced.update(constraint.coefficients.keys())

        unknown = referenced - variable_names
        if unknown:
            raise ValueError(
                f"Unknown variables referenced: {', '.join(sorted(unknown))}"
            )

        return self


# --- A single variable result in the solution ---
class VariableResult(BaseModel):
    name: str
    value: float
    objective_coefficient: float
    contribution: float


# --- A single constraint result in the solution ---
class ConstraintResult(BaseModel):
    name: str
    operator: ConstraintOperator
    rhs: float
    activity: float        # Evaluated LHS value
    slack: float           # Difference between RHS and activity
    is_binding: bool       # True when slack is ~0 (active constraint)
    shadow_price: Optional[float] = None  # Dual variable value


# --- Post-solution recommendation ---
class Recommendation(BaseModel):
    title: str
    description: str
    severity: Literal["info", "success", "warning"] = "info"


# --- Complete solver response ---
class SolveResponse(BaseModel):
    status: str
    status_label: str
    is_optimal: bool
    objective_value: Optional[float] = None
    variables: list[VariableResult] = Field(default_factory=list)
    constraints: list[ConstraintResult] = Field(default_factory=list)
    interpretation: str
    recommendations: list[Recommendation] = Field(default_factory=list)
