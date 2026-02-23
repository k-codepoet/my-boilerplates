import { useRef, useEffect, useState, useCallback } from "react";
import type { Game } from "~/engine/Game";
import { createPlatformerGame } from "~/templates/platformer/PlatformerGame";
import type { AdapterType, ResourceMode } from "~/templates/platformer/PlatformerGame";
import { DebugOverlay } from "./DebugOverlay";
import { HUD } from "./HUD";

const STORAGE_KEY_ADAPTER = "msw-engine:adapter";
const STORAGE_KEY_RESOURCE = "msw-engine:resource";

const ADAPTER_OPTIONS: { value: AdapterType; label: string }[] = [
  { value: "canvas", label: "Canvas 2D" },
  { value: "pixi", label: "PixiJS" },
  { value: "three", label: "Three.js" },
  { value: "phaser", label: "Phaser 3" },
];

const RESOURCE_OPTIONS: { value: ResourceMode; label: string }[] = [
  { value: "programmatic", label: "Programmatic" },
  { value: "file", label: "File-based" },
];

interface GameCanvasProps {
  width?: number;
  height?: number;
}

interface GameUIState {
  score: number;
  health: number;
  maxHealth: number;
  fps: number;
  objectCount: number;
  screen: string;
  won: boolean;
}

export function GameCanvas({ width = 800, height = 600 }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [adapterType, setAdapterType] = useState<AdapterType>(
    () => (localStorage.getItem(STORAGE_KEY_ADAPTER) as AdapterType) || "canvas",
  );
  const [resourceMode, setResourceMode] = useState<ResourceMode>(
    () => (localStorage.getItem(STORAGE_KEY_RESOURCE) as ResourceMode) || "programmatic",
  );
  const [uiState, setUIState] = useState<GameUIState>({
    score: 0,
    health: 3,
    maxHealth: 3,
    fps: 0,
    objectCount: 0,
    screen: "title",
    won: false,
  });

  const updateUI = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;

    const state = game.getState();
    const scene = game.activeScene;

    setUIState({
      score: state.get<number>("score") ?? 0,
      health: state.get<number>("health") ?? 3,
      maxHealth: 3,
      fps: game.getLoop().fps,
      objectCount: scene?.getObjectCount() ?? 0,
      screen: state.get<string>("screen") ?? "title",
      won: state.get<boolean>("won") ?? false,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create a fresh canvas each mount — prevents GPU context reuse issues
    // (React StrictMode double-mounts would corrupt WebGL/WebGPU on a reused canvas)
    const canvas = document.createElement("canvas");
    canvas.className = "block";
    canvas.tabIndex = 0;
    canvas.style.outline = "none";
    container.prepend(canvas);

    let stopped = false;

    createPlatformerGame(canvas, width, height, adapterType, resourceMode).then((game) => {
      if (stopped) {
        game.stop();
        return;
      }
      gameRef.current = game;
      canvas.focus();
    });

    // Poll UI state at 10Hz (decoupled from game loop)
    const pollInterval = setInterval(updateUI, 100);

    return () => {
      stopped = true;
      clearInterval(pollInterval);
      gameRef.current?.stop();
      gameRef.current = null;
      canvas.remove();
    };
  }, [width, height, adapterType, resourceMode, updateUI]);

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        {ADAPTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { localStorage.setItem(STORAGE_KEY_ADAPTER, opt.value); setAdapterType(opt.value); }}
            className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
              adapterType === opt.value
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Resources:</span>
        {RESOURCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { localStorage.setItem(STORAGE_KEY_RESOURCE, opt.value); setResourceMode(opt.value); }}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              resourceMode === opt.value
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        className="relative inline-block"
        style={{ width, height }}
      >
        <DebugOverlay
          fps={uiState.fps}
          objectCount={uiState.objectCount}
          scene={uiState.screen}
        />
        <HUD
          score={uiState.score}
          health={uiState.health}
          maxHealth={uiState.maxHealth}
          screen={uiState.screen}
          won={uiState.won}
        />
      </div>
    </div>
  );
}
