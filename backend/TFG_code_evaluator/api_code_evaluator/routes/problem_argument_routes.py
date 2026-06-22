# routes/problem_arguments_routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional 

from ..bd.connection import get_db
from ..models.problem_argument_model import ProblemArgument
from ..models.exercise_model import Exercise
from ..models.user_model import User
from ..dependencies.auth_dependencies import admin_required, get_current_user
from ..schemas.problem_argument_schema import (
    ProblemArgumentCreate,
    ProblemArgumentUpdate,
    ProblemArgumentResponse
)

router = APIRouter(prefix="/problem-arguments", tags=["Problem Arguments"])


# ==========================================
# GET ALL ARGUMENTS
# ==========================================
@router.get("/", response_model=list[ProblemArgumentResponse])
def get_all_arguments(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    _: User = Depends(get_current_user)
):
    """Obtener todos los argumentos de ejercicios"""
    return db.query(ProblemArgument).offset(skip).limit(limit).all()


# ==========================================
# GET ARGUMENTS BY EXERCISE
# ==========================================
@router.get("/exercise/{exercise_id}", response_model=list[ProblemArgumentResponse])
def get_arguments_by_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Obtener todos los argumentos de un ejercicio específico, ordenados por posición"""
    # Verificar que el ejercicio existe
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(404, f"Exercise with id {exercise_id} not found")
    
    arguments = db.query(ProblemArgument).filter(
        ProblemArgument.problem_id == exercise_id
    ).order_by(ProblemArgument.position).all()
    
    return arguments


# ==========================================
# GET SINGLE ARGUMENT
# ==========================================
@router.get("/{argument_id}", response_model=ProblemArgumentResponse)
def get_argument(
    argument_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    """Obtener un argumento por su ID"""
    argument = db.query(ProblemArgument).filter(ProblemArgument.id == argument_id).first()
    if not argument:
        raise HTTPException(404, "Argument not found")
    return argument


# ==========================================
# CREATE ARGUMENT (Admin or Teacher of the course)
# ==========================================
@router.post("/", response_model=ProblemArgumentResponse, status_code=201)
def create_argument(
    data: ProblemArgumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crear un nuevo argumento para un ejercicio.
    Solo administradores o el profesor del curso pueden hacer esto.
    """
    # Verificar que el ejercicio existe
    exercise = db.query(Exercise).filter(Exercise.id == data.problem_id).first()
    if not exercise:
        raise HTTPException(404, f"Exercise with id {data.problem_id} not found")
    
    # Verificar permisos: admin o profesor del curso
    if current_user.role != "admin":
        # Verificar si el usuario es profesor del curso
        from ..models.teacher_assignments_model import TeacherAssignment
        
        teacher_assignment = db.query(TeacherAssignment).filter(
            TeacherAssignment.professor_id == current_user.id,
            TeacherAssignment.course_offering_id == exercise.course_offering_id
        ).first()
        
        if not teacher_assignment:
            raise HTTPException(403, "You don't have permission to add arguments to this exercise")
    
    # Verificar que no exista ya un argumento con la misma posición
    existing = db.query(ProblemArgument).filter(
        ProblemArgument.problem_id == data.problem_id,
        ProblemArgument.position == data.position
    ).first()
    
    if existing:
        raise HTTPException(400, f"Ya existe un argumento en la posición {data.position}")
    
    # Verificar que no exista ya un argumento con el mismo nombre para este ejercicio
    existing_name = db.query(ProblemArgument).filter(
        ProblemArgument.problem_id == data.problem_id,
        ProblemArgument.name == data.name
    ).first()
    
    if existing_name:
        raise HTTPException(400, f"Ya existe un argumento con el nombre '{data.name}' para este ejercicio")
    
    # Crear el argumento
    argument = ProblemArgument(**data.model_dump())
    db.add(argument)
    db.commit()
    db.refresh(argument)
    
    return argument


