"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  astarSearch,
  graphConfig,
  NodeId,
  SearchResult,
  uniformCostSearch
} from "@/lib/graph";

// Represents each animation step so we can pulse nodes per algorithm.
type AnimationFrame = {
  algorithm: "ucs" | "astar";
  node: NodeId;
};

// Default scenario to steer users toward a high-contrast route.
const highlightScenario = {
  id: "cmc-to-merkato",
  title: "Eastern Junction → Merkato",
  blurb:
    "UCS must explore much of the southern ring road, while A* narrows toward Kazanchis, Piassa, and Merkato using the Euclidean heuristic.",
  start: "CMC" as NodeId,
  goal: "Merkato" as NodeId
};

const defaultStart: NodeId = highlightScenario.start;
const defaultGoal: NodeId = highlightScenario.goal;

// Utility helper for displaying meters while guarding against Infinity.
const formatCost = (cost: number) =>
  Number.isFinite(cost) ? `${Math.round(cost)} m` : "—";

export default function HomePage() {
  // Start/goal nodes reflect the highlight scenario by default.
  const [startNode, setStartNode] = useState<NodeId>(defaultStart);
  const [goalNode, setGoalNode] = useState<NodeId>(defaultGoal);
  // Search summaries for the stats sidebar.
  const [ucsResult, setUcsResult] = useState<SearchResult | null>(null);
  const [astarResult, setAstarResult] = useState<SearchResult | null>(null);
  // Track explored nodes for each algorithm so we can style them differently.
  const [ucsVisited, setUcsVisited] = useState<Set<NodeId>>(
    () => new Set<NodeId>()
  );
  const [astarVisited, setAstarVisited] = useState<Set<NodeId>>(
    () => new Set<NodeId>()
  );
  // Timeline stores interleaved UCS/A* expansions for the animation loop.
  const [timeline, setTimeline] = useState<AnimationFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  // Highlights whichever node just got expanded.
  const [pulseFrame, setPulseFrame] = useState<AnimationFrame | null>(null);
  // Final path rendered in green across the map.
  const [activePath, setActivePath] = useState<NodeId[]>([]);
  const [status, setStatus] = useState(
    "Scenario ready: compare how UCS vs. A* travel from CMC to Merkato."
  );

  // Runs both searches, records animation data, and resets the UI state.
  const handleRunComparison = () => {
    if (startNode === goalNode) {
      setStatus("Pick two distinct nodes to see the algorithms diverge.");
      return;
    }

    const ucs = uniformCostSearch(startNode, goalNode);
    const astar = astarSearch(startNode, goalNode);
    setUcsResult(ucs);
    setAstarResult(astar);
    setActivePath(ucs.path);
    setStatus(
      "Animating expansions… watch the yellow bloom (UCS) versus A*'s tighter focus."
    );

    // Build an interleaved animation timeline so both algorithms play together.
    const frames: AnimationFrame[] = [];
    const maxSteps = Math.max(ucs.visitedOrder.length, astar.visitedOrder.length);
    for (let i = 0; i < maxSteps; i += 1) {
      if (ucs.visitedOrder[i]) {
        frames.push({ algorithm: "ucs", node: ucs.visitedOrder[i] as NodeId });
      }
      if (astar.visitedOrder[i]) {
        frames.push({
          algorithm: "astar",
          node: astar.visitedOrder[i] as NodeId
        });
      }
    }

    setTimeline(frames);
    setCurrentFrameIndex(0);
    setIsAnimating(true);
    setPulseFrame(null);
    setUcsVisited(new Set());
    setAstarVisited(new Set());
  };

  // Drives the animation loop and populates the visited sets over time.
  useEffect(() => {
    if (!isAnimating || !timeline.length) {
      return;
    }

    if (currentFrameIndex >= timeline.length) {
      setIsAnimating(false);
      setPulseFrame(null);
      setStatus("Comparison complete. Notice the different exploration footprints.");
      return;
    }

    // Advance the animation at a fixed cadence.
    const timeout = setTimeout(() => {
      const frame = timeline[currentFrameIndex];
      if (!frame) {
        return;
      }

      setPulseFrame(frame);

      if (frame.algorithm === "ucs") {
        setUcsVisited((prev) => {
          if (prev.has(frame.node)) {
            return prev;
          }
          const next = new Set(prev);
          next.add(frame.node);
          return next;
        });
      } else {
        setAstarVisited((prev) => {
          if (prev.has(frame.node)) {
            return prev;
          }
          const next = new Set(prev);
          next.add(frame.node);
          return next;
        });
      }
      setCurrentFrameIndex((prev) => prev + 1);
    }, 450);

    return () => clearTimeout(timeout);
  }, [isAnimating, currentFrameIndex, timeline]);

  // Positive values mean A* expanded fewer nodes (performed better).
  const comparisonDelta =
    ucsResult && astarResult
      ? ucsResult.nodesExpanded - astarResult.nodesExpanded
      : null;

  return (
    // Two-column responsive layout: large map on the left, controls on right.
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row">
      <section className="glass-panel flex-[1.4] p-5 lg:p-7">
        <header className="mb-6 flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Addis Ababa Road Network
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Uniform Cost Search vs. A* Search
          </h1>
          <p className="text-sm text-slate-600">{status}</p>
        </header>

        <GraphCanvas
          activePath={activePath}
          astarVisited={astarVisited}
          pulseFrame={pulseFrame}
          ucsVisited={ucsVisited}
        />

        <Legend />
      </section>

      <aside className="flex w-full flex-col gap-5 lg:w-[320px]">
        <ControlsPanel
          goalNode={goalNode}
          isAnimating={isAnimating}
          onGoalChange={(value) => setGoalNode(value as NodeId)}
          onRun={handleRunComparison}
          onStartChange={(value) => setStartNode(value as NodeId)}
          startNode={startNode}
        />

        <StatsPanel
          astarResult={astarResult}
          comparisonDelta={comparisonDelta}
          goalNode={goalNode}
          startNode={startNode}
          ucsResult={ucsResult}
        />

        <ScenarioPanel
          comparisonDelta={comparisonDelta}
          isActiveScenario={
            startNode === highlightScenario.start && goalNode === highlightScenario.goal
          }
          onApplyScenario={() => {
            setStartNode(highlightScenario.start);
            setGoalNode(highlightScenario.goal);
            setStatus(
              "Scenario loaded: run the comparison to see how UCS fans out versus A* toward Merkato."
            );
          }}
          scenario={highlightScenario}
        />
      </aside>
    </main>
  );
}

