/**
 * Dev utility: generates PNG files from SpriteFactory and triggers browser downloads.
 * Run from browser console or a dev-only UI button.
 *
 * Usage:
 *   import { exportAllSprites } from "./sprites/exportSpritePNGs";
 *   exportAllSprites();
 *
 * Place the downloaded files in public/assets/platformer/ for file-based loading.
 */
import {
  drawPlayerIdle,
  drawPlayerWalk1,
  drawPlayerWalk2,
  drawPlayerJump,
  drawPlatform,
  drawGround,
  drawCoin,
  drawEnemy,
} from "./SpriteFactory";

async function canvasToPngBlob(bitmap: ImageBitmap): Promise<Blob> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  return canvas.convertToBlob({ type: "image/png" });
}

export async function exportAllSprites(): Promise<void> {
  const sprites = [
    { name: "player-idle", draw: drawPlayerIdle },
    { name: "player-walk-1", draw: drawPlayerWalk1 },
    { name: "player-walk-2", draw: drawPlayerWalk2 },
    { name: "player-jump", draw: drawPlayerJump },
    { name: "platform", draw: drawPlatform },
    { name: "ground", draw: drawGround },
    { name: "coin", draw: drawCoin },
    { name: "enemy", draw: drawEnemy },
  ];

  for (const { name, draw } of sprites) {
    const bitmap = await draw();
    const blob = await canvasToPngBlob(bitmap);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
