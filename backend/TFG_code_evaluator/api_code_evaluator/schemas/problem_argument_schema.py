# schemas/problem_argument_schema.py
from pydantic import BaseModel, Field
from typing import Optional


class ProblemArgumentBase(BaseModel):
    problem_id: int = Field(..., description="ID del ejercicio al que pertenece")
    name: str = Field(..., max_length=100, description="Nombre del argumento (ej: a, b, root, s)")
    type_name: str = Field(..., max_length=100, description="Tipo del argumento (int, string, TreeNode, vector<int>, etc.)")
    position: int = Field(..., ge=0, description="Posición del argumento (0, 1, 2, ...)")


class ProblemArgumentCreate(ProblemArgumentBase):
    pass


class ProblemArgumentUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    type_name: Optional[str] = Field(None, max_length=100)
    position: Optional[int] = Field(None, ge=0)


class ProblemArgumentResponse(ProblemArgumentBase):
    id: int

    class Config:
        from_attributes = True