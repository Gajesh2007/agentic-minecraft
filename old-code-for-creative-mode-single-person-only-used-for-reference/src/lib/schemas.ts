import { z } from 'zod';

export const vec3Schema = z.object({
  x: z.coerce.number().int(),
  y: z.coerce.number().int(),
  z: z.coerce.number().int(),
});

export const bboxSchema = z.object({
  min: vec3Schema,
  max: vec3Schema,
});

export const blockSpecSchema = z
  .object({
    name: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    bind: z.string().min(1).optional(),
  })
  .refine(v => Boolean(v.name || v.state || v.bind), {
    message: 'BlockSpec requires name, state, or bind',
  });

export const paletteSchema = z.record(z.string(), z.string().min(1));

export const styleSchema = z
  .object({
    family: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
  })
  .optional();

// Base op schemas (non-recursive)
const baseOpSchemas = [
  z.object({
    op: z.literal('fillCuboid'),
    from: vec3Schema,
    to: vec3Schema,
    block: blockSpecSchema,
  }),
  z.object({
    op: z.literal('hollowBox'),
    from: vec3Schema,
    to: vec3Schema,
    wall: blockSpecSchema,
    trim: blockSpecSchema.optional(),
  }),
  z.object({
    op: z.literal('replace'),
    from: vec3Schema,
    to: vec3Schema,
    fromBlock: blockSpecSchema,
    toBlock: blockSpecSchema,
  }),
  z.object({
    op: z.literal('foundation'),
    rect: bboxSchema,
    material: blockSpecSchema,
    height: z.coerce.number().int().min(1).optional(),
  }),
  z.object({
    op: z.literal('pillarLine'),
    start: vec3Schema,
    end: vec3Schema,
    material: blockSpecSchema,
    spacing: z.coerce.number().int().min(1),
  }),
  z.object({
    op: z.literal('beam'),
    start: vec3Schema,
    end: vec3Schema,
    material: blockSpecSchema,
  }),
  z.object({
    op: z.literal('windowRow'),
    wall: bboxSchema,
    y: z.coerce.number().int(),
    every: z.coerce.number().int().min(1),
    block: blockSpecSchema,
  }),
  z.object({
    op: z.literal('door'),
    at: vec3Schema,
    facing: z.enum(['north', 'south', 'east', 'west']),
    material: blockSpecSchema,
    hinge: z.enum(['left', 'right']).optional(),
  }),
  z.object({
    op: z.literal('staircase'),
    from: vec3Schema,
    to: vec3Schema,
    material: blockSpecSchema,
    style: z.enum(['straight', 'spiral']),
  }),
  z.object({
    op: z.literal('gableRoof'),
    bbox: bboxSchema,
    overhang: z.coerce.number().int().min(0).optional(),
    block: blockSpecSchema,
  }),
  z.object({
    op: z.literal('hipRoof'),
    bbox: bboxSchema,
    overhang: z.coerce.number().int().min(0).optional(),
    block: blockSpecSchema,
  }),
  z.object({
    op: z.literal('flatRoof'),
    bbox: bboxSchema,
    trim: blockSpecSchema.optional(),
    block: blockSpecSchema,
  }),
  z.object({
    op: z.literal('trimBand'),
    bbox: bboxSchema,
    y: z.coerce.number().int(),
    material: blockSpecSchema,
  }),
  z.object({
    op: z.literal('overhang'),
    bbox: bboxSchema,
    depth: z.coerce.number().int().min(1),
    material: blockSpecSchema,
  }),
  z.object({
    op: z.literal('balcony'),
    bbox: bboxSchema,
    railMaterial: blockSpecSchema,
    floorMaterial: blockSpecSchema.optional(),
  }),
  z.object({
    op: z.literal('arch'),
    opening: bboxSchema,
    material: blockSpecSchema,
  }),
  z.object({
    op: z.literal('road'),
    path: z.array(vec3Schema).min(2),
    width: z.coerce.number().int().min(1).max(16),
    material: blockSpecSchema,
    edgeMaterial: blockSpecSchema.optional(),
  }),
  z.object({
    op: z.literal('lamppost'),
    at: vec3Schema,
    height: z.coerce.number().int().min(1).max(16),
    material: blockSpecSchema,
    lightBlock: blockSpecSchema,
  }),
] as const;

// Use lazy for recursive schemas (repeat, mirror)
const baseOpUnion: z.ZodType = z.discriminatedUnion('op', baseOpSchemas);

export const blueprintOpSchema: z.ZodType = z.lazy(() =>
  z.union([
    baseOpUnion,
    z.object({
      op: z.literal('repeat'),
      innerOp: blueprintOpSchema,
      dx: z.coerce.number().int(),
      dy: z.coerce.number().int(),
      dz: z.coerce.number().int(),
      count: z.coerce.number().int().min(1).max(100),
    }),
    z.object({
      op: z.literal('mirror'),
      innerOp: blueprintOpSchema,
      axis: z.enum(['x', 'z']),
      center: z.coerce.number(),
    }),
  ]),
);

