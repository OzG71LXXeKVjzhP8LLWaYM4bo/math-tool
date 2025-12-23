"""Math/Physics/Chemistry solver service using SymPy."""

from typing import Optional
from dataclasses import dataclass

import sympy as sp
from sympy.parsing.latex import parse_latex


@dataclass
class SolutionStep:
    """A single step in a solution."""
    step_number: int
    description: str
    expression_latex: str


@dataclass
class SolveResult:
    """Result of solving an expression."""
    success: bool
    answer_latex: str
    steps: list[SolutionStep]
    error: Optional[str] = None


class SolverService:
    """Service for solving math expressions using SymPy."""

    @staticmethod
    def latex_to_sympy(latex: str) -> sp.Expr:
        """Convert LaTeX string to SymPy expression."""
        # Clean up common LaTeX issues
        latex = latex.strip()
        latex = latex.replace(r"\left", "").replace(r"\right", "")

        return parse_latex(latex)

    @staticmethod
    def sympy_to_latex(expr: sp.Expr) -> str:
        """Convert SymPy expression to LaTeX string."""
        return sp.latex(expr)

    @classmethod
    def solve_equation(
        cls,
        latex: str,
        solve_for: Optional[str] = None,
        show_steps: bool = True
    ) -> SolveResult:
        """
        Solve an equation or simplify an expression.

        Args:
            latex: LaTeX expression to solve
            solve_for: Variable to solve for (if equation)
            show_steps: Whether to generate step-by-step solution

        Returns:
            SolveResult with answer and steps
        """
        steps = []

        try:
            # Parse the LaTeX
            steps.append(SolutionStep(
                step_number=1,
                description="Parse the expression",
                expression_latex=latex
            ))

            expr = cls.latex_to_sympy(latex)

            # Check if it's an equation (contains =)
            if "=" in latex:
                # Split by = and create equation
                parts = latex.split("=")
                if len(parts) == 2:
                    left = cls.latex_to_sympy(parts[0])
                    right = cls.latex_to_sympy(parts[1])
                    expr = sp.Eq(left, right)

                    steps.append(SolutionStep(
                        step_number=2,
                        description="Identify the equation",
                        expression_latex=cls.sympy_to_latex(expr)
                    ))

                    # Determine variable to solve for
                    if solve_for:
                        var = sp.Symbol(solve_for)
                    else:
                        # Auto-detect variable
                        free_symbols = expr.free_symbols
                        if free_symbols:
                            var = list(free_symbols)[0]
                        else:
                            var = sp.Symbol("x")

                    steps.append(SolutionStep(
                        step_number=3,
                        description=f"Solve for {var}",
                        expression_latex=cls.sympy_to_latex(var)
                    ))

                    # Solve the equation
                    solution = sp.solve(expr, var)

                    if solution:
                        if isinstance(solution, list):
                            answer = solution[0] if len(solution) == 1 else solution
                        else:
                            answer = solution

                        answer_latex = cls.sympy_to_latex(answer)

                        steps.append(SolutionStep(
                            step_number=4,
                            description="Solution",
                            expression_latex=f"{var} = {answer_latex}"
                        ))

                        return SolveResult(
                            success=True,
                            answer_latex=f"{var} = {answer_latex}",
                            steps=steps
                        )
                    else:
                        return SolveResult(
                            success=False,
                            answer_latex="",
                            steps=steps,
                            error="No solution found"
                        )
            else:
                # Just simplify the expression
                steps.append(SolutionStep(
                    step_number=2,
                    description="Simplify the expression",
                    expression_latex=cls.sympy_to_latex(expr)
                ))

                simplified = sp.simplify(expr)
                simplified_latex = cls.sympy_to_latex(simplified)

                steps.append(SolutionStep(
                    step_number=3,
                    description="Simplified result",
                    expression_latex=simplified_latex
                ))

                return SolveResult(
                    success=True,
                    answer_latex=simplified_latex,
                    steps=steps
                )

        except Exception as e:
            return SolveResult(
                success=False,
                answer_latex="",
                steps=steps,
                error=str(e)
            )

    @classmethod
    def differentiate(cls, latex: str, var: str = "x") -> SolveResult:
        """Differentiate an expression with respect to a variable."""
        steps = []

        try:
            expr = cls.latex_to_sympy(latex)
            symbol = sp.Symbol(var)

            steps.append(SolutionStep(
                step_number=1,
                description=f"Differentiate with respect to {var}",
                expression_latex=f"\\frac{{d}}{{d{var}}}\\left({latex}\\right)"
            ))

            derivative = sp.diff(expr, symbol)
            derivative_latex = cls.sympy_to_latex(derivative)

            steps.append(SolutionStep(
                step_number=2,
                description="Apply differentiation rules",
                expression_latex=derivative_latex
            ))

            # Simplify if possible
            simplified = sp.simplify(derivative)
            if simplified != derivative:
                simplified_latex = cls.sympy_to_latex(simplified)
                steps.append(SolutionStep(
                    step_number=3,
                    description="Simplify",
                    expression_latex=simplified_latex
                ))
                derivative_latex = simplified_latex

            return SolveResult(
                success=True,
                answer_latex=derivative_latex,
                steps=steps
            )

        except Exception as e:
            return SolveResult(
                success=False,
                answer_latex="",
                steps=steps,
                error=str(e)
            )

    @classmethod
    def integrate(cls, latex: str, var: str = "x") -> SolveResult:
        """Integrate an expression with respect to a variable."""
        steps = []

        try:
            expr = cls.latex_to_sympy(latex)
            symbol = sp.Symbol(var)

            steps.append(SolutionStep(
                step_number=1,
                description=f"Integrate with respect to {var}",
                expression_latex=f"\\int {latex} \\, d{var}"
            ))

            integral = sp.integrate(expr, symbol)
            integral_latex = cls.sympy_to_latex(integral)

            steps.append(SolutionStep(
                step_number=2,
                description="Apply integration rules",
                expression_latex=integral_latex + " + C"
            ))

            return SolveResult(
                success=True,
                answer_latex=integral_latex + " + C",
                steps=steps
            )

        except Exception as e:
            return SolveResult(
                success=False,
                answer_latex="",
                steps=steps,
                error=str(e)
            )
