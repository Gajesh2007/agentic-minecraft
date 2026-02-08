import { makeId } from '../lib/ids.js';
import { resolveBlockSpec, blockNameFromSpec } from '../types/blocks.js';
import { Blueprint, BlueprintOp, ConstructionScript, ConstructionStep } from '../types/blueprint.js';
import { BBox, Vec3i, addVec, bboxDimensions, bboxUnion, bboxVolume, normalizeBBox, subVec } from '../types/geometry.js';

type CompilerOptions = {
  maxCommandLength: number;
};

type StepBuild = {
  steps: ConstructionStep[];
  bbox: BBox;
  estimatedChangedBlocksUpperBound: number;
};

export function compileBlueprint(
  blueprint: Blueprint,
  options: CompilerOptions,
): ConstructionScript {
  const steps: ConstructionStep[] = [];
  let unionBox: ReturnType<typeof normalizeBBox> | null = null;
  let estimated = 0;

  for (const op of blueprint.ops) {
    const result = compileOp(blueprint, op, options);
    steps.push(...result.steps);
    unionBox = unionBox ? bboxUnion(unionBox, result.bbox) : result.bbox;
    estimated += result.estimatedChangedBlocksUpperBound;
  }

  const script: ConstructionScript = {
    scriptId: makeId('cs'),
    blueprintId: blueprint.blueprintId,
    steps,
    estimated: {
      changedBlocksUpperBound: estimated,
      commands: steps.length,
    },
  };

  return script;
}

function compileOp(
  blueprint: Blueprint,
  op: BlueprintOp,
  options: CompilerOptions,
): StepBuild {
  switch (op.op) {
    case 'fillCuboid': {
      const box = toWorldBox(blueprint.origin, op.from, op.to);
      const block = resolveBlockSpec(op.block, blueprint.palette);
      return compileFill(box, block, options.maxCommandLength, [blockNameFromSpec(op.block, blueprint.palette)]);
    }
    case 'hollowBox': {
      const box = toWorldBox(blueprint.origin, op.from, op.to);
      const block = resolveBlockSpec(op.wall, blueprint.palette);
      const steps = compileFill(box, block, options.maxCommandLength, [blockNameFromSpec(op.wall, blueprint.palette)], 'hollow').steps;
      let estimatedChangedBlocksUpperBound = hollowBoxEstimate(box);
      if (op.trim) {
        const trimSteps = compileTrimBand(
          { min: box.min, max: box.max },
          box.max.y,
          resolveBlockSpec(op.trim, blueprint.palette),
          options.maxCommandLength,
          [blockNameFromSpec(op.trim, blueprint.palette)],
        );
        steps.push(...trimSteps.steps);
        estimatedChangedBlocksUpperBound += trimSteps.estimatedChangedBlocksUpperBound;
      }
      return { steps, bbox: box, estimatedChangedBlocksUpperBound };
    }
    case 'foundation': {
      const rect = normalizeBBox({
        min: addVec(blueprint.origin, op.rect.min),
        max: addVec(blueprint.origin, op.rect.max),
      });
      const height = op.height ?? 1;
      const box = normalizeBBox({
        min: rect.min,
        max: { x: rect.max.x, y: rect.min.y + height - 1, z: rect.max.z },
      });
      const block = resolveBlockSpec(op.material, blueprint.palette);
      return compileFill(box, block, options.maxCommandLength, [blockNameFromSpec(op.material, blueprint.palette)]);
    }
    case 'windowRow': {
      const wall = normalizeBBox({
        min: addVec(blueprint.origin, op.wall.min),
        max: addVec(blueprint.origin, op.wall.max),
      });
      const block = resolveBlockSpec(op.block, blueprint.palette);
      const blockName = blockNameFromSpec(op.block, blueprint.palette);
      const steps: ConstructionStep[] = [];
      let estimated = 0;
      const { dx, dz } = bboxDimensions(wall);
      const alongX = dz === 1;
      const alongZ = dx === 1;
      if (!alongX && !alongZ) {
        throw new Error('windowRow wall must be 1 block thick along x or z');
      }
      const count = alongX ? dx : dz;
      for (let i = 0; i < count; i += op.every) {
        const pos = alongX
          ? { x: wall.min.x + i, y: op.y + blueprint.origin.y, z: wall.min.z }
          : { x: wall.min.x, y: op.y + blueprint.origin.y, z: wall.min.z + i };
        steps.push({
          kind: 'command',
          command: `/setblock ${pos.x} ${pos.y} ${pos.z} ${block}`,
          bbox: { min: pos, max: pos },
          estimatedChangedBlocksUpperBound: 1,
          blocksUsed: [blockName],
        });
        estimated += 1;
      }
      return { steps, bbox: wall, estimatedChangedBlocksUpperBound: estimated };
    }
    case 'door': {
      const pos = addVec(blueprint.origin, op.at);
      const blockName = blockNameFromSpec(op.material, blueprint.palette);
      const base = resolveBlockSpec(op.material, blueprint.palette);
      const hinge = op.hinge ?? 'left';
      const lower = `${base}[facing=${op.facing},half=lower,hinge=${hinge},open=false]`;
      const upper = `${base}[facing=${op.facing},half=upper,hinge=${hinge},open=false]`;
      const lowerStep: ConstructionStep = {
        kind: 'command',
        command: `/setblock ${pos.x} ${pos.y} ${pos.z} ${lower}`,
        bbox: { min: pos, max: pos },
        estimatedChangedBlocksUpperBound: 1,
        blocksUsed: [blockName],
      };
      const upperPos = { x: pos.x, y: pos.y + 1, z: pos.z };
      const upperStep: ConstructionStep = {
        kind: 'command',
        command: `/setblock ${upperPos.x} ${upperPos.y} ${upperPos.z} ${upper}`,
        bbox: { min: upperPos, max: upperPos },
        estimatedChangedBlocksUpperBound: 1,
        blocksUsed: [blockName],
      };
      return {
        steps: [lowerStep, upperStep],
        bbox: { min: pos, max: upperPos },
        estimatedChangedBlocksUpperBound: 2,
      };
    }
    case 'gableRoof': {
      return compileGableRoof(blueprint, op, options.maxCommandLength);
    }
    case 'hipRoof': {
      return compileHipRoof(blueprint, op, options.maxCommandLength);
    }
    case 'flatRoof': {
      return compileFlatRoof(blueprint, op, options.maxCommandLength);
    }
    case 'trimBand': {
      const box = normalizeBBox({
        min: addVec(blueprint.origin, op.bbox.min),
        max: addVec(blueprint.origin, op.bbox.max),
      });
      return compileTrimBand(
        box,
        op.y + blueprint.origin.y,
        resolveBlockSpec(op.material, blueprint.palette),
        options.maxCommandLength,
        [blockNameFromSpec(op.material, blueprint.palette)],
      );
    }
    case 'replace': {
      return compileReplace(blueprint, op, options.maxCommandLength);
    }
    case 'repeat': {
      return compileRepeat(blueprint, op, options);
    }
    case 'mirror': {
      return compileMirror(blueprint, op, options);
    }
    case 'pillarLine': {
      return compilePillarLine(blueprint, op, options.maxCommandLength);
    }
    case 'beam': {
      return compileBeam(blueprint, op, options.maxCommandLength);
    }
    case 'staircase': {
      return compileStaircase(blueprint, op, options.maxCommandLength);
    }
    case 'overhang': {
      return compileOverhang(blueprint, op, options.maxCommandLength);
    }
    case 'balcony': {
      return compileBalcony(blueprint, op, options.maxCommandLength);
    }
    case 'arch': {
      return compileArch(blueprint, op, options.maxCommandLength);
    }
    case 'road': {
      return compileRoad(blueprint, op, options.maxCommandLength);
    }
    case 'lamppost': {
      return compileLamppost(blueprint, op, options.maxCommandLength);
    }
    default:
      throw new Error(`Unsupported op ${(op as BlueprintOp).op}`);
  }
}

