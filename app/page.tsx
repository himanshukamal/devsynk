"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
} from "react";

const NAV_LINKS = ["About", "Services", "Pricing", "Contact"];
const CELL_SIZE = 100;
const TRAIL_LIMIT = 5;
const RANDOM_COLORS = ["accent-a", "accent-b", "accent-c", "accent-d"];
const RANDOM_CELL_COUNT = 6;

type GridCell = { row: number; col: number };
type ColoredCell = GridCell & { tone: string; id: string };

export default function Home() {
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  const [hoverCell, setHoverCell] = useState<GridCell | null>(null);
  const [trail, setTrail] = useState<GridCell[]>([]);
  const [showTrail, setShowTrail] = useState(false);
  const [coloredCells, setColoredCells] = useState<ColoredCell[]>([]);
  const idleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateGridSize = () => {
      setGridSize({
        rows: Math.ceil(window.innerHeight / CELL_SIZE),
        cols: Math.ceil(window.innerWidth / CELL_SIZE),
      });
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize);

    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerMove = (event: PointerEvent) => {
      const nextCell: GridCell = {
        row: Math.floor(event.clientY / CELL_SIZE),
        col: Math.floor(event.clientX / CELL_SIZE),
      };

      setHoverCell(nextCell);
      setShowTrail(true);
      setTrail((prev) => {
        if (prev.length === 0) return [nextCell];
        const last = prev[prev.length - 1];
        if (last.row === nextCell.row && last.col === nextCell.col) return prev;

        const updated = [...prev, nextCell];
        if (updated.length > TRAIL_LIMIT) updated.shift();
        return updated;
      });

      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
      }
      idleTimeoutRef.current = window.setTimeout(() => {
        setShowTrail(false);
        setTrail((prev) => (prev.length ? [prev[prev.length - 1]] : []));
      }, 250);
    };

    const handlePointerLeave = () => {
      setHoverCell(null);
      setTrail([]);
      setShowTrail(false);
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      if (idleTimeoutRef.current !== null) {
        window.clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  const cells = useMemo(() => {
    if (!gridSize.rows || !gridSize.cols) return [];
    return Array.from({ length: gridSize.rows * gridSize.cols }, (_, index) => {
      const row = Math.floor(index / gridSize.cols);
      const col = index % gridSize.cols;
      return { row, col };
    });
  }, [gridSize]);

  const buildColoredCells = useCallback(() => {
    if (!gridSize.rows || !gridSize.cols) {
      setColoredCells([]);
      return;
    }

    const totalCells = gridSize.rows * gridSize.cols;
    const targetCount = Math.min(RANDOM_CELL_COUNT, totalCells);
    const used = new Set<string>();
    const result: ColoredCell[] = [];

    while (result.length < targetCount) {
      const row = Math.floor(Math.random() * gridSize.rows);
      const col = Math.floor(Math.random() * gridSize.cols);
      const key = `${row}-${col}`;
      if (used.has(key)) continue;
      used.add(key);

      const tone = RANDOM_COLORS[result.length % RANDOM_COLORS.length];
      const id = `${Date.now()}-${result.length}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      result.push({ row, col, tone, id });
    }

    setColoredCells(result);
  }, [gridSize]);

  useEffect(() => {
    buildColoredCells();
    if (!gridSize.rows || !gridSize.cols) return;
    const intervalId = window.setInterval(buildColoredCells, 1600);
    return () => window.clearInterval(intervalId);
  }, [buildColoredCells, gridSize]);

  const getCellClass = (cell: GridCell) => {
    if (!hoverCell || trail.length === 0) return "hero__grid-cell";

    const reversedTrail = [...trail].reverse();
    const historyIndex = reversedTrail.findIndex(
      (trailCell) =>
        trailCell.row === cell.row && trailCell.col === cell.col,
    );

    if (historyIndex === -1) return "hero__grid-cell";
    if (historyIndex === 0)
      return "hero__grid-cell hero__grid-cell--active";

    if (!showTrail) return "hero__grid-cell";

    if (historyIndex <= 4) {
      return `hero__grid-cell hero__grid-cell--trail hero__grid-cell--trail-${historyIndex}`;
    }
    return "hero__grid-cell";
  };

  return (
    <main className="hero">
      <div className="hero__grid" aria-hidden="true">
        <div className="hero__grid-canvas">
          {coloredCells.map((cell) => (
            <span
              key={cell.id}
              className={`hero__grid-cell hero__grid-cell--colored hero__grid-cell--${cell.tone}`}
              style={
                {
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  top: `${cell.row * CELL_SIZE}px`,
                  left: `${cell.col * CELL_SIZE}px`,
                } as CSSProperties
              }
            />
          ))}

          {cells.map((cell) => (
            <span
              key={`${cell.row}-${cell.col}`}
              className={getCellClass(cell)}
              style={
                {
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  top: `${cell.row * CELL_SIZE}px`,
                  left: `${cell.col * CELL_SIZE}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>

      <header className="hero__nav">
        <div className="hero__brand">
          <span className="hero__logo" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 48 48" role="presentation">
              <rect
                x="7"
                y="7"
                width="34"
                height="34"
                rx="6"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
              />
              <polyline
                points="18,27 24,20 32,28"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
              />
              <circle cx="32" cy="20" r="2" fill="currentColor" />
            </svg>
          </span>
          <span className="hero__brand-text">Dev Sync</span>
        </div>
        <nav className="hero__links">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#">
              {link}
            </a>
          ))}
        </nav>
      </header>

      <section className="hero__content">
        <div className="hero__symbol" aria-hidden="true">
          <svg width="80" height="80" viewBox="0 0 64 64" role="presentation">
            <rect
              x="12"
              y="12"
              width="40"
              height="40"
              rx="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <polyline
              points="22,40 30,30 38,38"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line
              x1="38"
              y1="24"
              x2="48"
              y2="24"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="48" cy="24" r="2" fill="currentColor" />
          </svg>
        </div>
        <h1>Dev Sync</h1>
        <p>
          Fast, custom websites built for conversion and growth. No templates—
          just precision craftsmanship.
        </p>
        <button type="button" className="hero__cta">
          Let&apos;s Connect
        </button>
      </section>
    </main>
  );
}
