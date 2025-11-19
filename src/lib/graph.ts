// Enumerates the districts/intersections represented in the network.
export type NodeId =
  | "Arat_Kilo"
  | "Autobus_Tera"
  | "Bole"
  | "CMC"
  | "Gotera"
  | "Hayahulet"
  | "Kazanchis"
  | "Legehar"
  | "Meskel_Square"
  | "Megenagna"
  | "Merkato"
  | "Mexico"
  | "Piassa"
  | "SarBet"
  | "Stadium";

// Basic metadata for rendering and adjacency calculations.
export type GraphNode = {
  id: NodeId;
  label: string;
  position: { x: number; y: number };
};

// Weighted connection between two nodes (undirected in practice).
export type GraphEdge = {
  id: string;
  from: NodeId;
  to: NodeId;
  cost: number;
};

// Helper type for adjacency lists.
export type Neighbor = { node: NodeId; cost: number };

// Aggregated structure exported to the UI layer.
export type GraphConfig = {
  nodes: GraphNode[];
  nodeMap: Record<NodeId, GraphNode>;
  edges: GraphEdge[];
  adjacency: Record<NodeId, Neighbor[]>;
};

// Standardized return payload for the visualization layer.
export type SearchResult = {
  path: NodeId[];
  cost: number;
  visitedOrder: NodeId[];
  nodesExpanded: number;
  reachedGoal: boolean;
};

// Approximate layout derived from a stylized Addis Ababa map to improve readability.
// Nodes are spread widely horizontally to create a landscape-oriented map.
const nodes: GraphNode[] = [
  { id: "Megenagna", label: "Megenagna", position: { x: 120, y: 16 } },
  { id: "CMC", label: "CMC", position: { x: 150, y: 8 } },
  { id: "Hayahulet", label: "Hayahulet", position: { x: 110, y: 34 } },
  { id: "Kazanchis", label: "Kazanchis", position: { x: 75, y: 42 } },
  { id: "Meskel_Square", label: "Meskel Sq.", position: { x: 65, y: 50 } },
  { id: "Mexico", label: "Mexico", position: { x: 50, y: 58 } },
  { id: "Stadium", label: "Stadium", position: { x: 85, y: 60 } },
  { id: "Gotera", label: "Gotera", position: { x: 105, y: 64 } },
  { id: "Bole", label: "Bole", position: { x: 140, y: 56 } },
  { id: "Legehar", label: "Legehar", position: { x: 40, y: 72 } },
  {
    id: "Autobus_Tera",
    label: "Autobus Tera",
    position: { x: 25, y: 86 }
  },
  { id: "SarBet", label: "Sar Bet", position: { x: 55, y: 82 } },
  { id: "Arat_Kilo", label: "Arat Kilo", position: { x: 35, y: 34 } },
  { id: "Piassa", label: "Piassa", position: { x: 15, y: 26 } },
  { id: "Merkato", label: "Merkato", position: { x: 5, y: 38 } }
];

// Bidirectional edges representing primary corridors and shortcuts.
const edges: GraphEdge[] = [
  { id: "meg-cmc", from: "Megenagna", to: "CMC", cost: 125 },
  { id: "meg-haya", from: "Megenagna", to: "Hayahulet", cost: 140 },
  { id: "meg-bole", from: "Megenagna", to: "Bole", cost: 260 },
  { id: "bole-gotera", from: "Bole", to: "Gotera", cost: 130 },
  { id: "bole-stadium", from: "Bole", to: "Stadium", cost: 240 },
  { id: "haya-kazan", from: "Hayahulet", to: "Kazanchis", cost: 110 },
  { id: "haya-meskel", from: "Hayahulet", to: "Meskel_Square", cost: 150 },
  { id: "kazan-arat", from: "Kazanchis", to: "Arat_Kilo", cost: 120 },
  { id: "kazan-meskel", from: "Kazanchis", to: "Meskel_Square", cost: 65 },
  { id: "meskel-stadium", from: "Meskel_Square", to: "Stadium", cost: 80 },
  { id: "meskel-mexico", from: "Meskel_Square", to: "Mexico", cost: 85 },
  { id: "meskel-arat", from: "Meskel_Square", to: "Arat_Kilo", cost: 70 },
  { id: "mexico-sarbet", from: "Mexico", to: "SarBet", cost: 150 },
  { id: "mexico-piassa", from: "Mexico", to: "Piassa", cost: 140 },
  { id: "stadium-legehar", from: "Stadium", to: "Legehar", cost: 100 },
  { id: "legehar-sarbet", from: "Legehar", to: "SarBet", cost: 95 },
  { id: "sarbet-autobus", from: "SarBet", to: "Autobus_Tera", cost: 130 },
  { id: "legehar-autobus", from: "Legehar", to: "Autobus_Tera", cost: 95 },
  { id: "gotera-mexico", from: "Gotera", to: "Mexico", cost: 90 },
  { id: "gotera-sarbet", from: "Gotera", to: "SarBet", cost: 140 },
  { id: "gotera-haya", from: "Gotera", to: "Hayahulet", cost: 170 },
  { id: "arat-piassa", from: "Arat_Kilo", to: "Piassa", cost: 70 },
  { id: "piassa-merkato", from: "Piassa", to: "Merkato", cost: 60 },
  { id: "merkato-autobus", from: "Merkato", to: "Autobus_Tera", cost: 140 },
  { id: "merkato-legehar", from: "Merkato", to: "Legehar", cost: 120 }
];

