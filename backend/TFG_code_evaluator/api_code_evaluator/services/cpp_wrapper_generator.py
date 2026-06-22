# services/cpp_wrapper_generator.py - VERSIÓN CORREGIDA CON DEPURACIÓN Y SIN LIMPIEZA AGRESIVA
"""
Generador de wrappers dinámicos para C++
Genera un programa C++ completo con función main()
"""

class CppWrapperGenerator:
    """Genera código C++ completo con wrapper para ejecutar solution()"""
    
    def generate(self, user_code: str, problem) -> str:
        """
        Genera el código completo para compilar y ejecutar.
        
        Args:
            user_code: Código del estudiante
            problem: Objeto Exercise con sus arguments cargados
        
        Returns:
            Código C++ completo con includes, helpers y main
        """
        # Obtener nombres de argumentos en orden
        arg_names = self._get_argument_names(problem.arguments)
        
        # Generar conversiones para cada argumento
        conversions = self._generate_conversions(problem.arguments)
        
        # Generar llamada a la función
        if not arg_names:
            function_call = "solution()"
        else:
            function_call = f"solution({', '.join(arg_names)})"
        
        # Generar código del estudiante sin conflictos (ahora sin limpieza agresiva)
        cleaned_user_code = self._clean_user_code(user_code)
        
        return f'''#include <bits/stdc++.h>
#include <nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

// =====================
// TIPOS AUXILIARES (estructuras de datos)
// =====================

{self._get_type_helpers()}

// =====================
// CÓDIGO DEL ESTUDIANTE
// =====================

{cleaned_user_code}

// =====================
// CONVERSIONES DE ARGUMENTOS (desde JSON)
// =====================

{self._get_json_conversions()}

// =====================
// CONVERSIONES DE RESULTADO (a JSON)
// =====================

{self._get_json_serializers()}

// =====================
// MAIN - PUNTO DE ENTRADA CON DEBUG
// =====================

int main() {{
    json input;
    cin >> input;
    
    // DEBUG: imprimir lo que se recibió
    cerr << "DEBUG: Input recibido = " << input.dump() << endl;
    
    // Verificar si input tiene el campo "args"
    if (!input.contains("args")) {{
        cerr << "ERROR: input no contiene 'args'" << endl;
        cout << "null";
        return 1;
    }}
    
    json args = input["args"];
    
    // DEBUG: imprimir args
    cerr << "DEBUG: args = " << args.dump() << endl;
    
    // Verificar si args es un objeto
    if (!args.is_object()) {{
        cerr << "ERROR: args no es un objeto, es de tipo: " << args.type_name() << endl;
        cout << "null";
        return 1;
    }}
    
    // Convertir argumentos
    {conversions}
    
    // Llamar a la función solution
    auto result = {function_call};
    
    // DEBUG: imprimir el resultado devuelto por solution()
    cerr << "DEBUG: solution returned " << serialize_to_json(result).dump() << endl;
    
    // Imprimir resultado serializado como JSON
    cout << serialize_to_json(result).dump();
    
    return 0;
}}
'''
    
    def _clean_user_code(self, user_code: str) -> str:
        """Limpia el código del estudiante para evitar duplicados.
           En esta versión NO se eliminan includes ni using namespace std."""
        code = user_code.strip()
        # No se elimina nada, solo se devuelve el código original
        return code
    
    def _get_argument_names(self, arguments):
        """Obtiene los nombres de los argumentos en orden"""
        if not arguments:
            return []
        return [arg.name for arg in sorted(arguments, key=lambda x: x.position)]
    
    def _generate_conversions(self, arguments) -> str:
        """Genera el código para convertir JSON a los tipos de C++"""
        if not arguments:
            return "// No arguments"
        
        conversions = []
        for arg in sorted(arguments, key=lambda x: x.position):
            conv = self._single_conversion(arg.name, arg.type_name)
            conversions.append(conv)
        
        return "\n    ".join(conversions)
    
    def _single_conversion(self, name: str, type_name: str) -> str:
        """Genera conversión para un solo argumento"""
        
        # Tipos simples
        if type_name in ["int", "long", "long long"]:
            return f'int {name} = args["{name}"].get<int>();'
        elif type_name in ["double", "float"]:
            return f'double {name} = args["{name}"].get<double>();'
        elif type_name == "bool":
            return f'bool {name} = args["{name}"].get<bool>();'
        elif type_name == "string":
            return f'string {name} = args["{name}"].get<string>();'
        
        # Vectores
        elif type_name in ["vector<int>", "vector<long long>", "vector<double>", "vector<bool>", "vector<string>"]:
            return f'vector<int> {name} = args["{name}"].get<vector<int>>();'
        elif type_name == "vector<vector<int>>":
            return f'vector<vector<int>> {name} = args["{name}"].get<vector<vector<int>>>();'
        
        # Conjuntos
        elif type_name in ["set", "unordered_set"]:
            return f'''
set<int> {name};
for (auto& v : args["{name}"]) {{
    {name}.insert(v.get<int>());
}}'''
        
        # Mapas
        elif type_name in ["map", "unordered_map"]:
            return f'''
map<string, int> {name};
for (auto& [key, value] : args["{name}"].items()) {{
    {name}[key] = value.get<int>();
}}'''
        
        # Colas
        elif type_name == "queue":
            return f'''
queue<int> {name};
for (auto& v : args["{name}"]) {{
    {name}.push(v.get<int>());
}}'''
        elif type_name == "deque":
            return f'''
deque<int> {name};
for (auto& v : args["{name}"]) {{
    {name}.push_back(v.get<int>());
}}'''
        
        # Pila
        elif type_name == "stack":
            return f'''
stack<int> {name};
for (int i = args["{name}"].size() - 1; i >= 0; i--) {{
    {name}.push(args["{name}"][i].get<int>());
}}'''
        
        # Cola de prioridad
        elif type_name == "priority_queue":
            return f'''
priority_queue<int> {name};
for (auto& v : args["{name}"]) {{
    {name}.push(v.get<int>());
}}'''
        
        # Par
        elif type_name == "pair":
            return f'''
pair<int, int> {name};
if (args["{name}"].is_array() && args["{name}"].size() >= 2) {{
    {name} = {{args["{name}"][0].get<int>(), args["{name}"][1].get<int>()}};
}} else if (args["{name}"].is_object()) {{
    {name} = {{args["{name}"]["first"].get<int>(), args["{name}"]["second"].get<int>()}};
}}'''
        
        # Estructuras especiales
        elif type_name == "ListNode":
            return f'ListNode* {name} = buildList(args["{name}"]);'
        elif type_name == "DoublyListNode":
            return f'DoublyListNode* {name} = buildDoublyList(args["{name}"]);'
        elif type_name == "TreeNode":
            return f'TreeNode* {name} = buildTree(args["{name}"]);'
        elif type_name == "NaryTreeNode":
            return f'NaryTreeNode* {name} = buildNaryTree(args["{name}"]);'
        elif type_name == "GraphNode":
            return f'GraphNode* {name} = buildGraph(args["{name}"]);'
        
        # Por defecto
        else:
            return f'json {name} = args["{name}"];'
    
    def _get_json_conversions(self) -> str:
        """Funciones para convertir JSON a tipos de C++"""
        return '''
// =====================
// CONVERSIONES JSON -> C++
// =====================

// Lista enlazada simple
ListNode* buildList(const json& arr) {
    if (arr.empty()) return nullptr;
    ListNode* head = new ListNode(arr[0].get<int>());
    ListNode* current = head;
    for (size_t i = 1; i < arr.size(); i++) {
        current->next = new ListNode(arr[i].get<int>());
        current = current->next;
    }
    return head;
}

// Lista doblemente enlazada
DoublyListNode* buildDoublyList(const json& arr) {
    if (arr.empty()) return nullptr;
    DoublyListNode* head = new DoublyListNode(arr[0].get<int>());
    DoublyListNode* current = head;
    for (size_t i = 1; i < arr.size(); i++) {
        current->next = new DoublyListNode(arr[i].get<int>(), current);
        current = current->next;
    }
    return head;
}

// Árbol binario
TreeNode* buildTree(const json& arr) {
    if (arr.empty() || arr[0].is_null()) return nullptr;
    
    vector<TreeNode*> nodes;
    for (const auto& val : arr) {
        if (val.is_null()) nodes.push_back(nullptr);
        else nodes.push_back(new TreeNode(val.get<int>()));
    }
    
    int childIndex = 1;
    for (size_t i = 0; i < nodes.size() && childIndex < (int)nodes.size(); i++) {
        if (nodes[i] != nullptr) {
            nodes[i]->left = nodes[childIndex++];
            if (childIndex < (int)nodes.size()) {
                nodes[i]->right = nodes[childIndex++];
            }
        }
    }
    return nodes[0];
}

// Árbol N-ario
NaryTreeNode* buildNaryTree(const json& obj) {
    if (obj.empty()) return nullptr;
    
    function<NaryTreeNode*(const json&)> build = [&](const json& nodeJson) -> NaryTreeNode* {
        if (nodeJson.empty()) return nullptr;
        int val = nodeJson["val"].get<int>();
        NaryTreeNode* node = new NaryTreeNode(val);
        if (nodeJson.contains("children") && nodeJson["children"].is_array()) {
            for (const auto& childJson : nodeJson["children"]) {
                node->children.push_back(build(childJson));
            }
        }
        return node;
    };
    return build(obj);
}

// Grafo
GraphNode* buildGraph(const json& arr) {
    if (arr.empty()) return nullptr;
    
    unordered_map<int, GraphNode*> nodeMap;
    for (const auto& item : arr) {
        int val = item["val"].get<int>();
        nodeMap[val] = new GraphNode(val);
    }
    for (const auto& item : arr) {
        int val = item["val"].get<int>();
        GraphNode* node = nodeMap[val];
        if (item.contains("neighbors")) {
            for (const auto& neighborVal : item["neighbors"]) {
                int nVal = neighborVal.get<int>();
                if (nodeMap.count(nVal)) {
                    node->neighbors.push_back(nodeMap[nVal]);
                }
            }
        }
    }
    return nodeMap[arr[0]["val"].get<int>()];
}
'''
    
    def _get_json_serializers(self) -> str:
        return '''
// =====================
// SERIALIZACIÓN A JSON
// =====================

// Sobrecarga específica para std::string (con comillas)
json serialize_to_json(const std::string& value) {
    return json(value);
}

// Sobrecarga para const char* (también produce "cadena")
json serialize_to_json(const char* value) {
    return json(std::string(value));
}

// Sobrecargas para tipos básicos
json serialize_to_json(int value) { return value; }
json serialize_to_json(long long value) { return value; }
json serialize_to_json(double value) { return value; }
json serialize_to_json(bool value) { return value; }
json serialize_to_json(std::nullptr_t) { return nullptr; }

// Plantilla para vectores
template<typename T>
json serialize_to_json(const std::vector<T>& vec) {
    json arr = json::array();
    for (const auto& v : vec) arr.push_back(serialize_to_json(v));
    return arr;
}

// Plantilla para conjuntos (set, unordered_set)
template<typename T>
json serialize_to_json(const std::set<T>& s) {
    json arr = json::array();
    for (const auto& v : s) arr.push_back(serialize_to_json(v));
    return arr;
}

// Mapa (con clave convertida a string)
template<typename K, typename V>
json serialize_to_json(const std::map<K, V>& m) {
    json obj = json::object();
    for (const auto& [key, value] : m) {
        obj[std::to_string(key)] = serialize_to_json(value);
    }
    return obj;
}

// Lista enlazada simple (ListNode*)
json serialize_to_json(ListNode* head) {
    if (!head) return nullptr;
    std::vector<int> result;
    ListNode* current = head;
    while (current) {
        result.push_back(current->val);
        current = current->next;
    }
    return result;
}

// Árbol binario (TreeNode*)
json serialize_to_json(TreeNode* root) {
    if (!root) return nullptr;
    std::vector<json> result;
    std::queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* node = q.front(); q.pop();
        if (node) {
            result.push_back(node->val);
            q.push(node->left);
            q.push(node->right);
        } else {
            result.push_back(nullptr);
        }
    }
    while (!result.empty() && result.back().is_null()) result.pop_back();
    return result;
}

// (Opcional) Para cualquier otro tipo, intentar convertir a string
template<typename T>
json serialize_to_json(const T& value) {
    return json(std::to_string(value));
}
'''

    # ✅ Método _get_type_helpers correctamente dentro de la clase
    def _get_type_helpers(self) -> str:
        """Devuelve helpers para tipos complejos"""
        return '''
// =====================
// ESTRUCTURAS DE DATOS
// =====================

// Lista enlazada simple
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

// Lista doblemente enlazada
struct DoublyListNode {
    int val;
    DoublyListNode* prev;
    DoublyListNode* next;
    DoublyListNode(int x) : val(x), prev(nullptr), next(nullptr) {}
    DoublyListNode(int x, DoublyListNode* p) : val(x), prev(p), next(nullptr) {}
};

// Árbol binario
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

// Árbol N-ario
struct NaryTreeNode {
    int val;
    vector<NaryTreeNode*> children;
    NaryTreeNode(int x) : val(x) {}
};

// Grafo
struct GraphNode {
    int val;
    vector<GraphNode*> neighbors;
    GraphNode(int x) : val(x) {}
};
'''