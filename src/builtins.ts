import { _array, _number, _string } from './lib';
import { Builtin } from './types';

function typesof(...values: any[]) {
  return values.map(value => {
    switch(true) {
      case Array.isArray(value): return 'array';
      case value === null: return 'null';
      default: return typeof value;
    }
  }).join(',');
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
      return _array.reduceNoSkip(args, (a, b) => func(a, b));
    },
  }
}


function add(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, add);
    case v && /^array,/.test(types): return vectorize(a, [b], add);
    case v && /,array$/.test(types): return vectorize([a], b, add);

    case /^((string|number|boolean|null)(,|$)){2}/.test(types): return a + b;

    default: throw Error(`Can\'t perform subtraction on the following pair of types: ${types}`);
  }
}

function subtract(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, add);
    case v && /^array,/.test(types): return vectorize(a, [b], add);
    case v && /,array$/.test(types): return vectorize([a], b, add);

    case /^((number|boolean|null)(,|$)){2}/.test(types): return a - b;

    case /^string,(boolean|number|null)$/.test(types): return a.slice(0, -b);
    case /^(boolean|number|null),string$/.test(types): return b.slice(b);

    case types === 'string,string': return a.replace(b, '');

    case types === 'array,array':
    case /^array,/.test(types): return _array.remove(a, b);
    case /,array$/.test(types): return _array.remove([a], b)[0];

    default: throw Error(`The - function does not support operating on the following pair of types: ${types}`);
  }
}

function multiply(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, add);
    case v && /^array,/.test(types): return vectorize(a, [b], add);
    case v && /,array$/.test(types): return vectorize([a], b, add);

    case /^((number|boolean|null)(,|$)){2}/.test(types): return a * b;

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
    
    default: throw Error(`Can\'t perform multiplication on the following pair of types: ${types}`);
  }
}

function divide(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, add);
    case v && /^array,/.test(types): return vectorize(a, [b], add);
    case v && /,array$/.test(types): return vectorize([a], b, add);

    case /string,(boolean|number)/.test(types): return b === 0 ? [] : _string.chunks(a, +b);
    case /(boolean|number),string/.test(types): return a === 0 ? [] : _string.chunks(b, +a);

    case /array,(boolean|number)/.test(types): return _array.chunks(a, +b);
    case /(boolean|number),array/.test(types): return _array.chunks(b, +a);

    case types === 'string,string': return a.split(b);

    case /^((number|boolean|null)(,|$)){2}/.test(types): return a / b;

    default: throw Error(`Can\'t perform division on the following pair of types: ${types}`);
  }
}

function modulo(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, add);
    case v && /^array,/.test(types): return vectorize(a, [b], add);
    case v && /,array$/.test(types): return vectorize([a], b, add);
    
    case /string,(boolean|number)/.test(types): return b === 0 ? [] : _string.chunksOfSize(a, +b);
    case /(boolean|number),string/.test(types): return a === 0 ? [] : _string.chunksOfSize(b, +a);

    case /array,(boolean|number)/.test(types): return _array.chunksOfSize(a, +b);
    case /(boolean|number),array/.test(types): return _array.chunksOfSize(b, +a);

    case types === 'string,string': return _string.indecesOf(a, b);

    case /^null,(?!array)/.test(types):
    case /(?<!array),null$/.test(types): return /string/.test(types) ? '' : 0 % b;

    case /^((number|boolean|null)(,|$)){2}/.test(types): return a % b;

    default: throw Error(`Can\'t perform modulo on the following pair of types: ${types}`);
  }
}


function bitwiseAnd(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, bitwiseAnd);
    case v && /^array,/.test(types): return vectorize(a, [b], bitwiseAnd);
    case v && /,array$/.test(types): return vectorize([a], b, bitwiseAnd);

    case /^((number|boolean|null)(,|$)){2}/.test(types): return a & b;

    case /string,(boolean|number|null)/.test(types): {
      const mask = _number.digits(b, 2);
      return [...a].filter((_, i) => mask[i]).join('');
    }
    case /(boolean|number|null),string/.test(types): {
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

    default: throw Error(`Can\'t perform bitwise AND on the following pair of types: ${types}`);
  }
}

function bitwiseOr(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, bitwiseOr);
    case v && /^array,/.test(types): return vectorize(a, [b], bitwiseOr);
    case v && /,array$/.test(types): return vectorize([a], b, bitwiseOr);

    case /^((number|boolean|null)(,|$)){2}/.test(types): return a | b;

    case /string,(boolean|number|null)/.test(types): return a;
    case /(boolean|number|null),string/.test(types): return b;

    case types === 'string,string': {
      const [l, s] = a.length < b.length ? [b, a] : [a, b];
      return [...l].map((c, i) => s[i] || c).join('');
    }

    case types === 'array,array': return _array.interleave(a, b);
    case /^array,/.test(types): return a;
    case /,array$/.test(types): return b;

    default: throw Error(`Can\'t perform bitwise OR on the following pair of types: ${types}`);
  }
}

function bitwiseXor(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, bitwiseXor);
    case v && /^array,/.test(types): return vectorize(a, [b], bitwiseXor);
    case v && /,array$/.test(types): return vectorize([a], b, bitwiseXor);

    case /^((number|boolean|null)(,|$)){2}/.test(types): return a ^ b;

    case /string,(boolean|number|null)/.test(types): {
      const mask = _number.digits(b, 2);
      return [...a].filter((_, i) => !mask[i]).join('');
    }
    case /(boolean|number|null),string/.test(types): {
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

    default: throw Error(`Can\'t perform bitwise XOR on the following pair of types: ${types}`);
  }
}