function toWorldBox(origin: { x: number; y: number; z: number }, from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }) {
  return normalizeBBox({
    min: addVec(origin, from),
    max: addVec(origin, to),
  });
}

function compileFill(
  box: ReturnType<typeof normalizeBBox>,
  block: string,
  maxCommandLength: number,
  blocksUsed: string[],
  mode?: 'hollow',
): StepBuild {
  const command = `/fill ${box.min.x} ${box.min.y} ${box.min.z} ${box.max.x} ${box.max.y} ${box.max.z} ${block}${mode ? ` ${mode}` : ''}`;
  if (command.length <= maxCommandLength) {
    const step: ConstructionStep = {
      kind: 'command',
      command,
      bbox: box,
      estimatedChangedBlocksUpperBound: mode === 'hollow' ? hollowBoxEstimate(box) : bboxVolume(box),
      blocksUsed,
    };
    return { steps: [step], bbox: box, estimatedChangedBlocksUpperBound: step.estimatedChangedBlocksUpperBound };
  }
  const { dx, dy, dz } = bboxDimensions(box);
  const splitAxis = dx >= dy && dx >= dz ? 'x' : dz >= dy ? 'z' : 'y';
  if (splitAxis === 'x') {
    const mid = Math.floor((box.min.x + box.max.x) / 2);
    const left = normalizeBBox({ min: box.min, max: { ...box.max, x: mid } });
    const right = normalizeBBox({ min: { ...box.min, x: mid + 1 }, max: box.max });
    const leftSteps = compileFill(left, block, maxCommandLength, blocksUsed, mode);
    const rightSteps = compileFill(right, block, maxCommandLength, blocksUsed, mode);
    return mergeSteps(leftSteps, rightSteps);
  }
  if (splitAxis === 'z') {
    const mid = Math.floor((box.min.z + box.max.z) / 2);
    const front = normalizeBBox({ min: box.min, max: { ...box.max, z: mid } });
    const back = normalizeBBox({ min: { ...box.min, z: mid + 1 }, max: box.max });
    const frontSteps = compileFill(front, block, maxCommandLength, blocksUsed, mode);
    const backSteps = compileFill(back, block, maxCommandLength, blocksUsed, mode);
    return mergeSteps(frontSteps, backSteps);
  }
  const mid = Math.floor((box.min.y + box.max.y) / 2);
  const lower = normalizeBBox({ min: box.min, max: { ...box.max, y: mid } });
  const upper = normalizeBBox({ min: { ...box.min, y: mid + 1 }, max: box.max });
  const lowerSteps = compileFill(lower, block, maxCommandLength, blocksUsed, mode);
  const upperSteps = compileFill(upper, block, maxCommandLength, blocksUsed, mode);
  return mergeSteps(lowerSteps, upperSteps);
}

