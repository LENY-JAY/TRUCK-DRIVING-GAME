export type TruckId = "maw" | "blaze" | "mud" | "titan";

export type TruckSpec = {
  id: TruckId;
  name: string;
  tag: string;
  price: number;
  accel: number;
  top: number;
  grip: number;
  mass: number;
  color: number;
  accent: number;
  livery: "skull" | "flame" | "camo" | "stripe";
  number: string;
};

export const TRUCKS: TruckSpec[] = [
  {
    id: "maw",
    name: "Yard Freight",
    tag: "Balanced box truck",
    price: 0,
    accel: 12,
    top: 28,
    grip: 0.96,
    mass: 1.12,
    color: 0x1b3a2a,
    accent: 0xd4a24c,
    livery: "skull",
    number: "13",
  },
  {
    id: "blaze",
    name: "Redline Cargo",
    tag: "Faster, lighter",
    price: 0,
    accel: 15,
    top: 34,
    grip: 0.78,
    mass: 0.92,
    color: 0x8e2218,
    accent: 0xf4a261,
    livery: "flame",
    number: "07",
  },
  {
    id: "mud",
    name: "Ridge Hauler",
    tag: "Heavy, grippy",
    price: 900,
    accel: 10.5,
    top: 24,
    grip: 1.22,
    mass: 1.38,
    color: 0x3e4a32,
    accent: 0x8a9a62,
    livery: "camo",
    number: "44",
  },
  {
    id: "titan",
    name: "Chrome Line",
    tag: "Long gear, planted",
    price: 2400,
    accel: 13,
    top: 31,
    grip: 1.02,
    mass: 1.2,
    color: 0xc5ccd3,
    accent: 0x1e242b,
    livery: "stripe",
    number: "01",
  },
];

export const ROADS = [-184, -138, -92, -46, 0, 46, 92, 138, 184];

export type Ramp = { x: number; z: number; yaw: number; len: number; rise: number; width: number };

export const RAMPS: Ramp[] = [
  { x: 0, z: 196, yaw: Math.PI, len: 26, rise: 8.5, width: 16 },
  { x: -16, z: 242, yaw: Math.PI, len: 12, rise: 2.4, width: 9 },
  { x: 2, z: 256, yaw: Math.PI, len: 12, rise: 3.1, width: 9 },
  { x: 18, z: 270, yaw: Math.PI, len: 12, rise: 3.6, width: 9 },
  { x: 78, z: -46, yaw: -Math.PI / 2, len: 18, rise: 5.5, width: 12 },
];

export const CHECKPOINTS: { x: number; z: number; yaw: number }[] = [
  { x: 0, z: -92, yaw: 0 },
  { x: 92, z: -46, yaw: Math.PI / 2 },
  { x: 92, z: 92, yaw: Math.PI / 2 },
  { x: 0, z: 138, yaw: Math.PI },
  { x: -92, z: 46, yaw: -Math.PI / 2 },
  { x: -46, z: -46, yaw: 0 },
];

export const LANDMARKS: { id: string; name: string; x: number; z: number; r: number; cash: number }[] = [
  { id: "core", name: "Foundry District", x: 0, z: -20, r: 28, cash: 250 },
  { id: "arena", name: "Jawbone Arena", x: 0, z: 230, r: 40, cash: 400 },
  { id: "ridge", name: "Redline Ridge", x: -280, z: 30, r: 36, cash: 500 },
  { id: "harbor", name: "Sluice Harbor", x: 250, z: -80, r: 34, cash: 350 },
  { id: "stacks", name: "Kiln Stacks", x: -92, z: 92, r: 22, cash: 200 },
];

export type SaveData = {
  v: 1;
  cash: number;
  unlocked: TruckId[];
  truck: TruckId;
  bestTrial: number | null;
  discovered: string[];
  stuntCash: number;
};

const KEY = "ironhaul-save-v1";

export function defaultSave(): SaveData {
  return { v: 1, cash: 0, unlocked: ["maw", "blaze"], truck: "maw", bestTrial: null, discovered: [], stuntCash: 0 };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const p = JSON.parse(raw) as SaveData;
    if (p.v !== 1 || !Array.isArray(p.unlocked)) return defaultSave();
    return p;
  } catch {
    return defaultSave();
  }
}

export function writeSave(s: SaveData) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function hillsHeight(x: number, z: number): number {
  if (x >= -190) return 0;
  const fade = Math.min(1, (-190 - x) / 46);
  return fade * (7.5 * Math.sin(x * 0.031) * Math.cos(z * 0.024) + 3.4 * Math.sin((x + z) * 0.02));
}

export function rampHeightAt(x: number, z: number): number | null {
  let best: number | null = null;
  for (const r of RAMPS) {
    const dx = x - r.x;
    const dz = z - r.z;
    const fx = -Math.sin(r.yaw);
    const fz = -Math.cos(r.yaw);
    const rx = Math.cos(r.yaw);
    const rz = -Math.sin(r.yaw);
    const along = dx * fx + dz * fz;
    const lat = dx * rx + dz * rz;
    if (along < -0.2 || along > r.len + 0.2 || Math.abs(lat) > r.width * 0.5) continue;
    const t = Math.min(1, Math.max(0, along / r.len));
    const h = t * r.rise;
    if (best == null || h > best) best = h;
  }
  return best;
}

export function groundHeight(x: number, z: number): number {
  let h = hillsHeight(x, z);
  const rh = rampHeightAt(x, z);
  if (rh != null) h = Math.max(h, rh);
  if (x > 220 && z < -30 && z > -160) h = Math.min(h, -1.15);
  return h;
}

export function distToAsphalt(x: number, z: number): number {
  let d = 999;
  if (x > -200 && x < 200 && z > -200 && z < 200) {
    for (const r of ROADS) {
      d = Math.min(d, Math.abs(x - r), Math.abs(z - r));
    }
  }
  const ax = Math.abs(x);
  const az = Math.abs(z);
  if (ax > 190 && ax < 232 && az <= 214) d = Math.min(d, Math.abs(ax - 210));
  if (az > 190 && az < 232 && ax <= 214) d = Math.min(d, Math.abs(az - 210));
  return d;
}

export type Surface = "asphalt" | "dirt" | "mud" | "water";

export function surfaceAt(x: number, z: number, h: number): Surface {
  if (x > 220 && z < -30 && z > -160) return "water";
  if (Math.abs(z) < 8 && x < -184 && x > -380) return "dirt";
  if (x < -190) return h < 0.8 ? "mud" : "dirt";
  if (Math.hypot(x, z - 236) < 78) return "dirt";
  if (distToAsphalt(x, z) < 7.2) return "asphalt";
  return "dirt";
}
