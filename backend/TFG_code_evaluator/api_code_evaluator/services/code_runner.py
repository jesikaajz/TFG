# code_runner.py - Versión actualizada con wrapper generator y memory_limit
import shlex
import time
import os
import json
import paramiko
from dotenv import load_dotenv
import logging
logger = logging.getLogger(__name__)
from .wrapper_generator_service import WrapperGeneratorService

load_dotenv()

VM_HOST = os.getenv("VM_HOST_FINAL")
VM_USER = os.getenv("VM_USER_FINAL")
VM_PASS = os.getenv("VM_PASS_FINAL")

KEY_PATH = os.path.expanduser("~/.ssh/code_runner_key")

wrapper_generator = WrapperGeneratorService()

LANGUAGE_CONFIG = {
    "cpp": {
        "image": "gcc:12-json",
        "compile_cmd": "g++ -std=c++17 /run/main.cpp -o /run/program 2> /run/compile_error.txt",
        "run_cmd": "/run/program",
        "source_file": "main.cpp",
        "compile_required": True,
        "shell": "bash"
    },
    "python": {
        "image": "python:3.11-alpine",
        "compile_cmd": None,  # Python no necesita compilación
        "run_cmd": "python /run/main.py",
        "source_file": "main.py",
        "compile_required": False,
        "shell": "sh"
    },
    "java": {
        "image": "eclipse-temurin:21-jdk-alpine-gson",
        "compile_cmd": "javac -cp \"/run:/usr/local/lib/gson-2.10.1.jar\" /run/Wrapper.java 2> /run/compile_error.txt",
        "run_cmd": "java -cp \"/run:/usr/local/lib/gson-2.10.1.jar\" Wrapper",
        "source_file": "Wrapper.java",
        "compile_required": True,
        "shell": "sh"
    }
}


def _get_source_filename(language: str) -> str:
    config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["cpp"])
    return config["source_file"]


def create_ssh_connection(vm_host, vm_user):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    private_key = paramiko.RSAKey.from_private_key_file(KEY_PATH)
    
    ssh.connect(
        vm_host,
        username=vm_user,
        pkey=private_key,
        allow_agent=False,
        look_for_keys=False
    )
    return ssh


# En code_runner.py, dentro de prepare_submission_remote

def prepare_submission_remote(vm_host, vm_user, vm_pass, submission_id, code, language: str = "cpp"):
    submission_dir = f"/tmp/submissions/{submission_id}"
    source_file = _get_source_filename(language)

    ssh = create_ssh_connection(vm_host, vm_user)

    try:
        ssh.exec_command(f"mkdir -p {shlex.quote(submission_dir)}")[1].channel.recv_exit_status()
        ssh.exec_command(f"chmod 777 {shlex.quote(submission_dir)}")[1].channel.recv_exit_status()
        ssh.exec_command(f"chown -R 1002:1002 {shlex.quote(submission_dir)}")[1].channel.recv_exit_status()

        sftp = ssh.open_sftp()
        try:
            with sftp.file(f"{submission_dir}/{source_file}", "w") as f:
                f.write(code)
            
            # 🔥 AGREGAR ESTO PARA DEBUG 🔥
            print(f"\n{'='*60}")
            print(f"📄 CONTENIDO DE {source_file} ENVIADO:")
            print(f"{'='*60}")
            print(code[:1000])  # Mostrar primeros 1000 caracteres
            if len(code) > 1000:
                print(f"... (y {len(code)-1000} caracteres más)")
            print(f"{'='*60}\n")
            
        finally:
            sftp.close()

    finally:
        ssh.close()

    return submission_dir