function mergeSteps(a: StepBuild, b: StepBuild): StepBuild {
  return {
    steps: [...a.steps, ...b.steps],
    bbox: bboxUnion(a.bbox, b.bbox),
    estimatedChangedBlocksUpperBound: a.estimatedChangedBlocksUpperBound + b.estimatedChangedBlocksUpperBound,
  };
}

function hollowBoxEstimate(box: ReturnType<typeof normalizeBBox>): number {
  const { dx, dy, dz } = bboxDimensions(box);
  if (dx <= 2 || dy <= 2 || dz <= 2) return bboxVolume(box);
  const inner = (dx - 2) * (dy - 2) * (dz - 2);
  return Math.max(0, bboxVolume(box) - inner);
}

function compileTrimBand(
  box: ReturnType<typeof normalizeBBox>,
  y: number,
  block: string,
  maxCommandLength: number,
  blocksUsed: string[],
): StepBuild {
  const top = { min: { ...box.min, y }, max: { ...box.max, y } };
  const steps: ConstructionStep[] = [];
  let estimated = 0;
  const north = normalizeBBox({ min: { x: top.min.x, y, z: top.min.z }, max: { x: top.max.x, y, z: top.min.z } });
  const south = normalizeBBox({ min: { x: top.min.x, y, z: top.max.z }, max: { x: top.max.x, y, z: top.max.z } });
  const west = normalizeBBox({ min: { x: top.min.x, y, z: top.min.z }, max: { x: top.min.x, y, z: top.max.z } });
  const east = normalizeBBox({ min: { x: top.max.x, y, z: top.min.z }, max: { x: top.max.x, y, z: top.max.z } });

  for (const segment of [north, south, west, east]) {
    const compiled = compileFill(segment, block, maxCommandLength, blocksUsed);
    steps.push(...compiled.steps);
    estimated += compiled.estimatedChangedBlocksUpperBound;
  }
  return {
    steps,
    bbox: normalizeBBox({ min: top.min, max: top.max }),
    estimatedChangedBlocksUpperBound: estimated,
  };
}

function compileGableRoof(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'gableRoof' }>,
  maxCommandLength: number,
): StepBuild {
  const roofBox = normalizeBBox({
    min: addVec(blueprint.origin, op.bbox.min),
    max: addVec(blueprint.origin, op.bbox.max),
  });
  const block = resolveBlockSpec(op.block, blueprint.palette);
  const blockName = blockNameFromSpec(op.block, blueprint.palette);
  const { dx, dz } = bboxDimensions(roofBox);
  const shrinkAxis = dx <= dz ? 'x' : 'z';
  let layer = 0;
  let current = roofBox;
  const steps: ConstructionStep[] = [];
  let estimated = 0;

  while (true) {
    const { dx: cdx, dz: cdz } = bboxDimensions(current);
    if ((shrinkAxis === 'x' && cdx <= 0) || (shrinkAxis === 'z' && cdz <= 0)) break;
    const layerBox = normalizeBBox({
      min: { x: current.min.x, y: roofBox.min.y + layer, z: current.min.z },
      max: { x: current.max.x, y: roofBox.min.y + layer, z: current.max.z },
    });
    const compiled = compileFill(layerBox, block, maxCommandLength, [blockName]);
    steps.push(...compiled.steps);
    estimated += compiled.estimatedChangedBlocksUpperBound;
    if (shrinkAxis === 'x') {
      if (current.min.x + 1 > current.max.x - 1) break;
      current = normalizeBBox({
        min: { ...current.min, x: current.min.x + 1 },
        max: { ...current.max, x: current.max.x - 1 },
      });
    } else {
      if (current.min.z + 1 > current.max.z - 1) break;
      current = normalizeBBox({
        min: { ...current.min, z: current.min.z + 1 },
        max: { ...current.max, z: current.max.z - 1 },
      });
    }
    layer += 1;
  }
  return { steps, bbox: roofBox, estimatedChangedBlocksUpperBound: estimated };
}

