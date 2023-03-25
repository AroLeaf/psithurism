import { _array, _number, _string } from '../lib';
import { BreezeContext } from './interpreter';

export type BreezeBuiltin = (ctx: BreezeContext, passed: any[], piped: any[]) => any[];

function getTypesString(objects: any[]) {
  return objects.map(o => {
    switch (true) {
      case o === null: return 'null';
      case Array.isArray(o): return 'array';
      default: return typeof o;
    }
  }).join(',');
}

function operator(func: (acc: any, item?: any, i?: number | undefined) => any): BreezeBuiltin {
  return (_ctx, passed, piped) => [_array.reduceNoSkip(piped.concat(passed), func)];
}


function add(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'number': return a;
    case types === 'string':
    case types === 'boolean': return +a;
    case types === 'array': return _array.reduceNoSkip(a, add);

    case /^null,(?!array)/.test(types): return b;
    case /(?<!array),null$/.test(types): return a;
    case /^((string|number|boolean)(,|$)){2}/.test(types): return a + b;

    case types === 'array,array': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return l.map((v: any, i: number) => add(v, s[i] || null));
    }
    case /^array,/.test(types): return a.map((v: any) => add(v, b));
    case /,array$/.test(types): return b.map((v: any) => add(a, v));
  }
}

function subtract(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null': return a;
    case types === 'number':
    case types === 'boolean':
    case types === 'string': return -a;
    case types === 'array': return _array.reduceNoSkip(a, subtract);

    case types === 'null,string': return b;
    case /^null,(?!array)/.test(types): return -b;
    case /(?<!array),null$/.test(types): return a;

    case /^((number|boolean)(,|$)){2}/.test(types): return a - b;

    case types === 'string,string': return a.replace(b, '');
    case types === 'string,number': return a.slice(0, -b);
    case types === 'number,string': return b.slice(a);

    case types === 'array,array': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return l.map((v: any, i: number) => subtract(v, s[i] || null));
    }
    case /^array,/.test(types): return a.map((v: any) => subtract(v, b));
    case /,array$/.test(types): return b.map((v: any) => subtract(a, v));
  }
}

function multiply(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean': return a;
    case types === 'number': return a ** 2;
    case types === 'array': return _array.reduceNoSkip(a, multiply);

    case /string,(boolean|number)/.test(types): return a.repeat(+b);
    case /(boolean|number),string/.test(types): return b.repeat(+a);

    case types === 'string,string': {
      const f = (a: string, b: string): string[] => {
        if (!(a || b)) return [''];

        const ca = a[0] || '';
        const cb = b[0] || '';
        const rest = f(a.slice(1), b.slice(1));

        return [...new Set(ca === cb
          ? rest.map(e => ca + e)
          : rest.flatMap(e => [ca + e, cb + e])
        )];
      }

      return f(a, b);
    }

    case /^null,(?!array)/.test(types):
    case /(?<!array),null$/.test(types): return /string/.test(types) ? '' : 0;

    case /^((number|boolean)(,|$)){2}/.test(types): return a * b;

    case types === 'array,array': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return l.map((v: any, i: number) => multiply(v, s[i] || null));
    }
    case /^array,/.test(types): return a.map((v: any) => multiply(v, b));
    case /,array$/.test(types): return b.map((v: any) => multiply(a, v));
  }
}

function divide(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean': return a;
    case types === 'number': return [...a + ''].map(v => +v);
    case types === 'string': return a.split('');
    case types === 'array': return _array.reduceNoSkip(a, divide);

    case /string,(boolean|number)/.test(types): return b === 0 ? [] : _string.chunks(a, +b);
    case /(boolean|number),string/.test(types): return a === 0 ? [] : _string.chunks(b, +a);

    case types === 'string,string': return a.split(b);

    case /^null,(?!array)/.test(types):
    case /(?<!array),null$/.test(types): return /string/.test(types) ? '' : a / 0;

    case /^((number|boolean)(,|$)){2}/.test(types): return a / b;

    case types === 'array,array': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return l.map((v: any, i: number) => divide(v, s[i] || null));
    }
    case /^array,/.test(types): return a.map((v: any) => divide(v, b));
    case /,array$/.test(types): return b.map((v: any) => divide(a, v));
  }
}

