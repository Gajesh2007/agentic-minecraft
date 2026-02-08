import { z } from 'zod';
import { tool } from 'ai';
import { BotRunner } from '../bot-runner.js';
import { 
  SemanticLocation, 
  FacingDirection, 
  resolveLocation, 
  resolveFacing,
  describeLocation,
  ResolutionContext 
} from './semantic-location.js';
import { Vec3i, BBox } from '../types/geometry.js';
import { BlueprintOp } from '../types/blueprint.js';
import { getStylePack, STYLE_PACKS } from '../styles/style-packs.js';

// === Schema Definitions ===

const semanticLocationSchema = z.union([
  z.object({ ref: z.literal('plot'), plotId: z.string() }),
  z.object({ ref: z.literal('structure'), name: z.string() }),
  z.object({ ref: z.literal('district'), name: z.string() }),
  z.object({ ref: z.literal('landmark'), name: z.string() }),
  z.object({ 
    ref: z.literal('relative'), 
    anchor: z.string(), 
    direction: z.enum(['north', 'south', 'east', 'west']),
    distance: z.enum(['adjacent', 'nearby', 'far']).optional(),
  }),
  z.object({ ref: z.literal('here') }),
]);

const facingSchema = z.union([
  z.object({ toward: z.literal('road') }),
  z.object({ toward: z.literal('center') }),
  z.object({ toward: z.literal('landmark'), name: z.string() }),
  z.object({ toward: z.literal('structure'), name: z.string() }),
  z.object({ compass: z.enum(['north', 'south', 'east', 'west']) }),
]);

// === Build Semantic Tools ===