def run_test(vm_host, vm_user, vm_pass, submission_dir, test_case_id, input_data, language: str = "cpp", timeout=10, memory_limit_mb: int = 1024):
    """Ejecuta un test para el lenguaje especificado"""
    config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG["cpp"])
    source_file = config["source_file"]
    shell = config.get("shell", "bash")

    print(f"\n========== [TEST {test_case_id}] {language.upper()} START ==========")
    print(f"🔧 Memory limit: {memory_limit_mb} MB")

    ssh = create_ssh_connection(vm_host, vm_user)

    run_dir = f"{submission_dir}/run_{test_case_id}"

    try:
        ssh.exec_command(f"mkdir -p {shlex.quote(run_dir)}")[1].channel.recv_exit_status()
        ssh.exec_command(f"chmod 777 {shlex.quote(run_dir)}")[1].channel.recv_exit_status()
        ssh.exec_command(f"chown -R 1002:1002 {shlex.quote(run_dir)}")[1].channel.recv_exit_status()

        sftp = ssh.open_sftp()

        with sftp.file(f"{submission_dir}/{source_file}", "r") as src:
            code = src.read()
        if isinstance(code, bytes):
            code = code.decode()

        with sftp.file(f"{run_dir}/{source_file}", "w") as f:
            f.write(code)

        with sftp.file(f"{run_dir}/input.txt", "w") as f:
            # input_data ya es un string JSON, escribirlo directamente
            f.write(input_data)

        sftp.close()

        script = f"""set +e

echo "[DEBUG] Language: {language}"
echo "[DEBUG] Working directory:"
ls -la /run
"""

        if config["compile_required"]:
            script += f"""
echo "[COMPILING {language.upper()}]"
{config["compile_cmd"]}
COMP_STATUS=$?

if [ $COMP_STATUS -ne 0 ]; then
    echo "[COMPILATION FAILED]"
    cat /run/compile_error.txt
    touch /run/output.txt /run/runtime_error.txt
    exit 1
fi

echo "[COMPILATION SUCCESS]"
"""

        script += f"""
echo "[RUNNING {language.upper()}]"

timeout {int(timeout)}s {config["run_cmd"]} < /run/input.txt > /run/output.txt 2> /run/runtime_error.txt
RUN_STATUS=$?

if [ $RUN_STATUS -eq 124 ]; then
    echo "TIMEOUT: Execution exceeded {int(timeout)} seconds"
    echo "TIMEOUT" > /run/runtime_error.txt
    exit 124
fi

exit $RUN_STATUS
"""

        escaped_script = script.replace("'", "'\\''")
        
        # ✅ Usar memory_limit_mb correctamente
        docker_cmd = (
            f"docker run --rm "
            f"--memory={memory_limit_mb}m "
            f"--cpus=0.5 "
            f"--pids-limit=64 "
            f"--network=none "
            f"--cap-drop=ALL "
            f"--cap-add=DAC_OVERRIDE "
            f"--security-opt=no-new-privileges "
            f"-v {run_dir}:/run:rw "
            f"-w /run "
            f"{config['image']} "
            f"{shell} -c '{escaped_script}'"
        )

        print(f"[DEBUG] Docker command: {docker_cmd[:200]}...")

        stdin, stdout, stderr = ssh.exec_command(docker_cmd)

        out = stdout.read().decode(errors="ignore")
        err = stderr.read().decode(errors="ignore")
        exit_code = stdout.channel.recv_exit_status()

        print("\n========== DOCKER STDOUT ==========")
        print(out)
        print("\n========== DOCKER STDERR ==========")
        print(err)

        sftp = ssh.open_sftp()

        def read_file(path):
            try:
                with sftp.file(path, "r") as f:
                    return f.read().decode(errors="ignore")
            except Exception as e:
                return ""

        output = read_file(f"{run_dir}/output.txt")
        compile_error = read_file(f"{run_dir}/compile_error.txt") if config["compile_required"] else ""
        runtime_error = read_file(f"{run_dir}/runtime_error.txt")

        sftp.close()

        try:
            output_parsed = json.loads(output.strip()) if output.strip() else None
        except:
            output_parsed = output.strip()

        flag = None
        error = ""

        if compile_error.strip():
            flag = "compile_error"
            error = compile_error
        elif exit_code == 124:
            flag = "timeout"
            error = f"Execution timeout after {timeout} seconds"
        elif runtime_error.strip() and "TIMEOUT" not in runtime_error:
            flag = "runtime_error"
            error = runtime_error

        return {
            "output": output_parsed if output_parsed is not None else output.strip(),
            "error": error.strip(),
            "exit_code": exit_code,
            "flag": flag
        }

    except Exception as e:
        print(f"[ERROR] Exception in run_test: {e}")
        import traceback
        traceback.print_exc()
        return {
            "output": "",
            "error": str(e),
            "exit_code": -1,
            "flag": "runtime_error"
        }
    finally:
        ssh.close()


