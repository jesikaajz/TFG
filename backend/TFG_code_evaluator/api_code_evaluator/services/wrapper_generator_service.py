# services/wrapper_generator_service.py
from .cpp_wrapper_generator import CppWrapperGenerator
from .python_wrapper_generator import PythonWrapperGenerator
from .java_wrapper_generator import JavaWrapperGenerator  

class WrapperGeneratorService:
    """Servicio que selecciona el generador según el lenguaje"""
    
    def __init__(self):
        self.generators = {
            "cpp": CppWrapperGenerator(),
             "python": PythonWrapperGenerator(), 
             "java": JavaWrapperGenerator()  
        }
    
    def generate(self, language: str, user_code: str, problem) -> str:
        """
        Genera código completo con wrapper para el lenguaje dado.
        
        Args:
            language: "cpp", "python", "java"
            user_code: Código del estudiante
            problem: Objeto Exercise con arguments cargados
        
        Returns:
            Código completo listo para compilar/ejecutar
        """
        generator = self.generators.get(language.lower())
        if not generator:
            raise ValueError(f"Lenguaje no soportado: {language}")
        
        return generator.generate(user_code, problem)