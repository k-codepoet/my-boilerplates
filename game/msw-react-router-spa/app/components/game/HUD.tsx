interface HUDProps {
  score: number;
  health: number;
  maxHealth: number;
  screen: string;
  won?: boolean;
}

export function HUD({ score, health, maxHealth, screen, won }: HUDProps) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Score - top right */}
      {screen === "play" && (
        <div className="absolute top-3 right-3 bg-black/50 text-white font-bold text-lg px-3 py-1 rounded">
          Score: {score}
        </div>
      )}

      {/* Health - top left (offset for debug overlay) */}
      {screen === "play" && (
        <div className="absolute top-3 right-32 flex gap-1">
          {Array.from({ length: maxHealth }, (_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-sm ${
                i < health ? "bg-red-500" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      )}

      {/* Title screen overlay */}
      {screen === "title" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-4">
            Platformer Demo
          </h1>
          <p className="text-xl text-white/80 animate-pulse">
            Press SPACE to start
          </p>
        </div>
      )}

      {/* Game over overlay */}
      {screen === "gameover" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-2">
            {won ? "You Win!" : "Game Over"}
          </h1>
          <p className="text-2xl text-yellow-300 mb-4">Score: {score}</p>
          <p className="text-lg text-white/80 animate-pulse">
            Press SPACE to restart
          </p>
        </div>
      )}
    </div>
  );
}
