
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


// =====================
// CÓDIGO DEL ESTUDIANTE
// =====================

class Solution {
    public static boolean solution(String s) {
    java.util.Stack<Character> stack = new java.util.Stack<>();
    for(char c : s.toCharArray()) {
        if(c == '(' || c == '{' || c == '[') {
            stack.push(c);
        } else if(c == ')' || c == '}' || c == ']') {
            if(stack.isEmpty()) return false;
            char top = stack.pop();
            if((c == ')' && top != '(') ||
               (c == '}' && top != '{') ||
               (c == ']' && top != '[')) {
                return false;
            }
        }
    }
    return stack.isEmpty();
}
}

// =====================
// WRAPER AUTOMÁTICO
// =====================

public class Wrapper {
    
    public static void main(String[] args) throws Exception {
        Gson gson = new GsonBuilder()
            .registerTypeAdapter(ListNode.class, new ListNodeAdapter())
            .registerTypeAdapter(DoublyListNode.class, new DoublyListNodeAdapter())
            .registerTypeAdapter(TreeNode.class, new TreeNodeAdapter())
            .registerTypeAdapter(GraphNode.class, new GraphNodeAdapter())
            .create();
        
        Scanner scanner = new Scanner(System.in);
        String inputJson = scanner.useDelimiter("\\A").hasNext() ? 
                           scanner.useDelimiter("\\A").next() : "";
        scanner.close();
        
        JsonObject input = gson.fromJson(inputJson, JsonObject.class);
        JsonObject argsJson = input.getAsJsonObject("args");
        
        // Convertir argumentos
        String s = argsJson.get("s").getAsString();
        
        // Llamar a la función solution
        Object result = null;
        result = Solution.solution(s);
        
        // Imprimir resultado
        System.out.println(gson.toJson(result));
    }
}
