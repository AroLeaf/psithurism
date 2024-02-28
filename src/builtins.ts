import { _array, _number, _string } from './lib';
import { Builtin } from './types';

function typesof(...values: any[]) {
  return values.map(value => {
    switch(true) {
      case Array.isArray(value): return 'array';
      case value instanceof RegExp: return 'regex';
      case value === null: return 'null';
      default: return typeof value;
    }
  }).filter(v => v !== 'undefined').join(',');
}

function vectorize<A, B, R>(left: A[], right: B[], func: (a: A, b: B) => R): R[] {
  if (left.length === 1) return right.map(v => func(left[0], v));
  if (right.length === 1) return left.map(v => func(v, right[0]));

  if (left.length !== right.length) throw new Error('Can\'t vectorize two arrays with differing lengths!');
  return left.map((v, i) => func(v, right[i]));
}

function operatorBuiltin(func: (a: any, b: any, v?: boolean) => any): Builtin {
  return {
    operator(_state, left, right) {
      return vectorize(left, right, (a, b) => func(a, b, true));
    },
    
    operand(_state, piped, passed) {
      const args = piped.concat(passed);
      return [_array.reduceNoSkip(args, (a, b) => func(a, b))];
    },
  }
}

function overload(name: string, overloads: Record<string, (a: any, b: any, v?: boolean) => any>): (a: any, b: any, v?: boolean) => any {
  const table: Record<string, (a: any, b: any, v?: boolean) => any> = {};
  
  for (const [types, func] of Object.entries(overloads).toReversed()) {
    const [left, right] = types.replaceAll(' ', '').split(',').map(side => side.split('|'));
    
    const pairs = left.flatMap(ltype => right?.map(rtype => `${ltype},${rtype}`) || ltype);
    for (const pair of pairs) {
      table[pair] = func;
    }
  }

  return (a: any, b: any, v?: boolean) => {
    const types = typesof(a, b);
    const [ atype, btype ] = types.split(',');

    if (v && table.vectorize && (atype === 'array' || btype === 'array')) {
      const args: [any[], any[]] = [
        atype === 'array' ? a : [a],
        btype === 'array' ? b : [b],
      ];
      return vectorize(...args, table.vectorize);
    }
    
    const overload = table[types]
      || table[`${atype},*`]
      || table[`*,${btype}`]
      || table['*,*']
      || table['*'];
    
    if (!overload) {
      if (typeof btype === 'undefined') throw new Error(`No overload found for ${name} ${atype}.`);
      else throw new Error(`No overload found for ${atype} ${name} ${btype}.`);
    }

    return overload(a, b, v);
  }
}


const add = overload('add', {
  'vectorize': (a, b) => add(a, b, true),

  'string|number|boolean|null': (a: string|number|boolean|null) => Number(a),

  'string,null': (a: string, _: null) => a,
  'null,string': (_: null, b: string) => b,

  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) + Number(b),
  'string, string|number|boolean|null': (a: string, b: string|number|boolean|null) => a + (b?.toString() ?? ''),
  'string|number|boolean|null, string': (a: string|number|boolean|null, b: string) => (a?.toString() ?? '') + b,
});

const subtract = overload('subtract', {
  'vectorize': (a, b) => subtract(a, b, true),

  'string|number|boolean|null': (a: string|number|boolean|null) => -Number(a),

  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) - Number(b),

  'string, number|boolean|null': (a: string, b: number|boolean|null) => a.slice(0, -Number(b)),
  'number|boolean|null, string': (a: number|boolean|null, b: string) => b.slice(Number(a)),

  'string, string|regex': (a: string, b: string|RegExp) => a.replaceAll(b, ''),
  'regex, string': (a: RegExp, b: string) => b.replaceAll(a, ''),

  'array, *': (a: unknown[], b: unknown) => _array.remove(a, b),
  '*, array': (a: unknown, b: unknown[]) => _array.remove([a], b)[0],
});

