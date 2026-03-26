import shlex

import paramiko
import time
import os
from dotenv import load_dotenv

load_dotenv()  # carga variables del .env

VM_HOST = os.getenv("VM_HOST")
VM_USER = os.getenv("VM_USER")
VM_PASS = os.getenv("VM_PASS")

def prepare_submission_remote(vm_host, vm_user, vm_pass, exercise_id, code, tests):
    submission_dir = f"/tmp/submissions/{exercise_id}"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(vm_host, username=vm_user, password=vm_pass)

    ssh.exec_command(f"mkdir -p {shlex.quote(submission_dir)}")

    sftp = ssh.open_sftp()
    sftp.chdir(submission_dir)

    with sftp.file("main.cpp", "w") as f:
        f.write(code)

    input_files = []
    for idx, test in enumerate(tests):
        filename = f"input_{idx}.txt"
        with sftp.file(filename, "w") as f:
            f.write(test["input"])
        input_files.append(f"{submission_dir}/{filename}")

    sftp.close()
    ssh.close()

    return submission_dir, input_files

def run_code(vm_host, vm_user, vm_pass, submission_dir, input_file, test_idx, timeout=5):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(vm_host, username=vm_user, password=vm_pass)

    input_name = os.path.basename(input_file)
    test_run_dir = f"{submission_dir}/run_{test_idx}"

    ssh.exec_command(f"mkdir -p {test_run_dir}")
    ssh.exec_command(f"cp {submission_dir}/main.cpp {test_run_dir}/main.cpp")
    ssh.exec_command(f"cp {input_file} {test_run_dir}/input.txt")
    ssh.exec_command(f"chmod -R 777 {test_run_dir}")

    cmd = f"""
docker run --rm \
  --memory=100m \
  --cpus=0.5 \
  --pids-limit=64 \
  --network=none \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --user=1000:1000 \
  -v {test_run_dir}:/run:rw \
  -w /run \
  gcc:12 \
  bash -c "
g++ -std=c++17 -O2 main.cpp -o program 2> compile_error.txt;
if [ $? -ne 0 ]; then
  exit 1;
fi;
timeout {timeout}s ./program < input.txt > output.txt 2> runtime_error.txt
"
"""

    stdin, stdout, stderr = ssh.exec_command(cmd)

    #  IMPORTANTE: esperar a que termine docker
    exit_status = stdout.channel.recv_exit_status()

    sftp = ssh.open_sftp()

    def read_file(path):
        try:
            with sftp.file(path, "r") as f:
                return f.read().decode()
        except:
            return ""

    output = read_file(f"{test_run_dir}/output.txt")
    compile_error = read_file(f"{test_run_dir}/compile_error.txt")
    runtime_error = read_file(f"{test_run_dir}/runtime_error.txt")

    sftp.close()
    ssh.close()

    error = ""
    security_flag = None

    if compile_error:
        error = compile_error
        security_flag = "compilation error"
    elif "timed out" in runtime_error.lower() or exit_status == 124:
        error = "Execution timed out"
        security_flag = "timeout"
    elif runtime_error:
        error = runtime_error
        security_flag = "runtime error"

    return output.strip(), error.strip(), exit_status, security_flag


def evaluate_code(vm_host, vm_user, vm_pass, code, tests, exercise_id):
    submission_dir, input_files = prepare_submission_remote(
        vm_host, vm_user, vm_pass, exercise_id, code, tests
    )

    results = []
    passed = 0

    for idx, input_file in enumerate(input_files):
        start = time.perf_counter()

        stdout, stderr, returncode, security_flag = run_code(
            vm_host, vm_user, vm_pass, submission_dir, input_file, idx
        )

        end = time.perf_counter()

        expected = tests[idx]["expected_output"]
        ok = (stdout.strip() == expected.strip()) and (stderr == "")

        results.append({
            "test_case_id": tests[idx].get("id"),
            "input": tests[idx]["input"],
            "expected": expected,
            "output": stdout,
            "passed": ok,
            "error": stderr,
            "execution_time": end - start,
            "security_flag": security_flag
        })

        if ok:
            passed += 1

    total = len(tests)
    score = (passed / total) * 100 if total else 0

    return {
        "score": score,
        "passed": passed,
        "total": total,
        "results": results
    }