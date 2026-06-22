from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.colors import green, red, black, gray, HexColor
import os
from datetime import datetime

def generate_feedback_summary(evaluation, llm_result):
    """Genera un feedback general basado en los resultados si el LLM no proporcionó uno."""
    passed = evaluation.passed_tests
    total = evaluation.total_tests
    score = evaluation.score
    criteria_scores = llm_result.get("criteria_scores", [])
    
    if criteria_scores:
        avg_score = sum(c.get("score", 0) for c in criteria_scores) / len(criteria_scores)
        if avg_score >= 8:
            return f"¡Excelente trabajo! Has superado todos los tests ({passed}/{total}) y has obtenido una puntuación media de {avg_score:.1f}/10 en los criterios evaluados. Sigue así."
        elif avg_score >= 5:
            return f"Buen esfuerzo. Has pasado {passed}/{total} tests y tu puntuación media es {avg_score:.1f}/10. Revisa los comentarios para mejorar."
        else:
            return f"Necesitas mejorar. Has pasado {passed}/{total} tests y tu puntuación media es {avg_score:.1f}/10. Presta atención a los comentarios de cada criterio."
    else:
        return f"Has obtenido {score:.1f}% en los tests ({passed}/{total}). Revisa los criterios para ver detalles."

def generate_feedback_pdf(evaluation, submission, exercise, llm_result, output_path, student_name=None):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(output_path)
    styles = getSampleStyleSheet()

    # Estilos (igual que antes)
    title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=20, textColor=HexColor('#1a5276'), spaceAfter=20, alignment=TA_CENTER)
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14, textColor=HexColor('#2874a6'), spaceBefore=15, spaceAfter=10)
    criterion_name_style = ParagraphStyle('CriterionName', parent=styles['Normal'], fontSize=12, textColor=HexColor('#1b4f72'), fontName='Helvetica-Bold', leftIndent=10)
    criterion_comment_style = ParagraphStyle('CriterionComment', parent=styles['Normal'], fontSize=11, textColor=black, leftIndent=25, spaceAfter=8)
    feedback_style = ParagraphStyle('Feedback', parent=styles['Normal'], fontSize=12, textColor=HexColor('#2c3e50'), leftIndent=10, spaceBefore=5, spaceAfter=5)
    info_style = ParagraphStyle('Info', parent=styles['Normal'], fontSize=11, textColor=gray, alignment=TA_LEFT)
    pass_style = ParagraphStyle('Pass', parent=styles['Normal'], fontSize=11, textColor=green, fontName='Helvetica-Bold')
    fail_style = ParagraphStyle('Fail', parent=styles['Normal'], fontSize=11, textColor=red, fontName='Helvetica-Bold')

    content = []
    content.append(Paragraph("Informe de Evaluación", title_style))
    content.append(Paragraph(f"<b>Ejercicio:</b> {exercise.title}", info_style))
    content.append(Spacer(1, 5))
    fecha = datetime.now().strftime("%d/%m/%Y %H:%M")
    content.append(Paragraph(f"<b>Fecha:</b> {fecha}", info_style))
    content.append(Spacer(1, 15))

    # INFORMACIÓN GENERAL (con nombre del alumno)
    content.append(Paragraph("Información General", heading_style))
    
    passed = evaluation.passed_tests
    total = evaluation.total_tests
    percentage = (passed / total * 100) if total > 0 else 0
    score_color = "green" if percentage >= 80 else ("orange" if percentage >= 50 else "red")
    content.append(Paragraph(f"<b>Tests pasados:</b> {passed}/{total}", info_style))
    content.append(Paragraph(f"<b>Puntuación:</b> <font color='{score_color}'><b>{percentage:.2f}%</b></font>", info_style))
    content.append(Spacer(1, 15))

    # EVALUACIÓN POR CRITERIOS
    if llm_result and "criteria_scores" in llm_result and llm_result["criteria_scores"]:
        content.append(Paragraph("Evaluación por Criterios", heading_style))
        for i, criterion in enumerate(llm_result["criteria_scores"], 1):
            name = criterion.get('name', f'Criterio {i}')
            score = criterion.get('score', 0)
            comment = criterion.get('comment', 'Sin comentario')
            score_color_c = "green" if score >= 8 else ("orange" if score >= 5 else "red")
            criterion_text = f"<b>{i}. {name}</b> - <font color='{score_color_c}'><b>{score}/10</b></font>"
            content.append(Paragraph(criterion_text, criterion_name_style))
            content.append(Paragraph(comment, criterion_comment_style))
            content.append(Spacer(1, 3))
        content.append(Spacer(1, 10))
    else:
        content.append(Paragraph("Evaluación por Criterios", heading_style))
        content.append(Paragraph("<i>No hay criterios evaluados</i>", info_style))
        content.append(Spacer(1, 10))

    # FEEDBACK GENERAL (mejorado)
    content.append(Paragraph("Feedback General", heading_style))
    if llm_result and "feedback" in llm_result and llm_result["feedback"]:
        feedback_text = llm_result["feedback"]
        # Si el feedback es el genérico antiguo, lo reemplazamos
        if feedback_text.strip() == "Evaluación completada. Revisa los comentarios por criterio.":
            feedback_text = generate_feedback_summary(evaluation, llm_result)
    else:
        feedback_text = generate_feedback_summary(evaluation, llm_result)
    content.append(Paragraph(feedback_text, feedback_style))
    content.append(Spacer(1, 15))

    # RESULTADOS DETALLADOS (opcional, igual que antes)
    # ... (código existente para mostrar tests)
    
    # CÓDIGO DEL ALUMNO (opcional)
    # ... (código existente)
    
    # PIE DE PÁGINA
    content.append(Spacer(1, 20))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=gray, alignment=TA_CENTER)
    content.append(Paragraph("— Generado automáticamente por Code Evaluator —", footer_style))

    doc.build(content)
    print(f"✅ PDF generado correctamente: {output_path}")
    return output_path

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.colors import green, red, black, gray, HexColor
import os
from datetime import datetime