export const createBlueprintSchema = z.object({
  name: z.string().min(1),
  origin: vec3Schema,
  style: styleSchema,
  palette: paletteSchema.optional(),
  ops: z.array(blueprintOpSchema).min(1),
});

export const reviseBlueprintSchema = z.object({
  blueprintId: z.string().min(1),
  patchOps: z.array(blueprintOpSchema).min(1),
});

export const budgetsSchema = z.object({
  maxSeconds: z.coerce.number().int().min(1),
  maxCommands: z.coerce.number().int().min(1),
  maxChangedBlocksUpperBound: z.coerce.number().int().min(1),
});

export const setBudgetsSchema = z.object({
  budgets: budgetsSchema,
});

export const setBuildZoneSchema = z.object({
  buildZone: bboxSchema,
});

export const setAllowlistSchema = z.object({
  allowed: z.array(z.string().min(1)),
  mode: z.enum(['replace', 'add', 'remove', 'clear']).default('replace'),
});

export const ensureLoadedSchema = z.object({
  bbox: bboxSchema,
  strategy: z.enum(['forceload', 'teleport-sweep']).default('teleport-sweep'),
  timeoutMs: z.coerce.number().int().min(1000).max(120000).default(20000),
});

export const localSiteSummarySchema = z.object({
  origin: vec3Schema,
  radius: z.coerce.number().int().min(1).max(512).default(64),
  grid: z.coerce.number().int().min(5).max(129).default(33),
});

export const inspectRegionSchema = z.object({
  bbox: bboxSchema,
  mode: z.enum(['blocks', 'diff', 'heightmap']).default('blocks'),
  encoding: z.enum(['rle-stateId', 'counts', 'hash']).default('rle-stateId'),
});

export const teleportSchema = z.object({
  position: vec3Schema,
  yaw: z.coerce.number().optional(),
  pitch: z.coerce.number().optional(),
});

export const setViewpointSchema = z.object({
  targetBbox: bboxSchema,
  preset: z.enum(['front', 'corner45', 'topdown', 'interior']),
  distance: z.coerce.number().int().min(1).max(256).default(40),
});

export const compileBlueprintSchema = z.object({
  blueprintId: z.string().min(1),
  compiler: z
    .object({
      prefer: z.array(z.enum(['fill', 'clone', 'setblock'])).default(['fill', 'setblock']),
      maxCommandLength: z.coerce.number().int().min(64).max(1024).default(220),
    })
    .default({ prefer: ['fill', 'setblock'], maxCommandLength: 220 }),
  safety: z
    .object({
      enforceBuildZone: z.boolean().default(true),
      enforceAllowlist: z.boolean().default(true),
    })
    .default({ enforceBuildZone: true, enforceAllowlist: true }),
});

export const executeScriptSchema = z.object({
  scriptId: z.string().min(1),
  idempotencyKey: z.string().min(1).optional(),
  budgets: budgetsSchema.optional(),
  recordDiffs: z
    .object({
      mode: z.enum(['per-step', 'per-bbox']).default('per-step'),
      encoding: z.enum(['counts+hash', 'hash']).default('counts+hash'),
    })
    .optional(),
});

export const verifyStructureSchema = z.object({
  blueprintId: z.string().min(1),
  bbox: bboxSchema,
  match: z
    .object({
      mode: z.enum(['stateId']).default('stateId'),
      threshold: z.coerce.number().min(0.0).max(1.0).default(0.98),
    })
    .default({ mode: 'stateId', threshold: 0.98 }),
  residency: ensureLoadedSchema.optional(),
});

export const renderAnglesSchema = z.object({
  targetBbox: bboxSchema,
  presets: z.array(z.enum(['front', 'corner45', 'topdown', 'interior'])).min(1),
  resolution: z
    .object({
      width: z.coerce.number().int().min(64).max(2048).default(768),
      height: z.coerce.number().int().min(64).max(2048).default(768),
    })
    .default({ width: 768, height: 768 }),
  viewDistanceChunks: z.coerce.number().int().min(2).max(32).default(8),
  residency: ensureLoadedSchema.optional(),
});

export const logNoteSchema = z.object({
  text: z.string().min(1),
  tags: z.array(z.string().min(1)).optional(),
});

export type CreateBlueprintInput = z.infer<typeof createBlueprintSchema>;
export type ReviseBlueprintInput = z.infer<typeof reviseBlueprintSchema>;
export type CompileBlueprintInput = z.infer<typeof compileBlueprintSchema>;
export type ExecuteScriptInput = z.infer<typeof executeScriptSchema>;
export type VerifyStructureInput = z.infer<typeof verifyStructureSchema>;
export type RenderAnglesInput = z.infer<typeof renderAnglesSchema>;