def _compare_outputs(actual, expected, comparator: str = "exact") -> bool:
    """Compara dos salidas normalizando tipos, incluyendo booleanos en string."""
    def normalize(value):
        if value is None:
            return None
        
        # Si es string, intentar convertir a booleano o número
        if isinstance(value, str):
            stripped = value.strip()
            lower_val = stripped.lower()
            # Convertir "true"/"false" (y variantes como "True"/"False") a bool
            if lower_val == "true":
                return True
            if lower_val == "false":
                return False
            # Eliminar comillas dobles alrededor del string
            if stripped.startswith('"') and stripped.endswith('"'):
                stripped = stripped[1:-1]
            # Intentar convertir a número entero
            if stripped.isdigit() or (stripped.startswith('-') and stripped[1:].isdigit()):
                return int(stripped)
            try:
                # Intentar convertir a float
                return float(stripped)
            except ValueError:
                pass
            # Si no, devolver el string limpio
            return stripped
        
        # Si es booleano, devolver directamente
        if isinstance(value, bool):
            return value
        # Si es número
        if isinstance(value, (int, float)):
            return value
        # Si es lista o dict, devolver tal cual (se puede profundizar si es necesario)
        return value

    actual_norm = normalize(actual)
    expected_norm = normalize(expected)

    if comparator == "exact":
        return actual_norm == expected_norm
    elif comparator == "float":
        try:
            return abs(float(actual_norm) - float(expected_norm)) < 1e-6
        except (ValueError, TypeError):
            return actual_norm == expected_norm
    elif comparator == "unordered":
        try:
            if isinstance(actual_norm, list) and isinstance(expected_norm, list):
                # Ordenar recursivamente para listas anidadas
                def sort_nested(lst):
                    if isinstance(lst, list):
                        return sorted([sort_nested(x) for x in lst])
                    return lst
                return sort_nested(actual_norm) == sort_nested(expected_norm)
        except Exception:
            pass
        return actual_norm == expected_norm
    else:
        return actual_norm == expected_norm

# ============================================
# FUNCIÓN PRINCIPAL PARA EVALUAR (MODO FUNCIÓN) - ACTUALIZADA
# ============================================

# ============================================
# FUNCIÓN PRINCIPAL PARA EVALUAR (MODO FUNCIÓN) - VERSIÓN CORREGIDA
# ============================================

# ============================================
# FUNCIÓN PRINCIPAL PARA EVALUAR (MODO FUNCIÓN) - VERSIÓN CORREGIDA FINAL
# ============================================

# code_runner.py - Función evaluate_function_code completa actualizada