export function buildSemanticTools(botRunner: BotRunner) {
  const getResolutionContext = (): ResolutionContext => {
    const status = botRunner.getStatus();
    const pos = status.bot.position ?? { x: 0, y: 64, z: 0 };
    return {
      botPosition: { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) },
      worldIndex: (botRunner as any).worldIndex, // Access internal
      cityPlan: botRunner.getActiveCityPlan(),
    };
  };

  return {
    // === Navigation ===
    
    look_around: tool({
      description: 'Describe your current surroundings - what structures are nearby in each direction',
      inputSchema: z.object({}),
      execute: async () => {
        const ctx = getResolutionContext();
        return {
          description: describeLocation(ctx.botPosition, ctx),
          position: ctx.botPosition,
        };
      },
    }),

    goto: tool({
      description: 'Move to a location using semantic reference',
      inputSchema: z.object({
        location: semanticLocationSchema,
      }),
      execute: async (input) => {
        const ctx = getResolutionContext();
        const resolved = resolveLocation(input.location as SemanticLocation, ctx);
        if (!resolved) {
          return { error: `Could not find location: ${JSON.stringify(input.location)}` };
        }
        await botRunner.teleport(resolved.position);
        return { 
          success: true, 
          arrived_at: describeLocation(resolved.position, ctx),
        };
      },
    }),

    // === Building (Easy Mode) ===

    build_house: tool({
      description: 'Build a house at a semantic location with automatic style matching',
      inputSchema: z.object({
        name: z.string().describe('Name for the house, e.g., "Oak Cottage"'),
        location: semanticLocationSchema,
        facing: facingSchema.optional(),
        style: z.string().optional().describe('Style family (medieval, modern, etc.) or "match_neighbors"'),
        size: z.enum(['small', 'medium', 'large']).optional(),
      }),
      execute: async (input) => {
        const ctx = getResolutionContext();
        const resolved = resolveLocation(input.location as SemanticLocation, ctx);
        if (!resolved) {
          return { error: `Could not find location: ${JSON.stringify(input.location)}` };
        }

        // Determine style
        let styleFamily = input.style ?? 'modern';
        if (styleFamily === 'match_neighbors') {
          const district = ctx.worldIndex.findDistrictAt(resolved.position);
          styleFamily = district?.style.family ?? 'modern';
        }
        const stylePack = getStylePack(styleFamily) ?? STYLE_PACKS.modern!;

        // Determine facing
        const facing = input.facing 
          ? resolveFacing(input.facing as FacingDirection, resolved.position, ctx)
          : 'south';

        // Generate dimensions based on size
        const dims = getSizeForHouse(input.size ?? 'medium', stylePack);

        // Build the blueprint ops
        const ops = generateHouseOps(resolved.position, dims, facing, stylePack);

        // Create and build
        const blueprint = botRunner.createBlueprint({
          name: input.name,
          origin: resolved.position,
          palette: stylePack.palette,
          style: { family: styleFamily, tags: ['house', 'residential'] },
          ops,
        });

        const budgets = botRunner.getStatus().budgets;
        const job = botRunner.buildFromBlueprint(blueprint.blueprintId, budgets);

        return {
          success: true,
          building: input.name,
          location: describeLocation(resolved.position, ctx),
          style: styleFamily,
          facing,
          jobId: job.jobId,
          blueprintId: blueprint.blueprintId,
        };
      },
    }),

    build_road: tool({
      description: 'Build a road between two semantic locations',
      inputSchema: z.object({
        from: semanticLocationSchema,
        to: semanticLocationSchema,
        style: z.string().optional(),
        width: z.number().int().min(3).max(7).optional(),
      }),
      execute: async (input) => {
        const ctx = getResolutionContext();
        const fromResolved = resolveLocation(input.from as SemanticLocation, ctx);
        const toResolved = resolveLocation(input.to as SemanticLocation, ctx);
        
        if (!fromResolved) return { error: `Could not find 'from' location` };
        if (!toResolved) return { error: `Could not find 'to' location` };

        const stylePack = getStylePack(input.style ?? 'medieval') ?? STYLE_PACKS.medieval!;
        const width = input.width ?? stylePack.roadWidth;

        const ops: BlueprintOp[] = [{
          op: 'road',
          path: [
            { x: 0, y: 0, z: 0 },
            { 
              x: toResolved.position.x - fromResolved.position.x,
              y: 0,
              z: toResolved.position.z - fromResolved.position.z,
            },
          ],
          width,
          material: { name: stylePack.palette.path ?? 'minecraft:cobblestone' },
        }];

        const blueprint = botRunner.createBlueprint({
          name: `Road`,
          origin: fromResolved.position,
          palette: stylePack.palette,
          style: { family: input.style ?? 'medieval', tags: ['road', 'infrastructure'] },
          ops,
        });

        const budgets = botRunner.getStatus().budgets;
        const job = botRunner.buildFromBlueprint(blueprint.blueprintId, budgets);

        return {
          success: true,
          from: describeLocation(fromResolved.position, ctx),
          to: describeLocation(toResolved.position, ctx),
          jobId: job.jobId,
        };
      },
    }),

    // === Query Tools ===

    find_plot: tool({
      description: 'Find an available plot matching criteria',
      inputSchema: z.object({
        type: z.enum(['residential', 'commercial', 'landmark', 'park', 'infrastructure']).optional(),
        size: z.enum(['small', 'medium', 'large']).optional(),
        near: semanticLocationSchema.optional(),
      }),
      execute: async (input) => {
        const plot = botRunner.findAvailablePlot({
          type: input.type,
          size: input.size,
        });

        if (!plot) {
          return { error: 'No available plot matching criteria' };
        }

        return {
          plotId: plot.plotId,
          type: plot.type,
          size: plot.size,
          facing: plot.facing,
          description: `${plot.size} ${plot.type} plot facing ${plot.facing}`,
        };
      },
    }),

    get_coordinates: tool({
      description: 'HARD MODE: Get exact coordinates for a semantic location',
      inputSchema: z.object({
        location: semanticLocationSchema,
      }),
      execute: async (input) => {
        const ctx = getResolutionContext();
        const resolved = resolveLocation(input.location as SemanticLocation, ctx);
        if (!resolved) {
          return { error: `Could not find location` };
        }
        return {
          position: resolved.position,
          bbox: resolved.bbox,
          note: 'Use these coordinates only if you need precise control',
        };
      },
    }),

    // === Refinement ===

    critique_structure: tool({
      description: 'Get aesthetic feedback on a built structure',
      inputSchema: z.object({
        target: z.union([
          z.object({ name: z.string() }),
          z.object({ last_built: z.literal(true) }),
        ]),
      }),
      execute: async (input) => {
        const ctx = getResolutionContext();
        const all = ctx.worldIndex.listStructures();
        let structure;

        const target = input.target;
        if ('last_built' in target && target.last_built === true) {
          structure = all.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
        } else if ('name' in target) {
          const targetName = target.name;
          structure = all.find(s => 
            s.name.toLowerCase() === targetName.toLowerCase()
          );
        }

        if (!structure) {
          return { error: 'Structure not found' };
        }

        if (!structure.blueprintId) {
          return { error: 'Structure has no associated blueprint' };
        }

        const result = await botRunner.critiqueStructure(
          structure.blueprintId,
          structure.bbox,
        );

        return {
          structure: structure.name,
          score: result.feedback.scores.overall,
          observations: result.feedback.observations,
          suggestions: result.feedback.suggestions,
          imageUrls: result.imageUrls,
        };
      },
    }),
  };
}

