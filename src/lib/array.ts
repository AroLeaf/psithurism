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
  return array.flatMap((item, i) => {
    if (Array.isArray(and)) return and[i] ? [item, and[i]] : [item];
    if (typeof and === 'function') return [item, (<(item: T) => T>and)(item)];
    return [item, and];
  });
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