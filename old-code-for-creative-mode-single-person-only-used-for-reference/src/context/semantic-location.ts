import { Vec3i, BBox, normalizeBBox, bboxDimensions } from '../types/geometry.js';
import { WorldIndex, StructureRecord } from '../store/world-index.js';
import { CityPlan, Plot } from '../planner/city-planner.js';

// === Semantic Location Types ===

export type Direction = 'north' | 'south' | 'east' | 'west' | 'above' | 'below';
export type Distance = 'adjacent' | 'nearby' | 'far';

export type SemanticLocation =
  | { ref: 'structure'; name: string }
  | { ref: 'structureId'; structureId: string }
  | { ref: 'district'; name: string }
  | { ref: 'landmark'; name: string }
  | { ref: 'plot'; plotId: string }
  | { ref: 'relative'; anchor: string; direction: Direction; distance?: Distance }
  | { ref: 'here' } // Current bot position
  | { ref: 'absolute'; x: number; y: number; z: number };

export type FacingDirection =
  | { toward: 'road' }
  | { toward: 'landmark'; name: string }
  | { toward: 'structure'; name: string }
  | { toward: 'center' } // District/plaza center
  | { compass: Direction };

// === Resolution Context ===

export type ResolutionContext = {
  botPosition: Vec3i;
  worldIndex: WorldIndex;
  cityPlan: CityPlan | null;
};

// === Resolver ===

export function resolveLocation(
  location: SemanticLocation,
  ctx: ResolutionContext,
): { position: Vec3i; bbox: BBox | null } | null {
  switch (location.ref) {
    case 'here':
      return { position: ctx.botPosition, bbox: null };

    case 'absolute':
      return {
        position: { x: location.x, y: location.y, z: location.z },
        bbox: null,
      };

    case 'structure': {
      const structures = ctx.worldIndex.listStructures();
      const match = structures.find(s => 
        s.name.toLowerCase() === location.name.toLowerCase()
      );
      if (!match) return null;
      return { position: match.anchor, bbox: match.bbox };
    }

    case 'structureId': {
      const structure = ctx.worldIndex.getStructure(location.structureId);
      if (!structure) return null;
      return { position: structure.anchor, bbox: structure.bbox };
    }

    case 'district': {
      const districts = ctx.worldIndex.listDistricts();
      const match = districts.find(d =>
        d.name.toLowerCase() === location.name.toLowerCase()
      );
      if (!match) return null;
      const center: Vec3i = {
        x: Math.floor((match.bbox.min.x + match.bbox.max.x) / 2),
        y: match.bbox.min.y,
        z: Math.floor((match.bbox.min.z + match.bbox.max.z) / 2),
      };
      return { position: center, bbox: match.bbox };
    }

    case 'landmark': {
      const structures = ctx.worldIndex.listStructures({ type: 'landmark' });
      const match = structures.find(s =>
        s.name.toLowerCase() === location.name.toLowerCase()
      );
      if (!match) return null;
      return { position: match.anchor, bbox: match.bbox };
    }

    case 'plot': {
      if (!ctx.cityPlan) return null;
      const plot = ctx.cityPlan.plots.find(p => p.plotId === location.plotId);
      if (!plot) return null;
      return { position: plot.bbox.min, bbox: plot.bbox };
    }

    case 'relative': {
      const anchor = resolveLocation({ ref: 'structure', name: location.anchor }, ctx);
      if (!anchor) return null;
      const offset = getDirectionOffset(location.direction, location.distance ?? 'adjacent');
      const position: Vec3i = {
        x: anchor.position.x + offset.x,
        y: anchor.position.y + offset.y,
        z: anchor.position.z + offset.z,
      };
      return { position, bbox: null };
    }

    default:
      return null;
  }
}

function getDirectionOffset(direction: Direction, distance: Distance): Vec3i {
  const dist = distance === 'adjacent' ? 5 : distance === 'nearby' ? 15 : 30;
  
  switch (direction) {
    case 'north': return { x: 0, y: 0, z: -dist };
    case 'south': return { x: 0, y: 0, z: dist };
    case 'east': return { x: dist, y: 0, z: 0 };
    case 'west': return { x: -dist, y: 0, z: 0 };
    case 'above': return { x: 0, y: dist, z: 0 };
    case 'below': return { x: 0, y: -dist, z: 0 };
  }
}