// Props required to render the graph with overlays.
type GraphCanvasProps = {
  ucsVisited: Set<NodeId>;
  astarVisited: Set<NodeId>;
  activePath: NodeId[];
  pulseFrame: AnimationFrame | null;
};

// Renders the SVG map plus all algorithm overlays.
const GraphCanvas = ({
  ucsVisited,
  astarVisited,
  activePath,
  pulseFrame
}: GraphCanvasProps) => {
  // Cache current path for quick membership checks.
  const pathNodes = useMemo(() => new Set(activePath), [activePath]);
  // Stores straight segments so we can thicken only edges that lie on path.
  const pathSegments = useMemo(() => {
    const segments = new Set<string>();
    for (let i = 0; i < activePath.length - 1; i += 1) {
      const from = activePath[i];
      const to = activePath[i + 1];
      const key = [from, to].sort().join("-");
      segments.add(key);
    }
    return segments;
  }, [activePath]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 lg:p-4 shadow-inner">
      <svg
        viewBox="0 0 160 100"
        className="aspect-[16/9] w-full text-slate-500"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Render the full road network */}
        {graphConfig.edges.map((edge) => {
          const from = graphConfig.nodeMap[edge.from];
          const to = graphConfig.nodeMap[edge.to];
          const key = [edge.from, edge.to].sort().join("-");
          const isOnPath = pathSegments.has(key);
          return (
            <g key={edge.id} className="stroke-slate-600/70">
              <motion.line
                x1={from.position.x}
                y1={from.position.y}
                x2={to.position.x}
                y2={to.position.y}
                stroke={isOnPath ? "#22c55e" : "rgba(100,116,139,0.4)"}
                strokeWidth={isOnPath ? 3.6 : 1.6}
                strokeLinecap="round"
                initial={false}
                animate={{ strokeWidth: isOnPath ? 3.6 : 1.6 }}
                transition={{ duration: 0.35 }}
              />
              <text
                x={(from.position.x + to.position.x) / 2}
                y={(from.position.y + to.position.y) / 2 - 1}
                className="fill-slate-500 text-[1.8px]"
                stroke="none"
              >
                {edge.cost}
              </text>
            </g>
          );
        })}

        {/* Render each district node */}
        {graphConfig.nodes.map((node) => {
          const visited = ucsVisited.has(node.id) || astarVisited.has(node.id);
          const visitedByAstar = astarVisited.has(node.id);
          const visitedByUcs = ucsVisited.has(node.id);
          const isOnPath = pathNodes.has(node.id);
          const isPulsing = pulseFrame?.node === node.id;

          return (
            <g key={node.id}>
              <AnimatePresence>
                {visited && (
                  <motion.circle
                    key={`${node.id}-halo`}
                    cx={node.position.x}
                    cy={node.position.y}
                    r={visitedByUcs && visitedByAstar ? 5.2 : 4.4}
                    fill="rgba(250, 204, 21, 0.2)"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {visitedByAstar && (
                  <motion.circle
                    key={`${node.id}-astar-ring`}
                    cx={node.position.x}
                    cy={node.position.y}
                    r={3.6}
                    fill="transparent"
                    stroke="#0ea5e9"
                    strokeWidth={0.6}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {visitedByUcs && !isOnPath && (
                  <motion.circle
                    key={`${node.id}-ucs-ring`}
                    cx={node.position.x}
                    cy={node.position.y}
                    r={3.8}
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth={0.3}
                    strokeDasharray="1"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>
              <motion.circle
                cx={node.position.x}
                cy={node.position.y}
                r={isOnPath ? 2.9 : 2.1}
                fill={isOnPath ? "#22c55e" : "#e2e8f0"}
                stroke={isOnPath ? "#16a34a" : "#94a3b8"}
                strokeWidth={isOnPath ? 1 : 0.7}
                initial={false}
                animate={{
                  r: isOnPath ? 2.9 : 2.1,
                  strokeWidth: isOnPath ? 1 : 0.7
                }}
                className={isOnPath ? "shadow-glow" : ""}
              />
              <text
                x={node.position.x}
                y={node.position.y - 3.8}
                textAnchor="middle"
                className="fill-slate-900 text-[2.2px] font-semibold"
              >
                {node.label}
              </text>
              {isPulsing && (
                <motion.circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={2.1}
                  fill="transparent"
                  stroke={pulseFrame?.algorithm === "ucs" ? "#f59e0b" : "#0ea5e9"}
                  strokeWidth={0.8}
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Props for the user-input controls.
type ControlsPanelProps = {
  startNode: NodeId;
  goalNode: NodeId;
  onStartChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onRun: () => void;
  isAnimating: boolean;
};

const ControlsPanel = ({
  startNode,
  goalNode,
  onStartChange,
  onGoalChange,
  onRun,
  isAnimating
}: ControlsPanelProps) => {
  return (
    <div className="glass-panel p-6">
      {/* Simple form for choosing start/goal nodes and triggering an animation */}
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Controls</h2>
      <div className="flex flex-col gap-4">
        <label className="text-sm text-slate-600">
          Start Node
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            value={startNode}
            onChange={(event) => onStartChange(event.target.value)}
          >
            {graphConfig.nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Target Node
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            value={goalNode}
            onChange={(event) => onGoalChange(event.target.value)}
          >
            {graphConfig.nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onRun}
          disabled={isAnimating}
          className="rounded-xl bg-slate-800 px-4 py-2 text-base font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isAnimating ? "Running…" : "Run Comparison"}
        </button>
      </div>
    </div>
  );
};

// Contract for the metrics card component.
type StatsPanelProps = {
  startNode: NodeId;
  goalNode: NodeId;
  ucsResult: SearchResult | null;
  astarResult: SearchResult | null;
  comparisonDelta: number | null;
};

const StatsPanel = ({
  startNode,
  goalNode,
  ucsResult,
  astarResult,
  comparisonDelta
}: StatsPanelProps) => {
  const stats = [
    {
      label: "Uniform Cost Search",
      result: ucsResult,
      accent: "text-amber-300"
    },
    {
      label: "A* Search",
      result: astarResult,
      accent: "text-sky-300"
    }
  ];

  const bothReady = ucsResult && astarResult;

  return (
    <div className="glass-panel p-6">
      {/* Shows aggregate metrics for each algorithm plus delta callout */}
      <h2 className="text-xl font-semibold text-slate-900">Execution Metrics</h2>
      <p className="text-sm text-slate-500">
        {startNode} → {goalNode}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {stats.map(({ label, result, accent }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <p className={`text-xs uppercase tracking-wide ${accent}`}>
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {result ? formatCost(result.cost) : "—"}
            </p>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Nodes Visited</span>
              <strong className="font-semibold text-slate-900">
                {result ? result.nodesExpanded : "—"}
              </strong>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm text-slate-600">
              <span>Path Length</span>
              <strong className="font-semibold text-slate-900">
                {result ? result.path.length : "—"}
              </strong>
            </div>
          </div>
        ))}
      </div>

      {bothReady && (
        <div className="mt-4 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
          {comparisonDelta !== null && comparisonDelta > 0 ? (
            <>
              <p>
                A* reached the goal while expanding{" "}
                <strong className="text-slate-900">{comparisonDelta}</strong> fewer
                nodes.
              </p>
              <p className="text-xs text-slate-500">
                The Euclidean heuristic (based on spatial coordinates) tightens
                the search around the goal.
              </p>
            </>
          ) : (
            <p>Both algorithms expanded the same number of nodes.</p>
          )}
        </div>
      )}
    </div>
  );
};

// Describes the props for the recommended-case callout card.
type ScenarioPanelProps = {
  scenario: typeof highlightScenario;
  onApplyScenario: () => void;
  isActiveScenario: boolean;
  comparisonDelta: number | null;
};

const ScenarioPanel = ({
  scenario,
  onApplyScenario,
  isActiveScenario,
  comparisonDelta
}: ScenarioPanelProps) => {
  const showDelta = isActiveScenario && comparisonDelta !== null;

  return (
    <div className="glass-panel border border-slate-200 p-6">
      {/* Highlights a pre-tuned route that best demonstrates algorithmic differences */}
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Case scenario</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{scenario.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{scenario.blurb}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
        <div>
          <p className="text-xs uppercase text-slate-400">Start</p>
          <p className="font-semibold text-slate-900">{scenario.start}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Goal</p>
          <p className="font-semibold text-slate-900">{scenario.goal}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onApplyScenario}
        className="mt-4 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
      >
        Load Scenario
      </button>

      {showDelta && (
        <p className="mt-3 text-xs text-slate-500">
          Last run: A* expanded {Math.abs(comparisonDelta as number)} fewer nodes.
        </p>
      )}
    </div>
  );
};

const Legend = () => (
  // Quick reference for the colors used in the map visualization.
  <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
    <LegendItem color="bg-lime-400" label="Final Path" />
    <LegendItem color="bg-amber-200" label="Visited (UCS)" />
    <LegendItem color="bg-sky-300" label="Visited (A*)" />
    <LegendItem color="bg-slate-600" label="Unexplored" />
  </div>
);

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  // Visual bullet used for each legend entry.
  <span className="inline-flex items-center gap-2">
    <span className={`h-3 w-3 rounded-full ${color}`} />
    {label}
  </span>
);