const multiply = overload('multiply', {
  'vectorize': (a, b) => multiply(a, b, true),

  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) * Number(b),

  'string, boolean|number|null': (a: string, b: boolean|number|null) => a.repeat(Number(b)),
  'boolean|number|null, string': (a: boolean|number|null, b: string) => b.repeat(Number(a)),

  'array, boolean|number|null': (a: any[], b: boolean|number|null) => _array.repeat(a, Number(b)),
  'boolean|number|null, array': (a: boolean|number|null, b: any[]) => _array.repeat(b, Number(a)),

  'string, string': (a: string, b: string) => {
    const f = (a: string, b: string): string[] => {
      if (!(a || b)) return [''];

      const ca   = a[0] || '';
      const cb   = b[0] || '';
      const rest = f(a.slice(1), b.slice(1));

      return [...new Set(ca === cb
        ? rest.map(e => ca + e)
        : rest.flatMap(e => [ca + e, cb + e])
      )];
    }

    return f(a, b);
  },

  'string, regex': (a: string, b: RegExp) => a.match(b),
  'regex, string': (a: RegExp, b: string) => b.match(a),
});

const divide = overload('divide', {
  'vectorize': (a, b) => divide(a, b, true),

  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) / Number(b),

  'string, number|boolean|null': (a: string, b: number|boolean|null) => Number(b) === 0 ? [] : _string.chunks(a, Number(b)),
  'number|boolean|null, string': (a: number|boolean|null, b: string) => Number(a) === 0 ? [] : _string.chunks(b, Number(a)),

  'array, number|boolean|null': (a: any[], b: number|boolean|null) => Number(b) === 0 ? [] : _array.chunks(a, Number(b)),
  'number|boolean|null, array': (a: number|boolean|null, b: any[]) => Number(a) === 0 ? [] : _array.chunks(b, Number(a)),

  'string, string|regex': (a: string, b: string|RegExp) => a.split(b),
  'regex, string': (a: RegExp, b: string) => b.split(a),
});

const modulo = overload('modulo', {
  'vectorize': (a, b) => modulo(a, b, true),

  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) % Number(b),

  'string, number|boolean|null': (a: string, b: number|boolean|null) => Number(b) === 0 ? [] : _string.chunksOfSize(a, Number(b)),
  'number|boolean|null, string': (a: number|boolean|null, b: string) => Number(a) === 0 ? [] : _string.chunksOfSize(b, Number(a)),

  'array, number|boolean|null': (a: any[], b: number|boolean|null) => Number(b) === 0 ? [] : _array.chunksOfSize(a, Number(b)),
  'number|boolean|null, array': (a: number|boolean|null, b: any[]) => Number(a) === 0 ? [] : _array.chunksOfSize(b, Number(a)),

  'string, string': (a: string, b: string) => _string.indecesOf(a, b),
});

const power = overload('power', {
  'vectorize': (a, b) => power(a, b, true),
  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) ** Number(b),
});


const bitwiseAnd = overload('bitwise and', {
  'vectorize': (a, b) => bitwiseAnd(a, b, true),

  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) & Number(b),

  'string, number|boolean|null': (a: string, b: number|boolean|null) => {
    const mask = _number.digits(Number(b), 2);
    return [...a].filter((_, i) => mask[i]).join('');
  },

  'number|boolean|null, string': (a: number|boolean|null, b: string) => {
    const mask = _number.digits(Number(a), 2);
    return [...b].filter((_, i) => mask[i]).join('');
  },

  'string, string': (a: string, b: string) => {
    const [l, s] = a.length < b.length ? [b, a] : [a, b];
    return [...l].filter((c, i) => s[i] === c).join('');
  },

  'array, array': (a: any[], b: any[]) => {
    const setOfA = new Set(a);
    const setOfB = new Set(b);
    return _array.interleave(
      a.filter(v => setOfB.has(v)),
      b.filter(v => setOfA.has(v)),
    );
  },

  'array, *': (a: any[], b: any) => a.filter(v => v === b),
  '*, array': (a: any, b: any[]) => b.filter(v => v === a),
});

