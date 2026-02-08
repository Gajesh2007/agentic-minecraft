export type Vec3i = Readonly<{ x: number; y: number; z: number }>;

export type BBox = Readonly<{ min: Vec3i; max: Vec3i }>;

export function normalizeBBox(box: BBox): BBox {
  return {
    min: {
      x: Math.min(box.min.x, box.max.x),
      y: Math.min(box.min.y, box.max.y),
      z: Math.min(box.min.z, box.max.z),
    },
    max: {
      x: Math.max(box.min.x, box.max.x),
      y: Math.max(box.min.y, box.max.y),
      z: Math.max(box.min.z, box.max.z),
    },
  };
}

export function bboxDimensions(box: BBox): { dx: number; dy: number; dz: number } {
  const b = normalizeBBox(box);
  return {
    dx: b.max.x - b.min.x + 1,
    dy: b.max.y - b.min.y + 1,
    dz: b.max.z - b.min.z + 1,
  };
}

export function bboxVolume(box: BBox): number {
  const { dx, dy, dz } = bboxDimensions(box);
  return dx * dy * dz;
}

export function bboxUnion(a: BBox, b: BBox): BBox {
  const aN = normalizeBBox(a);
  const bN = normalizeBBox(b);
  return {
    min: {
      x: Math.min(aN.min.x, bN.min.x),
      y: Math.min(aN.min.y, bN.min.y),
      z: Math.min(aN.min.z, bN.min.z),
    },
    max: {
      x: Math.max(aN.max.x, bN.max.x),
      y: Math.max(aN.max.y, bN.max.y),
      z: Math.max(aN.max.z, bN.max.z),
    },
  };
}

export function bboxContains(box: BBox, point: Vec3i): boolean {
  const b = normalizeBBox(box);
  return (
    point.x >= b.min.x &&
    point.x <= b.max.x &&
    point.y >= b.min.y &&
    point.y <= b.max.y &&
    point.z >= b.min.z &&
    point.z <= b.max.z
  );
}

export function bboxContainsBox(outer: BBox, inner: BBox): boolean {
  const o = normalizeBBox(outer);
  const i = normalizeBBox(inner);
  return (
    i.min.x >= o.min.x &&
    i.max.x <= o.max.x &&
    i.min.y >= o.min.y &&
    i.max.y <= o.max.y &&
    i.min.z >= o.min.z &&
    i.max.z <= o.max.z
  );
}

export function bboxIterate(
  box: BBox,
  visit: (pos: Vec3i) => void,
): void {
  const b = normalizeBBox(box);
  for (let x = b.min.x; x <= b.max.x; x += 1) {
    for (let y = b.min.y; y <= b.max.y; y += 1) {
      for (let z = b.min.z; z <= b.max.z; z += 1) {
        visit({ x, y, z });
      }
    }
  }
}

export function addVec(a: Vec3i, b: Vec3i): Vec3i {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subVec(a: Vec3i, b: Vec3i): Vec3i {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