// Allows O(1) access to coordinates/labels by node id.
const nodeMap = nodes.reduce<Record<NodeId, GraphNode>>((acc, node) => {
  acc[node.id] = node;
  return acc;
}, {} as Record<NodeId, GraphNode>);

// Initialize adjacency list for the undirected graph.
const adjacency = nodes.reduce<Record<NodeId, Neighbor[]>>((acc, node) => {
  acc[node.id] = [];
  return acc;
}, {} as Record<NodeId, Neighbor[]>);

// Populate adjacency entries in both directions since roads are two-way.
edges.forEach(({ from, to, cost }) => {
  adjacency[from].push({ node: to, cost });
  adjacency[to].push({ node: from, cost });
});

// Exported so the UI can render the map and build dropdowns.
export const graphConfig: GraphConfig = {
  nodes,
  edges,
  nodeMap,
  adjacency
};

// Heuristic for A*: straight-line distance within the SVG coordinate system.
const euclideanDistance = (a: NodeId, b: NodeId) => {
  const start = nodeMap[a].position;
  const goal = nodeMap[b].position;
  const dx = start.x - goal.x;
  const dy = start.y - goal.y;
  return Math.hypot(dx, dy);
};

// Backtracks from the goal to produce the final path once a search completes.
const reconstructPath = (
  cameFrom: Partial<Record<NodeId, NodeId | null>>,
  current: NodeId
): NodeId[] => {
  const totalPath: NodeId[] = [current];
  let cursor: NodeId | null | undefined = current;

  while (cursor && cameFrom[cursor]) {
    cursor = cameFrom[cursor] as NodeId | null;
    if (cursor) {
      totalPath.unshift(cursor);
    }
  }

  return totalPath;
};

// Minimal priority queue entry (node id + priority cost).
type QueueNode = { node: NodeId; priority: number };

// Array-based priority queue selection (sufficient for small graphs).
const popMin = (queue: QueueNode[]) => {
  let minIndex = 0;
  for (let i = 1; i < queue.length; i += 1) {
    if (queue[i].priority < queue[minIndex].priority) {
      minIndex = i;
    }
  }
  return queue.splice(minIndex, 1)[0];
};

// Classic Dijkstra/UCS implementation that disregards heuristics.
export const uniformCostSearch = (
  start: NodeId,
  goal: NodeId
): SearchResult => {
  const frontier: QueueNode[] = [{ node: start, priority: 0 }];
  const costs: Partial<Record<NodeId, number>> = { [start]: 0 };
  const cameFrom: Partial<Record<NodeId, NodeId | null>> = { [start]: null };
  const visitedOrder: NodeId[] = [];
  const closed = new Set<NodeId>();
  let reachedGoal = false;

  while (frontier.length) {
    const current = popMin(frontier);
    if (closed.has(current.node)) {
      continue;
    }

    closed.add(current.node);
    visitedOrder.push(current.node);

    if (current.node === goal) {
      reachedGoal = true;
      break;
    }

    // Relax edges; if we find a cheaper path we push it back on the queue.
    adjacency[current.node].forEach(({ node, cost }) => {
      const newCost = (costs[current.node] ?? Number.POSITIVE_INFINITY) + cost;
      if (newCost < (costs[node] ?? Number.POSITIVE_INFINITY)) {
        costs[node] = newCost;
        cameFrom[node] = current.node;
        frontier.push({ node, priority: newCost });
      }
    });
  }

  return {
    path: reachedGoal ? reconstructPath(cameFrom, goal) : [],
    cost: costs[goal] ?? Number.POSITIVE_INFINITY,
    visitedOrder,
    nodesExpanded: visitedOrder.length,
    reachedGoal
  };
};

// Optimized variant using Euclidean heuristic to focus expansions.
export const astarSearch = (start: NodeId, goal: NodeId): SearchResult => {
  const frontier: QueueNode[] = [{ node: start, priority: euclideanDistance(start, goal) }];
  const gScore: Partial<Record<NodeId, number>> = { [start]: 0 };
  const fScore: Partial<Record<NodeId, number>> = {
    [start]: euclideanDistance(start, goal)
  };
  const cameFrom: Partial<Record<NodeId, NodeId | null>> = { [start]: null };
  const visitedOrder: NodeId[] = [];
  const closed = new Set<NodeId>();
  let reachedGoal = false;

  while (frontier.length) {
    const current = popMin(frontier);

    if (closed.has(current.node)) {
      continue;
    }

    closed.add(current.node);
    visitedOrder.push(current.node);

    if (current.node === goal) {
      reachedGoal = true;
      break;
    }

    // Standard A* relaxation combining cost-so-far (g) and heuristic (h).
    adjacency[current.node].forEach(({ node, cost }) => {
      const tentativeG = (gScore[current.node] ?? Number.POSITIVE_INFINITY) + cost;
      if (tentativeG < (gScore[node] ?? Number.POSITIVE_INFINITY)) {
        cameFrom[node] = current.node;
        gScore[node] = tentativeG;
        const heuristic = euclideanDistance(node, goal);
        fScore[node] = tentativeG + heuristic;
        frontier.push({ node, priority: fScore[node] as number });
      }
    });
  }

  return {
    path: reachedGoal ? reconstructPath(cameFrom, goal) : [],
    cost: gScore[goal] ?? Number.POSITIVE_INFINITY,
    visitedOrder,
    nodesExpanded: visitedOrder.length,
    reachedGoal
  };
};