const bitwiseOr = overload('bitwise or', {
  'vectorize': (a, b) => bitwiseOr(a, b, true),

  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) | Number(b),

  'string, number|boolean|null': (a: string, _: number|boolean|null) => a,

  'number|boolean|null, string': (_: number|boolean|null, b: string) => b,

  'string, string': (a: string, b: string) => {
    const [l, s] = a.length < b.length ? [b, a] : [a, b];
    return [...l].map((c, i) => s[i] || c).join('');
  },

  'array, array': (a: any[], b: any[]) => _array.interleave(a, b),
  'array, *': (a: any[], _: any) => a,
  '*, array': (_: any, b: any[]) => b,
});

const bitwiseXor = overload('bitwise or', {
  'vectorize': (a, b) => bitwiseXor(a, b, true),

  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) ^ Number(b),

  'string, number|boolean|null': (a: string, b: number|boolean|null) => {
    const mask = _number.digits(Number(b), 2);
      return [...a].filter((_, i) => !mask[i]).join('');
  },

  'number|boolean|null, string': (a: number|boolean|null, b: string) => {
    const mask = _number.digits(Number(a), 2);
      return [...b].filter((_, i) => !mask[i]).join('');
  },

  'string, string': (a: string, b: string) => {
    const [l, s] = a.length < b.length ? [b, a] : [a, b];
    return [...l].filter((c, i) => s[i] !== c).join('');
  },

  'array, array': (a: any[], b: any[]) => {
    const setOfA = new Set(a);
    const setOfB = new Set(b);
    return _array.interleave(
      a.filter((v: any) => !setOfB.has(v)),
      b.filter((v: any) => !setOfA.has(v)),
    );
  },
  
  'array, *': (a: any[], b: any) => a.filter(v => v !== b),
  '*, array': (a: any, b: any[]) => b.filter(v => v !== a),
});

const shiftLeft = overload('shift left', {
  'vectorize': (a, b) => shiftLeft(a, b, true),

  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) << Number(b),

  'string, boolean|number|null': (a: string, b: boolean|number|null) => Buffer.from(a).map(char => char - Number(b)).toString(),
  'boolean|number|null, string': (a: boolean|number|null, b: string) => Buffer.from(b).map(char => char - Number(a)).toString(),
});

const shiftRight = overload('shift right', {
  'vectorize': (a, b) => shiftRight(a, b, true),

  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => Number(a) >> Number(b),

  'string, boolean|number|null': (a: string, b: boolean|number|null) => Buffer.from(a).map(char => char + Number(b)).toString(),
  'boolean|number|null, string': (a: boolean|number|null, b: string) => Buffer.from(b).map(char => char + Number(a)).toString(),
});


const equals = overload('equals', {
  'string|number|boolean|null, string|number|boolean|null': (a: string|number|boolean|null, b: string|number|boolean|null) => a === b,
  'array, array': (a: any[], b: any) => a.length === b.length && a.every((v: any, i: number) => equals(v, b[i])),
});

const notEquals = overload('not equals', {
  'string|number|boolean|null, string|number|boolean|null': (a: string|number|boolean|null, b: string|number|boolean|null) => a !== b,
  'array, array': (a: any[], b: any) => a.length === b.length && a.every((v: any, i: number) => notEquals(v, b[i])),
});

const approximatelyEquals = overload('approximately equals', {
  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => a == b,

  'null, string|array': (_: null, b: string|any[]) => b.length === 0,
  'string|array, null': (a: string|any[], _: null) => a.length === 0,

  'string, string': (a: string, b: string) => {
    if (a.length !== b.length) return false;
    const _a = [...a].sort().join('');
    const _b = [...b].sort().join('');
    return _a === _b;
  },

  'string, regex': (a: string, b: RegExp) => b.test(a),
  'regex, string': (a: RegExp, b: string) => a.test(b),

  'array, array': (a: any[], b: any[]) => a.length === b.length && a.every(av => b.some(bv => equals(av, bv))),
});