function compileHipRoof(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'hipRoof' }>,
  maxCommandLength: number,
): StepBuild {
  const roofBox = normalizeBBox({
    min: addVec(blueprint.origin, op.bbox.min),
    max: addVec(blueprint.origin, op.bbox.max),
  });
  const block = resolveBlockSpec(op.block, blueprint.palette);
  const blockName = blockNameFromSpec(op.block, blueprint.palette);
  let layer = 0;
  let current = roofBox;
  const steps: ConstructionStep[] = [];
  let estimated = 0;

  // Hip roof shrinks on all sides each layer
  while (true) {
    const { dx, dz } = bboxDimensions(current);
    if (dx <= 0 || dz <= 0) break;
    const layerBox = normalizeBBox({
      min: { x: current.min.x, y: roofBox.min.y + layer, z: current.min.z },
      max: { x: current.max.x, y: roofBox.min.y + layer, z: current.max.z },
    });
    const compiled = compileFill(layerBox, block, maxCommandLength, [blockName]);
    steps.push(...compiled.steps);
    estimated += compiled.estimatedChangedBlocksUpperBound;

    if (current.min.x + 1 > current.max.x - 1 || current.min.z + 1 > current.max.z - 1) break;
    current = normalizeBBox({
      min: { x: current.min.x + 1, y: current.min.y, z: current.min.z + 1 },
      max: { x: current.max.x - 1, y: current.max.y, z: current.max.z - 1 },
    });
    layer += 1;
  }
  return { steps, bbox: roofBox, estimatedChangedBlocksUpperBound: estimated };
}

function compileFlatRoof(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'flatRoof' }>,
  maxCommandLength: number,
): StepBuild {
  const roofBox = normalizeBBox({
    min: addVec(blueprint.origin, op.bbox.min),
    max: addVec(blueprint.origin, op.bbox.max),
  });
  const block = resolveBlockSpec(op.block, blueprint.palette);
  const blockName = blockNameFromSpec(op.block, blueprint.palette);
  const steps: ConstructionStep[] = [];
  let estimated = 0;

  // Main roof slab
  const slabBox = normalizeBBox({
    min: roofBox.min,
    max: { x: roofBox.max.x, y: roofBox.min.y, z: roofBox.max.z },
  });
  const main = compileFill(slabBox, block, maxCommandLength, [blockName]);
  steps.push(...main.steps);
  estimated += main.estimatedChangedBlocksUpperBound;

  // Trim around edge if specified
  if (op.trim) {
    const trimBlock = resolveBlockSpec(op.trim, blueprint.palette);
    const trimName = blockNameFromSpec(op.trim, blueprint.palette);
    const trimResult = compileTrimBand(roofBox, roofBox.min.y, trimBlock, maxCommandLength, [trimName]);
    steps.push(...trimResult.steps);
    estimated += trimResult.estimatedChangedBlocksUpperBound;
  }

  return { steps, bbox: roofBox, estimatedChangedBlocksUpperBound: estimated };
}

function compileReplace(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'replace' }>,
  maxCommandLength: number,
): StepBuild {
  const box = toWorldBox(blueprint.origin, op.from, op.to);
  const fromBlock = resolveBlockSpec(op.fromBlock, blueprint.palette);
  const toBlock = resolveBlockSpec(op.toBlock, blueprint.palette);
  const command = `/fill ${box.min.x} ${box.min.y} ${box.min.z} ${box.max.x} ${box.max.y} ${box.max.z} ${toBlock} replace ${fromBlock}`;

  if (command.length <= maxCommandLength) {
    return {
      steps: [{
        kind: 'command',
        command,
        bbox: box,
        estimatedChangedBlocksUpperBound: bboxVolume(box),
        blocksUsed: [blockNameFromSpec(op.toBlock, blueprint.palette)],
      }],
      bbox: box,
      estimatedChangedBlocksUpperBound: bboxVolume(box),
    };
  }
  // Split if too long
  return splitAndCompileReplace(box, fromBlock, toBlock, maxCommandLength, [blockNameFromSpec(op.toBlock, blueprint.palette)]);
}

function splitAndCompileReplace(
  box: BBox,
  fromBlock: string,
  toBlock: string,
  maxCommandLength: number,
  blocksUsed: string[],
): StepBuild {
  const { dx, dy, dz } = bboxDimensions(box);
  const splitAxis = dx >= dy && dx >= dz ? 'x' : dz >= dy ? 'z' : 'y';
  const mid = splitAxis === 'x' ? Math.floor((box.min.x + box.max.x) / 2) :
              splitAxis === 'z' ? Math.floor((box.min.z + box.max.z) / 2) :
              Math.floor((box.min.y + box.max.y) / 2);

  const [a, b] = splitAxis === 'x' ? [
    normalizeBBox({ min: box.min, max: { ...box.max, x: mid } }),
    normalizeBBox({ min: { ...box.min, x: mid + 1 }, max: box.max }),
  ] : splitAxis === 'z' ? [
    normalizeBBox({ min: box.min, max: { ...box.max, z: mid } }),
    normalizeBBox({ min: { ...box.min, z: mid + 1 }, max: box.max }),
  ] : [
    normalizeBBox({ min: box.min, max: { ...box.max, y: mid } }),
    normalizeBBox({ min: { ...box.min, y: mid + 1 }, max: box.max }),
  ];

  const cmdA = `/fill ${a.min.x} ${a.min.y} ${a.min.z} ${a.max.x} ${a.max.y} ${a.max.z} ${toBlock} replace ${fromBlock}`;
  const cmdB = `/fill ${b.min.x} ${b.min.y} ${b.min.z} ${b.max.x} ${b.max.y} ${b.max.z} ${toBlock} replace ${fromBlock}`;

  const stepsA = cmdA.length <= maxCommandLength ? [{
    kind: 'command' as const,
    command: cmdA,
    bbox: a,
    estimatedChangedBlocksUpperBound: bboxVolume(a),
    blocksUsed,
  }] : splitAndCompileReplace(a, fromBlock, toBlock, maxCommandLength, blocksUsed).steps;

  const stepsB = cmdB.length <= maxCommandLength ? [{
    kind: 'command' as const,
    command: cmdB,
    bbox: b,
    estimatedChangedBlocksUpperBound: bboxVolume(b),
    blocksUsed,
  }] : splitAndCompileReplace(b, fromBlock, toBlock, maxCommandLength, blocksUsed).steps;

  return {
    steps: [...stepsA, ...stepsB],
    bbox: bboxUnion(a, b),
    estimatedChangedBlocksUpperBound: bboxVolume(a) + bboxVolume(b),
  };
}

