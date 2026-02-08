import { Vec3i, BBox } from '../types/geometry.js';
import { Budgets } from '../types/blueprint.js';
import { WorldIndex, StructureRecord, StructureType } from '../store/world-index.js';
import { EpisodeStore, EpisodeRecord } from '../store/episode-store.js';
import { CityPlan, Plot } from '../planner/city-planner.js';
import { StylePack, getStylePack } from '../styles/style-packs.js';

// === Prompt Pack Types ===

export type PromptPack = {
  surroundings: string;
  history: string;
  constraints: string;
  objectives: string;
  availableActions: string;
};

export type PromptPackContext = {
  botPosition: Vec3i;
  worldIndex: WorldIndex;
  episodeStore: EpisodeStore;
  cityPlan: CityPlan | null;
  budgets: Budgets;
  buildZone: BBox | null;
  currentEpisode: EpisodeRecord | null;
  recentCritiqueFeedback?: { score: number; suggestions: string[] };
};

// === Build Prompt Pack ===

export function buildPromptPack(ctx: PromptPackContext): PromptPack {
  return {
    surroundings: buildSurroundings(ctx),
    history: buildHistory(ctx),
    constraints: buildConstraints(ctx),
    objectives: buildObjectives(ctx),
    availableActions: buildAvailableActions(ctx),
  };
}

// === Surroundings ===

function buildSurroundings(ctx: PromptPackContext): string {
  const { botPosition, worldIndex, cityPlan } = ctx;
  const district = worldIndex.findDistrictAt(botPosition);
  const nearby = worldIndex.findStructuresNear(botPosition, 60);
  const byDir = groupByDirection(botPosition, nearby);

  const districtInfo = district
    ? `You are in: ${district.name} (${district.style.family} district)
Style guide: ${getStyleDescription(district.style.family)}`
    : `You are in: Unzoned area (no style restrictions)`;

  const directions = (['north', 'south', 'east', 'west'] as const)
    .map(dir => {
      const items = byDir[dir] ?? [];
      const desc = items.length > 0
        ? items.slice(0, 3).map(s => `${s.name} (${s.type})`).join(', ')
        : 'Empty';
      return `  ${dir.toUpperCase()}: ${desc}`;
    })
    .join('\n');

  const plotsSection = cityPlan ? buildPlotsSection(botPosition, cityPlan) : '';

  return `
SURROUNDINGS:
${districtInfo}

${directions}
${plotsSection}
`.trim();
}

function buildPlotsSection(pos: Vec3i, cityPlan: CityPlan): string {
  const available = cityPlan.plots.filter(p => !p.reserved);
  const nearbyPlots = available.filter(p => {
    const cx = (p.bbox.min.x + p.bbox.max.x) / 2;
    const cz = (p.bbox.min.z + p.bbox.max.z) / 2;
    return Math.sqrt((pos.x - cx) ** 2 + (pos.z - cz) ** 2) < 100;
  });

  if (nearbyPlots.length === 0) return '';

  const plotList = nearbyPlots
    .slice(0, 5)
    .map(p => `  - ${p.plotId}: ${p.size} ${p.type} plot, facing ${p.facing}`)
    .join('\n');

  return `

AVAILABLE PLOTS NEARBY:
${plotList}`;
}

// === History ===

function buildHistory(ctx: PromptPackContext): string {
  const { worldIndex, recentCritiqueFeedback } = ctx;

  const structures = worldIndex.listStructures();
  const recent = [...structures]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentBuilds = recent.length === 0
    ? 'No structures built yet. This is a fresh start!'
    : recent.map(s => `  - ${relativeTime(s.createdAt)}: Built "${s.name}" (${s.type})`).join('\n');

  const critiqueSection = recentCritiqueFeedback
    ? `

LAST CRITIC FEEDBACK:
  Score: ${recentCritiqueFeedback.score}/10
  Suggestions:
${recentCritiqueFeedback.suggestions.slice(0, 3).map(s => `    - ${s}`).join('\n')}`
    : '';

  return `
RECENT HISTORY:
${recentBuilds}
${critiqueSection}

PATTERNS THAT WORK WELL:
  - 2-block roof overhang looks better than 1
  - Add window depth with trapdoors
  - Break up flat walls with trim bands
  - Vary building heights for interesting skyline
`.trim();
}

// === Constraints ===

function buildConstraints(ctx: PromptPackContext): string {
  const { budgets, buildZone, worldIndex, botPosition } = ctx;

  const inZone = buildZone ? isInBuildZone(botPosition, buildZone) : true;
  const zoneStatus = buildZone
    ? inZone
      ? 'Build zone: You are inside'
      : 'Build zone: You are OUTSIDE - move first!'
    : 'Build zone: No restrictions';

  const rules = worldIndex.getZoningRulesFor(botPosition);
  const zoningSection = rules.length > 0
    ? `

Zoning rules here:
${rules.map(r => `  - ${describeRule(r)}`).join('\n')}`
    : '';

  return `
CONSTRAINTS:
Budget remaining:
  - ${budgets.maxCommands} commands
  - ${budgets.maxChangedBlocksUpperBound} blocks
  - ${budgets.maxSeconds} seconds

${zoneStatus}
${zoningSection}
`.trim();
}

