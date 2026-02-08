import { generateText, tool } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { BlueprintOp } from '../types/blueprint.js';
import { BBox, Vec3i } from '../types/geometry.js';
import { StylePack } from '../styles/style-packs.js';

export type CriticScore = Readonly<{
  overall: number; // 0-10
  silhouette: number; // roofline, height variation
  rhythm: number; // window spacing, repetition
  depth: number; // facade breakup, layering
  proportion: number; // width/height/depth ratios
  paletteHarmony: number; // color consistency
  detail: number; // trim, texture variety
  context: number; // fits with surroundings
}>;

export type CriticFeedback = Readonly<{
  scores: CriticScore;
  observations: string[];
  suggestions: string[];
  patchOps: BlueprintOp[];
  confidence: number; // 0-1, how confident the critic is
}>;

export type CriticContext = Readonly<{
  stylePack?: StylePack;
  structureName?: string;
  structureType?: string;
  bbox: BBox;
  neighboringStyles?: string[];
}>;

const criticRubric = `
You are an architectural critic evaluating Minecraft builds. Score each dimension 0-10:

SILHOUETTE (0-10): Is the roofline interesting? Does height vary appropriately?
- 0-3: Flat, boring roofline
- 4-6: Some variation but predictable
- 7-10: Dynamic, visually interesting profile

RHYTHM (0-10): Do windows/elements have pleasing repetition and spacing?
- 0-3: Random or no pattern
- 4-6: Basic repetition present
- 7-10: Musical rhythm, intentional variation

DEPTH (0-10): Does the facade have layers and visual interest?
- 0-3: Flat wall, no depth
- 4-6: Some recesses or projections
- 7-10: Rich layering, shadow play

PROPORTION (0-10): Are width/height/depth ratios pleasing?
- 0-3: Awkward, stretched or compressed
- 4-6: Acceptable but unremarkable
- 7-10: Golden ratio vibes, feels "right"

PALETTE_HARMONY (0-10): Do materials work well together?
- 0-3: Clashing colors/textures
- 4-6: Safe but uninspired
- 7-10: Cohesive, intentional material story

DETAIL (0-10): Is there appropriate trim, texture variety?
- 0-3: No detail, plain surfaces
- 4-6: Some trim or variation
- 7-10: Rich detail without being noisy

CONTEXT (0-10): Does it fit the environment/style?
- 0-3: Completely out of place
- 4-6: Neutral, doesn't clash
- 7-10: Perfect contextual fit
`;

const patchSuggestionSchema = z.object({
  scores: z.object({
    overall: z.number().min(0).max(10),
    silhouette: z.number().min(0).max(10),
    rhythm: z.number().min(0).max(10),
    depth: z.number().min(0).max(10),
    proportion: z.number().min(0).max(10),
    paletteHarmony: z.number().min(0).max(10),
    detail: z.number().min(0).max(10),
    context: z.number().min(0).max(10),
  }),
  observations: z.array(z.string()),
  suggestions: z.array(z.string()),
  patchOps: z.array(z.object({
    op: z.string(),
    description: z.string(),
    params: z.record(z.string(), z.unknown()),
  })),
  confidence: z.number().min(0).max(1),
});

export async function critiqueStructure(
  imagePaths: string[],
  context: CriticContext,
  aiModel: string,
): Promise<CriticFeedback> {
  // Read images and convert to base64
  const imageContents = await Promise.all(
    imagePaths.map(async path => {
      const buffer = await readFile(path);
      const base64 = buffer.toString('base64');
      const mimeType = path.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return { type: 'image' as const, image: `data:${mimeType};base64,${base64}` };
    }),
  );

  const contextDescription = buildContextDescription(context);

  const result = await generateText({
    model: gateway(aiModel),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: criticRubric },
          { type: 'text', text: contextDescription },
          ...imageContents,
          {
            type: 'text',
            text: `
Analyze these screenshots of a Minecraft structure. Provide:
1. Scores for each dimension (0-10)
2. Specific observations about what works and what doesn't
3. Concrete suggestions for improvement
4. Patch operations that could improve the build

For patch operations, suggest specific Minecraft-compatible improvements like:
- Adding trim bands at specific Y levels
- Adding window depth with trapdoors
- Breaking up flat walls with pillars
- Adding roof overhang
- Balconies or facade projections

Return your analysis as a JSON object matching this schema:
{
  "scores": { "overall": 0-10, "silhouette": 0-10, ... },
  "observations": ["observation 1", ...],
  "suggestions": ["suggestion 1", ...],
  "patchOps": [{ "op": "trimBand", "description": "...", "params": {...} }, ...],
  "confidence": 0-1
}
`,
          },
        ],
      },
    ],
  });

  // Parse the response
  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return createDefaultFeedback('Could not parse critic response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const validated = patchSuggestionSchema.safeParse(parsed);

    if (!validated.success) {
      return createDefaultFeedback('Invalid critic response schema');
    }

    // Convert suggested ops to proper BlueprintOps
    const patchOps = convertSuggestedOps(validated.data.patchOps, context.bbox);

    return {
      scores: validated.data.scores,
      observations: validated.data.observations,
      suggestions: validated.data.suggestions,
      patchOps,
      confidence: validated.data.confidence,
    };
  } catch {
    return createDefaultFeedback('Failed to parse critic JSON');
  }
}

