/**
 * Programmatic pixel-art sprite factory.
 * Draws sprites using OffscreenCanvas and returns ImageBitmap objects
 * usable by all 4 renderers (Canvas, Pixi, Three, Phaser).
 */

async function drawToBitmap(
  w: number,
  h: number,
  draw: (ctx: OffscreenCanvasRenderingContext2D) => void,
): Promise<ImageBitmap> {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get OffscreenCanvas 2d context");
  draw(ctx);
  return createImageBitmap(canvas);
}

// ---------------------------------------------------------------------------
// Player sprites — 28x36px
// ---------------------------------------------------------------------------

function drawPlayerBase(ctx: OffscreenCanvasRenderingContext2D): void {
  // Body
  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(0, 0, 28, 36);
  // Eyes (white)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(6, 8, 6, 6);
  ctx.fillRect(16, 8, 6, 6);
  // Pupils
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(9, 10, 3, 3);
  ctx.fillRect(19, 10, 3, 3);
}

export async function drawPlayerIdle(): Promise<ImageBitmap> {
  return drawToBitmap(28, 36, (ctx) => {
    drawPlayerBase(ctx);
    // Feet (dark blue)
    ctx.fillStyle = "#1e40af";
    ctx.fillRect(2, 30, 10, 6);
    ctx.fillRect(16, 30, 10, 6);
  });
}

export async function drawPlayerWalk1(): Promise<ImageBitmap> {
  return drawToBitmap(28, 36, (ctx) => {
    drawPlayerBase(ctx);
    // Left foot shifted up, right foot lower
    ctx.fillStyle = "#1e40af";
    ctx.fillRect(2, 28, 10, 6);
    ctx.fillRect(16, 32, 10, 4);
  });
}

export async function drawPlayerWalk2(): Promise<ImageBitmap> {
  return drawToBitmap(28, 36, (ctx) => {
    drawPlayerBase(ctx);
    // Right foot shifted up, left foot lower
    ctx.fillStyle = "#1e40af";
    ctx.fillRect(2, 32, 10, 4);
    ctx.fillRect(16, 28, 10, 6);
  });
}

export async function drawPlayerJump(): Promise<ImageBitmap> {
  return drawToBitmap(28, 36, (ctx) => {
    drawPlayerBase(ctx);
    // Feet tucked together
    ctx.fillStyle = "#1e40af";
    ctx.fillRect(6, 28, 8, 6);
    ctx.fillRect(14, 28, 8, 6);
  });
}

// ---------------------------------------------------------------------------
// Platform — 120x19px (3px grass + 16px stone body)
// ---------------------------------------------------------------------------

export async function drawPlatform(): Promise<ImageBitmap> {
  return drawToBitmap(120, 19, (ctx) => {
    // Grass strip
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(0, 0, 120, 3);
    // Stone body
    ctx.fillStyle = "#78716c";
    ctx.fillRect(0, 3, 120, 16);
    // Top highlight on stone
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(0, 3, 120, 3);
  });
}

// ---------------------------------------------------------------------------
// Ground — 800x50px
// ---------------------------------------------------------------------------

export async function drawGround(): Promise<ImageBitmap> {
  return drawToBitmap(800, 50, (ctx) => {
    // Darker stone body
    ctx.fillStyle = "#57534e";
    ctx.fillRect(0, 0, 800, 50);
    // Top highlight
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(0, 0, 800, 3);
  });
}

// ---------------------------------------------------------------------------
// Coin — 14x14px
// ---------------------------------------------------------------------------

export async function drawCoin(): Promise<ImageBitmap> {
  return drawToBitmap(14, 14, (ctx) => {
    // Yellow circle
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.arc(7, 7, 7, 0, Math.PI * 2);
    ctx.fill();
    // Shine highlight
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(5, 5, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ---------------------------------------------------------------------------
// Enemy — 26x26px
// ---------------------------------------------------------------------------

export async function drawEnemy(): Promise<ImageBitmap> {
  return drawToBitmap(26, 26, (ctx) => {
    // Red body
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(0, 0, 26, 26);
    // Eyes (white)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(4, 6, 6, 6);
    ctx.fillRect(16, 6, 6, 6);
    // Pupils (black)
    ctx.fillStyle = "#000000";
    ctx.fillRect(6, 8, 3, 3);
    ctx.fillRect(18, 8, 3, 3);
    // Angry eyebrows
    ctx.fillStyle = "#000000";
    ctx.fillRect(3, 4, 8, 2);
    ctx.fillRect(15, 4, 8, 2);
  });
}