// === Helper Functions ===

function getSizeForHouse(
  size: 'small' | 'medium' | 'large',
  stylePack: ReturnType<typeof getStylePack> & {},
): { width: number; depth: number; height: number } {
  const ranges = {
    small: { w: stylePack.widthRange.min, d: stylePack.depthRange.min, h: stylePack.heightRange.min },
    medium: { 
      w: Math.floor((stylePack.widthRange.min + stylePack.widthRange.max) / 2),
      d: Math.floor((stylePack.depthRange.min + stylePack.depthRange.max) / 2),
      h: Math.floor((stylePack.heightRange.min + stylePack.heightRange.max) / 2),
    },
    large: { w: stylePack.widthRange.max, d: stylePack.depthRange.max, h: stylePack.heightRange.max },
  };
  const r = ranges[size];
  return { width: r.w, depth: r.d, height: r.h };
}

function generateHouseOps(
  origin: Vec3i,
  dims: { width: number; depth: number; height: number },
  facing: 'north' | 'south' | 'east' | 'west',
  stylePack: ReturnType<typeof getStylePack> & {},
): BlueprintOp[] {
  const ops: BlueprintOp[] = [];
  const { width, depth, height } = dims;

  // Foundation
  ops.push({
    op: 'foundation',
    rect: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: width - 1, y: 0, z: depth - 1 },
    },
    material: { name: stylePack.palette.foundation ?? stylePack.palette.wall ?? 'minecraft:cobblestone' },
  });

  // Walls
  ops.push({
    op: 'hollowBox',
    from: { x: 0, y: 1, z: 0 },
    to: { x: width - 1, y: height - 1, z: depth - 1 },
    wall: { name: stylePack.palette.wall ?? 'minecraft:white_terracotta' },
    trim: stylePack.trimEnabled ? { name: stylePack.palette.trim ?? 'minecraft:dark_oak_planks' } : undefined,
  });

  // Windows on front wall
  const frontZ = facing === 'south' ? 0 : facing === 'north' ? depth - 1 : Math.floor(depth / 2);
  ops.push({
    op: 'windowRow',
    wall: {
      min: { x: 0, y: 2, z: frontZ },
      max: { x: width - 1, y: height - 2, z: frontZ },
    },
    y: Math.floor(height / 2),
    every: stylePack.windowSpacing,
    block: { name: stylePack.palette.glass ?? 'minecraft:glass_pane' },
  });

  // Door
  const doorX = Math.floor(width / 2);
  const doorZ = facing === 'south' ? 0 : facing === 'north' ? depth - 1 : 0;
  ops.push({
    op: 'door',
    at: { x: doorX, y: 1, z: doorZ },
    facing,
    material: { name: stylePack.palette.door ?? 'minecraft:oak_door' },
  });

  // Roof
  const roofOp = stylePack.roofStyle;
  ops.push({
    op: roofOp === 'gable' ? 'gableRoof' : roofOp === 'hip' ? 'hipRoof' : 'flatRoof',
    bbox: {
      min: { x: -stylePack.overhangDepth, y: height, z: -stylePack.overhangDepth },
      max: { x: width - 1 + stylePack.overhangDepth, y: height + Math.ceil(width / 2), z: depth - 1 + stylePack.overhangDepth },
    },
    overhang: stylePack.overhangDepth,
    block: { name: stylePack.palette.roof ?? 'minecraft:dark_oak_stairs' },
  } as BlueprintOp);

  return ops;
}
