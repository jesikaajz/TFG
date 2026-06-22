import json
import re
import requests


import json
import re
import requests

def extract_json(text):
    """Extrae y repara JSON de la respuesta del LLM."""
    if not text or not text.strip():
        raise Exception("Empty LLM response")

    original = text
    text = text.strip()

    # 1. Buscar bloque de código
    json_block = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
    if json_block:
        text = json_block.group(1)
    else:
        # 2. Buscar el primer '{' y el último '}'
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and start < end:
            text = text[start:end+1]
        else:
            # 3. Si no, intentar con cualquier cosa que empiece y termine con llaves
            if text.startswith('{') and text.endswith('}'):
                pass
            else:
                print(f"[EXTRACT] No JSON found. Raw:\n{original[:500]}")
                raise Exception("No JSON found")

    # 4. Limpiar caracteres de control y BOM
    text = re.sub(r'[\x00-\x1f\x7f]', '', text)
    # 5. Reemplazar comillas simples por dobles en nombres de clave
    text = re.sub(r"'([^']+?)':", r'"\1":', text)
    # 6. Reemplazar comillas simples por dobles en valores string (básico, no cubre escapes)
    #    Se hace con una expresión que busca ':' seguido de espacio y luego una comilla simple
    text = re.sub(r':\s*\'([^\']*)\'', r': "\1"', text)
    # 7. Eliminar trailing commas
    text = re.sub(r',\s*}', '}', text)
    text = re.sub(r',\s*]', ']', text)

    # 8. Intentar parsear
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"[EXTRACT] JSON parse error: {e}\nCleaned text:\n{text[:500]}")
        raise

def generate_single_criterion_feedback(criterion_name, criterion_desc, 
                                        exercise_desc, code, passed, total):
    print(f"   📝 Evaluando: {criterion_name}")
    
    code_short = (code[:400] + "...") if len(code) > 400 else code
    criterion_short = (criterion_desc[:150] + "...") if len(criterion_desc) > 150 else criterion_desc
    
    prompt = f"""Criterio: {criterion_name}
{criterion_short}
Tests: {passed}/{total} pasados.
Código:
{code_short}

Devuelve SOLO este JSON, sin texto adicional:
{{"score": 0-10, "comment": "Comentario detallado en español (mínimo 80 caracteres) explicando por qué se asigna esa puntuación y qué mejorar. Puedes usar saltos de línea."}}"""
    
    max_retries = 2
    for attempt in range(max_retries):
        try:
            print(f"      📤 Intento {attempt+1}/{max_retries}...")
            response = requests.post(
                "http://10.5.160.165:11434/api/generate",
                json={
                    "model": "llama3",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {
                        "num_predict": 300,      # Aumentado para comentarios completos
                        "temperature": 0.3,
                        "top_p": 0.9,
                        "stop": ["\n```", "```"]
                    }
                },
                timeout=80
            )
            response.raise_for_status()
            data = response.json()
            text = data.get("response", "").strip()
            if not text:
                if attempt == 0:
                    continue
                return {"score": 5, "comment": "Respuesta vacía"}
            
            result = json.loads(text)
            score = result.get("score", 5)
            if isinstance(score, str):
                try:
                    score = int(score)
                except:
                    score = 5
            comment = result.get("comment", "")
            # No truncar (o truncar a 600 caracteres si quieres un límite alto)
            if len(comment) < 30:
                comment = "Revisa los detalles de la evaluación. " + comment
            print(f"      ✅ {criterion_name}: {score}/10")
            return {
                "score": max(0, min(10, score)),
                "comment": comment
            }
        except Exception as e:
            print(f"      ❌ Error: {e}")
            if attempt == 0:
                continue
            return {"score": 5, "comment": f"Error: {str(e)[:50]}"}
    return {"score": 5, "comment": "Error tras reintentos"}

