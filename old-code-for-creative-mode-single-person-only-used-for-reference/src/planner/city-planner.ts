import { Vec3i, BBox, normalizeBBox, bboxDimensions, addVec } from '../types/geometry.js';
import { BlueprintOp } from '../types/blueprint.js';
import { StylePack, STYLE_PACKS, getRecommendedDimensions } from '../styles/style-packs.js';
import { StructureRecord, StructureType, WorldIndex, ZoningRule } from '../store/world-index.js';
import { makeId } from '../lib/ids.js';

export type PlotSize = 'small' | 'medium' | 'large';
export type PlotType = 'residential' | 'commercial' | 'landmark' | 'park' | 'infrastructure';

export type Plot = Readonly<{
  plotId: string;
  bbox: BBox;
  type: PlotType;
  size: PlotSize;
  facing: 'north' | 'south' | 'east' | 'west';
  districtId?: string;
  reserved: boolean;
  structureId?: string;
}>;

export type RoadSegment = Readonly<{
  start: Vec3i;
  end: Vec3i;
  width: number;
  type: 'main' | 'secondary' | 'alley';
}>;

export type CityPlan = Readonly<{
  planId: string;
  name: string;
  bounds: BBox;
  districts: Array<{
    name: string;
    bbox: BBox;
    style: string;
    plotTypes: PlotType[];
  }>;
  roads: RoadSegment[];
  plots: Plot[];
  landmarks: Vec3i[];
  createdAt: string;
}>;

export type GridLayoutOptions = {
  bounds: BBox;
  roadWidth: number;
  blockSize: number; // Size of each city block (between roads)
  mainRoadSpacing: number; // How many blocks between main roads
};

export type DistrictLayoutOptions = {
  name: string;
  style: string;
  bounds: BBox;
  density: 'low' | 'medium' | 'high';
  plotTypes: PlotType[];
};

// Generate a grid-based city layout
export function generateGridLayout(options: GridLayoutOptions): { roads: RoadSegment[]; blocks: BBox[] } {
  const { bounds, roadWidth, blockSize, mainRoadSpacing } = options;
  const roads: RoadSegment[] = [];
  const blocks: BBox[] = [];

  const { dx, dz } = bboxDimensions(bounds);
  const startX = bounds.min.x;
  const startZ = bounds.min.z;
  const y = bounds.min.y;

  // Generate east-west roads
  let roadIdx = 0;
  for (let z = startZ; z <= bounds.max.z; z += blockSize + roadWidth) {
    const isMain = roadIdx % mainRoadSpacing === 0;
    roads.push({
      start: { x: startX, y, z },
      end: { x: bounds.max.x, y, z },
      width: isMain ? roadWidth + 2 : roadWidth,
      type: isMain ? 'main' : 'secondary',
    });
    roadIdx++;
  }

  // Generate north-south roads
  roadIdx = 0;
  for (let x = startX; x <= bounds.max.x; x += blockSize + roadWidth) {
    const isMain = roadIdx % mainRoadSpacing === 0;
    roads.push({
      start: { x, y, z: startZ },
      end: { x, y, z: bounds.max.z },
      width: isMain ? roadWidth + 2 : roadWidth,
      type: isMain ? 'main' : 'secondary',
    });
    roadIdx++;
  }

  // Generate blocks (areas between roads)
  for (let x = startX + roadWidth; x < bounds.max.x - blockSize; x += blockSize + roadWidth) {
    for (let z = startZ + roadWidth; z < bounds.max.z - blockSize; z += blockSize + roadWidth) {
      blocks.push(normalizeBBox({
        min: { x, y, z },
        max: { x: x + blockSize - 1, y: bounds.max.y, z: z + blockSize - 1 },
      }));
    }
  }

  return { roads, blocks };
}

// Subdivide a block into plots
export function subdividePlots(
  block: BBox,
  plotTypes: PlotType[],
  stylePack: StylePack,
): Plot[] {
  if (plotTypes.length === 0) return [];
  
  const plots: Plot[] = [];
  const { dx, dz } = bboxDimensions(block);
  const dims = getRecommendedDimensions(stylePack);

  // Simple subdivision: try to fit as many plots as possible
  const plotWidth = dims.width + 2; // +2 for spacing
  const plotDepth = dims.depth + 2;

  const plotsX = Math.floor(dx / plotWidth);
  const plotsZ = Math.floor(dz / plotDepth);

  const facings = ['north', 'south', 'east', 'west'] as const;
  let plotIdx = 0;

  for (let ix = 0; ix < plotsX; ix++) {
    for (let iz = 0; iz < plotsZ; iz++) {
      const minX = block.min.x + ix * plotWidth + 1;
      const minZ = block.min.z + iz * plotDepth + 1;

      const plotBbox = normalizeBBox({
        min: { x: minX, y: block.min.y, z: minZ },
        max: { x: minX + dims.width - 1, y: block.min.y + dims.height - 1, z: minZ + dims.depth - 1 },
      });

      const size: PlotSize = dims.width <= 8 ? 'small' : dims.width <= 12 ? 'medium' : 'large';
      const facing = facings[plotIdx % 4] as typeof facings[number];
      const plotType = plotTypes[plotIdx % plotTypes.length] as PlotType;

      plots.push({
        plotId: makeId('plot'),
        bbox: plotBbox,
        type: plotType,
        size,
        facing,
        reserved: false,
      });

      plotIdx++;
    }
  }

  return plots;
}

