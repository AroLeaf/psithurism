export function divisors(n: number): number[] {
  const divs = [1];
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (!(n % i)) {
      divs.push(i);
      if (n / i !== i) divs.push(n / i);
    }
  }
  const l = divs.length;
  const sorted: number[] = [];
  for (let i = 0; i < l; i += 2) {
    sorted[i/2] = divs[i];
    sorted[l - i/2 - 1] = divs[i + 1];
  }
  return sorted;
}

export function range(from: number, to: number, step: number) {
  if (from - to * step >= 0) return [];
  return Array.from({ length: Math.ceil((from - to) / -step) }, (_, i) => from + i * step);
}

export function digits(n: number, base = 10): number[] {
  return Array.from(n.toString(base), Number);
}

export function primeFactors(n: number): number[] {
  if (n === 1) return [1];
  const factors = [];
  let divisor = 2;
  while (n >= 2) {
    if (n % divisor) {
      divisor++;
      continue;
    }
    factors.push(divisor);
    n /= divisor;
  }
  return factors;
}