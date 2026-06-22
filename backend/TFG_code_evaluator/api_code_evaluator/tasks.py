import os
import json
from time import time
import traceback
from celery import chord
from sqlalchemy.orm import joinedload

from .celery_app import celery

from .bd.connection import SessionLocal
from .models.submissions_model import Submission
from .models.evaluation_model import Evaluation
from .models.test_cases_model import TestCase
from .models.rubric_model import Rubric
from .models.exercise_model import Exercise
from .services.code_runner import VM_HOST, VM_USER, VM_PASS, evaluate_code, evaluate_function_code
from .services.llm_feedback import generate_single_criterion_feedback, combine_criteria_feedback
from .services.pdf_generator import generate_feedback_pdf
from .models.tests_results_model import TestResult


# Mapeo de nombres de lenguajes
LANGUAGE_MAP = {
    "python": "python",
    "cpp": "cpp",
    "c++": "cpp",
    "java": "java"
}

print("=" * 60)
print("🔧 [TASKS] Módulo tasks.py cargado")
print("=" * 60)


def notify_evaluation_status(submission_id: int, status_data: dict):
    """Envía notificación de cambio de estado vía WebSocket"""
    try:
        from .routes.submissions_routes import evaluation_status_manager
        import asyncio
        
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        if loop.is_running():
            asyncio.create_task(evaluation_status_manager.send_status(submission_id, status_data))
        else:
            loop.run_until_complete(evaluation_status_manager.send_status(submission_id, status_data))
    except Exception as e:
        print(f"Error sending WebSocket notification: {e}")


# ------------------------------------------------------------
# Tarea principal: procesar una submission (MODO LEGACY)
# ------------------------------------------------------------
@celery.task(queue="default", bind=True, max_retries=3)
def process_submission_task(self, submission_id):
    print(f"\n{'='*60}")
    print(f"🚀 [TASK STARTED] process_submission_task")
    print(f"📋 Submission ID: {submission_id}")
    print(f"🔑 Task ID: {self.request.id}")
    print(f"📮 Queue: {self.request.delivery_info.get('routing_key', 'unknown')}")
    print(f"🔄 Retry count: {self.request.retries}")
    print(f"{'='*60}")
    
    db = SessionLocal()
    try:
        submission = db.get(Submission, submission_id)
        if not submission:
            print(f"❌ [ERROR] Submission {submission_id} no encontrada")
            return {"error": "Submission no encontrada"}

        print(f"✅ Submission encontrada - Ejercicio ID: {submission.exercise_id}")
        
        tests = db.query(TestCase).filter(
            TestCase.exercise_id == submission.exercise_id
        ).all()

        if not tests:
            print(f"❌ [ERROR] No hay tests para submission {submission_id}")
            return {"error": "No hay tests"}

        print(f"📊 Tests encontrados: {len(tests)}")

        submission.status = "processing"
        db.commit()
        print(f"✅ Submission {submission_id} estado cambiado a 'processing'")
        
        # Notificar inicio
        notify_evaluation_status(submission_id, {
            "type": "status_update",
            "submission_id": submission_id,
            "status": "processing",
            "detailed_status": "running_tests",
            "message": "Ejecutando tests..."
        })

        test_tasks = [run_single_test.s(submission_id, t.id) for t in tests]
        print(f"📤 Creando chord con {len(test_tasks)} tareas")
        
        chord(test_tasks)(finalize_evaluation.s(submission_id))

        print(f"✅ Chord iniciado para submission {submission_id}")
        return {"status": "processing"}

    except Exception as e:
        db.rollback()
        print(f"❌ [ERROR] process_submission_task: {e}")
        traceback.print_exc()
        print(f"🔄 Reintentando en 5 segundos...")
        raise self.retry(exc=e, countdown=5)
    finally:
        db.close()
        print(f"🔚 [TASK] Finalizando process_submission_task para submission {submission_id}\n")


# ------------------------------------------------------------
# Tarea principal: procesar una submission (MODO FUNCIÓN)
# ------------------------------------------------------------
# tasks.py - Función process_submission_function_task completa actualizada

# tasks.py - Función process_submission_function_task CORREGIDA

