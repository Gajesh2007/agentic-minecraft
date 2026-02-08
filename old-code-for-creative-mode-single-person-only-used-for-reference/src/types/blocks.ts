export type BlockSpec = Readonly<{
  name?: string;
  state?: string;
  bind?: string;
}>;

export type Palette = Readonly<Record<string, string>>;

export function resolveBlockSpec(spec: BlockSpec, palette: Palette | undefined): string {
  if (spec.state && spec.state.length > 0) return spec.state;
  if (spec.name && spec.name.length > 0) return spec.name;
  const bound = spec.bind && palette ? palette[spec.bind] : undefined;
  if (typeof bound === 'string' && bound.length > 0) return bound;
  throw new Error('Invalid BlockSpec: no name/state/bind resolved');
}

export function blockNameFromSpec(spec: BlockSpec, palette: Palette | undefined): string {
  const resolved = resolveBlockSpec(spec, palette);
  return resolved.split('[')[0] ?? resolved;
}

