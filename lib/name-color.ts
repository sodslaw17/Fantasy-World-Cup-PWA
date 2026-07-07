const PALETTE = ["#0A3D91","#008A52","#E4002B","#7C3AED","#D97706","#059669","#DC2626","#2563EB","#0891B2","#9333EA"];

export function nameToColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}