# ==========================================
# UPDATE ARGUMENT (Admin or Teacher of the course)
# ==========================================
@router.put("/{argument_id}", response_model=ProblemArgumentResponse)
def update_argument(
    argument_id: int,
    data: ProblemArgumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar un argumento existente.
    Solo administradores o el profesor del curso pueden hacer esto.
    """
    argument = db.query(ProblemArgument).filter(ProblemArgument.id == argument_id).first()
    if not argument:
        raise HTTPException(404, "Argument not found")
    
    # Verificar que el ejercicio existe
    exercise = db.query(Exercise).filter(Exercise.id == argument.problem_id).first()
    if not exercise:
        raise HTTPException(404, "Associated exercise not found")
    
    # Verificar permisos: admin o profesor del curso
    if current_user.role != "admin":
        from ..models.teacher_assignments_model import TeacherAssignment
        
        teacher_assignment = db.query(TeacherAssignment).filter(
            TeacherAssignment.professor_id == current_user.id,
            TeacherAssignment.course_offering_id == exercise.course_offering_id
        ).first()
        
        if not teacher_assignment:
            raise HTTPException(403, "You don't have permission to update arguments for this exercise")
    
    # Si se está cambiando la posición, verificar que no haya conflicto
    if data.position is not None and data.position != argument.position:
        existing = db.query(ProblemArgument).filter(
            ProblemArgument.problem_id == argument.problem_id,
            ProblemArgument.position == data.position
        ).first()
        
        if existing:
            raise HTTPException(400, f"Ya existe un argumento en la posición {data.position}")
    
    # Si se está cambiando el nombre, verificar que no haya conflicto
    if data.name is not None and data.name != argument.name:
        existing_name = db.query(ProblemArgument).filter(
            ProblemArgument.problem_id == argument.problem_id,
            ProblemArgument.name == data.name
        ).first()
        
        if existing_name:
            raise HTTPException(400, f"Ya existe un argumento con el nombre '{data.name}' para este ejercicio")
    
    # Actualizar campos
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(argument, key, value)
    
    db.commit()
    db.refresh(argument)
    
    return argument


# ==========================================
# DELETE ARGUMENT (Admin or Teacher of the course)
# ==========================================
@router.delete("/{argument_id}")
def delete_argument(
    argument_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar un argumento.
    Solo administradores o el profesor del curso pueden hacer esto.
    """
    argument = db.query(ProblemArgument).filter(ProblemArgument.id == argument_id).first()
    if not argument:
        raise HTTPException(404, "Argument not found")
    
    # Verificar que el ejercicio existe
    exercise = db.query(Exercise).filter(Exercise.id == argument.problem_id).first()
    if not exercise:
        raise HTTPException(404, "Associated exercise not found")
    
    # Verificar permisos: admin o profesor del curso
    if current_user.role != "admin":
        from ..models.teacher_assignments_model import TeacherAssignment
        
        teacher_assignment = db.query(TeacherAssignment).filter(
            TeacherAssignment.professor_id == current_user.id,
            TeacherAssignment.course_offering_id == exercise.course_offering_id
        ).first()
        
        if not teacher_assignment:
            raise HTTPException(403, "You don't have permission to delete arguments from this exercise")
    
    db.delete(argument)
    db.commit()
    
    return {"message": "Argument deleted successfully"}


# ==========================================
# BULK CREATE ARGUMENTS (Admin or Teacher of the course)
# ==========================================
@router.post("/bulk", response_model=list[ProblemArgumentResponse], status_code=201)
def create_arguments_bulk(
    args_list: list[ProblemArgumentCreate],  # Cambiado de 'arguments' a 'args_list'
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crear múltiples argumentos para un ejercicio de una vez.
    Útil para configurar rápidamente todos los argumentos de un ejercicio.
    Solo administradores o el profesor del curso pueden hacer esto.
    """
    if not args_list:
        raise HTTPException(400, "No arguments provided")
    
    # Verificar que todos los argumentos pertenecen al mismo ejercicio
    problem_id = args_list[0].problem_id
    for arg in args_list:
        if arg.problem_id != problem_id:
            raise HTTPException(400, "All arguments must belong to the same exercise")
    
    # Verificar que el ejercicio existe
    exercise = db.query(Exercise).filter(Exercise.id == problem_id).first()
    if not exercise:
        raise HTTPException(404, f"Exercise with id {problem_id} not found")
    
    # Verificar permisos: admin o profesor del curso
    if current_user.role != "admin":
        from ..models.teacher_assignments_model import TeacherAssignment
        
        teacher_assignment = db.query(TeacherAssignment).filter(
            TeacherAssignment.professor_id == current_user.id,
            TeacherAssignment.course_offering_id == exercise.course_offering_id
        ).first()
        
        if not teacher_assignment:
            raise HTTPException(403, "You don't have permission to add arguments to this exercise")
    
    # Verificar posiciones duplicadas
    positions = [arg.position for arg in args_list]
    if len(positions) != len(set(positions)):
        raise HTTPException(400, "Duplicate positions found")
    
    # Verificar nombres duplicados
    names = [arg.name for arg in args_list]
    if len(names) != len(set(names)):
        raise HTTPException(400, "Duplicate argument names found")
    
    # Verificar que no existan argumentos ya creados
    for arg in args_list:
        existing = db.query(ProblemArgument).filter(
            ProblemArgument.problem_id == problem_id,
            ProblemArgument.position == arg.position
        ).first()
        if existing:
            raise HTTPException(400, f"Argument already exists at position {arg.position}")
        
        existing_name = db.query(ProblemArgument).filter(
            ProblemArgument.problem_id == problem_id,
            ProblemArgument.name == arg.name
        ).first()
        if existing_name:
            raise HTTPException(400, f"Argument with name '{arg.name}' already exists")
    
    # Crear todos los argumentos
    created_arguments = []
    for arg_data in args_list:
        argument = ProblemArgument(**arg_data.model_dump())
        db.add(argument)
        created_arguments.append(argument)
    
    db.commit()
    
    # Refrescar todos
    for arg in created_arguments:
        db.refresh(arg)
    
    return created_arguments


# ==========================================
# DELETE ALL ARGUMENTS BY EXERCISE (Admin or Teacher of the course)
# ==========================================
@router.delete("/exercise/{exercise_id}")
def delete_arguments_by_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar todos los argumentos de un ejercicio.
    Solo administradores o el profesor del curso pueden hacer esto.
    """
    # Verificar que el ejercicio existe
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(404, f"Exercise with id {exercise_id} not found")
    
    # Verificar permisos: admin o profesor del curso
    if current_user.role != "admin":
        from ..models.teacher_assignments_model import TeacherAssignment
        
        teacher_assignment = db.query(TeacherAssignment).filter(
            TeacherAssignment.professor_id == current_user.id,
            TeacherAssignment.course_offering_id == exercise.course_offering_id
        ).first()
        
        if not teacher_assignment:
            raise HTTPException(403, "You don't have permission to delete arguments from this exercise")
    
    # Eliminar todos los argumentos
    deleted_count = db.query(ProblemArgument).filter(
        ProblemArgument.problem_id == exercise_id
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"Deleted {deleted_count} arguments from exercise {exercise_id}",
        "deleted_count": deleted_count
    }
# ==========================================
# SWAP ARGUMENT POSITIONS (Admin or Teacher of the course)
# ==========================================
class SwapPositionsRequest(BaseModel):
    swaps: list[dict]  # Lista de intercambios: [{"argument_id": 1, "new_position": 1}, ...]

@router.post("/swap-positions", response_model=list[ProblemArgumentResponse])
def swap_argument_positions(
    request: SwapPositionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Intercambiar posiciones de múltiples argumentos en una sola operación.
    Esto evita conflictos de posición porque se hace todo en una transacción.
    
    Ejemplo de request:
    {
        "swaps": [
            {"argument_id": 23, "new_position": 0},
            {"argument_id": 21, "new_position": 1}
        ]
    }
    """
    if not request.swaps:
        raise HTTPException(400, "No swaps provided")
    
    # Verificar que todos los argumentos existen
    arguments = []
    problem_id = None
    
    for swap in request.swaps:
        arg_id = swap.get("argument_id")
        new_pos = swap.get("new_position")
        
        if arg_id is None or new_pos is None:
            raise HTTPException(400, "Each swap must have argument_id and new_position")
        
        argument = db.query(ProblemArgument).filter(ProblemArgument.id == arg_id).first()
        if not argument:
            raise HTTPException(404, f"Argument with id {arg_id} not found")
        
        if problem_id is None:
            problem_id = argument.problem_id
        elif argument.problem_id != problem_id:
            raise HTTPException(400, "All arguments must belong to the same exercise")
        
        arguments.append({
            "id": arg_id,
            "current_position": argument.position,
            "new_position": new_pos,
            "name": argument.name,
            "type_name": argument.type_name
        })
    
    # Verificar que el ejercicio existe
    exercise = db.query(Exercise).filter(Exercise.id == problem_id).first()
    if not exercise:
        raise HTTPException(404, f"Exercise with id {problem_id} not found")
    
    # Verificar permisos
    if current_user.role != "admin":
        from ..models.teacher_assignments_model import TeacherAssignment
        
        teacher_assignment = db.query(TeacherAssignment).filter(
            TeacherAssignment.professor_id == current_user.id,
            TeacherAssignment.course_offering_id == exercise.course_offering_id
        ).first()
        
        if not teacher_assignment:
            raise HTTPException(403, "You don't have permission to modify arguments for this exercise")
    
    # Crear un mapa de posiciones deseadas
    desired_positions = {}
    for arg in arguments:
        desired_positions[arg["id"]] = arg["new_position"]
    
    # Verificar que no haya dos argumentos queriendo la misma posición
    if len(desired_positions.values()) != len(set(desired_positions.values())):
        raise HTTPException(400, "Duplicate target positions detected")
    
    # ACTUALIZAR TODOS LOS ARGUMENTOS EN MEMORIA PRIMERO
    # Guardar los cambios en objetos Python antes de hacer commit
    
    # 1. Primero, crear una copia de los argumentos con sus nuevas posiciones
    updated_args = []
    for arg in arguments:
        arg_obj = db.query(ProblemArgument).filter(ProblemArgument.id == arg["id"]).first()
        arg_obj.position = arg["new_position"]  # Actualizar en memoria
        updated_args.append(arg_obj)
    
    # 2. Hacer commit de todos los cambios de una vez
    db.commit()
    
    # 3. Refrescar para devolver los datos actualizados
    for arg in updated_args:
        db.refresh(arg)
    
    # Devolver todos los argumentos del ejercicio actualizados
    all_arguments = db.query(ProblemArgument).filter(
        ProblemArgument.problem_id == problem_id
    ).order_by(ProblemArgument.position).all()
    
    return all_arguments