function modulo(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean': return a;
    case types === 'number': return _number.divisors(a);
    case types === 'string': return a.split('');
    case types === 'array': return _array.reduceNoSkip(a, modulo);

    case /string,(boolean|number)/.test(types): return b === 0 ? [] : _string.chunksOfSize(a, +b);
    case /(boolean|number),string/.test(types): return a === 0 ? [] : _string.chunksOfSize(b, +a);

    case types === 'string,string': return _string.indecesOf(a, b);

    case /^null,(?!array)/.test(types):
    case /(?<!array),null$/.test(types): return /string/.test(types) ? '' : 0 % b;

    case /^((number|boolean)(,|$)){2}/.test(types): return a % b;

    case types === 'array,array': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return l.map((v: any, i: number) => modulo(v, s[i] || null));
    }
    case /^array,/.test(types): return a.map((v: any) => modulo(v, b));
    case /,array$/.test(types): return b.map((v: any) => modulo(a, v));
  }
}


function bitwiseAnd(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean':
    case types === 'number':
    case types === 'string': return a;
    case types === 'array': return _array.reduceNoSkip(a, bitwiseAnd);

    case /^null,(?!array)/.test(types):
    case /(?<!array),null$/.test(types): return /string/.test(types) ? '' : 0;

    case /^((number|boolean)(,|$)){2}/.test(types): return a & b;



    case /string,(boolean|number)/.test(types): {
      const mask = _number.digits(b, 2);
      return [...a].filter((_, i) => mask[i]).join('');
    }
    case /(boolean|number),string/.test(types): {
      const mask = _number.digits(a, 2);
      return [...b].filter((_, i) => mask[i]).join('');
    }

    case types === 'string,string': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return [...l].filter((c, i) => s[i] === c).join('');
    }

    case types === 'array,array': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return l.map((v: any, i: number) => bitwiseAnd(v, s[i] || null));
    }
    case /^array,/.test(types): return a.map((v: any) => bitwiseAnd(v, b));
    case /,array$/.test(types): return b.map((v: any) => bitwiseAnd(a, v));
  }
}

function bitwiseOr(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean':
    case types === 'number':
    case types === 'string': return a;
    case types === 'array': return _array.reduceNoSkip(a, bitwiseOr);

    case /^null,(?!array)/.test(types): return b;
    case /(?<!array),null$/.test(types): return a;

    case /^((number|boolean)(,|$)){2}/.test(types): return a | b;

    case /string,(boolean|number)/.test(types): return a;
    case /(boolean|number),string/.test(types): return b;

    case types === 'string,string': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return [...l].map((c, i) => s[i] || c);
    }

    case types === 'array,array': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return l.map((v: any, i: number) => bitwiseOr(v, s[i] || null));
    }
    case /^array,/.test(types): return a.map((v: any) => bitwiseOr(v, b));
    case /,array$/.test(types): return b.map((v: any) => bitwiseOr(a, v));
  }
}

function bitwiseXor(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean':
    case types === 'number':
    case types === 'string': return a;
    case types === 'array': return _array.reduceNoSkip(a, bitwiseXor);

    case /^null,(?!array)/.test(types): return b;
    case /(?<!array),null$/.test(types): return a;

    case /^((number|boolean)(,|$)){2}/.test(types): return a ^ b;

    case /string,(boolean|number)/.test(types): {
      const mask = _number.digits(b, 2);
      return [...a].filter((_, i) => !mask[i]).join('');
    }
    case /(boolean|number),string/.test(types): {
      const mask = _number.digits(a, 2);
      return [...b].filter((_, i) => !mask[i]).join('');
    }

    case types === 'string,string': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return [...l].filter((c, i) => s[i] !== c).join('');
    }

    case types === 'array,array': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return l.map((v: any, i: number) => bitwiseXor(v, s[i] || null));
    }
    case /^array,/.test(types): return a.map((v: any) => bitwiseXor(v, b));
    case /,array$/.test(types): return b.map((v: any) => bitwiseXor(a, v));
  }
}

function shiftLeft(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null': return 0;
    case types === 'boolean':
    case types === 'number': return a << 1;
    case types === 'string': return Buffer.from(a).map(char => char - 1).toString();
    case types === 'array': return _array.reduceNoSkip(a, shiftLeft);

    case /^null,(?!array)/.test(types): return /string/.test(types) ? '' : 0;
    case /(?<!array),null$/.test(types): return a;

    case /^((number|boolean)(,|$)){2}/.test(types): return a << b;

    case /string,(boolean|number)/.test(types): return Buffer.from(a).map(char => char - b).toString();
    case /(boolean|number),string/.test(types): return Buffer.from(b).map(char => char - a).toString();

    case types === 'array,array': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return l.map((v: any, i: number) => shiftLeft(v, s[i] || null));
    }
    case /^array,/.test(types): return a.map((v: any) => shiftLeft(v, b));
    case /,array$/.test(types): return b.map((v: any) => shiftLeft(a, v));
  }
}

