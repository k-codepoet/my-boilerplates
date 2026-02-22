import { GameCanvas } from "~/components/game/GameCanvas";

export default function Play() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-53px)] bg-gray-950">
      <GameCanvas width={800} height={600} />
    </div>
  );
}
