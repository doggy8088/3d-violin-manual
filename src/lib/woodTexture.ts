import * as THREE from "three";

function paintWood(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: { base: string; dark: string; light: string; flame: boolean },
) {
  ctx.fillStyle = palette.base;
  ctx.fillRect(0, 0, width, height);

  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const n =
        Math.sin(x * 0.085 + Math.sin(y * 0.03) * 3.2) * 0.5 +
        Math.sin((x + y * 0.15) * 0.18) * 0.25;
      const flame = palette.flame
        ? Math.sin(y * 0.12 + Math.sin(x * 0.04) * 8) * 0.18
        : 0;
      const grain = n + flame;
      data[i] = Math.min(255, Math.max(0, data[i] + grain * 42));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain * 28));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain * 12));
    }
  }
  ctx.putImageData(image, 0, 0);

  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 70; i++) {
    const x = (i / 70) * width + Math.sin(i * 1.7) * 10;
    ctx.strokeStyle = palette.dark;
    ctx.lineWidth = 0.8 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= height; y += 6) {
      ctx.lineTo(x + Math.sin(y * 0.035 + i) * 7, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = palette.light;
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * width;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 8, height * 0.3, x - 6, height * 0.6, x + 4, height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function toTexture(canvas: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

let varnishTex: THREE.CanvasTexture | null = null;
let mapleTex: THREE.CanvasTexture | null = null;
let ebonyTex: THREE.CanvasTexture | null = null;

export function getVarnishTexture() {
  if (varnishTex) return varnishTex;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  paintWood(ctx, 512, 1024, {
    base: "#8a4318",
    dark: "#4a1f08",
    light: "#d4a066",
    flame: false,
  });
  varnishTex = toTexture(canvas);
  return varnishTex;
}

export function getMapleTexture() {
  if (mapleTex) return mapleTex;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  paintWood(ctx, 512, 1024, {
    base: "#b06a32",
    dark: "#6a3414",
    light: "#e6c08a",
    flame: true,
  });
  mapleTex = toTexture(canvas);
  return mapleTex;
}

export function getEbonyTexture() {
  if (ebonyTex) return ebonyTex;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  paintWood(ctx, 256, 256, {
    base: "#1a1614",
    dark: "#0a0908",
    light: "#3a342e",
    flame: false,
  });
  ebonyTex = toTexture(canvas);
  return ebonyTex;
}