@celery.task(queue="default", bind=True, max_retries=3)
def process_submission_function_task(self, submission_id):
    """
    Procesa una submission usando el modelo de función (solution()).
    """
    print(f"\n{'='*60}")
    print(f"🚀 [TASK STARTED] process_submission_function_task")
    print(f"📋 Submission ID: {submission_id}")
    print(f"🔑 Task ID: {self.request.id}")
    print(f"📮 Queue: {self.request.delivery_info.get('routing_key', 'unknown')}")
    print(f"🔄 Retry count: {self.request.retries}")
    print(f"{'='*60}")
    
    db = SessionLocal()
    try:
        submission = db.get(Submission, submission_id)
        if not submission:
            print(f"❌ [ERROR] Submission {submission_id} no encontrada")
            return {"error": "Submission no encontrada"}

        print(f"✅ Submission encontrada:")
        print(f"   - Estudiante ID: {submission.student_id}")
        print(f"   - Ejercicio ID: {submission.exercise_id}")
        print(f"   - Lenguaje ID: {submission.language_id}")
        print(f"   - Estado actual: {submission.status}")

        problem = db.query(Exercise).options(
            joinedload(Exercise.arguments)
        ).filter(Exercise.id == submission.exercise_id).first()
        
        if not problem:
            submission.status = "error"
            db.commit()
            print(f"❌ [ERROR] Problema {submission.exercise_id} no encontrado")
            return {"error": "Problema no encontrado"}

        # Cargar argumentos explícitamente
        from .models.problem_argument_model import ProblemArgument
        arguments = db.query(ProblemArgument).filter(
            ProblemArgument.problem_id == problem.id
        ).order_by(ProblemArgument.position).all()
        problem.arguments = arguments

        # Verificar si hay rúbrica
        has_rubric = db.query(Rubric).filter(Rubric.exercise_id == problem.id).first() is not None
        print(f"📋 ¿Tiene rúbrica? {has_rubric}")

        test_cases = db.query(TestCase).filter(
            TestCase.exercise_id == submission.exercise_id
        ).all()

        if not test_cases:
            submission.status = "error"
            db.commit()
            print(f"❌ [ERROR] No hay test cases para ejercicio {submission.exercise_id}")
            return {"error": "No hay test cases para este ejercicio"}

        print(f"📊 Test cases encontrados: {len(test_cases)}")
        print(f"📋 Argumentos del problema: {len(problem.arguments) if problem.arguments else 0}")
        
        # ==========================================
        # FUNCIÓN PARA NORMALIZAR INPUT
        # ==========================================
        def normalize_input(data):
            """Convierte string JSON a objeto Python si es necesario"""
            if data is None:
                return None
            if isinstance(data, str):
                data = data.strip()
                if (data.startswith('{') and data.endswith('}')) or \
                   (data.startswith('[') and data.endswith(']')):
                    try:
                        return json.loads(data)
                    except json.JSONDecodeError:
                        return data
            return data
        
        # ==========================================
        # Obtener nombres de argumentos
        # ==========================================
        arg_names = [arg.name for arg in sorted(problem.arguments, key=lambda x: x.position)] if problem.arguments else []
        
        # ==========================================
        # Preparar test cases para el runner
        # ==========================================
        tests_for_runner = []
        for tc in test_cases:
            # Normalizar input_data
            input_data_raw = tc.input_data
            if isinstance(input_data_raw, str):
                try:
                    input_data_raw = json.loads(input_data_raw)
                except json.JSONDecodeError:
                    pass
            
            # 🔥 CRÍTICO: Asegurar que input_data_raw sea un dict
            if isinstance(input_data_raw, dict):
                # Ya es un diccionario, usarlo directamente
                args_dict = input_data_raw
            elif arg_names and len(arg_names) == 1:
                # Un solo argumento
                args_dict = {arg_names[0]: normalize_input(input_data_raw)}
            elif arg_names and isinstance(input_data_raw, list) and len(input_data_raw) == len(arg_names):
                # Lista de valores en orden
                args_dict = {arg_names[j]: normalize_input(input_data_raw[j]) for j in range(len(arg_names))}
            else:
                # Fallback: envolver en value
                args_dict = {"value": normalize_input(input_data_raw)}
            
            # Normalizar expected_output
            expected_output_norm = normalize_input(tc.expected_output)
            
            tests_for_runner.append({
                "id": tc.id,
                "input_data": args_dict,  # Esto es un DICCIONARIO
                "expected_output": expected_output_norm
            })
            
            print(f"   - Test {tc.id}: input={json.dumps(args_dict)[:50]}...")

        language_name = submission.language.name.lower() if submission.language else "python"
        language_map = {"python": "python", "cpp": "cpp", "c++": "cpp", "java": "java"}
        language = language_map.get(language_name, "python")
        print(f"💻 Lenguaje: {language} (original: {language_name})")

        if language == "python" and 'def solution' not in submission.code:
            submission.status = "error"
            db.commit()
            print(f"❌ [ERROR] Código Python sin función 'solution'")
            print(f"   Código recibido (primeros 200 chars): {submission.code[:200]}")
            return {"error": "El código debe definir una función llamada 'solution'"}

        # ==========================================
        # GENERAR EL WRAPPER
        # ==========================================
        from .services.wrapper_generator_service import WrapperGeneratorService
        
        wrapper_gen = WrapperGeneratorService()
        
        print(f"🔧 Generando wrapper para {language}...")
        wrapped_code = wrapper_gen.generate(
            language=language,
            user_code=submission.code,
            problem=problem
        )
        
        print(f"📦 Wrapper generado - tamaño: {len(wrapped_code)} bytes")

        submission.status = "processing"
        db.commit()
        print(f"✅ Submission {submission_id} estado cambiado a 'processing'")
        
        # Notificar inicio de tests
        notify_evaluation_status(submission_id, {
            "type": "status_update",
            "submission_id": submission_id,
            "status": "processing",
            "detailed_status": "running_tests",
            "message": "Ejecutando tests...",
            "has_rubric": has_rubric
        })

        print(f"🔨 Llamando a evaluate_function_code...")
        print(f"   - VM_HOST: {VM_HOST}")
        print(f"   - Tests: {len(tests_for_runner)}")
        
        # Ejecutar la evaluación
        result = evaluate_function_code(
            VM_HOST, VM_USER, VM_PASS,
            submission_id,
            wrapped_code,
            tests_for_runner,
            problem=problem,
            language=language,
            memory_limit_mb=problem.memory_limit_mb if hasattr(problem, 'memory_limit_mb') else 1024
        )
        
        print(f"📊 Resultado evaluación:")
        print(f"   - Tests pasados: {result['passed']}/{result['total']}")
        print(f"   - Puntuación: {result['score']:.2f}%")

        # Crear evaluación
        evaluation = Evaluation(
            submission_id=submission_id,
            score=result["score"],
            passed_tests=result["passed"],
            total_tests=result["total"],
            feedback=None,
            reviewed=False
        )
        db.add(evaluation)
        db.flush()
        print(f"✅ Evaluación creada con ID {evaluation.id}")

        # Guardar resultados de tests
        for i, r in enumerate(result["results"]):
            actual_output = r.get("actual_output")
            if isinstance(actual_output, (dict, list)):
                actual_output = json.dumps(actual_output)
            elif actual_output is None:
                actual_output = ""
            else:
                actual_output = str(actual_output)
            
            error_msg = r.get("error", "")
            if error_msg is None:
                error_msg = ""
            
            db.add(TestResult(
                evaluation_id=evaluation.id,
                test_case_id=r["test_case_id"],
                passed=r["passed"],
                actual_output=actual_output[:500],
                error=error_msg[:500] if error_msg else "",
                execution_time=r.get("execution_time", 0)
            ))
            print(f"   - Test {i+1}: {'✓' if r['passed'] else '✗'} (ID: {r['test_case_id']})")

        submission.status = "evaluated"
        db.commit()

        print(f"✅ Submission {submission_id} completada exitosamente")
        print(f"   - Evaluación ID: {evaluation.id}")
        print(f"   - Score: {evaluation.score}")
        print(f"   - Tests pasados: {evaluation.passed_tests}/{evaluation.total_tests}")

        # Notificar tests completados
        notify_evaluation_status(submission_id, {
            "type": "tests_completed",
            "submission_id": submission_id,
            "status": "evaluated",
            "detailed_status": "evaluating_rubric" if has_rubric else "generating_pdf",
            "message": "Evaluando con rúbrica..." if has_rubric else "Generando PDF...",
            "evaluation": {
                "passed_tests": evaluation.passed_tests,
                "total_tests": evaluation.total_tests,
                "score": float(evaluation.score) if evaluation.score else 0
            },
            "has_rubric": has_rubric
        })

        send_notification_task.delay(
            submission.student_id,
            f"Evaluación completada: {result['passed']}/{result['total']} tests pasados"
        )
        print(f"📧 Notificación encolada para estudiante {submission.student_id}")

        evaluate_rubric_parallel.delay(evaluation.id)
        print(f"📋 Evaluación de rúbrica encolada para evaluation {evaluation.id}")

        return {
            "evaluation_id": evaluation.id,
            "score": evaluation.score,
            "passed": result["passed"],
            "total": result["total"]
        }

    except Exception as e:
        db.rollback()
        print(f"❌ [ERROR] process_submission_function_task: {type(e).__name__}: {e}")
        traceback.print_exc()
        print(f"🔄 Reintentando en 5 segundos... (intento {self.request.retries + 1}/3)")
        raise self.retry(exc=e, countdown=5)
    finally:
        db.close()
        print(f"🔚 [TASK] Finalizando process_submission_function_task\n")

