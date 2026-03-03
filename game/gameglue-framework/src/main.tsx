import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameCanvas } from "~/ui/GameCanvas";
import "~/app.css";

declare const __BUILD_TIME__: string;
declare const __APP_VERSION__: string;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameCanvas width={800} height={600} />
    <footer className="fixed bottom-2 right-3 text-[10px] text-muted-foreground/40">
      {__APP_VERSION__} · {__BUILD_TIME__}
    </footer>
  </StrictMode>,
);