// Generate a complete city plan
export function generateCityPlan(
  name: string,
  bounds: BBox,
  districts: DistrictLayoutOptions[],
): CityPlan {
  const planId = makeId('plan');
  const allRoads: RoadSegment[] = [];
  const allPlots: Plot[] = [];
  const districtRecords: CityPlan['districts'] = [];
  const landmarks: Vec3i[] = [];

  // Main grid layout
  const gridResult = generateGridLayout({
    bounds,
    roadWidth: 4,
    blockSize: 32,
    mainRoadSpacing: 3,
  });

  allRoads.push(...gridResult.roads);

  // Default style pack for fallback
  const defaultStyle = STYLE_PACKS.modern!;

  // Process each district
  for (const districtOpt of districts) {
    const stylePack = STYLE_PACKS[districtOpt.style.toLowerCase()] ?? defaultStyle;

    // Find blocks that fall within this district
    const districtBlocks = gridResult.blocks.filter(block =>
      block.min.x >= districtOpt.bounds.min.x &&
      block.max.x <= districtOpt.bounds.max.x &&
      block.min.z >= districtOpt.bounds.min.z &&
      block.max.z <= districtOpt.bounds.max.z
    );

    // Subdivide blocks into plots
    for (const block of districtBlocks) {
      const plots = subdividePlots(block, districtOpt.plotTypes, stylePack);
      for (const plot of plots) {
        allPlots.push({ ...plot, districtId: districtOpt.name });
      }
    }

    districtRecords.push({
      name: districtOpt.name,
      bbox: districtOpt.bounds,
      style: districtOpt.style,
      plotTypes: districtOpt.plotTypes,
    });

    // Place landmark at district center
    const centerX = Math.floor((districtOpt.bounds.min.x + districtOpt.bounds.max.x) / 2);
    const centerZ = Math.floor((districtOpt.bounds.min.z + districtOpt.bounds.max.z) / 2);
    landmarks.push({ x: centerX, y: districtOpt.bounds.min.y, z: centerZ });
  }

  return {
    planId,
    name,
    bounds,
    districts: districtRecords,
    roads: allRoads,
    plots: allPlots,
    landmarks,
    createdAt: new Date().toISOString(),
  };
}

// Find an available plot for a new structure
export function findAvailablePlot(
  plan: CityPlan,
  requirements: {
    type?: PlotType;
    size?: PlotSize;
    districtId?: string;
  },
): Plot | undefined {
  return plan.plots.find(plot => {
    if (plot.reserved || plot.structureId) return false;
    if (requirements.type && plot.type !== requirements.type) return false;
    if (requirements.size && plot.size !== requirements.size) return false;
    if (requirements.districtId && plot.districtId !== requirements.districtId) return false;
    return true;
  });
}

// Generate road blueprint ops from road segments
export function generateRoadOps(
  segments: RoadSegment[],
  stylePack: StylePack,
): BlueprintOp[] {
  const ops: BlueprintOp[] = [];

  for (const segment of segments) {
    ops.push({
      op: 'road',
      path: [segment.start, segment.end],
      width: segment.width,
      material: { name: stylePack.palette.path ?? 'minecraft:cobblestone' },
      edgeMaterial: segment.type === 'main' ? { name: stylePack.palette.trim ?? 'minecraft:stone_bricks' } : undefined,
    });

    // Add lampposts along main roads
    if (segment.type === 'main') {
      const dx = segment.end.x - segment.start.x;
      const dz = segment.end.z - segment.start.z;
      const length = Math.max(Math.abs(dx), Math.abs(dz));
      const spacing = stylePack.lamppostSpacing;

      for (let i = 0; i < length; i += spacing) {
        const ratio = i / length;
        const lampPos: Vec3i = {
          x: Math.round(segment.start.x + dx * ratio + segment.width / 2 + 1),
          y: segment.start.y,
          z: Math.round(segment.start.z + dz * ratio),
        };

        ops.push({
          op: 'lamppost',
          at: lampPos,
          height: 5,
          material: { name: stylePack.palette.fence ?? 'minecraft:oak_fence' },
          lightBlock: { name: stylePack.palette.light ?? 'minecraft:lantern' },
        });
      }
    }
  }

  return ops;
}