function buildContextDescription(context: CriticContext): string {
  const parts: string[] = ['Context for this structure:'];

  if (context.structureName) {
    parts.push(`Name: ${context.structureName}`);
  }
  if (context.structureType) {
    parts.push(`Type: ${context.structureType}`);
  }
  if (context.stylePack) {
    parts.push(`Style: ${context.stylePack.name} (${context.stylePack.description})`);
    parts.push(`Expected features: ${context.stylePack.tags.join(', ')}`);
  }
  if (context.neighboringStyles && context.neighboringStyles.length > 0) {
    parts.push(`Neighboring styles: ${context.neighboringStyles.join(', ')}`);
  }

  const dims = {
    width: context.bbox.max.x - context.bbox.min.x + 1,
    height: context.bbox.max.y - context.bbox.min.y + 1,
    depth: context.bbox.max.z - context.bbox.min.z + 1,
  };
  parts.push(`Dimensions: ${dims.width}x${dims.height}x${dims.depth}`);

  return parts.join('\n');
}

function createDefaultFeedback(error: string): CriticFeedback {
  return {
    scores: {
      overall: 5,
      silhouette: 5,
      rhythm: 5,
      depth: 5,
      proportion: 5,
      paletteHarmony: 5,
      detail: 5,
      context: 5,
    },
    observations: [error],
    suggestions: [],
    patchOps: [],
    confidence: 0,
  };
}

function convertSuggestedOps(
  suggestions: Array<{ op: string; description: string; params: Record<string, unknown> }>,
  bbox: BBox,
): BlueprintOp[] {
  const ops: BlueprintOp[] = [];
  const origin: Vec3i = { x: 0, y: 0, z: 0 };

  for (const s of suggestions) {
    try {
      switch (s.op) {
        case 'trimBand': {
          const y = typeof s.params.y === 'number' ? s.params.y : bbox.max.y;
          const material = typeof s.params.material === 'string' ? s.params.material : 'minecraft:stone_brick_slab';
          ops.push({
            op: 'trimBand',
            bbox: { min: origin, max: { x: bbox.max.x - bbox.min.x, y: y - bbox.min.y, z: bbox.max.z - bbox.min.z } },
            y: y - bbox.min.y,
            material: { name: material },
          });
          break;
        }
        case 'overhang': {
          const depth = typeof s.params.depth === 'number' ? s.params.depth : 1;
          const material = typeof s.params.material === 'string' ? s.params.material : 'minecraft:spruce_slab';
          ops.push({
            op: 'overhang',
            bbox: { min: origin, max: { x: bbox.max.x - bbox.min.x, y: bbox.max.y - bbox.min.y, z: bbox.max.z - bbox.min.z } },
            depth,
            material: { name: material },
          });
          break;
        }
        case 'balcony': {
          const railMaterial = typeof s.params.railMaterial === 'string' ? s.params.railMaterial : 'minecraft:oak_fence';
          const y = typeof s.params.y === 'number' ? s.params.y : Math.floor((bbox.max.y - bbox.min.y) / 2);
          ops.push({
            op: 'balcony',
            bbox: {
              min: { x: 0, y, z: 0 },
              max: { x: bbox.max.x - bbox.min.x, y: y + 1, z: 2 },
            },
            railMaterial: { name: railMaterial },
          });
          break;
        }
        case 'windowRow': {
          const y = typeof s.params.y === 'number' ? s.params.y : Math.floor((bbox.max.y - bbox.min.y) / 2);
          const every = typeof s.params.every === 'number' ? s.params.every : 3;
          const block = typeof s.params.block === 'string' ? s.params.block : 'minecraft:glass_pane';
          ops.push({
            op: 'windowRow',
            wall: { min: { x: 0, y: 0, z: 0 }, max: { x: bbox.max.x - bbox.min.x, y: 0, z: 0 } },
            y: y - bbox.min.y,
            every,
            block: { name: block },
          });
          break;
        }
        case 'pillarLine': {
          const spacing = typeof s.params.spacing === 'number' ? s.params.spacing : 4;
          const material = typeof s.params.material === 'string' ? s.params.material : 'minecraft:oak_log';
          ops.push({
            op: 'pillarLine',
            start: { x: 0, y: 0, z: 0 },
            end: { x: bbox.max.x - bbox.min.x, y: bbox.max.y - bbox.min.y, z: 0 },
            material: { name: material },
            spacing,
          });
          break;
        }
      }
    } catch {
      // Skip invalid ops
    }
  }

  return ops;
}

// Quick scoring without full AI call (heuristic-based)
export function quickScore(
  dimensions: { width: number; height: number; depth: number },
  hasRoof: boolean,
  hasWindows: boolean,
  hasTrim: boolean,
): number {
  let score = 5;

  // Proportion check (golden ratio approximation)
  const aspectRatio = dimensions.width / dimensions.height;
  if (aspectRatio >= 1.4 && aspectRatio <= 1.8) score += 1;

  // Basic features
  if (hasRoof) score += 1.5;
  if (hasWindows) score += 1;
  if (hasTrim) score += 1;

  // Penalize extremes
  if (dimensions.height < 3 || dimensions.height > 20) score -= 1;
  if (dimensions.width < 4 || dimensions.width > 30) score -= 0.5;

  return Math.max(0, Math.min(10, score));
}
