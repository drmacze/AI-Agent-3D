import * as THREE from 'three';

// ── Cached texture singletons ─────────────────────────────────────────────────
let _woodLight: THREE.CanvasTexture | null = null;
let _woodDark:  THREE.CanvasTexture | null = null;
let _concrete:  THREE.CanvasTexture | null = null;
let _carpet:    THREE.CanvasTexture | null = null;

function buildWood(baseHex: string, grainHex: string, w = 512, h = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Base fill
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, w, h);

  // Grain lines — long wavy streaks
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * h;
    ctx.strokeStyle = grainHex;
    ctx.lineWidth = 0.4 + Math.random() * 1.8;
    ctx.globalAlpha = 0.07 + Math.random() * 0.22;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 6) {
      ctx.lineTo(x, y + Math.sin(x * 0.035 + i * 1.3) * 3.5);
    }
    ctx.stroke();
  }

  // Pore dots
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 500; i++) {
    const v = Math.random() > 0.5 ? '#000' : '#fff';
    ctx.fillStyle = v;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random(), 1);
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  tex.anisotropy = 4;
  return tex;
}

function buildConcrete(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c4c0b8';
  ctx.fillRect(0, 0, 512, 512);

  // Large-scale tone variation
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const r = 40 + Math.random() * 80;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const v = Math.random() > 0.5 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
    g.addColorStop(0, v); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  }

  // Micro noise
  for (let i = 0; i < 12000; i++) {
    const v = Math.floor(180 + Math.random() * 60);
    ctx.fillStyle = `rgb(${v},${v},${v - 2})`;
    ctx.globalAlpha = 0.06 + Math.random() * 0.10;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random(), 1 + Math.random());
  }

  // Hairline cracks
  ctx.globalAlpha = 0.05; ctx.strokeStyle = '#8a8888'; ctx.lineWidth = 0.5;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    ctx.bezierCurveTo(
      Math.random() * 512, Math.random() * 512,
      Math.random() * 512, Math.random() * 512,
      Math.random() * 512, Math.random() * 512,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 4);
  tex.anisotropy = 4;
  return tex;
}

function buildCarpet(accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base
  ctx.fillStyle = '#1e2030';
  ctx.fillRect(0, 0, 256, 256);

  // Fiber noise
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    const l = 2 + Math.random() * 4;
    ctx.strokeStyle = Math.random() > 0.92 ? accentHex : `hsl(240,10%,${15 + Math.random() * 12}%)`;
    ctx.globalAlpha = 0.3 + Math.random() * 0.5;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y + l * (Math.random() - 0.5)); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 6);
  return tex;
}

// ── Public API ────────────────────────────────────────────────────────────────
export function getWoodLightTexture(): THREE.CanvasTexture {
  if (!_woodLight) _woodLight = buildWood('#c8a870', '#8a5e28');
  return _woodLight;
}

export function getWoodDarkTexture(): THREE.CanvasTexture {
  if (!_woodDark) _woodDark = buildWood('#906840', '#5a3014');
  return _woodDark;
}

export function getConcreteTexture(): THREE.CanvasTexture {
  if (!_concrete) _concrete = buildConcrete();
  return _concrete;
}

export function getCarpetTexture(accentHex = '#2563eb'): THREE.CanvasTexture {
  if (!_carpet) _carpet = buildCarpet(accentHex);
  return _carpet;
}

export function disposeAllTextures(): void {
  [_woodLight, _woodDark, _concrete, _carpet].forEach(t => t?.dispose());
  _woodLight = _woodDark = _concrete = _carpet = null;
}
