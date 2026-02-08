import { Palette } from '../types/blocks.js';
import { StyleSpec } from '../types/blueprint.js';

export type StylePack = Readonly<{
  name: string;
  family: string;
  tags: string[];
  description: string;
  palette: Palette;
  roofStyle: 'gable' | 'hip' | 'flat';
  windowSpacing: number;
  trimEnabled: boolean;
  overhangDepth: number;
  heightRange: { min: number; max: number };
  widthRange: { min: number; max: number };
  depthRange: { min: number; max: number };
  roadWidth: number;
  lamppostSpacing: number;
}>;

export const STYLE_PACKS: Record<string, StylePack> = {
  modern: {
    name: 'Modern',
    family: 'modern',
    tags: ['clean', 'minimalist', 'glass', 'concrete'],
    description: 'Clean lines, large windows, flat roofs, concrete and glass materials',
    palette: {
      wall: 'minecraft:white_concrete',
      trim: 'minecraft:gray_concrete',
      roof: 'minecraft:smooth_stone_slab',
      glass: 'minecraft:glass_pane',
      floor: 'minecraft:polished_andesite',
      accent: 'minecraft:black_concrete',
      door: 'minecraft:iron_door',
      fence: 'minecraft:iron_bars',
      light: 'minecraft:sea_lantern',
      path: 'minecraft:smooth_stone',
    },
    roofStyle: 'flat',
    windowSpacing: 2,
    trimEnabled: false,
    overhangDepth: 1,
    heightRange: { min: 4, max: 12 },
    widthRange: { min: 8, max: 20 },
    depthRange: { min: 8, max: 16 },
    roadWidth: 5,
    lamppostSpacing: 8,
  },

  medieval: {
    name: 'Medieval',
    family: 'medieval',
    tags: ['timber', 'stone', 'rustic', 'historic'],
    description: 'Timber frame, steep roofs, stone foundations, warm colors',
    palette: {
      wall: 'minecraft:white_terracotta',
      trim: 'minecraft:dark_oak_planks',
      roof: 'minecraft:dark_oak_stairs',
      glass: 'minecraft:glass_pane',
      floor: 'minecraft:spruce_planks',
      accent: 'minecraft:dark_oak_log',
      door: 'minecraft:dark_oak_door',
      fence: 'minecraft:dark_oak_fence',
      light: 'minecraft:lantern',
      path: 'minecraft:cobblestone',
      foundation: 'minecraft:cobblestone',
    },
    roofStyle: 'gable',
    windowSpacing: 3,
    trimEnabled: true,
    overhangDepth: 1,
    heightRange: { min: 5, max: 10 },
    widthRange: { min: 6, max: 14 },
    depthRange: { min: 6, max: 12 },
    roadWidth: 4,
    lamppostSpacing: 6,
  },

  japanese: {
    name: 'Japanese',
    family: 'japanese',
    tags: ['minimalist', 'wood', 'zen', 'traditional'],
    description: 'Curved roofs, paper screens, natural wood, zen gardens',
    palette: {
      wall: 'minecraft:birch_planks',
      trim: 'minecraft:dark_oak_planks',
      roof: 'minecraft:deepslate_tile_stairs',
      glass: 'minecraft:white_stained_glass_pane',
      floor: 'minecraft:bamboo_mosaic',
      accent: 'minecraft:red_concrete',
      door: 'minecraft:bamboo_door',
      fence: 'minecraft:bamboo_fence',
      light: 'minecraft:lantern',
      path: 'minecraft:gravel',
      pillar: 'minecraft:dark_oak_log',
    },
    roofStyle: 'hip',
    windowSpacing: 2,
    trimEnabled: true,
    overhangDepth: 2,
    heightRange: { min: 4, max: 8 },
    widthRange: { min: 8, max: 16 },
    depthRange: { min: 8, max: 14 },
    roadWidth: 3,
    lamppostSpacing: 5,
  },

  coastal: {
    name: 'Coastal',
    family: 'coastal',
    tags: ['beach', 'bright', 'airy', 'tropical'],
    description: 'Light colors, open designs, beach vibes, nautical elements',
    palette: {
      wall: 'minecraft:cyan_terracotta',
      trim: 'minecraft:white_concrete',
      roof: 'minecraft:prismarine_stairs',
      glass: 'minecraft:light_blue_stained_glass_pane',
      floor: 'minecraft:birch_planks',
      accent: 'minecraft:blue_concrete',
      door: 'minecraft:birch_door',
      fence: 'minecraft:birch_fence',
      light: 'minecraft:sea_lantern',
      path: 'minecraft:sand',
      pillar: 'minecraft:stripped_birch_log',
    },
    roofStyle: 'hip',
    windowSpacing: 2,
    trimEnabled: true,
    overhangDepth: 2,
    heightRange: { min: 4, max: 8 },
    widthRange: { min: 8, max: 14 },
    depthRange: { min: 8, max: 12 },
    roadWidth: 4,
    lamppostSpacing: 7,
  },

  nordic: {
    name: 'Nordic',
    family: 'nordic',
    tags: ['wood', 'cozy', 'winter', 'cabin'],
    description: 'Warm wood interiors, steep snow-shedding roofs, cozy aesthetic',
    palette: {
      wall: 'minecraft:spruce_planks',
      trim: 'minecraft:stripped_spruce_log',
      roof: 'minecraft:spruce_stairs',
      glass: 'minecraft:glass_pane',
      floor: 'minecraft:spruce_planks',
      accent: 'minecraft:stone_bricks',
      door: 'minecraft:spruce_door',
      fence: 'minecraft:spruce_fence',
      light: 'minecraft:lantern',
      path: 'minecraft:cobblestone',
      foundation: 'minecraft:stone_bricks',
    },
    roofStyle: 'gable',
    windowSpacing: 4,
    trimEnabled: true,
    overhangDepth: 1,
    heightRange: { min: 5, max: 9 },
    widthRange: { min: 7, max: 12 },
    depthRange: { min: 7, max: 11 },
    roadWidth: 3,
    lamppostSpacing: 6,
  },

  desert: {
    name: 'Desert',
    family: 'desert',
    tags: ['sandstone', 'adobe', 'warm', 'arid'],
    description: 'Flat roofs, thick walls, sandstone materials, courtyards',
    palette: {
      wall: 'minecraft:smooth_sandstone',
      trim: 'minecraft:cut_sandstone',
      roof: 'minecraft:smooth_sandstone_slab',
      glass: 'minecraft:orange_stained_glass_pane',
      floor: 'minecraft:terracotta',
      accent: 'minecraft:red_sandstone',
      door: 'minecraft:acacia_door',
      fence: 'minecraft:acacia_fence',
      light: 'minecraft:torch',
      path: 'minecraft:sand',
      pillar: 'minecraft:sandstone_pillar',
    },
    roofStyle: 'flat',
    windowSpacing: 4,
    trimEnabled: false,
    overhangDepth: 0,
    heightRange: { min: 3, max: 7 },
    widthRange: { min: 6, max: 14 },
    depthRange: { min: 6, max: 12 },
    roadWidth: 4,
    lamppostSpacing: 8,
  },

  victorian: {
    name: 'Victorian',
    family: 'victorian',
    tags: ['ornate', 'brick', 'detailed', 'elegant'],
    description: 'Ornate details, brick facades, bay windows, decorative trim',
    palette: {
      wall: 'minecraft:bricks',
      trim: 'minecraft:white_concrete',
      roof: 'minecraft:dark_prismarine_stairs',
      glass: 'minecraft:glass_pane',
      floor: 'minecraft:oak_planks',
      accent: 'minecraft:polished_granite',
      door: 'minecraft:oak_door',
      fence: 'minecraft:oak_fence',
      light: 'minecraft:lantern',
      path: 'minecraft:cobblestone',
      foundation: 'minecraft:stone_bricks',
    },
    roofStyle: 'gable',
    windowSpacing: 2,
    trimEnabled: true,
    overhangDepth: 1,
    heightRange: { min: 6, max: 12 },
    widthRange: { min: 8, max: 16 },
    depthRange: { min: 8, max: 14 },
    roadWidth: 5,
    lamppostSpacing: 5,
  },
};

export function getStylePack(family: string): StylePack | undefined {
  return STYLE_PACKS[family.toLowerCase()];
}

export function getStylePackFromSpec(style?: StyleSpec): StylePack | undefined {
  if (!style?.family) return undefined;
  return getStylePack(style.family);
}

export function listStyleFamilies(): string[] {
  return Object.keys(STYLE_PACKS);
}

export function mergePalette(basePalette: Palette, overrides?: Palette): Palette {
  if (!overrides) return basePalette;
  return { ...basePalette, ...overrides };
}

export function getRecommendedDimensions(stylePack: StylePack): {
  width: number;
  depth: number;
  height: number;
} {
  return {
    width: Math.floor((stylePack.widthRange.min + stylePack.widthRange.max) / 2),
    depth: Math.floor((stylePack.depthRange.min + stylePack.depthRange.max) / 2),
    height: Math.floor((stylePack.heightRange.min + stylePack.heightRange.max) / 2),
  };
}