const notApproximatelyEquals = overload('approximately equals', {
  'number|boolean|null, number|boolean|null': (a: number|boolean|null, b: number|boolean|null) => a != b,

  'null, string|array': (_: null, b: string|any[]) => b.length !== 0,
  'string|array, null': (a: string|any[], _: null) => a.length !== 0,

  'string, string': (a: string, b: string) => {
    if (a.length !== b.length) return false;
    const _a = [...a].sort().join('');
    const _b = [...b].sort().join('');
    return _a !== _b;
  },

  'string, regex': (a: string, b: RegExp) => !b.test(a),
  'regex, string': (a: RegExp, b: string) => !a.test(b),

  'array, array': (a: any[], b: any[]) => a.length !== b.length || a.some(av => b.every(bv => notEquals(av, bv))),
});


const greater = overload('greater than', {
  'vectorize': (a: any, b: any) => greater(a, b, true),

  'null, string|array': () => false,
  'string|array, null': (a: string|any[]) => a.length > 0,

  'array, array': (a: any[], b: any[]) => a.length > b.length,
  'array, *': (a: any[], b: any) => greater(a.length, b),
  '*, array': (a: any, b: any[]) => greater(a, b.length),
  
  '*': (a: any, b: any) => a > b,
});

const greaterOrEqual = overload('greater than', {
  'vectorize': (a: any, b: any) => greaterOrEqual(a, b, true),

  'null, string|array': (_: null, b: string|any[]) => b.length === 0,
  'string|array, null': () => true,

  'array, array': (a: any[], b: any[]) => a.length >= b.length,
  'array, *': (a: any[], b: any) => greaterOrEqual(a.length, b),
  '*, array': (a: any, b: any[]) => greaterOrEqual(a, b.length),
  
  '*': (a: any, b: any) => a >= b,
});

const less = overload('greater than', {
  'vectorize': (a: any, b: any) => less(a, b, true),

  'null, string|array': (_: null, b: string|any[]) => b.length > 0,
  'string|array, null': () => false,
  
  'array, array': (a: any[], b: any[]) => a.length < b.length,
  'array, *': (a: any[], b: any) => less(a.length, b),
  '*, array': (a: any, b: any[]) => less(a, b.length),
  
  '*': (a: any, b: any) => a < b,
});

const lessOrEqual = overload('greater than', {
  'vectorize': (a: any, b: any) => lessOrEqual(a, b, true),

  'null, string|array': () => true,
  'string|array, null': (a: string|any[]) => a.length === 0,

  'array, array': (a: any[], b: any[]) => a.length <= b.length,
  'array, *': (a: any[], b: any) => lessOrEqual(a.length, b),
  '*, array': (a: any, b: any[]) => lessOrEqual(a, b.length),
  
  '*': (a: any, b: any) => a <= b,
});


function setOperatorBuiltin(func: (a: any, b: any) => any): Builtin {
  return operatorBuiltin((a: any, b: any) => {
    const aIsString = typeof a === 'string';
    const bIsString = typeof b === 'string';
    const result = func(aIsString ? [...a] : a, bIsString ? [...b] : b);
    return aIsString && bIsString ? result.join('') : result;
  });
}


function union(a: any, b: any): any {
  return a.concat(b as any);
}

function intersection(a: any, b: any): any {
  return a.filter((v: any) => b.includes(v));
}

function difference(a: any, b: any): any {
  return a.filter((v: any) => !b.includes(v)).concat(b.filter((v: any) => !a.includes(v)));
}

function memberOf(a: any, b: any): any {
  return b.includes(a);
}

function has(a: any, b: any): any {
  return a.includes(b);
}

function subsetOf(a: any, b: any): any {
  return a.every((v: any) => b.includes(v));
}

function supersetOf(a: any, b: any): any {
  return b.every((v: any) => a.includes(v));
}

function properSubsetOf(a: any, b: any): any {
  return a.length < b.length && a.every((v: any) => b.includes(v));
}

function properSupersetOf(a: any, b: any): any {
  return a.length > b.length && b.every((v: any) => a.includes(v));
}