function compileRepeat(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'repeat' }>,
  options: CompilerOptions,
): StepBuild {
  const steps: ConstructionStep[] = [];
  let unionBox: BBox | null = null;
  let estimated = 0;

  for (let i = 0; i < op.count; i++) {
    const offset: Vec3i = { x: op.dx * i, y: op.dy * i, z: op.dz * i };
    const shiftedBlueprint: Blueprint = {
      ...blueprint,
      origin: addVec(blueprint.origin, offset),
    };
    const result = compileOp(shiftedBlueprint, op.innerOp, options);
    steps.push(...result.steps);
    unionBox = unionBox ? bboxUnion(unionBox, result.bbox) : result.bbox;
    estimated += result.estimatedChangedBlocksUpperBound;
  }

  return {
    steps,
    bbox: unionBox ?? normalizeBBox({ min: blueprint.origin, max: blueprint.origin }),
    estimatedChangedBlocksUpperBound: estimated,
  };
}

function compileMirror(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'mirror' }>,
  options: CompilerOptions,
): StepBuild {
  // First compile the original
  const original = compileOp(blueprint, op.innerOp, options);

  // Then mirror each step
  const mirroredSteps = original.steps.map(step => {
    const { min, max } = step.bbox;
    let mirroredMin: Vec3i;
    let mirroredMax: Vec3i;

    if (op.axis === 'x') {
      mirroredMin = { x: Math.floor(2 * op.center - max.x), y: min.y, z: min.z };
      mirroredMax = { x: Math.floor(2 * op.center - min.x), y: max.y, z: max.z };
    } else {
      mirroredMin = { x: min.x, y: min.y, z: Math.floor(2 * op.center - max.z) };
      mirroredMax = { x: max.x, y: max.y, z: Math.floor(2 * op.center - min.z) };
    }

    const mirroredBox = normalizeBBox({ min: mirroredMin, max: mirroredMax });
    // Reconstruct fill command with mirrored coords
    const cmdMatch = step.command.match(/^\/fill\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(.+)$/);
    if (cmdMatch) {
      const block = cmdMatch[7];
      return {
        ...step,
        command: `/fill ${mirroredBox.min.x} ${mirroredBox.min.y} ${mirroredBox.min.z} ${mirroredBox.max.x} ${mirroredBox.max.y} ${mirroredBox.max.z} ${block}`,
        bbox: mirroredBox,
      };
    }
    // For setblock commands
    const setMatch = step.command.match(/^\/setblock\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(.+)$/);
    if (setMatch) {
      const [, x, y, z, block] = setMatch;
      const mx = op.axis === 'x' ? Math.floor(2 * op.center - Number(x)) : Number(x);
      const mz = op.axis === 'z' ? Math.floor(2 * op.center - Number(z)) : Number(z);
      return {
        ...step,
        command: `/setblock ${mx} ${y} ${mz} ${block}`,
        bbox: { min: { x: mx, y: Number(y), z: mz }, max: { x: mx, y: Number(y), z: mz } },
      };
    }
    return step;
  });

  return {
    steps: [...original.steps, ...mirroredSteps],
    bbox: bboxUnion(original.bbox, mirroredSteps.length > 0 ? mirroredSteps.map(s => s.bbox).reduce(bboxUnion) : original.bbox),
    estimatedChangedBlocksUpperBound: original.estimatedChangedBlocksUpperBound * 2,
  };
}

