@echo off
title Iniciar Workers Celery
echo ========================================
echo    INICIANDO TODOS LOS WORKERS
echo ========================================
echo.

cd /d "C:\Users\Gerard\Documents\GitHub\TFG\backend\TFG_code_evaluator"

:: Matar procesos previos
taskkill /F /IM celery.exe 2>nul
timeout /t 3 >nul

:: Usar start con ventanas visibles
echo [1/6] Iniciando DEFAULT...
start "Celery Default" cmd /c "celery -A api_code_evaluator.celery_app:celery worker -Q default -n default_worker --concurrency=2 --pool=solo -l info"

timeout /t 2 >nul

echo [2/6] Iniciando EXECUTION...
start "Celery Execution" cmd /c "celery -A api_code_evaluator.celery_app:celery worker -Q execution -n execution_worker --concurrency=4 --pool=solo -l info"

timeout /t 2 >nul

echo [3/6] Iniciando LLM...
start "Celery LLM" cmd /c "celery -A api_code_evaluator.celery_app:celery worker -Q llm -n llm_worker --concurrency=1 --pool=solo -l info"

timeout /t 2 >nul

echo [4/6] Iniciando PDF...
start "Celery PDF" cmd /c "celery -A api_code_evaluator.celery_app:celery worker -Q pdf -n pdf_worker --concurrency=1 --pool=solo -l info"

timeout /t 2 >nul

echo [5/6] Iniciando SECURITY...
start "Celery Security" cmd /c "celery -A api_code_evaluator.celery_app:celery worker -Q security -n security_worker --concurrency=1 --pool=solo -l warning"

timeout /t 2 >nul

echo [6/6] Iniciando NOTIFICATIONS...
start "Celery Notifications" cmd /c "celery -A api_code_evaluator.celery_app:celery worker -Q notifications -n notifications_worker --concurrency=1 --pool=solo -l info"

echo.
echo ========================================
echo    WORKERS INICIADOS!
echo ========================================
echo.
echo Las ventanas de los workers se han abierto.
echo Puedes cerrar esta ventana.
echo.
pause