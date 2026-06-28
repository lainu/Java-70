export interface GenerationStyle {
  bg: string;
  text: string;
  border: string;
  tailwindBg: string;
}

const GENERATION_COLORS: GenerationStyle[] = [
  { bg: '#7C3AED', text: '#FFFFFF', border: '#6D28D9', tailwindBg: 'bg-violet-600' },   // 0 — founders
  { bg: '#1D4ED8', text: '#FFFFFF', border: '#1E40AF', tailwindBg: 'bg-blue-700' },     // 1
  { bg: '#047857', text: '#FFFFFF', border: '#065F46', tailwindBg: 'bg-emerald-700' },  // 2
  { bg: '#B45309', text: '#FFFFFF', border: '#92400E', tailwindBg: 'bg-amber-700' },    // 3
  { bg: '#DC2626', text: '#FFFFFF', border: '#B91C1C', tailwindBg: 'bg-red-600' },      // 4
  { bg: '#0891B2', text: '#FFFFFF', border: '#0E7490', tailwindBg: 'bg-cyan-600' },     // 5
  { bg: '#9333EA', text: '#FFFFFF', border: '#7E22CE', tailwindBg: 'bg-purple-600' },   // 6
  { bg: '#0F766E', text: '#FFFFFF', border: '#115E59', tailwindBg: 'bg-teal-700' },     // 7
  { bg: '#C2410C', text: '#FFFFFF', border: '#9A3412', tailwindBg: 'bg-orange-700' },   // 8
  { bg: '#1E40AF', text: '#FFFFFF', border: '#1E3A8A', tailwindBg: 'bg-blue-800' },     // 9
];

export function getGenerationStyle(generation: number | null): GenerationStyle {
  if (generation === null || generation === undefined) {
    return GENERATION_COLORS[0];
  }
  return GENERATION_COLORS[Math.abs(generation) % GENERATION_COLORS.length];
}

export function getAllGenerationColors(): GenerationStyle[] {
  return GENERATION_COLORS;
}
