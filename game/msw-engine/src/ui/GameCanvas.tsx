import { useRef, useEffect, useState, useCallback } from "react";
import type { Game } from "~/engine/Game";
import { createPlatformerGame } from "~/templates/platformer/PlatformerGame";
import { DebugOverlay } from "./DebugOverlay";
import { HUD } from "./HUD";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    let stopped = false;

    createPlatformerGame(canvas, width, height).then((game) => {
      if (stopped) {
        game.stop();
        return;
      }
      gameRef.current = game;
    });

    // Poll UI state at 10Hz (decoupled from game loop)
    const pollInterval = setInterval(updateUI, 100);

    return () => {
      stopped = true;
      clearInterval(pollInterval);
      gameRef.current?.stop();
      gameRef.current = null;
    };
  }, [width, height, updateUI]);

  return (
    <div
      className="relative inline-block"
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        className="block"
        tabIndex={0}
      />
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
  );
}
