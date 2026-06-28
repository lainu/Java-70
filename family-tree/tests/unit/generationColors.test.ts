import { describe, it, expect } from 'vitest';
import { getGenerationStyle, getAllGenerationColors } from '@/lib/tree/generationColors';

describe('getGenerationStyle', () => {
  it('returns a style for generation 0', () => {
    const style = getGenerationStyle(0);
    expect(style.bg).toBe('#7C3AED');
    expect(style.text).toBe('#FFFFFF');
  });

  it('wraps around for generations >= 10', () => {
    expect(getGenerationStyle(10)).toEqual(getGenerationStyle(0));
    expect(getGenerationStyle(11)).toEqual(getGenerationStyle(1));
  });

  it('handles null generation gracefully', () => {
    const style = getGenerationStyle(null);
    expect(style).toBeDefined();
    expect(style.bg).toBeTruthy();
  });

  it('returns distinct colors for first 5 generations', () => {
    const bgs = [0, 1, 2, 3, 4].map((g) => getGenerationStyle(g).bg);
    const unique = new Set(bgs);
    expect(unique.size).toBe(5);
  });
});

describe('getAllGenerationColors', () => {
  it('returns 10 colors', () => {
    expect(getAllGenerationColors()).toHaveLength(10);
  });
});
