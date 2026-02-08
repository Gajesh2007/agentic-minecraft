import { BBox, Vec3i, bboxDimensions, normalizeBBox } from '../types/geometry.js';
import { StructureTemplate } from './template-store.js';

const MAX_CLONE_VOLUME = 32768;

export function generateCloneCommands(
  template: StructureTemplate,
  destination: Vec3i,
  options?: { maskMode?: 'masked' | 'filtered' | 'replace'; cloneMode?: 'force' | 'move' | 'normal' },
): string[] {
  const { sourceBbox, dimensions } = template;
  const maskMode = options?.maskMode ?? 'replace';
  const cloneMode = options?.cloneMode ?? 'force';

  const volume = dimensions.dx * dimensions.dy * dimensions.dz;
  if (volume <= MAX_CLONE_VOLUME) {
    return [
      `/clone ${sourceBbox.min.x} ${sourceBbox.min.y} ${sourceBbox.min.z} ${sourceBbox.max.x} ${sourceBbox.max.y} ${sourceBbox.max.z} ${destination.x} ${destination.y} ${destination.z} ${maskMode} ${cloneMode}`,
    ];
  }

  return splitClone(sourceBbox, destination, dimensions, maskMode, cloneMode);
}

function splitClone(
  src: BBox,
  dest: Vec3i,
  dims: { dx: number; dy: number; dz: number },
  maskMode: string,
  cloneMode: string,
): string[] {
  const commands: string[] = [];

  // Split along the longest axis into slices under MAX_CLONE_VOLUME
  const sliceArea = dims.dy * dims.dz;
  const maxSliceX = sliceArea > 0 ? Math.floor(MAX_CLONE_VOLUME / sliceArea) : dims.dx;
  const sliceWidth = Math.max(1, Math.min(maxSliceX, dims.dx));

  for (let offsetX = 0; offsetX < dims.dx; offsetX += sliceWidth) {
    const endX = Math.min(offsetX + sliceWidth - 1, dims.dx - 1);
    const sliceSrc = normalizeBBox({
      min: { x: src.min.x + offsetX, y: src.min.y, z: src.min.z },
      max: { x: src.min.x + endX, y: src.max.y, z: src.max.z },
    });
    const sliceDest: Vec3i = { x: dest.x + offsetX, y: dest.y, z: dest.z };

    commands.push(
      `/clone ${sliceSrc.min.x} ${sliceSrc.min.y} ${sliceSrc.min.z} ${sliceSrc.max.x} ${sliceSrc.max.y} ${sliceSrc.max.z} ${sliceDest.x} ${sliceDest.y} ${sliceDest.z} ${maskMode} ${cloneMode}`,
    );
  }

  return commands;
}