def evaluate_function_code(
    vm_host, vm_user, vm_pass, 
    submission_id,
    code: str,
    test_cases: list,
    problem,
    language: str = "python",
    memory_limit_mb: int = 1024
) -> dict:
    print(f"[FUNCTION] ========================================")
    print(f"[FUNCTION] Evaluando submission {submission_id} en {language}")
    print(f"[FUNCTION] Test cases: {len(test_cases)}")
    print(f"[FUNCTION] Memory limit: {memory_limit_mb} MB")
    print(f"[FUNCTION] Tamaño del código: {len(code)} bytes")
    print(f"[FUNCTION] ========================================")
    logger.info(f"Iniciando evaluación funcional - Submission {submission_id}")
    # Obtener nombres de argumentos del problema
    arg_names = []
    if problem and hasattr(problem, 'arguments') and problem.arguments:
        arg_names = [arg.name for arg in sorted(problem.arguments, key=lambda x: x.position)]
    print(f"[FUNCTION] Nombres de argumentos: {arg_names}")
    
    # Función auxiliar para normalizar input
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
    
    results = []
    passed = 0
    
    for i, test_case in enumerate(test_cases):
        print(f"[FUNCTION] Ejecutando test {i+1}/{len(test_cases)}")
        
        try:
            input_data = test_case["input_data"]
            
            # 🔥 CRÍTICO: Normalizar input_data
            input_data = normalize_input(input_data)
            
            # Construir args_dict
            if isinstance(input_data, dict):
                # Ya es un diccionario, usarlo directamente
                args_dict = {k: normalize_input(v) for k, v in input_data.items()}
            elif arg_names and len(arg_names) == 1:
                # Un solo argumento
                args_dict = {arg_names[0]: normalize_input(input_data)}
            elif arg_names and isinstance(input_data, list) and len(input_data) == len(arg_names):
                # Lista de valores en orden
                args_dict = {arg_names[j]: normalize_input(input_data[j]) for j in range(len(arg_names))}
            else:
                # Fallback
                args_dict = {"value": normalize_input(input_data)}
            
            # Serializar a JSON para enviar al wrapper
            input_for_wrapper = json.dumps({"args": args_dict})
            print(f"[FUNCTION] Input para wrapper: {input_for_wrapper}")
            
            temp_id = f"func_{submission_id}_{i}_{int(time.time())}"
            
            submission_dir = prepare_submission_remote(
                vm_host, vm_user, vm_pass,
                temp_id,
                code,
                language
            )
            
            result = run_test(
                vm_host, vm_user, vm_pass,
                submission_dir,
                f"test_{i}",
                input_for_wrapper,
                language,
                timeout=15,
                memory_limit_mb=memory_limit_mb
            )
            
            actual = result["output"]
            expected = test_case["expected_output"]
            
            # Normalizar expected
            expected = normalize_input(expected)
            
            # Normalizar actual si es string JSON
            if isinstance(actual, str):
                try:
                    actual = json.loads(actual)
                except:
                    pass
            
            # Comparar
            test_passed = _compare_outputs(actual, expected, problem.comparator if problem and hasattr(problem, 'comparator') else "exact")
            
            if test_passed:
                passed += 1
            
            results.append({
                "test_case_id": test_case.get("id", i),
                "passed": test_passed,
                "expected_output": expected,
                "actual_output": actual,
                "error": result["error"] if not test_passed else "",
                "execution_time": result.get("execution_time", 0)
            })
            
            print(f"[FUNCTION] Test {i+1}: {'✅ PASS' if test_passed else '❌ FAIL'}")
            print(f"   Expected: {expected}")
            print(f"   Got: {actual}")
        except Exception as e:
            logger.error(f"Error en evaluación funcional: {str(e)}", exc_info=True)
            print(f"[FUNCTION] Error en test {i+1}: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                "test_case_id": test_case.get("id", i),
                "passed": False,
                "expected_output": test_case.get("expected_output"),
                "actual_output": None,
                "error": str(e),
                "execution_time": 0
            })
    
    total = len(test_cases)
    score = (passed / total) * 100 if total > 0 else 0
    logger.info(f"Evaluación completada - Tests pasados: {passed}/{total}, Puntuación: {score}")
    print(f"[FUNCTION] Resultado final: {passed}/{total} tests pasados ({score:.1f}%)")
    
    return {
        "score": score,
        "passed": passed,
        "total": total,
        "results": results
    }

    
def evaluate_code(vm_host, vm_user, vm_pass, submission_id, code, tests, language: str = "cpp"):
    """Versión LEGACY para evaluar código con stdin/stdout."""
    submission_dir = prepare_submission_remote(
        vm_host, vm_user, vm_pass, submission_id, code, language
    )

    results = []
    passed = 0

    for test in tests:
        start = time.perf_counter()

        result = run_test(
            vm_host,
            vm_user,
            vm_pass,
            submission_dir,
            test["id"],
            test["input"],
            language
        )

        end = time.perf_counter()

        expected = test["expected_output"]
        ok = (result["output"] == expected and result["error"] == "")

        results.append({
            "test_case_id": test["id"],
            "passed": ok,
            "expected_output": expected,
            "actual_output": result["output"],
            "error": result["error"],
            "execution_time": end - start,
            "security_flag": result["flag"]
        })

        if ok:
            passed += 1

    total = len(tests)
    score = (passed / total) * 100 if total > 0 else 0

    return {
        "score": score,
        "passed": passed,
        "total": total,
        "results": results
    }