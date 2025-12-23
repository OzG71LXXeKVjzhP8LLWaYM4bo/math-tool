"""Solver route for math expression solving."""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.solver_service import SolverService, SolutionStep

router = APIRouter()


class SolutionStepModel(BaseModel):
    """Pydantic model for solution steps."""
    step_number: int
    description: str
    expression_latex: str


class SolveRequest(BaseModel):
    """Request model for solve endpoint."""
    expression_latex: str
    subject: str = "math"
    solve_for: Optional[str] = None
    show_steps: bool = True
    operation: str = "solve"  # solve, differentiate, integrate


class SolveResponse(BaseModel):
    """Response model for solve endpoint."""
    success: bool
    answer_latex: str = ""
    steps: list[SolutionStepModel] = []
    error: Optional[str] = None


@router.post("", response_model=SolveResponse)
async def solve_expression(request: SolveRequest) -> SolveResponse:
    """
    Solve a mathematical expression.

    Supports:
    - Equation solving (expressions with =)
    - Expression simplification
    - Differentiation
    - Integration

    Args:
        request: SolveRequest with LaTeX expression

    Returns:
        SolveResponse with solution and steps
    """
    if not request.expression_latex:
        raise HTTPException(status_code=400, detail="No expression provided")

    # Route to appropriate solver based on operation
    if request.operation == "differentiate":
        result = SolverService.differentiate(
            request.expression_latex,
            request.solve_for or "x"
        )
    elif request.operation == "integrate":
        result = SolverService.integrate(
            request.expression_latex,
            request.solve_for or "x"
        )
    else:
        result = SolverService.solve_equation(
            request.expression_latex,
            request.solve_for,
            request.show_steps
        )

    # Convert dataclass steps to pydantic models
    steps = [
        SolutionStepModel(
            step_number=s.step_number,
            description=s.description,
            expression_latex=s.expression_latex
        )
        for s in result.steps
    ]

    return SolveResponse(
        success=result.success,
        answer_latex=result.answer_latex,
        steps=steps,
        error=result.error
    )


@router.post("/verify")
async def verify_answer(
    expression_latex: str,
    user_answer: str,
    expected_answer: Optional[str] = None
) -> dict:
    """
    Verify if a user's answer is correct.

    Args:
        expression_latex: The original problem
        user_answer: User's answer in LaTeX
        expected_answer: Expected answer (optional, will solve if not provided)

    Returns:
        Dictionary with is_correct and explanation
    """
    # First solve the expression if no expected answer
    if not expected_answer:
        result = SolverService.solve_equation(expression_latex)
        if not result.success:
            return {
                "is_correct": False,
                "error": result.error
            }
        expected_answer = result.answer_latex

    # Compare user answer with expected
    try:
        from sympy.parsing.latex import parse_latex
        import sympy as sp

        user_expr = parse_latex(user_answer)
        expected_expr = parse_latex(expected_answer.split("=")[-1].strip())

        # Check if expressions are equal
        diff = sp.simplify(user_expr - expected_expr)
        is_correct = diff == 0

        return {
            "is_correct": is_correct,
            "expected_answer": expected_answer,
            "user_answer": user_answer
        }

    except Exception as e:
        return {
            "is_correct": False,
            "error": str(e)
        }