function compilePillarLine(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'pillarLine' }>,
  maxCommandLength: number,
): StepBuild {
  const start = addVec(blueprint.origin, op.start);
  const end = addVec(blueprint.origin, op.end);
  const block = resolveBlockSpec(op.material, blueprint.palette);
  const blockName = blockNameFromSpec(op.material, blueprint.palette);
  const steps: ConstructionStep[] = [];
  let estimated = 0;

  // Calculate direction
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.max(Math.abs(dx), Math.abs(dz));
  const stepX = length > 0 ? dx / length : 0;
  const stepZ = length > 0 ? dz / length : 0;

  const pillarHeight = Math.abs(end.y - start.y) + 1;
  const baseY = Math.min(start.y, end.y);

  for (let i = 0; i <= length; i += op.spacing) {
    const px = Math.round(start.x + stepX * i);
    const pz = Math.round(start.z + stepZ * i);
    const pillarBox = normalizeBBox({
      min: { x: px, y: baseY, z: pz },
      max: { x: px, y: baseY + pillarHeight - 1, z: pz },
    });
    const compiled = compileFill(pillarBox, block, maxCommandLength, [blockName]);
    steps.push(...compiled.steps);
    estimated += compiled.estimatedChangedBlocksUpperBound;
  }

  return {
    steps,
    bbox: normalizeBBox({ min: start, max: end }),
    estimatedChangedBlocksUpperBound: estimated,
  };
}

function compileBeam(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'beam' }>,
  maxCommandLength: number,
): StepBuild {
  const start = addVec(blueprint.origin, op.start);
  const end = addVec(blueprint.origin, op.end);
  const block = resolveBlockSpec(op.material, blueprint.palette);
  const blockName = blockNameFromSpec(op.material, blueprint.palette);

  const box = normalizeBBox({ min: start, max: end });
  return compileFill(box, block, maxCommandLength, [blockName]);
}

function compileStaircase(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'staircase' }>,
  maxCommandLength: number,
): StepBuild {
  const start = addVec(blueprint.origin, op.from);
  const end = addVec(blueprint.origin, op.to);
  const block = resolveBlockSpec(op.material, blueprint.palette);
  const blockName = blockNameFromSpec(op.material, blueprint.palette);
  const steps: ConstructionStep[] = [];
  let estimated = 0;

  const dy = end.y - start.y;
  const height = Math.abs(dy);
  const direction = dy > 0 ? 1 : -1;

  if (op.style === 'straight') {
    // Determine primary horizontal direction
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const horizontal = Math.abs(dx) >= Math.abs(dz) ? 'x' : 'z';
    const facing = horizontal === 'x' ? (dx > 0 ? 'east' : 'west') : (dz > 0 ? 'south' : 'north');
    const stepH = horizontal === 'x' ? (dx > 0 ? 1 : -1) : 0;
    const stepZ = horizontal === 'z' ? (dz > 0 ? 1 : -1) : 0;

    for (let i = 0; i <= height; i++) {
      const pos: Vec3i = {
        x: start.x + stepH * i,
        y: start.y + direction * i,
        z: start.z + stepZ * i,
      };
      const stairBlock = `${block}[facing=${facing},half=bottom,shape=straight]`;
      steps.push({
        kind: 'command',
        command: `/setblock ${pos.x} ${pos.y} ${pos.z} ${stairBlock}`,
        bbox: { min: pos, max: pos },
        estimatedChangedBlocksUpperBound: 1,
        blocksUsed: [blockName],
      });
      estimated += 1;
    }
  } else {
    // Spiral staircase
    const facings = ['north', 'east', 'south', 'west'];
    let facingIdx = 0;
    const centerX = (start.x + end.x) / 2;
    const centerZ = (start.z + end.z) / 2;
    const radius = 2;

    for (let i = 0; i <= height; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const pos: Vec3i = {
        x: Math.round(centerX + Math.cos(angle) * radius),
        y: start.y + direction * i,
        z: Math.round(centerZ + Math.sin(angle) * radius),
      };
      const facing = facings[facingIdx % 4];
      facingIdx++;
      const stairBlock = `${block}[facing=${facing},half=bottom,shape=straight]`;
      steps.push({
        kind: 'command',
        command: `/setblock ${pos.x} ${pos.y} ${pos.z} ${stairBlock}`,
        bbox: { min: pos, max: pos },
        estimatedChangedBlocksUpperBound: 1,
        blocksUsed: [blockName],
      });
      estimated += 1;
    }
  }

  return {
    steps,
    bbox: normalizeBBox({ min: start, max: end }),
    estimatedChangedBlocksUpperBound: estimated,
  };
}

