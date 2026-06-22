#include <bits/stdc++.h>
#include <nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

// =====================
// TIPOS AUXILIARES (estructuras de datos)
// =====================


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


// =====================
// CÓDIGO DEL ESTUDIANTE
// =====================

#include <iostream>
#include <string>
#include <vector>
#include <map>
using namespace std;

/**
 * TODO: Describe what this function does
 * @param root 
 * @return Description of return value
 */
bool solution(GraphNode* root) {
    if (!root) return false;
    
    unordered_set<GraphNode*> visited, recStack;
    
    function<bool(GraphNode*)> dfs = [&](GraphNode* node) -> bool {
        if (!node) return false;
        if (recStack.count(node)) return true;
        if (visited.count(node)) return false;
        
        visited.insert(node);
        recStack.insert(node);
        
        for (GraphNode* neighbor : node->neighbors) {
            if (dfs(neighbor)) return true;
        }
        
        recStack.erase(node);
        return false;
    };
    
    // Recorrer todos los nodos (el grafo puede tener mÃºltiples componentes)
    unordered_set<GraphNode*> allNodes;
    queue<GraphNode*> q;
    q.push(root);
    allNodes.insert(root);
    while (!q.empty()) {
        auto cur = q.front(); q.pop();
        for (auto nb : cur->neighbors) {
            if (!allNodes.count(nb)) {
                allNodes.insert(nb);
                q.push(nb);
            }
        }
    }
    
    for (GraphNode* node : allNodes) {
        if (!visited.count(node)) {
            if (dfs(node)) return true;
        }
    }
    return false;
}

// =====================
// CONVERSIONES DE ARGUMENTOS (desde JSON)
// =====================


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


// =====================
// CONVERSIONES DE RESULTADO (a JSON)
// =====================


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


// =====================
// MAIN - PUNTO DE ENTRADA CON DEBUG
// =====================

int main() {
    json input;
    cin >> input;
    
    // DEBUG: imprimir lo que se recibió
    cerr << "DEBUG: Input recibido = " << input.dump() << endl;
    
    // Verificar si input tiene el campo "args"
    if (!input.contains("args")) {
        cerr << "ERROR: input no contiene 'args'" << endl;
        cout << "null";
        return 1;
    }
    
    json args = input["args"];
    
    // DEBUG: imprimir args
    cerr << "DEBUG: args = " << args.dump() << endl;
    
    // Verificar si args es un objeto
    if (!args.is_object()) {
        cerr << "ERROR: args no es un objeto, es de tipo: " << args.type_name() << endl;
        cout << "null";
        return 1;
    }
    
    // Convertir argumentos
    GraphNode* root = buildGraph(args["root"]);
    
    // Llamar a la función solution
    auto result = solution(root);
    
    // DEBUG: imprimir el resultado devuelto por solution()
    cerr << "DEBUG: solution returned " << serialize_to_json(result).dump() << endl;
    
    // Imprimir resultado serializado como JSON
    cout << serialize_to_json(result).dump();
    
    return 0;
}
