import { _array, _number, _string } from '../lib';
import { BreezeContext } from './interpreter';

export type BreezeBuiltin = (ctx: BreezeContext, passed: any[], piped: any[]) => any[];

function typesOf(objects: any[]) {
  return objects.map(o => {
    switch (true) {
      case o === null: return 'null';
      case Array.isArray(o): return 'array';
      default: return typeof o;
    }
  }).join(',');
}

function combineArgs(func: (ctx: BreezeContext, args: any[]) => any[]): BreezeBuiltin {
  return (ctx, passed, piped) => func(ctx, piped.concat(passed));
}

function operator(func: (acc: any, item?: any, i?: number | undefined) => any): BreezeBuiltin {
  return combineArgs((_ctx, args) => [_array.reduceNoSkip(args, func)]);
}


function add(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'number': return a;
    case types === 'string':
    case types === 'boolean': return +a;
    case types === 'array': return _array.reduceNoSkip(a, add);

    case /^null,(?!array)/.test(types): return b;
    case /(?<!array),null$/.test(types): return a;
    case /^((string|number|boolean)(,|$)){2}/.test(types): return a + b;

    case types === 'array,array': return a.concat(b);
    case /^array,/.test(types): return a.concat([b]);
    case /,array$/.test(types): return [a].concat(b);
  }
}

function subtract(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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

    case types === 'array,array':
    case /^array,/.test(types): return _array.remove(a, b);
    case /,array$/.test(types): return _array.remove([a], b)[0];
  }
}

function multiply(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean': return a;
    case types === 'number': return a ** 2;
    case types === 'array': return _array.reduceNoSkip(a, multiply);

    case /string,(boolean|number)/.test(types): return a.repeat(+b);
    case /(boolean|number),string/.test(types): return b.repeat(+a);

    case /array,(boolean|number)/.test(types): return _array.repeat(a, +b);
    case /(boolean|number),array/.test(types): return _array.repeat(b, +a);

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
  }
}

function divide(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean': return a;
    case types === 'number': return [...a + ''].map(v => +v);
    case types === 'string': return a.split('');
    case types === 'array': return _array.reduceNoSkip(a, divide);

    case /string,(boolean|number)/.test(types): return b === 0 ? [] : _string.chunks(a, +b);
    case /(boolean|number),string/.test(types): return a === 0 ? [] : _string.chunks(b, +a);

    case /array,(boolean|number)/.test(types): return _array.chunks(a, +b);
    case /(boolean|number),array/.test(types): return _array.chunks(b, +a);

    case types === 'string,string': return a.split(b);

    case /^null,(?!array)/.test(types):
    case /(?<!array),null$/.test(types): return /string/.test(types) ? '' : a / 0;

    case /^((number|boolean)(,|$)){2}/.test(types): return a / b;
  }
}

function modulo(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case types === 'null':
    case types === 'boolean': return a;
    case types === 'number': return _number.divisors(a);
    case types === 'string': return a.split('');
    case types === 'array': return _array.reduceNoSkip(a, modulo);

    case /string,(boolean|number)/.test(types): return b === 0 ? [] : _string.chunksOfSize(a, +b);
    case /(boolean|number),string/.test(types): return a === 0 ? [] : _string.chunksOfSize(b, +a);

    case /array,(boolean|number)/.test(types): return _array.chunksOfSize(a, +b);
    case /(boolean|number),array/.test(types): return _array.chunksOfSize(b, +a);

    case types === 'string,string': return _string.indecesOf(a, b);

    case /^null,(?!array)/.test(types):
    case /(?<!array),null$/.test(types): return /string/.test(types) ? '' : 0 % b;

    case /^((number|boolean)(,|$)){2}/.test(types): return a % b;
  }
}


function bitwiseAnd(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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
      const setOfA = new Set(a);
      const setOfB = new Set(b);
      return _array.interleave(
        a.filter((v: any) => setOfB.has(v)),
        b.filter((v: any) => setOfA.has(v)),
      );
    }
    case /^array,/.test(types): return a.filter((v: any) => v === b);
    case /,array$/.test(types): return b.filter((v: any) => v === a);
  }
}

function bitwiseOr(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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

    case types === 'array,array': return _array.interleave(a, b);
    case /^array,/.test(types): return a;
    case /,array$/.test(types): return b;
  }
}

