"use client";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
} from "react";

const NAV_LINKS = ["About", "Services", "Pricing", "Contact"];
const DEFAULT_CELL_SIZE = 90;
const TRAIL_LIMIT = 5;
const RANDOM_COLORS = [
  "accent-a",
  "accent-b",
  "accent-c",
  "accent-d",
  "accent-e",
  "accent-f",
  "accent-g",
  "accent-h",
];
const RANDOM_CELL_COUNT = 10;

type GridCell = { row: number; col: number };
type ColoredCell = GridCell & { tone: string; id: string; delay: number };

const readCellSize = () => {
  if (typeof window === "undefined") return DEFAULT_CELL_SIZE;
  const raw = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--cell-size"),
  );
  return Number.isFinite(raw) ? raw : DEFAULT_CELL_SIZE;
};

export default function Home() {
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  const [cellSize, setCellSize] = useState(() => readCellSize());
  const [hoverCell, setHoverCell] = useState<GridCell | null>(null);
  const [trail, setTrail] = useState<GridCell[]>([]);
  const [showTrail, setShowTrail] = useState(false);
  const [coloredCells, setColoredCells] = useState<ColoredCell[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const idleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateCellSize = () => {
      setCellSize(readCellSize());
    };

    updateCellSize();
    window.addEventListener("resize", updateCellSize);
    return () => window.removeEventListener("resize", updateCellSize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateGridSize = () => {
      setGridSize({
        rows: Math.ceil(window.innerHeight / cellSize),
        cols: Math.ceil(window.innerWidth / cellSize),
      });
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize);

    return () => window.removeEventListener("resize", updateGridSize);
  }, [cellSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerMove = (event: PointerEvent) => {
      const nextCell: GridCell = {
        row: Math.floor(event.clientY / cellSize),
        col: Math.floor(event.clientX / cellSize),
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
      }, 180);
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
      const delay = Math.floor(Math.random() * 2000);
      result.push({ row, col, tone, id, delay });
    }

    setColoredCells(result);
  }, [gridSize]);

  useEffect(() => {
    buildColoredCells();
    if (!gridSize.rows || !gridSize.cols) return;
    const intervalId = window.setInterval(() => {
      setTimeout(buildColoredCells, Math.random() * 1200);
    }, 3600);
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
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  top: `${cell.row * cellSize}px`,
                  left: `${cell.col * cellSize}px`,
                  animationDelay: `${cell.delay}ms`,
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
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  top: `${cell.row * cellSize}px`,
                  left: `${cell.col * cellSize}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </div>
      <div
        className={`hero__sidebar-overlay${menuOpen ? " hero__sidebar-overlay--active" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`hero__sidebar${menuOpen ? " hero__sidebar--open" : ""}`}>
        <button
          className="hero__sidebar-close"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        >
          ×
        </button>
        <nav className="hero__sidebar-links">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" onClick={() => setMenuOpen(false)}>
              {link}
            </a>
          ))}
        </nav>
      </aside>

      <header className="hero__nav">
        <div className="hero__nav-inner">
          <div className="hero__brand">
           
            <span className="hero__brand-text">
              <Image src={"/devsynkLogoLight.png"} alt="DevSync Logo" width={219} height={51} />
            </span>
          </div>
          <nav className="hero__links">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#">
                {link}
              </a>
            ))}
          </nav>
          <button
            className="hero__menu-button"
            type="button"
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <section className="flex flex-col text-center items-center gap-6 mt-[50px] max-w-[800px]">
        <p className="text-4xl">DevSynk</p>
        <p className="text-3xl">Fast, custom websites built for conversion and growth. No templates—just precision craftsmanship.</p>
        {/* <p>
        custom-built, high-performance websites and application designed to convert, engage,and scale your business. No templates. just powerful digital experiences.
        </p> */}
        <button type="button" className="bg-[#21303f] px-4 rounded-2xl py-2 text-white w-fit items-center justify-center">
          Let&apos;s Connect
        </button>
      </section>
    </main>
  );
}
