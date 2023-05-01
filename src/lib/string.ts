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
  for (let x = 0; x <= a.length; x++) for (let y = 0; y <= b.length; y++) {
    matrix[x][y] = !x?y:!y?x:Math.min(
      matrix[x-1][y] + 1,
      matrix[x][y-1] + 1,
      matrix[x-1][y-1] + +(a[x]!==b[y]),
    );
  }
  return matrix[a.length][b.length];
}