function shiftRight(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  
  switch (true) {
    case types === 'null': return 0;
    case types === 'boolean':
    case types === 'number': return a >> 1;
    case types === 'string': return Buffer.from(a).map(char => char + 1).toString();
    case types === 'array': return _array.reduceNoSkip(a, shiftRight);

    case /^null,(?!array)/.test(types): return /string/.test(types) ? '' : 0;
    case /(?<!array),null$/.test(types): return a;

    case /^((number|boolean)(,|$)){2}/.test(types): return a >> b;

    case /string,(boolean|number)/.test(types): return Buffer.from(a).map(char => char + b).toString();
    case /(boolean|number),string/.test(types): return Buffer.from(b).map(char => char + a).toString();

    case types === 'array,array': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return l.map((v: any, i: number) => shiftRight(v, s[i] || null));
    }
    case /^array,/.test(types): return a.map((v: any) => shiftRight(v, b));
    case /,array$/.test(types): return b.map((v: any) => shiftRight(a, v));
  }
}


function equals(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean':
    case types === 'number':
    case types === 'string': return true;
    case types === 'array': return _array.reduceNoSkip(a, equals);

    case types === 'null,null': return true;
    case /^null,/.test(types):
    case /,null$/.test(types): return false;

    case /^((number|boolean|string)(,|$)){2}/.test(types): return a === b;

    case types === 'array,array': return a.length === b.length && a.every((v: any, i: number) => equals(v, b[i]));
    case /^array,/.test(types):
    case /,array$/.test(types): return false;
  }
}

function notEquals(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean':
    case types === 'number':
    case types === 'string': return false;
    case types === 'array': return _array.reduceNoSkip(a, notEquals);

    case types === 'null,null': return false;
    case /^null,/.test(types):
    case /,null$/.test(types): return true;

    case /^((number|boolean|string)(,|$)){2}/.test(types): return a !== b;

    case types === 'array,array': return a.length !== b.length || a.some((v: any, i: number) => notEquals(v, b[i]));
    case /^array,/.test(types):
    case /,array$/.test(types): return true;
  }
}

function approximatelyEquals(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean':
    case types === 'number':
    case types === 'string': return true;
    case types === 'array': return _array.reduceNoSkip(a, approximatelyEquals);

    case types === 'null,null': return true;
    case types === 'null,array': return b.length === 0;
    case types === 'array,null': return a.length === 0;
    case /^null,/.test(types): return !b;
    case /,null$/.test(types): return !a;

    case /^((number|boolean)(,|$)){2}/.test(types):
    case /string,(boolean|number)/.test(types):
    case /(boolean|number),string/.test(types): return a == b;

    case types === 'string,string': {
      if (a.length !== b.length) return false;
      const _a = [...a].sort().join();
      const _b = [...b].sort().join();
      return _a === _b;
    }

    case types === 'array,array': return a.length === b.length && a.every((v: any, i: number) => approximatelyEquals(v, b[i]));
    case /^array,/.test(types):
    case /,array$/.test(types): return false;
  }
}

function notApproximatelyEquals(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean':
    case types === 'number':
    case types === 'string': return false;
    case types === 'array': return _array.reduceNoSkip(a, notApproximatelyEquals);

    case types === 'null,null': return false;
    case types === 'null,array': return b.length !== 0;
    case types === 'array,null': return a.length !== 0;
    case /^null,/.test(types): return !!b;
    case /,null$/.test(types): return !!a;

    case /^((number|boolean)(,|$)){2}/.test(types):
    case /string,(boolean|number)/.test(types):
    case /(boolean|number),string/.test(types): return a != b;

    case types === 'string,string': {
      if (a.length !== b.length) return true;
      const _a = [...a].sort().join();
      const _b = [...b].sort().join();
      return _a !== _b;
    }

    case types === 'array,array': return a.length !== b.length || a.some((v: any, i: number) => notApproximatelyEquals(v, b[i]));
    case /^array,/.test(types):
    case /,array$/.test(types): return true;
  }
}


function greater(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null': return false;
    case types === 'boolean': return a;
    case types === 'number': return a > 0;
    case types === 'string': return a.length > 0;
    case types === 'array' : return _array.reduceNoSkip(a, greater);

    case types === 'null,null':
    case types === 'null,string': return false;
    case types === 'string,null': return a.length > 0;
    case /^null,(?!array)/.test(types): return 0 > b;
    case /(?<!array),null$/.test(types): return a > 0;

    case /^((number|boolean|string)(,|$)){2}/.test(types): return a > b;

    case types === 'array,null': return a.length > 0;
    case types === 'null,array': return false;
    case types === 'array,array': return a.length > b.length;
    case types === 'array,number': return a.length > b;
    case types === 'number,array': return a > b.length;
  }
}