def generate_conclusion(evaluation, llm_result):
    """
    Genera una conclusión personalizada basada en los criterios y resultados.
    """
    passed = evaluation.passed_tests
    total = evaluation.total_tests
    criteria_scores = llm_result.get("criteria_scores", [])
    
    if not criteria_scores:
        return f"Has superado {passed}/{total} tests. Revisa los detalles arriba."
    
    # Analizar fortalezas y debilidades
    strengths = []
    weaknesses = []
    for c in criteria_scores:
        if c['score'] >= 8:
            strengths.append(c['name'])
        elif c['score'] <= 5:
            weaknesses.append(c['name'])
    
    conclusion = f"En general, has obtenido {passed}/{total} tests correctos. "
    if strengths:
        conclusion += f"Tus puntos fuertes son: {', '.join(strengths)}. "
    if weaknesses:
        conclusion += f"Áreas de mejora: {', '.join(weaknesses)}. "
    
    # Recomendación final
    avg_score = sum(c['score'] for c in criteria_scores) / len(criteria_scores)
    if avg_score >= 8:
        conclusion += "¡Excelente trabajo! Sigue así."
    elif avg_score >= 6:
        conclusion += "Buen esfuerzo. Revisa los comentarios para seguir mejorando."
    else:
        conclusion += "Te recomendamos repasar los conceptos básicos y practicar más."
    
    return conclusion

