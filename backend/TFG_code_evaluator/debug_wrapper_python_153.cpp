
import json
import sys
from collections import deque
import heapq
from typing import Optional, List, Dict, Any, Set, Tuple

# =====================
# TIPOS AUXILIARES (estructuras de datos)
# =====================


# =====================
# LISTA ENLAZADA SIMPLE
# =====================
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_list(arr):
    """Convierte un array JSON a ListNode"""
    if not arr:
        return None
    head = ListNode(arr[0])
    current = head
    for val in arr[1:]:
        current.next = ListNode(val)
        current = current.next
    return head

def serialize_list(head):
    """Convierte ListNode a array JSON"""
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
    """Convierte un array JSON a DoublyListNode"""
    if not arr:
        return None
    head = DoublyListNode(arr[0])
    current = head
    for val in arr[1:]:
        current.next = DoublyListNode(val, current)
        current = current.next
    return head

def serialize_doubly_list(head):
    """Convierte DoublyListNode a array JSON"""
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
    """Convierte un array JSON a TreeNode (representación de nivel)"""
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
    """Convierte TreeNode a array JSON (representación de nivel)"""
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
# ÁRBOL N-ARIO
# =====================
class NaryTreeNode:
    def __init__(self, val=0, children=None):
        self.val = val
        self.children = children if children is not None else []

def build_nary_tree(obj):
    """Convierte un objeto JSON a NaryTreeNode"""
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
    """Convierte NaryTreeNode a objeto JSON"""
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
# GRAFO
# =====================
class GraphNode:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

def build_graph(arr):
    """Convierte un array JSON a GraphNode"""
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
    
    return nodes.get(arr[0].get("val")) if arr else None

def serialize_graph(node):
    """Convierte GraphNode a array JSON"""
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


# =====================
# CÓDIGO DEL ESTUDIANTE
# =====================

def solution(a,b):
    return a+b;

# =====================
# WRAPER AUTOMÁTICO
# =====================

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            # Si no hay entrada, imprimir null
            print("null")
            return
        
        data = json.loads(input_data)
        args = data.get("args", {})
        
        # Convertir argumentos según tipo
        a = args.get("a", 0)
b = args.get("b", 0)
        
        # Llamar a la función solution
        result = solution(a, b)
        
        # Serializar resultado
        output = to_json(result)
        print(json.dumps(output))
    except Exception as e:
        # En caso de error, imprimir null (mejor que nada)
        print("null")

def to_json(obj):
    """Convierte objetos Python a JSON serializable"""
    if obj is None:
        return None
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, (int, float, str)):
        return obj
    if isinstance(obj, (list, tuple)):
        return [to_json(item) for item in obj]
    if isinstance(obj, dict):
        return {str(k): to_json(v) for k, v in obj.items()}
    if isinstance(obj, set):
        return [to_json(item) for item in obj]
    if isinstance(obj, deque):
        return [to_json(item) for item in obj]
    if isinstance(obj, ListNode):
        return serialize_list(obj)
    if isinstance(obj, DoublyListNode):
        return serialize_doubly_list(obj)
    if isinstance(obj, TreeNode):
        return serialize_tree(obj)
    if isinstance(obj, NaryTreeNode):
        return serialize_nary_tree(obj)
    if isinstance(obj, GraphNode):
        return serialize_graph(obj)
    if hasattr(obj, "__dict__"):
        return {k: to_json(v) for k, v in obj.__dict__.items() if not k.startswith("_")}
    return str(obj)

if __name__ == "__main__":
    main()
