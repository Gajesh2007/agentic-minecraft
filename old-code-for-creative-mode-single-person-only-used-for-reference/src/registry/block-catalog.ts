import type mineflayer from 'mineflayer';

type MineflayerBot = ReturnType<typeof mineflayer.createBot>;

export type BlockInfo = Readonly<{
  id: number;
  name: string;
  displayName: string;
  defaultState: number;
  category: string;
  hasStates: boolean;
  stackSize: number;
  transparent: boolean;
  emitLight: number;
}>;

const CATEGORY_PATTERNS: [RegExp, string][] = [
  [/_stairs$/, 'stairs'],
  [/_slab$/, 'slabs'],
  [/_door$/, 'doors'],
  [/_fence$|_fence_gate$/, 'fences'],
  [/_wall$/, 'walls'],
  [/_sign$|_hanging_sign$/, 'signs'],
  [/_glass$|_glass_pane$/, 'glass'],
  [/_log$|_wood$|_stem$|_hyphae$/, 'logs'],
  [/_planks$/, 'planks'],
  [/_wool$/, 'wool'],
  [/_carpet$/, 'carpet'],
  [/_concrete$|_concrete_powder$/, 'concrete'],
  [/_terracotta$|_glazed_terracotta$/, 'terracotta'],
  [/_coral$|_coral_block$|_coral_fan$|_coral_wall_fan$/, 'coral'],
  [/_ore$/, 'ores'],
  [/_button$/, 'buttons'],
  [/_pressure_plate$/, 'pressure_plates'],
  [/_trapdoor$/, 'trapdoors'],
  [/_banner$/, 'banners'],
  [/_bed$/, 'beds'],
  [/_candle$/, 'candles'],
  [/torch$|lantern$|sea_lantern|glowstone|shroomlight|froglight/, 'light'],
  [/repeater|comparator|observer|piston|hopper|dropper|dispenser|redstone/, 'redstone'],
  [/command_block|structure_block|barrier|jigsaw|light$/, 'technical'],
  [/leaves$|sapling$|flower|rose|tulip|daisy|orchid|allium|lilac|peony|sunflower|azalea/, 'nature'],
  [/grass$|fern$|vine|moss|dripleaf|spore_blossom|hanging_roots/, 'nature'],
  [/sand$|gravel|dirt|mud|clay|soul_soil|mycelium|podzol|rooted_dirt|farmland|path/, 'terrain'],
  [/water|lava|powder_snow|bubble_column/, 'fluid'],
  [/_rail$/, 'rails'],
];

function categorize(name: string): string {
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(name)) return category;
  }
  // Broad fallback categories
  if (name.includes('brick')) return 'building';
  if (name.includes('stone') || name.includes('deepslate') || name.includes('basalt')) return 'building';
  if (name.includes('copper') || name.includes('iron_block') || name.includes('gold_block')) return 'building';
  if (name.includes('prismarine') || name.includes('purpur') || name.includes('quartz')) return 'building';
  if (name.includes('nether') || name.includes('blackstone') || name.includes('end_stone')) return 'building';
  if (name.includes('amethyst') || name.includes('calcite') || name.includes('tuff') || name.includes('dripstone')) return 'building';
  if (name.includes('skull') || name.includes('head') || name.includes('pot') || name.includes('decorated')) return 'decoration';
  if (name.includes('chest') || name.includes('barrel') || name.includes('shulker')) return 'storage';
  if (name.includes('anvil') || name.includes('crafting') || name.includes('furnace') || name.includes('smoker') || name.includes('brewing') || name.includes('enchanting') || name.includes('grindstone') || name.includes('loom') || name.includes('cartography') || name.includes('smithing') || name.includes('stonecutter') || name.includes('lectern')) return 'workstations';
  return 'misc';
}

export class BlockCatalog {
  private catalog: BlockInfo[] | null = null;
  private categoryMap: Map<string, BlockInfo[]> | null = null;
  private nameMap: Map<string, BlockInfo> | null = null;

  constructor(private readonly bot: MineflayerBot) {}

  private build(): void {
    if (this.catalog) return;
    const registry = this.bot.registry as unknown as {
      blocksArray?: Array<{
        id: number;
        name: string;
        displayName: string;
        defaultState: number;
        states?: unknown[];
        stackSize: number;
        transparent: boolean;
        emitLight: number;
      }>;
    };
    const blocksArray = registry.blocksArray ?? [];
    this.catalog = blocksArray.map(b => ({
      id: b.id,
      name: `minecraft:${b.name}`,
      displayName: b.displayName,
      defaultState: b.defaultState,
      category: categorize(b.name),
      hasStates: Array.isArray(b.states) && b.states.length > 0,
      stackSize: b.stackSize,
      transparent: b.transparent,
      emitLight: b.emitLight,
    }));

    this.categoryMap = new Map();
    this.nameMap = new Map();
    for (const block of this.catalog) {
      this.nameMap.set(block.name, block);
      const list = this.categoryMap.get(block.category);
      if (list) list.push(block);
      else this.categoryMap.set(block.category, [block]);
    }
  }

  getAll(): BlockInfo[] {
    this.build();
    return this.catalog!;
  }

  search(query: string): BlockInfo[] {
    this.build();
    const q = query.toLowerCase();
    return this.catalog!.filter(
      b => b.name.includes(q) || b.displayName.toLowerCase().includes(q),
    );
  }

  getByCategory(category: string): BlockInfo[] {
    this.build();
    return this.categoryMap!.get(category) ?? [];
  }

  getCategories(): { category: string; count: number }[] {
    this.build();
    const result: { category: string; count: number }[] = [];
    for (const [category, blocks] of this.categoryMap!) {
      result.push({ category, count: blocks.length });
    }
    return result.sort((a, b) => b.count - a.count);
  }

  exists(name: string): boolean {
    this.build();
    const normalized = name.startsWith('minecraft:') ? name : `minecraft:${name}`;
    return this.nameMap!.has(normalized);
  }

  getSummary(): { total: number; categories: Record<string, number> } {
    this.build();
    const categories: Record<string, number> = {};
    for (const [category, blocks] of this.categoryMap!) {
      categories[category] = blocks.length;
    }
    return { total: this.catalog!.length, categories };
  }
}
