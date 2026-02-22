interface DebugOverlayProps {
  fps: number;
  objectCount: number;
  scene: string;
}

export function DebugOverlay({ fps, objectCount, scene }: DebugOverlayProps) {
  if (!import.meta.env.DEV) return null;

  return (
    <div className="absolute top-2 left-2 bg-black/60 text-green-400 font-mono text-xs px-2 py-1 rounded pointer-events-none select-none">
      <div>FPS: {fps}</div>
      <div>Objects: {objectCount}</div>
      <div>Scene: {scene}</div>
    </div>
  );
}
