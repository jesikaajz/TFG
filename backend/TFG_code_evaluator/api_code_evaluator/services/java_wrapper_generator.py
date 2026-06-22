# services/java_wrapper_generator.py - Versión SIMPLE

class JavaWrapperGenerator:
    """Genera código Java completo con wrapper para ejecutar solution()"""
    
    def generate(self, user_code: str, problem) -> str:
        """
        Genera el código completo para compilar y ejecutar.
        """
        arg_names = self._get_argument_names(problem.arguments)
        
        # Generar declaraciones de variables
        field_declarations = self._generate_field_declarations(problem.arguments)
        
        # Limpiar el código del estudiante
        cleaned_code = self._clean_user_code(user_code)
        
        # Generar la llamada a la función
        if not arg_names:
            function_call = f"result = Solution.solution();"
        else:
            function_call = f"result = Solution.solution({', '.join(arg_names)});"
        
        return f'''
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonArray;
import com.google.gson.reflect.TypeToken;
import java.lang.reflect.Type;
import java.util.*;

// =====================
// TIPOS AUXILIARES
// =====================

{self._get_type_helpers()}

// =====================
// CÓDIGO DEL ESTUDIANTE
// =====================

class Solution {{
    {cleaned_code}
}}

// =====================
// WRAPER AUTOMÁTICO
// =====================

public class Wrapper {{
    
    public static void main(String[] args) throws Exception {{
        Gson gson = new GsonBuilder()
            .registerTypeAdapter(ListNode.class, new ListNodeAdapter())
            .registerTypeAdapter(DoublyListNode.class, new DoublyListNodeAdapter())
            .registerTypeAdapter(TreeNode.class, new TreeNodeAdapter())
            .registerTypeAdapter(GraphNode.class, new GraphNodeAdapter())
            .create();
        
        Scanner scanner = new Scanner(System.in);
        String inputJson = scanner.useDelimiter("\\\\A").hasNext() ? 
                           scanner.useDelimiter("\\\\A").next() : "";
        scanner.close();
        
        JsonObject input = gson.fromJson(inputJson, JsonObject.class);
        JsonObject argsJson = input.getAsJsonObject("args");
        
        // Convertir argumentos
        {field_declarations}
        
        // Llamar a la función solution
        Object result = null;
        {function_call}
        
        // Imprimir resultado
        System.out.println(gson.toJson(result));
    }}
}}
'''
    
    def _clean_user_code(self, user_code: str) -> str:
        """Limpia el código del estudiante"""
        user_code = user_code.strip()
        
        # Eliminar "public class Solution" si existe
        if user_code.startswith('public class Solution'):
            lines = user_code.split('\n')
            new_lines = []
            in_class = False
            brace_count = 0
            for line in lines:
                if 'public class Solution' in line:
                    in_class = True
                    if '{' in line:
                        brace_count = 1
                    continue
                if in_class:
                    brace_count += line.count('{')
                    brace_count -= line.count('}')
                    if brace_count <= 0 and '}' in line:
                        in_class = False
                        continue
                    new_lines.append(line)
            user_code = '\n'.join(new_lines).strip()
        
        # Asegurar que tiene public static
        if 'public static' in user_code or 'static public' in user_code:
            return user_code
        if user_code.startswith(('int ', 'void ', 'boolean ', 'String ', 'double ', 'float ', 'long ', 'Map', 'List', 'Set')):
            return f'public static {user_code}'
        if user_code.startswith('public ') and 'static' not in user_code:
            return user_code.replace('public ', 'public static ')
        
        return f'public static {user_code}'
    
    def _generate_field_declarations(self, arguments) -> str:
        """Genera las declaraciones de variables para los argumentos"""
        if not arguments:
            return "// No arguments"
        
        declarations = []
        for arg in sorted(arguments, key=lambda x: x.position):
            decl = self._field_declaration(arg.name, arg.type_name)
            declarations.append(decl)
        
        return "\n        ".join(declarations)
    
    def _field_declaration(self, name: str, type_name: str) -> str:
        """Genera la declaración de variable para un argumento"""
        
        # Tipos simples
        if type_name in ["int", "long", "long long"]:
            return f'int {name} = argsJson.get("{name}").getAsInt();'
        elif type_name in ["double", "float"]:
            return f'double {name} = argsJson.get("{name}").getAsDouble();'
        elif type_name == "bool":
            return f'boolean {name} = argsJson.get("{name}").getAsBoolean();'
        elif type_name == "string":
            return f'String {name} = argsJson.get("{name}").getAsString();'
        
        # Listas
        elif type_name in ["vector<int>", "vector<long long>", "vector<double>", "vector<bool>"]:
            return f'List<Integer> {name} = gson.fromJson(argsJson.get("{name}"), new TypeToken<List<Integer>>(){{}}.getType());'
        elif type_name == "vector<string>":
            return f'List<String> {name} = gson.fromJson(argsJson.get("{name}"), new TypeToken<List<String>>(){{}}.getType());'
        elif type_name == "vector<vector<int>>":
            return f'List<List<Integer>> {name} = gson.fromJson(argsJson.get("{name}"), new TypeToken<List<List<Integer>>>(){{}}.getType());'
        
        # Conjuntos
        elif type_name in ["set", "unordered_set"]:
            return f'Set<Integer> {name} = new HashSet<>(gson.fromJson(argsJson.get("{name}"), new TypeToken<List<Integer>>(){{}}.getType()));'
        
        # Mapas
        elif type_name in ["map", "unordered_map"]:
            # Para el mapa de intereses (Map<Integer, Map<String, List<String>>>)
            if 'interest' in name.lower():
                return f'Map<Integer, Map<String, List<String>>> {name} = gson.fromJson(argsJson.get("{name}"), new TypeToken<Map<Integer, Map<String, List<String>>>>(){{}}.getType());'
            else:
                return f'Map<String, Object> {name} = gson.fromJson(argsJson.get("{name}"), new TypeToken<Map<String, Object>>(){{}}.getType());'
        
        # Colas y Pilas
        elif type_name == "queue":
            return f'Queue<Integer> {name} = new LinkedList<>(gson.fromJson(argsJson.get("{name}"), new TypeToken<List<Integer>>(){{}}.getType()));'
        elif type_name == "stack":
            return f'Stack<Integer> {name} = new Stack<>(); List<Integer> {name}List = gson.fromJson(argsJson.get("{name}"), new TypeToken<List<Integer>>(){{}}.getType()); for (int i = {name}List.size()-1; i>=0; i--) {name}.push({name}List.get(i));'
        elif type_name == "deque":
            return f'Deque<Integer> {name} = new ArrayDeque<>(gson.fromJson(argsJson.get("{name}"), new TypeToken<List<Integer>>(){{}}.getType()));'
        elif type_name == "priority_queue":
            return f'PriorityQueue<Integer> {name} = new PriorityQueue<>(gson.fromJson(argsJson.get("{name}"), new TypeToken<List<Integer>>(){{}}.getType()));'
        
        # Estructuras personalizadas
        elif type_name == "ListNode":
            return f'ListNode {name} = gson.fromJson(argsJson.get("{name}"), ListNode.class);'
        elif type_name == "DoublyListNode":
            return f'DoublyListNode {name} = gson.fromJson(argsJson.get("{name}"), DoublyListNode.class);'
        elif type_name == "TreeNode":
            return f'TreeNode {name} = gson.fromJson(argsJson.get("{name}"), TreeNode.class);'
        elif type_name == "GraphNode":
            return f'GraphNode {name} = gson.fromJson(argsJson.get("{name}"), GraphNode.class);'
        
        # Por defecto
        else:
            return f'JsonElement {name} = argsJson.get("{name}");'
    
    def _get_argument_names(self, arguments):
        return [arg.name for arg in sorted(arguments, key=lambda x: x.position)]
    
    def _get_type_helpers(self) -> str:
        return '''
// =====================
// LISTA ENLAZADA SIMPLE
// =====================
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class ListNodeAdapter implements com.google.gson.JsonSerializer<ListNode>, com.google.gson.JsonDeserializer<ListNode> {
    @Override
    public JsonElement serialize(ListNode src, java.lang.reflect.Type typeOfSrc, com.google.gson.JsonSerializationContext context) {
        List<Integer> list = new ArrayList<>();
        ListNode current = src;
        while (current != null) {
            list.add(current.val);
            current = current.next;
        }
        return context.serialize(list);
    }
    
    @Override
    public ListNode deserialize(JsonElement json, java.lang.reflect.Type typeOfT, com.google.gson.JsonDeserializationContext context) {
        List<Integer> list = context.deserialize(json, new TypeToken<List<Integer>>(){}.getType());
        if (list == null || list.isEmpty()) return null;
        ListNode head = new ListNode(list.get(0));
        ListNode current = head;
        for (int i = 1; i < list.size(); i++) {
            current.next = new ListNode(list.get(i));
            current = current.next;
        }
        return head;
    }
}

// =====================
// LISTA DOBLEMENTE ENLAZADA
// =====================
class DoublyListNode {
    int val;
    DoublyListNode prev;
    DoublyListNode next;
    DoublyListNode() {}
    DoublyListNode(int val) { this.val = val; }
}

class DoublyListNodeAdapter implements com.google.gson.JsonSerializer<DoublyListNode>, com.google.gson.JsonDeserializer<DoublyListNode> {
    @Override
    public JsonElement serialize(DoublyListNode src, java.lang.reflect.Type typeOfSrc, com.google.gson.JsonSerializationContext context) {
        List<Integer> list = new ArrayList<>();
        DoublyListNode current = src;
        while (current != null) {
            list.add(current.val);
            current = current.next;
        }
        return context.serialize(list);
    }
    
    @Override
    public DoublyListNode deserialize(JsonElement json, java.lang.reflect.Type typeOfT, com.google.gson.JsonDeserializationContext context) {
        List<Integer> list = context.deserialize(json, new TypeToken<List<Integer>>(){}.getType());
        if (list == null || list.isEmpty()) return null;
        DoublyListNode head = new DoublyListNode(list.get(0));
        DoublyListNode current = head;
        for (int i = 1; i < list.size(); i++) {
            current.next = new DoublyListNode(list.get(i));
            current.next.prev = current;
            current = current.next;
        }
        return head;
    }
}

// =====================
// ÁRBOL BINARIO
// =====================
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
}

class TreeNodeAdapter implements com.google.gson.JsonSerializer<TreeNode>, com.google.gson.JsonDeserializer<TreeNode> {
    @Override
    public JsonElement serialize(TreeNode src, java.lang.reflect.Type typeOfSrc, com.google.gson.JsonSerializationContext context) {
        if (src == null) return null;
        List<Integer> result = new ArrayList<>();
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(src);
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            if (node == null) {
                result.add(null);
            } else {
                result.add(node.val);
                queue.add(node.left);
                queue.add(node.right);
            }
        }
        while (!result.isEmpty() && result.get(result.size() - 1) == null) {
            result.remove(result.size() - 1);
        }
        return context.serialize(result);
    }
    
    @Override
    public TreeNode deserialize(JsonElement json, java.lang.reflect.Type typeOfT, com.google.gson.JsonDeserializationContext context) {
        List<Integer> arr = context.deserialize(json, new TypeToken<List<Integer>>(){}.getType());
        if (arr == null || arr.isEmpty() || arr.get(0) == null) return null;
        
        List<TreeNode> nodes = new ArrayList<>();
        for (Integer val : arr) {
            nodes.add(val == null ? null : new TreeNode(val));
        }
        
        int childIndex = 1;
        for (int i = 0; i < nodes.size() && childIndex < nodes.size(); i++) {
            TreeNode node = nodes.get(i);
            if (node != null) {
                node.left = nodes.get(childIndex++);
                if (childIndex < nodes.size()) {
                    node.right = nodes.get(childIndex++);
                }
            }
        }
        return nodes.get(0);
    }
}

// =====================
// GRAFO
// =====================
class GraphNode {
    int val;
    List<GraphNode> neighbors;
    GraphNode() {}
    GraphNode(int val) { this.val = val; this.neighbors = new ArrayList<>(); }
}

class GraphNodeAdapter implements com.google.gson.JsonSerializer<GraphNode>, com.google.gson.JsonDeserializer<GraphNode> {
    @Override
    public JsonElement serialize(GraphNode src, java.lang.reflect.Type typeOfSrc, com.google.gson.JsonSerializationContext context) {
        if (src == null) return null;
        List<JsonObject> result = new ArrayList<>();
        Set<Integer> visited = new HashSet<>();
        Queue<GraphNode> queue = new LinkedList<>();
        queue.add(src);
        visited.add(src.val);
        while (!queue.isEmpty()) {
            GraphNode node = queue.poll();
            JsonObject obj = new JsonObject();
            obj.addProperty("val", node.val);
            JsonArray neighborsArr = new JsonArray();
            for (GraphNode neighbor : node.neighbors) {
                neighborsArr.add(neighbor.val);
                if (!visited.contains(neighbor.val)) {
                    visited.add(neighbor.val);
                    queue.add(neighbor);
                }
            }
            obj.add("neighbors", neighborsArr);
            result.add(obj);
        }
        return context.serialize(result);
    }
    
    @Override
    public GraphNode deserialize(JsonElement json, java.lang.reflect.Type typeOfT, com.google.gson.JsonDeserializationContext context) {
        List<JsonObject> objList = context.deserialize(json, new TypeToken<List<JsonObject>>(){}.getType());
        if (objList == null || objList.isEmpty()) return null;
        
        Map<Integer, GraphNode> nodeMap = new HashMap<>();
        for (JsonObject obj : objList) {
            int val = obj.get("val").getAsInt();
            nodeMap.put(val, new GraphNode(val));
        }
        
        for (JsonObject obj : objList) {
            int val = obj.get("val").getAsInt();
            GraphNode node = nodeMap.get(val);
            if (obj.has("neighbors")) {
                JsonArray neighborsArr = obj.getAsJsonArray("neighbors");
                for (JsonElement neighborVal : neighborsArr) {
                    int nVal = neighborVal.getAsInt();
                    if (nodeMap.containsKey(nVal)) {
                        node.neighbors.add(nodeMap.get(nVal));
                    }
                }
            }
        }
        return nodeMap.get(objList.get(0).get("val").getAsInt());
    }
}
'''