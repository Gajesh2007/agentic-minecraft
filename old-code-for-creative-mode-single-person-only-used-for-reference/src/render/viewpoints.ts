import { BBox, Vec3i, normalizeBBox } from '../types/geometry.js';

export type ViewPreset = 'front' | 'corner45' | 'topdown' | 'interior';

export function computeViewpoint(
  bbox: BBox,
  preset: ViewPreset,
  distance: number,
): { position: Vec3i; yaw: number; pitch: number } {
  const b = normalizeBBox(bbox);
  const center = {
    x: (b.min.x + b.max.x) / 2,
    y: (b.min.y + b.max.y) / 2,
    z: (b.min.z + b.max.z) / 2,
  };
  let position: Vec3i;
  switch (preset) {
    case 'front':
      position = { x: Math.round(center.x), y: Math.round(center.y), z: b.min.z - distance };
      break;
    case 'corner45':
      position = { x: b.min.x - distance, y: Math.round(center.y), z: b.min.z - distance };
      break;
    case 'topdown':
      position = { x: Math.round(center.x), y: b.max.y + distance, z: Math.round(center.z) };
      break;
    case 'interior':
      position = { x: Math.round(center.x), y: Math.round(center.y), z: Math.round(center.z) };
      break;
    default:
      position = { x: Math.round(center.x), y: Math.round(center.y), z: b.min.z - distance };
  }
  const { yaw, pitch } = lookAt(position, center);
  return { position, yaw, pitch };
}

export function lookAt(from: Vec3i, to: { x: number; y: number; z: number }): { yaw: number; pitch: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const yaw = Math.atan2(-dx, -dz);
  const ground = Math.sqrt(dx * dx + dz * dz);
  const pitch = Math.atan2(dy, ground);
  return { yaw, pitch };
}

export function radiansToDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

