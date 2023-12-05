import { _number } from '.';

export function split<T>(array: T[], splitter: (item: T) => boolean = () => false, keep: boolean | ((item: T) => boolean) = false): T[][] {
  const _keep = typeof keep === 'function' ? keep : () => keep;
  const out = [];
  let start = 0;
  for (let i = 0; i < array.length; i++) {
    if (splitter(array[i])) {
      if (i > start) out.push(array.slice(start, i));
      if (_keep(array[i])) out.push([array[i]]);
      start = i + 1;
    }
  }
  out.push(array.slice(start));
  return out;
}

export function interleave<T>(array: T[], and: T | T[] | ((item: T) => T)): T[] {
  let out = array.flatMap((item, i) => {
    if (Array.isArray(and)) return and[i] ? [item, and[i]] : [item];
    if (typeof and === 'function') return [item, (<(item: T) => T>and)(item)];
    return [item, and];
  });
  if (Array.isArray(and) && and.length > array.length) out = out.concat(and.slice(array.length));
  return out;
}

export function reduceNoSkip<T>(array: T[], reducer: (acc: T, item?: T, i?: number) => T): T | undefined {
  switch (array.length) {
    case 0: return;
    case 1: return reducer(array[0]);
    default: return array.reduce(reducer);
  }
}

export function mapInPlace<T, R>(array: T[], mapper: (item: T, index: number, array: T[]) => R): R[] {
  for (let i = 0; i < array.length; i++) (<(T|R)[]>array)[i] = mapper(array[i], i, array);
  return array as unknown as R[];
}

export function remove<T>(from: T[], toRemove: T | T[]): T[] {
  if (!Array.isArray(toRemove)) return from.filter(item => item !== toRemove);
  const setToRemove = new Set(toRemove);
  return from.filter(item => !setToRemove.has(item));
}

export function repeat<T>(array: T[], times: number): T[] {
  let out: T[] = array;

  for (const factor of _number.primeFactors(times)) {
    out = [].concat(...Array(factor).fill(out));
  }

  return out;
}

export function chunks<T>(arr: T[], count: number): T[][] {
  const size = Math.floor(arr.length / count);
  const idx = (i: number) => i*size + Math.min(i, arr.length % count);
  return Array.from({ length: count }, (_, i) => arr.slice(idx(i), idx(i+1)));
}

export function chunksOfSize<T>(arr: T[], size: number): T[][] {
  const count = Math.ceil(arr.length / size);
  const idx = (i: number) => i*size + Math.min(i, arr.length % count);
  return Array.from({ length: count }, (_, i) => arr.slice(idx(i), idx(i+1)));
}

export function transpose<T>(arrs: T[][], empty?: any): T[][] {
  return arrs.toSorted((a,b) => b.length - a.length)[0]!.map((_, i) => arrs.map(arr => arr.length > i ? arr[i] : empty));
}