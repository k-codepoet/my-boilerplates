import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameCanvas } from "~/ui/GameCanvas";
import "~/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameCanvas width={800} height={600} />
  </StrictMode>,
);