# ------------------------------------------------------------
# Ejecuta un solo test (SOPORTA AMBOS MODOS) - ACTUALIZADO
# -----------------------------------------------------------
import json

def deep_parse_json(obj):
    """Convierte recursivamente cadenas que sean JSON válido en objetos Python."""
    if isinstance(obj, str):
        obj = obj.strip()
        if (obj.startswith('{') and obj.endswith('}')) or (obj.startswith('[') and obj.endswith(']')):
            try:
                return deep_parse_json(json.loads(obj))
            except json.JSONDecodeError:
                return obj
        return obj
    elif isinstance(obj, dict):
        return {k: deep_parse_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [deep_parse_json(item) for item in obj]
    else:
        return obj

# Dentro de run_single_test, después de obtener input_data_parsed:
@celery.task(queue="execution", bind=True, max_retries=2)
def run_single_test(self, submission_id, test_id):
    print(f"\n{'─'*40}")
    print(f"🧪 [TEST STARTED] run_single_test")
    print(f"📋 Submission ID: {submission_id}")
    print(f"📋 Test ID: {test_id}")
    print(f"🔑 Task ID: {self.request.id}")
    print(f"{'─'*40}")
    
    db = SessionLocal()
    try:
        submission = db.get(Submission, submission_id)
        test = db.get(TestCase, test_id)

        if not submission or not test:
            print(f"❌ [TEST] Datos faltantes")
            return {
                "passed": False,
                "error": "missing data",
                "test_case_id": test_id,
                "output": "",
                "execution_time": 0
            }

        exercise = db.query(Exercise).filter(
            Exercise.id == submission.exercise_id
        ).first()
        
        if not exercise:
            print(f"❌ [TEST] Exercise not found")
            return {
                "test_case_id": test.id,
                "passed": False,
                "output": "",
                "error": "Exercise not found",
                "execution_time": 0
            }
        
        from .models.problem_argument_model import ProblemArgument
        arguments = db.query(ProblemArgument).filter(
            ProblemArgument.problem_id == exercise.id
        ).order_by(ProblemArgument.position).all()
        
        exercise.arguments = arguments
        
        print(f"📋 Argumentos cargados: {len(arguments)}")
        for arg in arguments:
            print(f"   - {arg.name}: {arg.type_name} (posición {arg.position})")

        language_name = submission.language.name.lower() if submission.language else "cpp"
        language_map = {"python": "python", "cpp": "cpp", "c++": "cpp", "java": "java"}
        language = language_map.get(language_name, "cpp")
        
        print(f"🎯 Ejecutando test {test_id} en {language}")
        print(f"📋 Ejercicio: {exercise.title}")
        print(f"📋 Modo evaluación: {exercise.evaluation_mode}")

        from .services.code_runner import run_test as runner_run_test, prepare_submission_remote, VM_HOST, VM_USER, VM_PASS
        from .services.wrapper_generator_service import WrapperGeneratorService
        from time import time
        import json
        
        # ==========================================
        # Obtener nombres de argumentos
        # ==========================================
        arg_names = [arg.name for arg in sorted(arguments, key=lambda x: x.position)]
        
        # ==========================================
        # PROCESAR INPUT_DATA - LIMPIEZA Y PARSEO
        # ==========================================
        input_data_raw = test.input_data
        print(f"[TEST] input_data_raw (original): {input_data_raw}")
        
        # Parsear a JSON (limpia escapes internos)
        input_data_parsed = safe_json_parse(test.input_data)
        input_data_parsed = deep_parse_json(input_data_parsed)
        print(f"[TEST] input_data_parsed (type={type(input_data_parsed)}): {input_data_parsed}")
        
        # ==========================================
        # CONSTRUIR args_dict COMO DICCIONARIO
        # ==========================================
        args_dict = None
        
        if arg_names:
            if isinstance(input_data_parsed, dict):
                # Tomar solo los argumentos definidos, o todo si no hay coincidencia
                args_dict = {}
                for name in arg_names:
                    if name in input_data_parsed:
                        args_dict[name] = deep_parse_json(input_data_parsed[name])
                if not args_dict:
                    args_dict = input_data_parsed  # fallback
            elif len(arg_names) == 1:
                args_dict = {arg_names[0]: deep_parse_json(input_data_parsed)}
            elif isinstance(input_data_parsed, list) and len(input_data_parsed) == len(arg_names):
                args_dict = {arg_names[j]: deep_parse_json(input_data_parsed[j]) for j in range(len(arg_names))}
            else:
                args_dict = {arg_names[0]: deep_parse_json(input_data_parsed)}
        else:
            # Sin argumentos definidos
            args_dict = input_data_parsed if isinstance(input_data_parsed, dict) else {"value": deep_parse_json(input_data_parsed)}
        
        # Asegurar que args_dict es un diccionario (no string)
        if not isinstance(args_dict, dict):
            print(f"[TEST] ⚠️ args_dict no es dict, es {type(args_dict)}. Convirtiendo...")
            args_dict = {"value": args_dict}
        
        print(f"[TEST] args_dict (final, type={type(args_dict)}): {args_dict}")
        
        # ==========================================
        # CONSTRUIR EL JSON DE ENTRADA PARA EL WRAPPER (UNA SOLA VEZ)
        # ==========================================
        input_for_wrapper_obj = {"args": args_dict}
        input_for_wrapper_str = json.dumps(input_for_wrapper_obj)
        print(f"[TEST] input_for_wrapper_str: {input_for_wrapper_str}")
        
        # ==========================================
        # GENERAR WRAPPER
        # ==========================================
        wrapper_gen = WrapperGeneratorService()
        
        print(f"🔧 Generando wrapper para {language}...")
        wrapped_code = wrapper_gen.generate(
            language=language,
            user_code=submission.code,
            problem=exercise
        )
        
        print(f"📏 Tamaño del wrapper generado: {len(wrapped_code)} bytes")
        
        temp_id = f"exec_{submission_id}_{test_id}_{int(time())}"
        
        submission_dir = prepare_submission_remote(
            VM_HOST, VM_USER, VM_PASS,
            temp_id,
            wrapped_code,
            language
        )
        
        print(f"📁 Directorio remoto: {submission_dir}")
        
        # ==========================================
        # EJECUTAR TEST
        # ==========================================
        result = runner_run_test(
            VM_HOST, VM_USER, VM_PASS,
            submission_dir,
            f"test_{test_id}",
            input_for_wrapper_str,
            language,
            timeout=15,
            memory_limit_mb=exercise.memory_limit_mb if exercise and exercise.memory_limit_mb else 1024
        )
        
        actual = result["output"]
        expected = test.expected_output
        
        actual = safe_json_parse(actual)
        expected = safe_json_parse(expected)
        
        if actual is not None and not isinstance(actual, (str, int, float, bool, list, dict)):
            actual = str(actual)
        
        from .services.code_runner import _compare_outputs
        passed = _compare_outputs(actual, expected, exercise.comparator if hasattr(exercise, 'comparator') else "exact")
        
        print(f"📊 Test {test_id}: {'✅ PASS' if passed else '❌ FAIL'}")
        print(f"   Expected: {expected}")
        print(f"   Actual: {actual}")
        
        return {
            "test_case_id": test.id,
            "passed": passed,
            "output": actual if not isinstance(actual, (dict, list)) else json.dumps(actual),
            "error": result["error"] if not passed else "",
            "execution_time": result.get("execution_time", 0)
        }

    except Exception as e:
        print(f"❌ [TEST ERROR] {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return {
            "test_case_id": test_id,
            "passed": False,
            "error": str(e),
            "output": "",
            "execution_time": 0
        }
    finally:
        db.close()
        print(f"🔚 [TEST] Finalizando run_single_test\n")
# ------------------------------------------------------------
# Finaliza la evaluación (después de todos los tests)
# ------------------------------------------------------------
@celery.task(queue="default", bind=True, max_retries=3)
def finalize_evaluation(self, results, submission_id):
    print(f"\n{'='*60}")
    print(f"🏁 [FINALIZE] Finalizando evaluación")
    print(f"📋 Submission ID: {submission_id}")
    print(f"📊 Resultados recibidos: {len(results)}")
    print(f"{'='*60}")
    
    db = SessionLocal()
    try:
        submission = db.get(Submission, submission_id)
        if not submission:
            raise Exception("Submission not found")

        passed = sum(1 for r in results if r.get("passed"))
        total = len(results)
        score = (passed / total) * 100 if total else 0
        
        print(f"📊 Resumen:")
        print(f"   - Tests pasados: {passed}/{total}")
        print(f"   - Puntuación: {score:.2f}%")
        
        for i, r in enumerate(results):
            print(f"   - Test {i+1}: {'✓' if r.get('passed') else '✗'} (ID: {r.get('test_case_id')})")

        evaluation = Evaluation(
            submission_id=submission_id,
            score=score,
            passed_tests=passed,
            total_tests=total,
            feedback=None,
            reviewed=False
        )

        db.add(evaluation)
        submission.status = "evaluated"
        db.flush()

        evaluation_id = evaluation.id
        print(f"✅ Evaluación creada: ID={evaluation_id}")

        for r in results:
            # 🔥 CORREGIDO: Manejar si output es int o string
            actual_output = r.get("output", "")
            if actual_output is not None:
                # Convertir a string si es necesario
                actual_output_str = str(actual_output)
                actual_output_truncated = actual_output_str[:500]
            else:
                actual_output_truncated = ""
            
            error_msg = r.get("error", "")
            if error_msg is not None:
                error_truncated = str(error_msg)[:500]
            else:
                error_truncated = ""
            
            db.add(TestResult(
                evaluation_id=evaluation_id,
                test_case_id=r["test_case_id"],
                passed=r["passed"],
                actual_output=actual_output_truncated,
                error=error_truncated,
                execution_time=r.get("execution_time", 0)
            ))

        db.commit()
        print(f"✅ {len(results)} resultados de tests guardados")

        send_notification_task.delay(
            submission.student_id,
            f"Evaluación completada: {passed}/{total} tests pasados"
        )
        print(f"📧 Notificación enviada")

        evaluate_rubric_parallel.delay(evaluation_id)
        print(f"📋 Evaluación de rúbrica encolada")

        return {
            "evaluation_id": evaluation_id,
            "score": evaluation.score
        }

    except Exception as e:
        db.rollback()
        print(f"❌ [FINALIZE ERROR] {type(e).__name__}: {e}")
        traceback.print_exc()
        print(f"🔄 Reintentando en 10 segundos...")
        raise self.retry(exc=e, countdown=10)
    finally:
        db.close()
        print(f"🔚 [FINALIZE] Finalizando evaluación\n")


# ------------------------------------------------------------
# Lanza la evaluación paralela de la rúbrica
# ------------------------------------------------------------
@celery.task(queue="default", bind=True, max_retries=2)
def evaluate_rubric_parallel(self, evaluation_id):
    print(f"\n{'='*60}")
    print(f"📋 [RUBRIC] Iniciando evaluación de rúbrica")
    print(f"📋 Evaluation ID: {evaluation_id}")
    print(f"{'='*60}")
    
    db = SessionLocal()
    try:
        evaluation = db.query(Evaluation).options(
            joinedload(Evaluation.submission).joinedload(Submission.exercise)
        ).filter(Evaluation.id == evaluation_id).one_or_none()

        if not evaluation:
            raise Exception("Evaluation not found")

        submission = evaluation.submission
        exercise = submission.exercise
        
        print(f"✅ Datos cargados:")
        print(f"   - Ejercicio: {exercise.title}")
        print(f"   - Tests pasados: {evaluation.passed_tests}/{evaluation.total_tests}")

        rubric = db.query(Rubric).filter(
            Rubric.exercise_id == exercise.id
        ).first()

        if not rubric or not rubric.criteria:
            print(f"⚠️ No hay rúbrica definida para este ejercicio")
            _save_rubric_and_generate_pdf(evaluation_id, {
                "criteria_scores": [],
                "feedback": f"Has pasado {evaluation.passed_tests}/{evaluation.total_tests} tests correctos"
            })
            return {"status": "no_rubric"}

        criteria = rubric.criteria
        print(f"📋 Rúbrica encontrada con {len(criteria) if isinstance(criteria, (dict, list)) else 1} criterio(s)")

        if isinstance(criteria, dict):
            items = list(criteria.items())
        elif isinstance(criteria, list):
            items = [(f"Criterio {i+1}", c) for i, c in enumerate(criteria)]
        else:
            items = [("General", str(criteria))]

        print(f"📋 Creando {len(items)} tareas para evaluar criterios...")
        
        tasks = [
            evaluate_single_criterion.s(
                evaluation_id,
                name,
                desc,
                exercise.description,
                submission.code,
                evaluation.passed_tests,
                evaluation.total_tests
            )
            for name, desc in items
        ]

        chord(tasks)(combine_criteria_results.s(evaluation_id))
        print(f"✅ {len(tasks)} tareas de criterios encoladas")

        return {"status": "processing"}

    except Exception as e:
        print(f"❌ [RUBRIC ERROR] {type(e).__name__}: {e}")
        traceback.print_exc()
        raise self.retry(exc=e, countdown=10)
    finally:
        db.close()


# ------------------------------------------------------------
# Evalúa un solo criterio con LLM
# ------------------------------------------------------------
@celery.task(queue="llm", bind=True, max_retries=2, time_limit=90)
def evaluate_single_criterion(
    self,
    evaluation_id,
    criterion_name,
    criterion_desc,
    exercise_desc,
    code,
    passed,
    total
):
    print(f"\n🤖 [LLM] Evaluando criterio: {criterion_name}")
    print(f"   - Evaluation ID: {evaluation_id}")
    print(f"   - Tests: {passed}/{total}")
    
    try:
        result = generate_single_criterion_feedback(
            criterion_name,
            criterion_desc,
            exercise_desc,
            code,
            passed,
            total
        )

        print(f"✅ [LLM] Criterio '{criterion_name}' evaluado: {result.get('score', 0)}/10")
        print(f"   Comentario: {result.get('comment', '')[:100]}...")

        return {
            "criterion_name": criterion_name,
            "criterion_desc": criterion_desc,
            "score": result.get("score", 0),
            "comment": result.get("comment", "")
        }

    except Exception as e:
        print(f"❌ [LLM ERROR] {criterion_name}: {type(e).__name__}: {e}")
        traceback.print_exc()
        return {
            "criterion_name": criterion_name,
            "criterion_desc": criterion_desc,
            "score": 5,
            "comment": str(e)[:60]
        }


# ------------------------------------------------------------
# Combina los resultados de todos los criterios
# ------------------------------------------------------------
@celery.task(queue="default", bind=True)
def combine_criteria_results(self, results, evaluation_id):
    print(f"\n{'='*60}")
    print(f"🔗 [COMBINE] Combinando resultados de criterios")
    print(f"📋 Evaluation ID: {evaluation_id}")
    print(f"📊 Criterios recibidos: {len(results)}")
    print(f"{'='*60}")
    
    try:
        for r in results:
            print(f"   - {r.get('criterion_name')}: {r.get('score', 0)}/10")
        
        combined = combine_criteria_feedback(results)
        print(f"✅ Feedback combinado generado")
        print(f"   Feedback: {combined.get('feedback', '')[:150]}...")
        
    except Exception as e:
        print(f"❌ [COMBINE ERROR] {e}")
        traceback.print_exc()
        combined = {
            "criteria_scores": [
                {
                    "name": r["criterion_name"],
                    "description": r.get("criterion_desc", ""),
                    "score": r["score"],
                    "comment": r["comment"]
                }
                for r in results
            ],
            "feedback": generate_fallback_feedback(results)
        }
        print(f"⚠️ Usando feedback alternativo")

    db = SessionLocal()
    try:
        evaluation = db.get(Evaluation, evaluation_id)
        if evaluation:
            evaluation.feedback = combined.get("feedback", "")
            
            rubric_scores = []
            for c in combined.get("criteria_scores", []):
                rubric_scores.append({
                    "name": c.get("name"),
                    "description": c.get("description", ""),
                    "score": c.get("score", 0),
                    "comment": c.get("comment", "")
                })
            evaluation.rubric_scores = rubric_scores
            
            db.commit()
            print(f"✅ Feedback guardado en evaluación {evaluation_id}")
            
            generate_pdf_task.delay(evaluation_id)
            print(f"📄 Generación de PDF encolada")
        else:
            print(f"❌ Evaluación {evaluation_id} no encontrada")

    except Exception as e:
        print(f"❌ [COMBINE ERROR] Guardando resultados: {e}")
        db.rollback()
    finally:
        db.close()

    return {"status": "completed"}


def generate_fallback_feedback(criteria_results):
    """Genera un feedback general basado en los puntajes y comentarios de los criterios."""
    print(f"🔧 Generando feedback alternativo para {len(criteria_results)} criterios")
    
    if not criteria_results:
        return "Evaluación completada. Revisa los resultados de los tests."
    
    avg_score = sum(r['score'] for r in criteria_results) / len(criteria_results)
    print(f"   Puntaje promedio: {avg_score:.2f}/10")
    
    improvements = []
    for r in criteria_results:
        comment = r.get('comment', '').lower()
        if 'variable' in comment or 'nombre' in comment:
            improvements.append("usar nombres más descriptivos")
        if 'comentario' in comment or 'documentar' in comment:
            improvements.append("añadir comentarios explicativos")
        if 'error' in comment or 'validar' in comment:
            improvements.append("validar entradas del usuario")
        if 'función' in comment or 'modular' in comment:
            improvements.append("dividir el código en funciones")
        if 'formato' in comment or 'indentación' in comment:
            improvements.append("mejorar el formato y legibilidad")
    
    improvements = list(set(improvements))[:3]
    improvement_text = ", ".join(improvements) if improvements else "revisar buenas prácticas generales"
    
    if avg_score >= 8:
        feedback = f"¡Muy bien! Tu código funciona correctamente. Para mejorarlo, considera {improvement_text}. Sigue así."
    elif avg_score >= 6:
        feedback = f"Buen trabajo. Puedes mejorar en: {improvement_text}. Aplica estos cambios y verás progreso."
    else:
        feedback = f"El código necesita mejoras importantes. Concéntrate en: {improvement_text}. Repasa los conceptos básicos."
    
    print(f"   Feedback generado: {feedback[:100]}...")
    return feedback


# ------------------------------------------------------------
# Genera el PDF final
# ------------------------------------------------------------
@celery.task(queue="pdf", bind=True, max_retries=2)
def generate_pdf_task(self, evaluation_id):
    print(f"\n{'='*60}")
    print(f"📄 [PDF] Generando PDF para evaluación")
    print(f"📋 Evaluation ID: {evaluation_id}")
    print(f"{'='*60}")

    db = SessionLocal()
    try:
        evaluation = db.query(Evaluation).options(
            joinedload(Evaluation.submission).joinedload(Submission.exercise),
            joinedload(Evaluation.submission).joinedload(Submission.student)
        ).filter(Evaluation.id == evaluation_id).one_or_none()

        if not evaluation:
            raise Exception("Evaluation not found")

        submission_id = evaluation.submission_id

        student_name = (
            evaluation.submission.student.name
            if evaluation.submission.student
            else str(evaluation.submission.student_id)
        )
        print(f"👨‍🎓 Estudiante: {student_name}")

        criteria_scores = evaluation.rubric_scores or []
        if isinstance(criteria_scores, str):
            criteria_scores = json.loads(criteria_scores)
        print(f"📊 Criterios a incluir: {len(criteria_scores)}")

        os.makedirs("feedback_pdfs", exist_ok=True)
        path = f"feedback_pdfs/submission_{evaluation.submission_id}.pdf"
        print(f"📁 Ruta del PDF: {path}")

        generate_feedback_pdf(
            evaluation,
            evaluation.submission,
            evaluation.submission.exercise,
            {
                "criteria_scores": criteria_scores,
                "feedback": evaluation.feedback or ""
            },
            path,
            student_name=student_name
        )

        evaluation.feedback_pdf = path
        db.commit()

        print(f"✅ PDF generado exitosamente: {path}")

        # ========== ACTUALIZAR ESTADO DE LA SUBMISSION ==========
        submission = evaluation.submission
        submission.status = "evaluated"
        db.commit()
        print(f"✅ Estado de submission {submission.id} actualizado a 'evaluated'")

    except Exception as e:
        print(f"❌ [PDF ERROR] {type(e).__name__}: {e}")
        traceback.print_exc()
    finally:
        db.close()
        print(f"🔚 [PDF] Finalizando generación de PDF\n")

# ------------------------------------------------------------
# Función auxiliar
# ------------------------------------------------------------
def _save_rubric_and_generate_pdf(evaluation_id, result):
    print(f"\n💾 [RUBRIC] Guardando feedback simple para evaluation {evaluation_id}")
    
    db = SessionLocal()
    try:
        evaluation = db.get(Evaluation, evaluation_id)
        if evaluation:
            evaluation.feedback = result.get("feedback", "")
            evaluation.rubric_scores = result.get("criteria_scores", [])
            db.commit()
            print(f"✅ Feedback simple guardado")
            generate_pdf_task.delay(evaluation_id)
        else:
            print(f"❌ Evaluación {evaluation_id} no encontrada")
    except Exception as e:
        print(f"❌ Error guardando feedback simple: {e}")
        db.rollback()
    finally:
        db.close()


# ------------------------------------------------------------
# Tareas auxiliares
# ------------------------------------------------------------
@celery.task(queue="security")
def security_alert_task(submission_id, reason):
    print(f"\n🔒 [SECURITY ALERT] {'='*40}")
    print(f"📋 Submission ID: {submission_id}")
    print(f"⚠️ Razón: {reason}")
    print(f"{'='*40}\n")


@celery.task(queue="notifications")
def send_notification_task(user_id, message):
    print(f"\n📧 [NOTIFICATION] {'='*40}")
    print(f"👤 Usuario ID: {user_id}")
    print(f"💬 Mensaje: {message}")
    print(f"{'='*40}\n")


print("=" * 60)
print("✅ [TASKS] Todas las tareas registradas correctamente")
print("📋 Tareas disponibles:")
for task_name in celery.tasks.keys():
    if "api_code_evaluator" in task_name:
        print(f"   - {task_name}")
print("=" * 60)

import json

def safe_json_parse(data):
    """Convierte string a JSON limpiando escapes previos."""
    if data is None:
        return None
    if isinstance(data, str):
        data = data.strip()
        # Limpiar escapes comunes: \" y \\
        data = data.replace('\\"', '"').replace('\\\\', '\\')
        if (data.startswith('{') and data.endswith('}')) or (data.startswith('[') and data.endswith(']')):
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return data
    return data

def deep_parse_json(obj):
    """Convierte recursivamente cadenas que sean JSON válido en objetos Python, limpiando escapes."""
    if isinstance(obj, str):
        obj = obj.strip()
        obj = obj.replace('\\"', '"').replace('\\\\', '\\')
        if (obj.startswith('{') and obj.endswith('}')) or (obj.startswith('[') and obj.endswith(']')):
            try:
                return deep_parse_json(json.loads(obj))
            except json.JSONDecodeError:
                return obj
        return obj
    elif isinstance(obj, dict):
        return {k: deep_parse_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [deep_parse_json(item) for item in obj]
    else:
        return obj