function greaterOrEqual(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean':
    case types === 'string': return true;
    case types === 'number': return a >= 0;
    case types === 'array' : return _array.reduceNoSkip(a, greaterOrEqual);

    case /(array|string),null/.test(types): return true;
    case /null,(array|string)/.test(types): return b.length === 0;

    case types === 'null,null': return true;
    case /^null,(?!array)/.test(types): return 0 >= b;
    case /(?<!array),null$/.test(types): return a >= 0;

    case /^((number|boolean|string)(,|$)){2}/.test(types): return a >= b;

    case types === 'array,array': return a.length >= b.length;
    case types === 'array,number': return a.length >= b;
    case types === 'number,array': return a >= b.length;
  }
}

function less(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean':
    case types === 'string': return false;
    case types === 'number': return a < 0;
    case types === 'array' : return _array.reduceNoSkip(a, less);

    case types === 'null,null':
    case types === 'null,string': return b.length > 0;
    case types === 'string,null': return false;
    case /^null,(?!array)/.test(types): return 0 < b;
    case /(?<!array),null$/.test(types): return a < 0;

    case /^((number|boolean|string)(,|$)){2}/.test(types): return a < b;

    case types === 'array,null': return false;
    case types === 'null,array': return b.length > 0;
    case types === 'array,array': return a.length < b.length;
    case types === 'array,number': return a.length < b;
    case types === 'number,array': return a < b.length;
  }
}

function lessOrEqual(a: any, b?: any): any {
  const types = getTypesString(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null': return true;
    case types === 'boolean': return !a;
    case types === 'string': return a.length === 0;
    case types === 'number': return a <= 0;
    case types === 'array' : return _array.reduceNoSkip(a, lessOrEqual);

    case /(array|string),null/.test(types): return a.length === 0
    case /null,(array|string)/.test(types): return true;

    case types === 'null,null': return true;
    case /^null,(?!array)/.test(types): return 0 <= b;
    case /(?<!array),null$/.test(types): return a <= 0;

    case /^((number|boolean|string)(,|$)){2}/.test(types): return a <= b;
    
    case types === 'array,array': return a.length <= b.length;
    case types === 'array,number': return a.length <= b;
    case types === 'number,array': return a <= b.length;
  }
}


const builtins = {
  '_': (_ctx, passed, piped) => piped.concat(passed),

  '›': (_ctx, passed, piped, args = piped.concat(passed)): any[] => args.slice(0, ~(passed.at(-1) || 0)),
  '‹': (_ctx, passed, piped, args = piped.concat(passed)): any[] => args.slice(passed.at(-1) || 1, -!!passed.length),

  '…': (_ctx, passed, piped): any[] => (console.log(...piped, ...passed), []),
  '.': (_ctx, passed, piped, args = piped.concat(passed)): any[] => (process.stdout.write(args.join(' ')), []),

  '~': (_ctx, passed, piped, args = piped.concat(passed)): number[] => {
    let [from, to, step] = args;
    if (typeof to !== 'number') {
      to = from;
      from = 0;
    }
    if (typeof step !== 'number') step = from < to ? 1 : -1;
    return _number.range(from, to, step);
  },

  // Math Operators
  '+': operator(add),
  '-': operator(subtract),
  '*': operator(multiply),
  '/': operator(divide),
  '%': operator(modulo),

  // Logical Operators
  '∨': operator(((a: any, b: any) => a || b)),
  '∧': operator(((a: any, b: any) => a && b)),
  '⊻': operator(((a: any, b: any) => a ? b ? false : a : b)),

  // Bitwise Operators
  '&': operator(bitwiseAnd),
  '‖': operator(bitwiseOr),
  '^': operator(bitwiseXor),
  '«': operator(shiftLeft),
  '»': operator(shiftRight),

  // Equality Operators
  '=': operator(equals),
  '≠': operator(notEquals),
  '≈': operator(approximatelyEquals),
  '≉': operator(notApproximatelyEquals),

  // Comparison Operators
  '>': operator(greater),
  '≥': operator(greaterOrEqual),
  '<': operator(less),
  '≤': operator(lessOrEqual),

  // variables
  'i': (ctx): [number] => [ctx.i],
  '$': (ctx, passed, piped, args = piped.concat(passed)): any[] => args.length ? [ctx.$[args.at(-1)]] : ctx.$,

  // constants
  'ε': (): [string] => [''],
  '∅': (): [any[]] => [[]],
} as { [key: string]: BreezeBuiltin }

export default builtins;