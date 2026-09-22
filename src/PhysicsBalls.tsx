import { useEffect, useRef } from "react";
import Matter from "matter-js";

export type BallConfig = { [color: string]: number };

interface Props {
  width: number;
  height: number;
  balls: BallConfig;
}

const HIGHLIGHT: Record<string, string> = {
  "#ef4444": "#fca5a5",
  "#3b82f6": "#93c5fd",
  "#22c55e": "#86efac",
  "#f59e0b": "#fde68a",
  "#a855f7": "#d8b4fe",
};

const SWIPE_RADIUS_FACTOR = 3.5;
const SWIPE_VEL_SCALE = 6;   // px/step added per px/ms of swipe speed
const SWIPE_VEL_CAP = 22;  // maximum velocity kick per ball

function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function spawnPositions(count: number, r: number, w: number, h: number) {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 300; attempt++) {
      const x = r * 1.3 + Math.random() * (w - r * 2.6);
      const y = r * 1.3 + Math.random() * (h - r * 2.6);
      const ok = positions.every(p => {
        const dx = p.x - x, dy = p.y - y;
        return Math.sqrt(dx * dx + dy * dy) >= r * 2.15;
      });
      if (ok) { positions.push({ x, y }); placed = true; break; }
    }
    if (!placed) {
      const last = positions[positions.length - 1] ?? { x: w / 2, y: r };
      positions.push({ x: (last.x + r * 2.3) % (w - r * 2), y: (last.y + r * 2.3) % (h - r * 2) });
    }
  }
  return positions;
}

export default function PhysicsBalls({ width, height, balls }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || width === 0 || height === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = width;
    canvas.height = height;

    const { Engine, Bodies, Composite, Body } = Matter;
    // Higher solver iterations prevent fast balls from tunnelling through walls
    const engine = Engine.create({
      gravity: { x: 0, y: 1.8 },
      positionIterations: 16,
      velocityIterations: 16,
    });

    // Compute ball radius first so walls can be offset by it
    const ballList: { color: string }[] = [];
    for (const [color, count] of Object.entries(balls)) {
      for (let i = 0; i < Math.min(count, 10); i++) ballList.push({ color });
    }
    const r = Math.min(width / (Math.min(ballList.length, 6) * 2.2), height / 4, 28);

    // Wall thickness — thick enough that no ball can tunnel through even at max velocity
    const T = Math.max(60, r * 4);
    const halfT = T / 2;

    // Four static walls forming a closed box around the visible viewport.
    // Each wall is offset outward by halfT so its inner face sits at the viewport edge,
    // and the side walls use height * 4 to guarantee full coverage.
    Composite.add(engine.world, [
      // Bottom floor (existing — kept as-is)
      Bodies.rectangle(width / 2, height + halfT, width + T, T, { isStatic: true, friction: 0.4, restitution: 0.3 }),
      // Left wall
      Bodies.rectangle(-halfT, height / 2, T, height * 4, { isStatic: true, friction: 0, restitution: 0.5 }),
      // Right wall
      Bodies.rectangle(width + halfT, height / 2, T, height * 4, { isStatic: true, friction: 0, restitution: 0.5 }),
      // Top wall
      Bodies.rectangle(width / 2, -halfT, width + T, T, { isStatic: true, friction: 0, restitution: 0.5 }),
    ]);

    const positions = spawnPositions(ballList.length, r, width, height);

    const bodies = ballList.map(({ color }, i) => {
      const { x, y } = positions[i];
      const b = Bodies.circle(x, y, r, {
        restitution: 0.55,
        friction: 0.05,
        frictionAir: 0.01,
        density: 0.004,
      });
      Body.setVelocity(b, { x: (Math.random() - 0.5) * 2, y: Math.random() });
      (b as unknown as { _color: string })._color = color;
      return b;
    });

    Composite.add(engine.world, bodies);

    function drawBall(b: Matter.Body) {
      const { x, y } = b.position;
      const color = (b as unknown as { _color: string })._color;
      const hi = HIGHLIGHT[color] ?? "#ffffff";

      ctx.save();
      ctx.shadowColor = hexToRgba(color, 0.45);
      ctx.shadowBlur = r * 0.8;
      ctx.shadowOffsetY = r * 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();

      const grad = ctx.createRadialGradient(
        x - r * 0.32, y - r * 0.38, r * 0.04,
        x, y, r
      );
      grad.addColorStop(0, hi + "cc");
      grad.addColorStop(0.5, color + "00");
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    let raf = 0;
    function loop() {
      Engine.update(engine, 1000 / 60);
      ctx.clearRect(0, 0, width, height);
      bodies.forEach(drawBall);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop as FrameRequestCallback);

    // ── Interaction (registered directly on DOM so we can pass { passive: false }) ──

    function canvasXY(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left) * (width / rect.width),
        y: (clientY - rect.top) * (height / rect.height),
      };
    }

    function applyImpulse(
      x1: number, y1: number,
      x2: number, y2: number,
      dt: number
    ) {
      const dx = x2 - x1, dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) return;
      const speed = dist / Math.max(dt, 1); // px/ms
      const nx = dx / dist, ny = dy / dist;
      const threshold = r * SWIPE_RADIUS_FACTOR;

      bodies.forEach(b => {
        const bx = b.position.x, by = b.position.y;
        const t = Math.max(0, Math.min(1,
          ((bx - x1) * nx + (by - y1) * ny) / dist
        ));
        const cx = x1 + t * dx, cy = y1 + t * dy;
        const d = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2);
        if (d < threshold) {
          const falloff = 1 - d / threshold;
          const kick = Math.min(speed * SWIPE_VEL_SCALE * falloff, SWIPE_VEL_CAP);
          Body.setVelocity(b, {
            x: b.velocity.x + nx * kick,
            y: b.velocity.y + ny * kick,
          });
        }
      });
    }

    // Touch
    let lastTouch: { x: number; y: number; t: number } | null = null;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      const { x, y } = canvasXY(e.touches[0].clientX, e.touches[0].clientY);
      lastTouch = { x, y, t: Date.now() };
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (!lastTouch) return;
      const { x, y } = canvasXY(e.touches[0].clientX, e.touches[0].clientY);
      const now = Date.now();
      applyImpulse(lastTouch.x, lastTouch.y, x, y, now - lastTouch.t);
      lastTouch = { x, y, t: now };
    }
    function onTouchEnd(e: TouchEvent) { e.preventDefault(); lastTouch = null; }

    // Mouse
    let mouseDown = false;
    let lastMouse: { x: number; y: number; t: number } | null = null;

    function onMouseDown(e: MouseEvent) {
      mouseDown = true;
      const { x, y } = canvasXY(e.clientX, e.clientY);
      lastMouse = { x, y, t: Date.now() };
    }
    function onMouseMove(e: MouseEvent) {
      if (!mouseDown || !lastMouse) return;
      const { x, y } = canvasXY(e.clientX, e.clientY);
      const now = Date.now();
      applyImpulse(lastMouse.x, lastMouse.y, x, y, now - lastMouse.t);
      lastMouse = { x, y, t: now };
    }
    function onMouseUp() { mouseDown = false; lastMouse = null; }

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);

    return () => {
      cancelAnimationFrame(raf);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
    };
  }, [width, height, balls]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%", touchAction: "none", cursor: "crosshair" }}
    />
  );
}