function compileOverhang(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'overhang' }>,
  maxCommandLength: number,
): StepBuild {
  const box = normalizeBBox({
    min: addVec(blueprint.origin, op.bbox.min),
    max: addVec(blueprint.origin, op.bbox.max),
  });
  const block = resolveBlockSpec(op.material, blueprint.palette);
  const blockName = blockNameFromSpec(op.material, blueprint.palette);
  const steps: ConstructionStep[] = [];
  let estimated = 0;

  const topY = box.max.y;
  const depth = op.depth;

  // Overhang on all four sides at the top
  const overhangs = [
    // North overhang
    normalizeBBox({ min: { x: box.min.x - depth, y: topY, z: box.min.z - depth }, max: { x: box.max.x + depth, y: topY, z: box.min.z - 1 } }),
    // South overhang
    normalizeBBox({ min: { x: box.min.x - depth, y: topY, z: box.max.z + 1 }, max: { x: box.max.x + depth, y: topY, z: box.max.z + depth } }),
    // West overhang
    normalizeBBox({ min: { x: box.min.x - depth, y: topY, z: box.min.z }, max: { x: box.min.x - 1, y: topY, z: box.max.z } }),
    // East overhang
    normalizeBBox({ min: { x: box.max.x + 1, y: topY, z: box.min.z }, max: { x: box.max.x + depth, y: topY, z: box.max.z } }),
  ];

  for (const overhang of overhangs) {
    const compiled = compileFill(overhang, block, maxCommandLength, [blockName]);
    steps.push(...compiled.steps);
    estimated += compiled.estimatedChangedBlocksUpperBound;
  }

  return {
    steps,
    bbox: normalizeBBox({
      min: { x: box.min.x - depth, y: topY, z: box.min.z - depth },
      max: { x: box.max.x + depth, y: topY, z: box.max.z + depth },
    }),
    estimatedChangedBlocksUpperBound: estimated,
  };
}

function compileBalcony(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'balcony' }>,
  maxCommandLength: number,
): StepBuild {
  const box = normalizeBBox({
    min: addVec(blueprint.origin, op.bbox.min),
    max: addVec(blueprint.origin, op.bbox.max),
  });
  const railBlock = resolveBlockSpec(op.railMaterial, blueprint.palette);
  const railName = blockNameFromSpec(op.railMaterial, blueprint.palette);
  const floorBlock = op.floorMaterial ? resolveBlockSpec(op.floorMaterial, blueprint.palette) : 'minecraft:oak_slab';
  const floorName = op.floorMaterial ? blockNameFromSpec(op.floorMaterial, blueprint.palette) : 'minecraft:oak_slab';
  const steps: ConstructionStep[] = [];
  let estimated = 0;

  // Floor
  const floorBox = normalizeBBox({
    min: { x: box.min.x, y: box.min.y, z: box.min.z },
    max: { x: box.max.x, y: box.min.y, z: box.max.z },
  });
  const floor = compileFill(floorBox, floorBlock, maxCommandLength, [floorName]);
  steps.push(...floor.steps);
  estimated += floor.estimatedChangedBlocksUpperBound;

  // Rails around edge (at y+1)
  const railY = box.min.y + 1;
  const railBoxes = [
    normalizeBBox({ min: { x: box.min.x, y: railY, z: box.min.z }, max: { x: box.max.x, y: railY, z: box.min.z } }),
    normalizeBBox({ min: { x: box.min.x, y: railY, z: box.max.z }, max: { x: box.max.x, y: railY, z: box.max.z } }),
    normalizeBBox({ min: { x: box.min.x, y: railY, z: box.min.z }, max: { x: box.min.x, y: railY, z: box.max.z } }),
    normalizeBBox({ min: { x: box.max.x, y: railY, z: box.min.z }, max: { x: box.max.x, y: railY, z: box.max.z } }),
  ];

  for (const railBox of railBoxes) {
    const rail = compileFill(railBox, railBlock, maxCommandLength, [railName]);
    steps.push(...rail.steps);
    estimated += rail.estimatedChangedBlocksUpperBound;
  }

  return { steps, bbox: box, estimatedChangedBlocksUpperBound: estimated };
}

function compileArch(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'arch' }>,
  maxCommandLength: number,
): StepBuild {
  const opening = normalizeBBox({
    min: addVec(blueprint.origin, op.opening.min),
    max: addVec(blueprint.origin, op.opening.max),
  });
  const block = resolveBlockSpec(op.material, blueprint.palette);
  const blockName = blockNameFromSpec(op.material, blueprint.palette);
  const steps: ConstructionStep[] = [];
  let estimated = 0;

  const { dx, dy, dz } = bboxDimensions(opening);
  const width = Math.max(dx, dz);
  const height = dy;

  // Simple arch: pillars on sides + curved top
  // Left pillar
  const leftPillar = normalizeBBox({
    min: { x: opening.min.x, y: opening.min.y, z: opening.min.z },
    max: { x: opening.min.x, y: opening.max.y, z: opening.min.z },
  });
  const left = compileFill(leftPillar, block, maxCommandLength, [blockName]);
  steps.push(...left.steps);
  estimated += left.estimatedChangedBlocksUpperBound;

  // Right pillar
  const rightPillar = normalizeBBox({
    min: { x: opening.max.x, y: opening.min.y, z: opening.max.z },
    max: { x: opening.max.x, y: opening.max.y, z: opening.max.z },
  });
  const right = compileFill(rightPillar, block, maxCommandLength, [blockName]);
  steps.push(...right.steps);
  estimated += right.estimatedChangedBlocksUpperBound;

  // Top arch (simple: just fill the top row with slight curve)
  const topY = opening.max.y;
  const topBox = normalizeBBox({
    min: { x: opening.min.x, y: topY, z: opening.min.z },
    max: { x: opening.max.x, y: topY, z: opening.max.z },
  });
  const top = compileFill(topBox, block, maxCommandLength, [blockName]);
  steps.push(...top.steps);
  estimated += top.estimatedChangedBlocksUpperBound;

  return { steps, bbox: opening, estimatedChangedBlocksUpperBound: estimated };
}

