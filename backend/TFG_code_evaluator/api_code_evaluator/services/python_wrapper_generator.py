# services/python_wrapper_generator.py
import json

class PythonWrapperGenerator:
    def generate(self, user_code: str, problem) -> str:
        arg_names = self._get_argument_names(problem.arguments)
        conversions = self._generate_conversions(problem.arguments)
        
        if len(arg_names) == 0:
            function_call = "result = solution()"
        elif len(arg_names) == 1 and not conversions:
            function_call = "result = solution(args)"
        else:
            function_call = f"result = solution({', '.join(arg_names)})"
        
        return f'''
import json
import sys
from collections import deque
import heapq
from typing import Optional, List, Dict, Any, Set, Tuple

{self._get_type_helpers()}

# =====================
# CÓDIGO DEL ESTUDIANTE
# =====================

{user_code}

# =====================
# WRAPPER
# =====================

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print("null")
            return
        
        data = json.loads(input_data)
        args = data.get("args", {{}})
        
        # Convertir argumentos
{conversions}
        
        # Llamar a la función
        {function_call}
        
        # Imprimir resultado
        output = to_json(result)
        print(json.dumps(output))
    except Exception as e:
        # Para depuración, imprimir el error en stderr
        import traceback
        traceback.print_exc()
        print("null")

def to_json(obj):
    if obj is None:
        return None
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, (int, float, str)):
        return obj
    if isinstance(obj, (list, tuple)):
        return [to_json(item) for item in obj]
    if isinstance(obj, dict):
        return {{str(k): to_json(v) for k, v in obj.items()}}
    if isinstance(obj, set):
        return [to_json(item) for item in obj]
    if isinstance(obj, deque):
        return [to_json(item) for item in obj]
    if hasattr(obj, "val") and hasattr(obj, "next"):  # ListNode
        return serialize_list(obj)
    if hasattr(obj, "val") and hasattr(obj, "left"):  # TreeNode
        return serialize_tree(obj)
    if hasattr(obj, "__dict__"):
        return {{k: to_json(v) for k, v in obj.__dict__.items() if not k.startswith("_")}}
    return str(obj)

{self._get_serializers()}

if __name__ == "__main__":
    main()
'''

    def _generate_conversions(self, arguments) -> str:
        if not arguments:
            return "        pass  # No arguments"
        lines = []
        for arg in sorted(arguments, key=lambda x: x.position):
            lines.append(f"        {self._single_conversion(arg.name, arg.type_name)}")
        return "\n".join(lines)
    
    def _single_conversion(self, name: str, type_name: str) -> str:
        if type_name in ["int", "long", "long long"]:
            return f'{name} = args.get("{name}", 0)'
        elif type_name in ["double", "float"]:
            return f'{name} = float(args.get("{name}", 0.0))'
        elif type_name == "bool":
            return f'{name} = bool(args.get("{name}", False))'
        elif type_name == "string":
            return f'{name} = str(args.get("{name}", ""))'
        elif type_name in ["vector<int>", "vector<long long>", "vector<double>", "vector<bool>", "vector<string>"]:
            return f'{name} = args.get("{name}", [])'
        elif type_name == "vector<vector<int>>":
            return f'{name} = args.get("{name}", [])'
        elif type_name in ["set", "unordered_set"]:
            return f'{name} = set(args.get("{name}", []))'
        elif type_name in ["map", "unordered_map"]:
            return f'{name} = args.get("{name}", {{}})'
        elif type_name == "queue":
            return f'{name} = deque(args.get("{name}", []))'
        elif type_name == "stack":
            return f'{name} = list(args.get("{name}", []))'
        elif type_name == "deque":
            return f'{name} = deque(args.get("{name}", []))'
        elif type_name == "priority_queue":
            return f'{name} = args.get("{name}", []); heapq.heapify({name})'
        elif type_name == "pair":
            return (f'{name} = (args["{name}"][0], args["{name}"][1]) '
                    f'if isinstance(args.get("{name}"), list) and len(args["{name}"]) >= 2 '
                    f'else (args["{name}"].get("first"), args["{name}"].get("second")) '
                    f'if isinstance(args.get("{name}"), dict) else None')
        else:
            return f'{name} = args.get("{name}")'
    
    def _get_argument_names(self, arguments):
        return [arg.name for arg in sorted(arguments, key=lambda x: x.position)]
    
    def _get_type_helpers(self) -> str:
        return '''
# =====================
# LISTA ENLAZADA SIMPLE
# =====================
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_list(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    current = head
    for val in arr[1:]:
        current.next = ListNode(val)
        current = current.next
    return head

def serialize_list(head):
    result = []
    current = head
    while current:
        result.append(current.val)
        current = current.next
    return result

# =====================
# LISTA DOBLEMENTE ENLAZADA
# =====================
class DoublyListNode:
    def __init__(self, val=0, prev=None, next=None):
        self.val = val
        self.prev = prev
        self.next = next

def build_doubly_list(arr):
    if not arr:
        return None
    head = DoublyListNode(arr[0])
    current = head
    for val in arr[1:]:
        current.next = DoublyListNode(val, current)
        current = current.next
    return head

def serialize_doubly_list(head):
    result = []
    current = head
    while current:
        result.append(current.val)
        current = current.next
    return result

# =====================
# ÁRBOL BINARIO
# =====================
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(arr):
    if not arr or arr[0] is None:
        return None
    nodes = [None if val is None else TreeNode(val) for val in arr]
    children_index = 1
    for i, node in enumerate(nodes):
        if node:
            if children_index < len(nodes):
                node.left = nodes[children_index]
                children_index += 1
            if children_index < len(nodes):
                node.right = nodes[children_index]
                children_index += 1
    return nodes[0]

def serialize_tree(root):
    if not root:
        return []
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            result.append(None)
    while result and result[-1] is None:
        result.pop()
    return result

# =====================
# ÁRBOL N-ARIO (simplificado)
# =====================
class NaryTreeNode:
    def __init__(self, val=0, children=None):
        self.val = val
        self.children = children if children is not None else []

def build_nary_tree(obj):
    if not obj:
        return None
    def build(node_json):
        if not node_json:
            return None
        node = NaryTreeNode(node_json.get("val", 0))
        if "children" in node_json:
            for child_json in node_json["children"]:
                node.children.append(build(child_json))
        return node
    return build(obj)

def serialize_nary_tree(root):
    if not root:
        return None
    def serialize(node):
        if not node:
            return None
        result = {"val": node.val}
        if node.children:
            result["children"] = [serialize(child) for child in node.children]
        return result
    return serialize(root)

# =====================
# GRAFO (simplificado)
# =====================
class GraphNode:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

def build_graph(arr):
    if not arr:
        return None
    nodes = {}
    for item in arr:
        val = item.get("val")
        nodes[val] = GraphNode(val)
    for item in arr:
        val = item.get("val")
        node = nodes[val]
        for neighbor_val in item.get("neighbors", []):
            if neighbor_val in nodes:
                node.neighbors.append(nodes[neighbor_val])
    return nodes.get(arr[0].get("val"))

def serialize_graph(node):
    if not node:
        return None
    visited = set()
    result = []
    def serialize(n):
        if not n or n.val in visited:
            return
        visited.add(n.val)
        result.append({
            "val": n.val,
            "neighbors": [neighbor.val for neighbor in n.neighbors]
        })
        for neighbor in n.neighbors:
            serialize(neighbor)
    serialize(node)
    return result
'''
    
    def _get_serializers(self) -> str:
        return '''
def serialize_list(head):
    result = []
    current = head
    while current:
        result.append(current.val)
        current = current.next
    return result

def serialize_tree(root):
    if not root:
        return []
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            result.append(None)
    while result and result[-1] is None:
        result.pop()
    return result
'''