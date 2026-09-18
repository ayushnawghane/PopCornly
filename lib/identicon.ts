// Deterministic 5x5 symmetric pattern (GitHub-identicon style) from a seed
// string. Used for decorative avatars where visual variety matters more
// than recognizing an individual (landing hero, auth-page chip trios).
export function generateIdenticonGrid(seed: string): boolean[][] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

  const bits: boolean[] = [];
  let h = hash || 1;
  for (let i = 0; i < 15; i++) {
    // xorshift32 for a wider spread than the multiplicative hash alone
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    bits.push(h % 3 !== 0); // ~2/3 fill rate reads better than 50/50
  }

  const grid: boolean[][] = [];
  for (let row = 0; row < 5; row++) {
    const left = bits.slice(row * 3, row * 3 + 3);
    grid.push([left[0], left[1], left[2], left[1], left[0]]);
  }
  return grid;
}