function shiftLeft(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, shiftLeft);
    case v && /^array,/.test(types): return vectorize(a, [b], shiftLeft);
    case v && /,array$/.test(types): return vectorize([a], b, shiftLeft);

    case /^((number|boolean|null)(,|$)){2}/.test(types): return a << b;

    case /string,(boolean|number|null)/.test(types): return Buffer.from(a).map(char => char - b).toString();
    case /(boolean|number|null),string/.test(types): return Buffer.from(b).map(char => char - a).toString();

    default: throw Error(`Can\'t perform left shift on the following pair of types: ${types}`);
  }
}

function shiftRight(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, shiftRight);
    case v && /^array,/.test(types): return vectorize(a, [b], shiftRight);
    case v && /,array$/.test(types): return vectorize([a], b, shiftRight);

    case /^((number|boolean|null)(,|$)){2}/.test(types): return a >> b;

    case /string,(boolean|number|null)/.test(types): return Buffer.from(a).map(char => char + b).toString();
    case /(boolean|number|null),string/.test(types): return Buffer.from(b).map(char => char + a).toString();

    default: throw Error(`Can\'t perform right shift on the following pair of types: ${types}`);
  }
}


function equals(a: any, b: any): any {
  const types = typesof(a, b);
  switch(true) {
    case /^(string|number|boolean|null),\1$/.test(types): return a === b;
    
    case types === 'array,array': return a.length === b.length && a.every((v: any, i: number) => equals(v, b[i]));

    default: return false;
  }
}

function notEquals(a: any, b: any): any {
  const types = typesof(a, b);
  switch(true) {
    case /^(string|number|boolean|null),\1$/.test(types): return a !== b;

    case types === 'array,array': return a.length === b.length && a.every((v: any, i: number) => notEquals(v, b[i]));

    default: return true;
  }
}

function approximatelyEquals(a: any, b: any): any {
  const types = typesof(a, b);
  switch(true) {
    case /^((number|boolean|null)(,|$)){2}/.test(types): return a == b;

    case /null,(array|string)/.test(types): return b.length === 0;
    case /(array|string),null/.test(types): return a.length === 0;

    case types === 'string,string': {
      if (a.length !== b.length) return false;
      const _a = [...a].sort().join('');
      const _b = [...b].sort().join('');
      return _a === _b;
    }

    case types === 'array,array': return a.length === b.length && a.every((av: any) => b.some((bv: any) => equals(av, bv)));

    default: return false;
  }
}

function notApproximatelyEquals(a: any, b: any): any {
  const types = typesof(a, b);
  switch(true) {
    case /^((number|boolean|null)(,|$)){2}/.test(types): return a != b;

    case /null,(array|string)/.test(types): return b.length !== 0;
    case /(array|string),null/.test(types): return a.length !== 0;

    case types === 'string,string': {
      if (a.length !== b.length) return true;
      const _a = [...a].sort().join('');
      const _b = [...b].sort().join('');
      return _a !== _b;
    }

    case types === 'array,array': return a.length !== b.length || a.some((av: any) => b.every((bv: any) => notEquals(av, bv)));

    default: return false;
  }
}


function greater(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, greater);
    case v && /^array,/.test(types): return vectorize(a, [b], greater);
    case v && /,array$/.test(types): return vectorize([a], b, greater);

    case /null,(array|string)/.test(types): return false;
    case /(array|string),null/.test(types): return a.length > 0;

    case types === 'array,array': return a.length > b.length;
    case types === 'array,number': return a.length > b;
    case types === 'number,array': return a > b.length;

    default: return a > b;
  }
}

function greaterOrEqual(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, greaterOrEqual);
    case v && /^array,/.test(types): return vectorize(a, [b], greaterOrEqual);
    case v && /,array$/.test(types): return vectorize([a], b, greaterOrEqual);

    case /(array|string),null/.test(types): return true;
    case /null,(array|string)/.test(types): return b.length === 0;

    case types === 'array,array': return a.length >= b.length;
    case types === 'array,number': return a.length >= b;
    case types === 'number,array': return a >= b.length;

    default: return a >= b;
  }
}

function less(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, less);
    case v && /^array,/.test(types): return vectorize(a, [b], less);
    case v && /,array$/.test(types): return vectorize([a], b, less);

    case /null,(array|string)/.test(types): return b.length > 0;
    case /(array|string),null/.test(types): return false;

    case types === 'array,array': return a.length < b.length;
    case types === 'array,number': return a.length < b;
    case types === 'number,array': return a < b.length;

    default: return a < b;
  }
}

function lessOrEqual(a: any, b: any, v = false): any {
  const types = typesof(a, b);
  switch(true) {
    case v && types === 'array,array': return vectorize(a, b, lessOrEqual);
    case v && /^array,/.test(types): return vectorize(a, [b], lessOrEqual);
    case v && /,array$/.test(types): return vectorize([a], b, lessOrEqual);

    case /(array|string),null/.test(types): return a.length === 0;
    case /null,(array|string)/.test(types): return true;

    case types === 'array,array': return a.length <= b.length;
    case types === 'array,number': return a.length <= b;
    case types === 'number,array': return a <= b.length;

    default: return a <= b;
  }
}


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
      console.log(piped, passed);
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
  '⊂': setOperatorBuiltin(subsetOf),
  '⊃': setOperatorBuiltin(supersetOf),


  // CONSTANTS AND VARIABLES

  'ε': {
    operand() { return [''] },
    operator() { return [''] },
  },
  
  '∅': {
    operand() { return [[]] },
    operator() { return [[]] },
  },

  '$': {
    operator(state) { return state.$ },
    operand(state, _piped, passed) {
      return passed.length ? [state.$[passed[0]]] : state.$;
    },
  },

  'i': {
    operator(state) { return [state.i] },
    operand(state) { return [state.i] },
  },
} as Record<string, Builtin>

export default builtins;