function bitwiseXor(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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
      const setOfA = new Set(a);
      const setOfB = new Set(b);
      return _array.interleave(
        a.filter((v: any) => !setOfB.has(v)),
        b.filter((v: any) => !setOfA.has(v)),
      );
    }
    case /^array,/.test(types): return a.filter((v: any) => v !== b);
    case /,array$/.test(types): return b.filter((v: any) => v !== a);
  }
}

function shiftLeft(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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
  const types = typesOf(b !== undefined ? [a, b] : [a]);
  
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
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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


function comparisonOperator(func: (a: any, b?: any, i?: number | undefined) => any): BreezeBuiltin {
  return combineArgs((_ctx, args) => {
    switch (args.length) {
      case 0:
      case 1: return args;
      default: {
        const out = [];
        for (let i = 1; i < args.length - 1; i++) {
          const a = args[i];
          const b = args[i + 1];
          out.push(func(a, b, i));
        }
        return out;
      }
    }
  });
}


function greater(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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
  const types = typesOf(b !== undefined ? [a, b] : [a]);
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


function setOperator(func: (acc: any, item?: any, i?: number | undefined) => any): BreezeBuiltin {
  return combineArgs((_ctx, args) => {
    return args.length ? [args.map(arg => {
      switch(typesOf([arg])) {
        case 'array': return arg;
        case 'string': return arg.split('');
        default: return [arg];
      }
    }).reduce(func)]: [];
  });
}


function union(a: any[], b: any[]): any[] {
  return [...new Set(a.concat(b))];
}

function intersection(a: any[], b: any[]): any[] {
  const setOfA = new Set(a);
  const setOfB = new Set(b);
  return [...setOfA].filter(item => setOfB.has(item));
}

function difference(a: any[], b: any[]): any[] {
  const setOfA = new Set(a);
  const setOfB = new Set(b);
  return [...setOfA].filter(item => !setOfB.has(item));
}

function memberOf(a: any[], b: any[]): boolean {
  return b.includes(a);
}

function has(a: any[], b: any[]): boolean {
  return a.includes(b);
}

function subsetOf(a: any[], b: any[]): boolean {
  const setOfB = new Set(b);
  return a.every(item => setOfB.has(item));
}

function supersetOf(a: any[], b: any[]): boolean {
  const setOfA = new Set(a);
  return b.every(item => setOfA.has(item));
}


function join(a: any, b?: any): any {
  const types = typesOf(b !== undefined ? [a, b] : [a]);
  switch (true) {
    case /^(array|string),(boolean|number|string)$/.test(types): return [...a].join(b);
    case /^(boolean|number),(array|string)$/.test(types): return [...b].join(a);
    default: throw new Error(`Cannot join arguments of types \`${types}\``);
  }
}


const builtins = {
  '_': combineArgs((_ctx, args) => args),

  '›': (_ctx, passed, piped): any[] => passed.length ? passed.slice(1).concat(piped.slice(0, -passed[0])) : piped.slice(0, -1),
  '‹': (_ctx, passed, piped): any[] => passed.length ? piped.slice(passed[0]).concat(passed.slice(1)) : piped.slice(1),

  '…': combineArgs((_ctx, args): any[] => (console.log(...args), [])),
  '.': combineArgs((_ctx, args): any[] => (process.stdout.write(args.join('')), [])),

  '~': combineArgs((_ctx, args): number[] => {
    let [from, to, step] = args;
    if (typeof to !== 'number') {
      to = from;
      from = 0;
    }
    if (typeof step !== 'number') step = from < to ? 1 : -1;
    return _number.range(from, to, step);
  }),

  // Arithmetic Operators
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
  '>': comparisonOperator(greater),
  '≥': comparisonOperator(greaterOrEqual),
  '<': comparisonOperator(less),
  '≤': comparisonOperator(lessOrEqual),

  // Set Operators
  '∪': setOperator(union),
  '∩': setOperator(intersection),
  '∖': setOperator(difference),
  '∈': setOperator(memberOf),
  '∋': setOperator(has),
  '⊂': setOperator(subsetOf),
  '⊃': setOperator(supersetOf),

  // Sequence Operators
  '⨝': operator(join),

  // variables
  'i': (ctx): [number] => [ctx.i],
  '$': (ctx, passed): any[] => passed[0] ? [ctx.$[passed[0]]] : ctx.$,

  // constants
  'ε': (): [string] => [''],
  '∅': (): [any[]] => [[]],
} as { [key: string]: BreezeBuiltin }

export default builtins;