// === Objectives ===

function buildObjectives(ctx: PromptPackContext): string {
  const { currentEpisode, cityPlan } = ctx;

  const episodeObj = currentEpisode?.objective
    ? `Current episode: ${currentEpisode.objective}`
    : 'No active episode objective';

  const citySection = cityPlan
    ? buildCitySection(cityPlan)
    : `
No city plan active. Consider:
  1. Create a city plan to organize the build
  2. Or build individual structures freestyle`;

  return `
OBJECTIVES:
${episodeObj}
${citySection}
`.trim();
}

function buildCitySection(plan: CityPlan): string {
  const total = plan.plots.length;
  const used = plan.plots.filter(p => p.reserved).length;
  const nextPlot = plan.plots.find(p => !p.reserved);

  const suggestion = used === 0
    ? 'SUGGESTED NEXT STEP: Build roads first to establish the grid'
    : nextPlot
      ? `SUGGESTED NEXT STEP: Build on plot ${nextPlot.plotId} (${nextPlot.type})`
      : 'All plots built!';

  return `

City plan "${plan.name}":
  - ${used}/${total} plots built
  - ${plan.roads.length} road segments planned

${suggestion}`;
}

// === Available Actions ===

function buildAvailableActions(_ctx: PromptPackContext): string {
  return `
AVAILABLE ACTIONS:

BUILDING:
  - build_house { location: "plot A3", style: "medieval" }
  - build_tower { location: "next to Town Hall", height: "tall" }
  - build_road { from: "plaza", to: "market district" }

PLANNING:
  - create_city_plan { name: "...", districts: [...] }
  - find_plot { type: "residential", size: "medium" }

REFINEMENT:
  - critique_structure { target: { last_built: true } }
  - beauty_loop { target: "Oak Cottage", threshold: 8 }

EXPLORATION:
  - look_around
  - goto { location: "market district" }

For exact coordinates (hard mode):
  - get_coordinates { location: "plot A3" }
`.trim();
}

// === Full System Prompt ===

export function buildSystemPromptFromPack(pack: PromptPack, mode: string): string {
  return `
You are ClawCraft, an autonomous Minecraft world-building agent.
Mode: ${mode.toUpperCase()}

${pack.surroundings}

${pack.history}

${pack.constraints}

${pack.objectives}

${pack.availableActions}

IMPORTANT RULES:
1. Use semantic locations ("plot A3", "next to bakery") not raw coordinates
2. Match the district's style when building
3. Verify builds after construction
4. Register completed structures in the world index
5. If unsure about location, use "look_around" first

Always end your turn by either:
- Completing an action (build, move, etc.)
- Asking for clarification
- Calling "done" when the episode objective is met
`.trim();
}

// === Helpers ===

function groupByDirection(from: Vec3i, structures: StructureRecord[]): Record<string, StructureRecord[]> {
  const result: Record<string, StructureRecord[]> = { north: [], south: [], east: [], west: [] };

  for (const s of structures) {
    const cx = (s.bbox.min.x + s.bbox.max.x) / 2;
    const cz = (s.bbox.min.z + s.bbox.max.z) / 2;
    const dir = getDirection(from, { x: cx, y: from.y, z: cz });
    result[dir]?.push(s);
  }

  return result;
}

function getDirection(from: Vec3i, to: Vec3i): 'north' | 'south' | 'east' | 'west' {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  return Math.abs(dx) > Math.abs(dz)
    ? dx > 0 ? 'east' : 'west'
    : dz > 0 ? 'south' : 'north';
}

function getStyleDescription(family: string): string {
  const pack = getStylePack(family);
  if (!pack) return 'No specific style';
  return `${pack.description}. Use ${pack.roofStyle} roofs, window spacing ${pack.windowSpacing} blocks.`;
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function isInBuildZone(pos: Vec3i, zone: BBox): boolean {
  return pos.x >= zone.min.x && pos.x <= zone.max.x &&
         pos.y >= zone.min.y && pos.y <= zone.max.y &&
         pos.z >= zone.min.z && pos.z <= zone.max.z;
}

function describeRule(rule: { type: string; params: Record<string, unknown> }): string {
  switch (rule.type) {
    case 'height-limit': return `Max height: ${rule.params.maxHeight} blocks`;
    case 'spacing': return `Min spacing: ${rule.params.minSpacing} blocks`;
    case 'style-constraint': return `Style required: ${rule.params.style}`;
    default: return rule.type;
  }
}