def combine_criteria_feedback(criteria_results):
    print(f"🧩 Combinando {len(criteria_results)} criterios...")
    criteria_text = "\n".join([f"- {r['criterion_name']}: {r['score']}/10 - {r['comment']}" for r in criteria_results])
    
    prompt = f"""Eres un profesor de programación. Basándote en estas evaluaciones, escribe un feedback general **en español**, constructivo y detallado (mínimo 150 caracteres, máximo 800). Destaca fortalezas y áreas de mejora concretas. Puedes usar saltos de línea.

Evaluaciones:
{criteria_text}

Responde SOLO con JSON: {{"feedback": "texto del feedback"}}"""
    
    try:
        response = requests.post(
            "http://10.5.160.165:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "num_predict": 800,         # Aumentado para feedback más largo
                    "temperature": 0.3,
                    "top_p": 0.9
                }
            },
            timeout=80
        )
        if response.ok:
            data = response.json()
            text = data.get("response", "").strip()
            if text:
                try:
                    result = json.loads(text)
                except:
                    result = extract_json(text)
                feedback = result.get("feedback", "")
                if feedback and len(feedback) >= 40:
                    return {
                        "criteria_scores": [{"name": r["criterion_name"], "score": r["score"], "comment": r["comment"]} for r in criteria_results],
                        "feedback": feedback
                    }
    except Exception as e:
        print(f"⚠️ Error en combine: {e}")
    
    # Fallback manual (sin cambios)
    avg_score = sum(r['score'] for r in criteria_results) / len(criteria_results)
    if avg_score >= 8:
        feedback = "¡Excelente trabajo! Tu código es muy sólido. Para perfeccionarlo aún más, revisa los comentarios de cada criterio y aplica las pequeñas mejoras sugeridas. ¡Sigue así!"
    elif avg_score >= 6:
        feedback = "Buen trabajo, pero aún hay margen de mejora. Concéntrate en los criterios con puntuaciones más bajas y aplica las sugerencias. ¡Sigue practicando!"
    else:
        feedback = "Es necesario mejorar varios aspectos. Revisa con atención los comentarios de cada criterio, especialmente los de corrección y eficiencia. No dudes en consultar ejemplos o pedir ayuda."
    
    return {
        "criteria_scores": [{"name": r["criterion_name"], "score": r["score"], "comment": r["comment"]} for r in criteria_results],
        "feedback": feedback
    }

def generate_feedback(exercise_description, code, passed, total, rubric):
    """
    Wrapper para mantener compatibilidad con código existente.
    Evalúa todos los criterios secuencialmente (no paralelo).
    """
    print(f"🚀 [COMPAT] Generando feedback secuencial...")
    
    result = {
        "criteria_scores": [],
        "feedback": ""
    }
    
    if rubric:
        if isinstance(rubric, dict):
            criteria_items = list(rubric.items())
        elif isinstance(rubric, list):
            criteria_items = [(f"Criterio {i+1}", c) for i, c in enumerate(rubric)]
        else:
            criteria_items = [("General", str(rubric))]
        
        for criterion_name, criterion_desc in criteria_items[:5]:
            try:
                single = generate_single_criterion_feedback(
                    criterion_name,
                    criterion_desc,
                    exercise_description,
                    code,
                    passed,
                    total
                )
                result["criteria_scores"].append({
                    "name": criterion_name,
                    "score": single.get("score", 5),
                    "comment": single.get("comment", "")
                })
            except Exception as e:
                print(f"⚠️ Error en {criterion_name}: {e}")
                result["criteria_scores"].append({
                    "name": criterion_name,
                    "score": 5,
                    "comment": "Error en evaluación"
                })
        
        if result["criteria_scores"]:
            try:
                combined = combine_criteria_feedback(result["criteria_scores"])
                result["feedback"] = combined.get("feedback", "")
            except Exception as e:
                print(f"Error combinando feedback: {e}")
                result["feedback"] = f"Has pasado {passed}/{total} tests. Revisa los comentarios por criterio."
    else:
        result["feedback"] = f"Has pasado {passed}/{total} tests. Revisa los comentarios por criterio."
    
    return result
