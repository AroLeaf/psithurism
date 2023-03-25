import { _array } from '.';

export function chunks(str: string, count: number): string[] {
  const size = Math.floor(str.length / count);
  const idx = (i: number) => i*size + Math.min(i, str.length % count);
  return Array.from({ length: count }, (_, i) => str.slice(idx(i), idx(i+1)));
}

export function chunksOfSize(str: string, size: number): string[] {
  const count = Math.ceil(str.length / size);
  const idx = (i: number) => i*size + Math.min(i, str.length % count);
  return Array.from({ length: count }, (_, i) => str.slice(idx(i), idx(i+1)));
}

export function indecesOf(str: string, substr: string): number[] {
  const indices: number[] = [];
  let i = -1;
  while ((i = str.indexOf(substr, i+1)) >= 0) indices.push(i);
  return indices;
}

export function levenshtein(a: string, b: string) {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) for (let j = 0; j <= b.length; j++) {
    matrix[i][j] = !i?j:!j?i:Math.min(
      matrix[i-1][j] + 1,
      matrix[i][j-1] + 1,
      matrix[i-1][j-1] + +(a[i]!==b[j]),
    );
  }
  return matrix[a.length][b.length];
}