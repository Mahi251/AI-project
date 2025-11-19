# Addis Pathfinding Visualizer

This Next.js 14 project compares **Uniform Cost Search (UCS)** with **A\* Search** on a curated slice of the Addis Ababa road network (Megenagna → Autobus Tera corridor).

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS for styling
- Framer Motion for timeline animation

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to explore the visualizer.

## Key Features

- Hard-coded weighted graph with spatial `(x,y)` coordinates for each landmark.
- UCS and A\* implementations returning cost, final path, and expansion metrics.
- SVG canvas that highlights:
  - Visited nodes in a soft yellow bloom
  - Active expansions via ripple effects
  - Final path in bold Addis-green
- Side-by-side stats panel to emphasize that both algorithms discover the same optimal cost while A\* typically expands fewer nodes.