// Generate a simple house blueprint for a plot
export function generateHouseBlueprint(
  plot: Plot,
  stylePack: StylePack,
): BlueprintOp[] {
  const { dx, dy, dz } = bboxDimensions(plot.bbox);
  const ops: BlueprintOp[] = [];

  const origin: Vec3i = { x: 0, y: 0, z: 0 };
  const dims = { x: dx, y: dy, z: dz };

  // Foundation
  ops.push({
    op: 'foundation',
    rect: { min: origin, max: { x: dims.x, y: 0, z: dims.z } },
    material: { bind: 'foundation' in stylePack.palette ? 'foundation' : 'wall' },
    height: 1,
  });

  // Walls (hollow box)
  ops.push({
    op: 'hollowBox',
    from: { x: 0, y: 1, z: 0 },
    to: { x: dims.x, y: dims.y - 2, z: dims.z },
    wall: { bind: 'wall' },
    trim: stylePack.trimEnabled ? { bind: 'trim' } : undefined,
  });

  // Windows
  const windowY = Math.floor(dims.y / 2);
  ops.push({
    op: 'windowRow',
    wall: { min: { x: 0, y: 0, z: 0 }, max: { x: dims.x, y: 0, z: 0 } },
    y: windowY,
    every: stylePack.windowSpacing,
    block: { bind: 'glass' },
  });

  // Door
  const doorX = Math.floor(dims.x / 2);
  const doorZ = plot.facing === 'north' ? 0 : plot.facing === 'south' ? dims.z : Math.floor(dims.z / 2);
  ops.push({
    op: 'door',
    at: { x: doorX, y: 1, z: doorZ },
    facing: plot.facing,
    material: { bind: 'door' },
  });

  // Roof
  if (stylePack.roofStyle === 'gable') {
    ops.push({
      op: 'gableRoof',
      bbox: { min: { x: -1, y: dims.y - 1, z: -1 }, max: { x: dims.x + 1, y: dims.y + 3, z: dims.z + 1 } },
      overhang: stylePack.overhangDepth,
      block: { bind: 'roof' },
    });
  } else if (stylePack.roofStyle === 'hip') {
    ops.push({
      op: 'hipRoof',
      bbox: { min: { x: -1, y: dims.y - 1, z: -1 }, max: { x: dims.x + 1, y: dims.y + 2, z: dims.z + 1 } },
      overhang: stylePack.overhangDepth,
      block: { bind: 'roof' },
    });
  } else {
    ops.push({
      op: 'flatRoof',
      bbox: { min: { x: 0, y: dims.y - 1, z: 0 }, max: { x: dims.x, y: dims.y - 1, z: dims.z } },
      block: { bind: 'roof' },
      trim: { bind: 'trim' },
    });
  }

  return ops;
}

// Generate a tower/landmark blueprint
export function generateTowerBlueprint(
  center: Vec3i,
  height: number,
  stylePack: StylePack,
): BlueprintOp[] {
  const ops: BlueprintOp[] = [];
  const radius = 4;

  // Base
  ops.push({
    op: 'fillCuboid',
    from: { x: -radius, y: 0, z: -radius },
    to: { x: radius, y: 2, z: radius },
    block: { bind: 'wall' },
  });

  // Tower shaft (hollow)
  ops.push({
    op: 'hollowBox',
    from: { x: -radius + 1, y: 3, z: -radius + 1 },
    to: { x: radius - 1, y: height - 4, z: radius - 1 },
    wall: { bind: 'wall' },
    trim: { bind: 'trim' },
  });

  // Top platform
  ops.push({
    op: 'fillCuboid',
    from: { x: -radius, y: height - 3, z: -radius },
    to: { x: radius, y: height - 2, z: radius },
    block: { bind: 'trim' },
  });

  // Balcony at top
  ops.push({
    op: 'balcony',
    bbox: { min: { x: -radius - 1, y: height - 2, z: -radius - 1 }, max: { x: radius + 1, y: height - 1, z: radius + 1 } },
    railMaterial: { bind: 'fence' },
  });

  // Light at very top
  ops.push({
    op: 'lamppost',
    at: { x: 0, y: height - 1, z: 0 },
    height: 3,
    material: { bind: 'accent' },
    lightBlock: { bind: 'light' },
  });

  return ops;
}

// Calculate spacing requirements between structures
export function calculateSpacing(
  existingStructures: StructureRecord[],
  proposedBbox: BBox,
  minSpacing: number,
): { valid: boolean; nearestDistance: number; conflicts: string[] } {
  const conflicts: string[] = [];
  let nearestDistance = Infinity;

  const proposedCenter: Vec3i = {
    x: Math.floor((proposedBbox.min.x + proposedBbox.max.x) / 2),
    y: Math.floor((proposedBbox.min.y + proposedBbox.max.y) / 2),
    z: Math.floor((proposedBbox.min.z + proposedBbox.max.z) / 2),
  };

  for (const structure of existingStructures) {
    const existingCenter: Vec3i = {
      x: Math.floor((structure.bbox.min.x + structure.bbox.max.x) / 2),
      y: Math.floor((structure.bbox.min.y + structure.bbox.max.y) / 2),
      z: Math.floor((structure.bbox.min.z + structure.bbox.max.z) / 2),
    };

    const distance = Math.sqrt(
      (proposedCenter.x - existingCenter.x) ** 2 +
      (proposedCenter.z - existingCenter.z) ** 2
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
    }

    if (distance < minSpacing) {
      conflicts.push(`${structure.name} (${Math.round(distance)}m away)`);
    }
  }

  return {
    valid: conflicts.length === 0,
    nearestDistance,
    conflicts,
  };
}
