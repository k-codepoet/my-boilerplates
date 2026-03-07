import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "~/lib/layout.shared";
import { GameCanvas } from "~/components/game/GameCanvas";

export default function Play() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex items-center justify-center flex-1 bg-gray-950">
        <GameCanvas width={800} height={600} />
      </div>
    </HomeLayout>
  );
}