def generate_feedback_pdf(evaluation, submission, exercise, llm_result, output_path, student_name=None):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(output_path)
    styles = getSampleStyleSheet()

    # Estilos
    title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=20, textColor=HexColor('#1a5276'), spaceAfter=20, alignment=TA_CENTER)
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14, textColor=HexColor('#2874a6'), spaceBefore=15, spaceAfter=10)
    criterion_name_style = ParagraphStyle('CriterionName', parent=styles['Normal'], fontSize=12, textColor=HexColor('#1b4f72'), fontName='Helvetica-Bold', leftIndent=10)
    criterion_desc_style = ParagraphStyle('CriterionDesc', parent=styles['Normal'], fontSize=10, textColor=gray, leftIndent=15, spaceAfter=2)
    criterion_comment_style = ParagraphStyle('CriterionComment', parent=styles['Normal'], fontSize=11, textColor=black, leftIndent=25, spaceAfter=8)
    feedback_style = ParagraphStyle('Feedback', parent=styles['Normal'], fontSize=12, textColor=HexColor('#2c3e50'), leftIndent=10, spaceBefore=5, spaceAfter=5)
    info_style = ParagraphStyle('Info', parent=styles['Normal'], fontSize=11, textColor=gray, alignment=TA_LEFT)

    content = []
    content.append(Paragraph("Informe de Evaluación", title_style))
    content.append(Paragraph(f"<b>Ejercicio:</b> {exercise.title}", info_style))
    content.append(Spacer(1, 5))
    fecha = datetime.now().strftime("%d/%m/%Y %H:%M")
    content.append(Paragraph(f"<b>Fecha:</b> {fecha}", info_style))
    content.append(Spacer(1, 15))

    # Información General
    content.append(Paragraph("Información General", heading_style))
    if student_name:
        content.append(Paragraph(f"<b>Alumno:</b> {student_name}", info_style))
    else:
        content.append(Paragraph(f"<b>Alumno ID:</b> {submission.student_id}", info_style))
    passed = evaluation.passed_tests
    total = evaluation.total_tests
    percentage = (passed / total * 100) if total > 0 else 0
    score_color = "green" if percentage >= 80 else ("orange" if percentage >= 50 else "red")
    content.append(Paragraph(f"<b>Tests pasados:</b> {passed}/{total}", info_style))
    content.append(Paragraph(f"<b>Puntuación:</b> <font color='{score_color}'><b>{percentage:.2f}%</b></font>", info_style))
    content.append(Spacer(1, 15))

    # Evaluación por Criterios (con descripción)
    if llm_result and "criteria_scores" in llm_result and llm_result["criteria_scores"]:
        content.append(Paragraph("Evaluación por Criterios", heading_style))
        for i, criterion in enumerate(llm_result["criteria_scores"], 1):
            name = criterion.get('name', f'Criterio {i}')
            description = criterion.get('description', '')
            score = criterion.get('score', 0)
            comment = criterion.get('comment', 'Sin comentario')
            score_color_c = "green" if score >= 8 else ("orange" if score >= 5 else "red")
            criterion_text = f"<b>{i}. {name}</b> - <font color='{score_color_c}'><b>{score}/10</b></font>"
            content.append(Paragraph(criterion_text, criterion_name_style))
            if description:
                content.append(Paragraph(f"<i>{description}</i>", criterion_desc_style))
            content.append(Paragraph(comment, criterion_comment_style))
            content.append(Spacer(1, 3))
        content.append(Spacer(1, 10))
    else:
        content.append(Paragraph("Evaluación por Criterios", heading_style))
        content.append(Paragraph("<i>No hay criterios evaluados</i>", info_style))
        content.append(Spacer(1, 10))

    # Feedback General como conclusión
    content.append(Paragraph("Conclusión", heading_style))
    if llm_result and "feedback" in llm_result and llm_result["feedback"]:
        feedback_text = llm_result["feedback"]
        # Si es el texto genérico, lo reemplazamos
        if feedback_text.strip() in ["Evaluación completada. Revisa los comentarios por criterio.", ""]:
            feedback_text = generate_conclusion(evaluation, llm_result)
    else:
        feedback_text = generate_conclusion(evaluation, llm_result)
    content.append(Paragraph(feedback_text, feedback_style))
    content.append(Spacer(1, 15))

    # Aquí podrías añadir los resultados detallados de tests si quieres
    # ... (código existente)

    # Pie de página
    content.append(Spacer(1, 20))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=gray, alignment=TA_CENTER)
    content.append(Paragraph("— Generado automáticamente por Code Evaluator —", footer_style))

    doc.build(content)
    print(f"✅ PDF generado correctamente: {output_path}")
    return output_path