const builtins = {
  // BASIC FLOW FUNCTIONS

  '_': {
    operator(_state, left, right) {
      return left.concat(right);
    },

    operand(_state, piped, passed) {
      return piped.concat(passed);
    },
  },

  '›': {
    operator(_state, left, right) {
      const shift = right[0] || 1;
      return left.slice(0, -shift);
    },

    operand(_state, piped, passed) {
      if (!piped.length) return passed.slice(0, -1);
      const shift = passed[0] || 1;
      return piped.slice(0, -shift);
    },
  },

  '‹': {
    operator(_state, left, right) {
      const shift = right[0] || 1;
      return left.slice(shift);
    },

    operand(_state, piped, passed) {
      if (!piped.length) return passed.slice(1);
      const shift = passed[0] || 1;
      return piped.slice(shift);
    },
  },


  // ARITHMETIC FUNCTIONS
  
  '+': operatorBuiltin(add),
  '-': operatorBuiltin(subtract),
  '*': operatorBuiltin(multiply),
  '/': operatorBuiltin(divide),
  '%': operatorBuiltin(modulo),
  'e': operatorBuiltin(power),

  
  // LOGICAL FUNCTIONS
  
  '&': operatorBuiltin(bitwiseAnd),
  '‖': operatorBuiltin(bitwiseOr),
  '^': operatorBuiltin(bitwiseXor),
  '«': operatorBuiltin(shiftLeft),
  '»': operatorBuiltin(shiftRight),

  '∨': operatorBuiltin(((a: any, b: any) => a || b)),
  '∧': operatorBuiltin(((a: any, b: any) => a && b)),
  '⊻': operatorBuiltin(((a: any, b: any) => a ? b ? false : a : b)),
  
  '∀': {
    operand(_state, piped, passed) {
      const args = piped.concat(passed);
      return [args.every(arg => arg)];
    },
    operator(_state, left, right) {
      if (right.some(arg => typeof arg !== 'function')) throw new Error('The right operand of ∀ may only contain functions!');
      return [left.every(arg => right.every(func => func(arg)))];
    },
  },

  '∃': {
    operand(_state, piped, passed) {
      const args = piped.concat(passed);
      return [args.some(arg => arg)];
    },
    operator(_state, left, right) {
      if (right.some(arg => typeof arg !== 'function')) throw new Error('The right operand of ∃ may only contain functions!');
      return [left.some(arg => right.some(func => func(arg)))];
    },
  },


  // EQUALITY FUNCTIONS

  '=': operatorBuiltin(equals),
  '≠': operatorBuiltin(notEquals),
  '≈': operatorBuiltin(approximatelyEquals),
  '≉': operatorBuiltin(notApproximatelyEquals),


  // COMPARISON FUNCTIONS

  '>': {
    operand(_state, piped, passed) {
      const args = piped.concat(passed);
      return [args.slice(0, -1).every((arg, i) => greater(arg, args[i+1]))];
    },
    operator(_state, left, right) {
      return vectorize(left, right, (a, b) => greater(a, b, true));
    },
  },

  '≥': {
    operand(_state, piped, passed) {
      const args = piped.concat(passed);
      return [args.slice(0, -1).every((arg, i) => greaterOrEqual(arg, args[i+1]))];
    },
    operator(_state, left, right) {
      return vectorize(left, right, (a, b) => greaterOrEqual(a, b, true));
    },
  },

  '<': {
    operand(_state, piped, passed) {
      const args = piped.concat(passed);
      return [args.slice(0, -1).every((arg, i) => less(arg, args[i+1]))];
    },
    operator(_state, left, right) {
      return vectorize(left, right, (a, b) => less(a, b, true));
    },
  },

  '≤': {
    operand(_state, piped, passed) {
      const args = piped.concat(passed);
      return [args.slice(0, -1).every((arg, i) => lessOrEqual(arg, args[i+1]))];
    },
    operator(_state, left, right) {
      return vectorize(left, right, (a, b) => lessOrEqual(a, b, true));
    },
  },


  // SEQUENCE FUNCTIONS

  '∪': setOperatorBuiltin(union),
  '∩': setOperatorBuiltin(intersection),
  '∖': setOperatorBuiltin(difference),
  '∈': setOperatorBuiltin(memberOf),
  '∋': setOperatorBuiltin(has),
  '⊆': setOperatorBuiltin(subsetOf),
  '⊇': setOperatorBuiltin(supersetOf),
  '⊂': setOperatorBuiltin(properSubsetOf),
  '⊃': setOperatorBuiltin(properSupersetOf),

  '~': {
    operand(_state, piped, passed) {
      const args = piped.concat(passed);
      let [start, end, step] = <[number, number, number]>args;
      if (!end) {
        end = start;
        start = 0;
      }
      step ||= start < end ? 1 : -1;
      return _number.range(start, end, step);
    },

    operator(_state, left, right) {
      const start = left[0];
      const end = right[0];
      const step = start < end ? 1 : -1;
      return _number.range(start, end, step);
    },
  },

  '↔': {
    operand(_state, piped, passed) {
      return piped.concat(passed).toReversed();
    },

    operator(_state, left, right) {
      return left.concat(right).toReversed();
    },
  },

  '↕': {
    operand(_state, piped, passed) {
      return piped.concat(passed).map(v => {
        switch (typesof(v)) {
          case 'array': return v.toReversed();
          case 'string': return [...v].toReversed().join('');
          default: return v;
        }
      });
    },

    operator(_state, left, right) {
      return left.concat(right).map(v => {
        switch (typesof(v)) {
          case 'array': return v.toReversed();
          case 'string': return [...v].toReversed().join('');
          default: return v;
        }
      });
    },
  },

  '⟳': {
    operand(_state, piped, passed) {
      return _array.transpose(piped.concat(passed), null);
    },

    operator(_state, left, right) {
      // TODO: transpose left by right as axis
      return _array.transpose(left.concat(right), null);
    },
  },

  '☰': {
    operand(_state, piped, passed) {
      return piped.flat(passed[0]);
    },

    operator(_state, left, right) {
      return left.flat(right[0]);
    },
  },

  '⋖': {
    operand(_state, piped, passed) {
      return [piped.concat(passed).reduce((a, v) => less(a, v) ? a : v)];
    },

    operator(_state, left, right) {
      return [left.concat(right).reduce((a, v) => less(a, v) ? a : v)];
    },
  },

  '⋗': {
    operand(_state, piped, passed) {
      return [piped.concat(passed).reduce((a, v) => greater(a, v) ? a : v)];
    },

    operator(_state, left, right) {
      return [left.concat(right).reduce((a, v) => greater(a, v) ? a : v)];
    },
  },

  '☐': {
    operand(_state, piped, passed) {
      return [passed.reduce((a, v) => a[v], piped)];
    },

    operator(_state, left, right) {
      return [right.reduce((a, v) => a[v], left)];
    },
  },

  '⎵': {
    operand(_state, piped, passed) {
      return [piped.length + passed.length];
    },

    operator(_state, left, right) {
      // TODO: find a better thing to do here
      return [left.length + right.length];
    },
  },


  // OUTPUT FUNCTIONS

  '.': {
    operand(_state, piped, passed) {
      process.stdout.write(piped.concat(passed).join(''))
      return [];
    },

    operator(_state, left, right) {
      process.stdout.write(left.join(right[0] || ''))
      return [];
    },
  },

  '…': {
    operand(_state, piped, passed) {
      console.log(...piped.concat(passed));
      return [];
    },

    operator(_state, left, right) {
      console.log(left.join(right[0] || ''));
      return [];
    },
  },


  // CONSTANTS AND VARIABLES

  'ε': {
    operand() { return [''] },
    operator() { return [''] },
  },
  
  '∅': {
    operand() { return [[]] },
    operator() { return [[]] },
  },

  '⊨': {
    operand() { return [true] },
    operator() { return [true] },
  },

  '⊭': {
    operand() { return [false] },
    operator() { return [false] },
  },

  '$': {
    operator(state) { return state.$ },
    operand(state, _piped, passed) {
      return passed.length ? [state.$[passed[0]]] : state.$;
    },
  },

  'i': {
    operator(state) { return state.i.slice(0) },
    operand(state) { return state.i.slice(0) },
  },
} as Record<string, Builtin>

export default builtins;