// === Facing Resolver ===

export function resolveFacing(
  facing: FacingDirection,
  fromPosition: Vec3i,
  ctx: ResolutionContext,
): 'north' | 'south' | 'east' | 'west' {
  if ('compass' in facing) {
    if (facing.compass === 'above' || facing.compass === 'below') return 'south';
    return facing.compass;
  }

  let targetPosition: Vec3i | null = null;

  if (facing.toward === 'road') {
    // Find nearest road
    const roads = ctx.worldIndex.listStructures({ type: 'road' });
    if (roads.length > 0) {
      const nearest = findNearest(fromPosition, roads);
      if (nearest) {
        targetPosition = {
          x: (nearest.bbox.min.x + nearest.bbox.max.x) / 2,
          y: fromPosition.y,
          z: (nearest.bbox.min.z + nearest.bbox.max.z) / 2,
        };
      }
    }
  } else if (facing.toward === 'center') {
    const district = ctx.worldIndex.findDistrictAt(fromPosition);
    if (district) {
      targetPosition = {
        x: (district.bbox.min.x + district.bbox.max.x) / 2,
        y: fromPosition.y,
        z: (district.bbox.min.z + district.bbox.max.z) / 2,
      };
    }
  } else if (facing.toward === 'landmark' || facing.toward === 'structure') {
    const resolved = resolveLocation({ ref: 'structure', name: facing.name }, ctx);
    if (resolved) {
      targetPosition = resolved.position;
    }
  }

  if (!targetPosition) return 'south'; // Default

  return getDirectionToward(fromPosition, targetPosition);
}

function getDirectionToward(from: Vec3i, to: Vec3i): 'north' | 'south' | 'east' | 'west' {
  const dx = to.x - from.x;
  const dz = to.z - from.z;

  if (Math.abs(dx) > Math.abs(dz)) {
    return dx > 0 ? 'east' : 'west';
  } else {
    return dz > 0 ? 'south' : 'north';
  }
}

function findNearest(point: Vec3i, structures: StructureRecord[]): StructureRecord | null {
  let nearest: StructureRecord | null = null;
  let minDist = Infinity;

  for (const s of structures) {
    const cx = (s.bbox.min.x + s.bbox.max.x) / 2;
    const cz = (s.bbox.min.z + s.bbox.max.z) / 2;
    const dist = Math.sqrt((point.x - cx) ** 2 + (point.z - cz) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = s;
    }
  }

  return nearest;
}

// === Describe Location (for prompts) ===

export function describeLocation(position: Vec3i, ctx: ResolutionContext): string {
  const parts: string[] = [];

  // What district?
  const district = ctx.worldIndex.findDistrictAt(position);
  if (district) {
    parts.push(`in ${district.name} (${district.style.family} style)`);
  }

  // What structure am I at/in?
  const atStructure = ctx.worldIndex.findStructureAt(position);
  if (atStructure) {
    parts.push(`at ${atStructure.name}`);
  }

  // What's nearby in each direction?
  const nearby = ctx.worldIndex.findStructuresNear(position, 50);
  const byDirection = groupByDirection(position, nearby);
  
  for (const [dir, structures] of Object.entries(byDirection)) {
    if (structures.length > 0) {
      const names = structures.slice(0, 2).map(s => s.name).join(', ');
      parts.push(`${dir}: ${names}`);
    }
  }

  if (parts.length === 0) {
    return 'in an empty area';
  }

  return parts.join('; ');
}

function groupByDirection(
  from: Vec3i,
  structures: StructureRecord[],
): Record<string, StructureRecord[]> {
  const result: Record<string, StructureRecord[]> = {
    north: [],
    south: [],
    east: [],
    west: [],
  };

  for (const s of structures) {
    const cx = (s.bbox.min.x + s.bbox.max.x) / 2;
    const cz = (s.bbox.min.z + s.bbox.max.z) / 2;
    const direction = getDirectionToward(from, { x: cx, y: from.y, z: cz });
    const arr = result[direction];
    if (arr) arr.push(s);
  }

  return result;
}