function compileRoad(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'road' }>,
  maxCommandLength: number,
): StepBuild {
  const block = resolveBlockSpec(op.material, blueprint.palette);
  const blockName = blockNameFromSpec(op.material, blueprint.palette);
  const edgeBlock = op.edgeMaterial ? resolveBlockSpec(op.edgeMaterial, blueprint.palette) : null;
  const edgeName = op.edgeMaterial ? blockNameFromSpec(op.edgeMaterial, blueprint.palette) : null;
  const steps: ConstructionStep[] = [];
  let estimated = 0;
  let unionBox: BBox | null = null;

  const halfWidth = Math.floor(op.width / 2);

  // For each segment between path points
  for (let i = 0; i < op.path.length - 1; i++) {
    const pathP1 = op.path[i];
    const pathP2 = op.path[i + 1];
    if (!pathP1 || !pathP2) continue;
    const p1 = addVec(blueprint.origin, pathP1);
    const p2 = addVec(blueprint.origin, pathP2);

    // Determine direction
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const length = Math.max(Math.abs(dx), Math.abs(dz));

    if (length === 0) continue;

    const stepX = dx / length;
    const stepZ = dz / length;

    // Road runs perpendicular to movement direction
    const perpX = Math.abs(stepZ) > 0.5 ? 1 : 0;
    const perpZ = Math.abs(stepX) > 0.5 ? 1 : 0;

    for (let j = 0; j <= length; j++) {
      const cx = Math.round(p1.x + stepX * j);
      const cz = Math.round(p1.z + stepZ * j);
      const y = p1.y;

      // Main road surface
      const roadBox = normalizeBBox({
        min: { x: cx - perpX * halfWidth, y, z: cz - perpZ * halfWidth },
        max: { x: cx + perpX * halfWidth, y, z: cz + perpZ * halfWidth },
      });
      const road = compileFill(roadBox, block, maxCommandLength, [blockName]);
      steps.push(...road.steps);
      estimated += road.estimatedChangedBlocksUpperBound;
      unionBox = unionBox ? bboxUnion(unionBox, roadBox) : roadBox;

      // Edge blocks if specified
      if (edgeBlock && edgeName) {
        const edgeBoxes = [
          normalizeBBox({
            min: { x: cx - perpX * (halfWidth + 1), y, z: cz - perpZ * (halfWidth + 1) },
            max: { x: cx - perpX * (halfWidth + 1), y, z: cz - perpZ * (halfWidth + 1) },
          }),
          normalizeBBox({
            min: { x: cx + perpX * (halfWidth + 1), y, z: cz + perpZ * (halfWidth + 1) },
            max: { x: cx + perpX * (halfWidth + 1), y, z: cz + perpZ * (halfWidth + 1) },
          }),
        ];
        for (const eb of edgeBoxes) {
          const edge = compileFill(eb, edgeBlock, maxCommandLength, [edgeName]);
          steps.push(...edge.steps);
          estimated += edge.estimatedChangedBlocksUpperBound;
          unionBox = bboxUnion(unionBox!, eb);
        }
      }
    }
  }

  return {
    steps,
    bbox: unionBox ?? normalizeBBox({ min: blueprint.origin, max: blueprint.origin }),
    estimatedChangedBlocksUpperBound: estimated,
  };
}

function compileLamppost(
  blueprint: Blueprint,
  op: Extract<BlueprintOp, { op: 'lamppost' }>,
  maxCommandLength: number,
): StepBuild {
  const pos = addVec(blueprint.origin, op.at);
  const poleBlock = resolveBlockSpec(op.material, blueprint.palette);
  const poleName = blockNameFromSpec(op.material, blueprint.palette);
  const lightBlock = resolveBlockSpec(op.lightBlock, blueprint.palette);
  const lightName = blockNameFromSpec(op.lightBlock, blueprint.palette);
  const steps: ConstructionStep[] = [];
  let estimated = 0;

  // Pole
  const poleBox = normalizeBBox({
    min: pos,
    max: { x: pos.x, y: pos.y + op.height - 2, z: pos.z },
  });
  const pole = compileFill(poleBox, poleBlock, maxCommandLength, [poleName]);
  steps.push(...pole.steps);
  estimated += pole.estimatedChangedBlocksUpperBound;

  // Light at top
  const lightPos: Vec3i = { x: pos.x, y: pos.y + op.height - 1, z: pos.z };
  steps.push({
    kind: 'command',
    command: `/setblock ${lightPos.x} ${lightPos.y} ${lightPos.z} ${lightBlock}`,
    bbox: { min: lightPos, max: lightPos },
    estimatedChangedBlocksUpperBound: 1,
    blocksUsed: [lightName],
  });
  estimated += 1;

  return {
    steps,
    bbox: normalizeBBox({ min: pos, max: lightPos }),
    estimatedChangedBlocksUpperBound: estimated,
  };
}

