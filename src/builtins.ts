import { PsithurismContext } from './types';

function getTypes(...values: any[]) {
  return values.map(val => {
    if (Array.isArray(val)) return 'array';
    if (val === null) return 'null';
    return typeof val;
  }).filter(t => t !== 'undefined');
}

function vectorize(args: any[], callback: Function, reverse = false): [any] {
  if (args.length < 2) return [callback(...args)];

  const reducer = (a: any, v: any) => {
    if (Array.isArray(a)) {
      if (Array.isArray(v)) {
        return a.length > v.length
          ? a.map((item: any, i: number) => vectorize([item, v[i]], callback, reverse)[0])
          : v.map((item: any, i: number) => vectorize([a[i], item], callback, reverse)[0]);
      }

      return a.map((item: number|string) => vectorize([item, v], callback, reverse)[0]);
    }
    
    if (Array.isArray(v)) {
      return v.map((item: number|string) => vectorize([a, item], callback, reverse)[0]);
    }

    return callback(a,v);
  }

  return [reverse ? args.reduceRight(reducer) : args.reduce(reducer)];
}


const builtins: { [key: string]: Function } = {
  '_': (ctx: PsithurismContext, passed: any[], piped: any[]): any[] => passed.concat(piped),
  
  '›': (ctx: PsithurismContext, passed: any[], piped: any[]): any[] =>
    piped.length
      ? piped.slice(0, -(passed[0] || 1)).concat(passed.slice(1))
      : passed.slice(1).map(e => Array.isArray(e) ? e.slice(0, -passed[0]) : e),
  
  '‹': (ctx: PsithurismContext, passed: any[], piped: any[]): any[] =>
    piped.length
      ? piped.slice(passed[0] || 1).concat(passed.slice(1))
      : passed.slice(1).map(e => Array.isArray(e) ? e.slice(passed[0]) : e),


  '…': (ctx: PsithurismContext, passed: any[], piped: any[]): [] => (console.log(...passed, ...piped), []),
  '.': (ctx: PsithurismContext, passed: any[], piped: any[]): [] => (process.stdout.write(passed.concat(piped).join('')), []),


  '~': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)): number[] => {
    const from = args[0];
    if (typeof from !== 'number') throw new Error('Can\'t create a range starting at a non-number value');
    const to = typeof args[1] === 'number' ? args[1] : 0;
    const step = typeof args[2] === 'number' ? args[2] : (to ? (to > from) : from < 0) ? 1 : -1;
    if (step === 0) throw new Error('Can\'t create a range with a step size of 0');
    
    return (step < 0) 
      ? Array.from({ length: Math.max(Math.ceil((from - (to || 0)) / -step), 0) }, (_,i) => from + i * step)
      : Array.from({ length: Math.max(Math.ceil(((to || 0) - from) / step), 0) }, (_,i) => from + i * step);
  },

  '+': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)): [any] => vectorize(args, (a: any, v: any) => {    
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : return a;
      case 'string'       : return +a;
      case 'array'        : return builtins['+'](ctx, a, [])[0];
      
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  :
      case 'null,string'  : return v;
          
      case 'number,string': return a + +v;
      case 'string,number': return +a + v;
      
      case 'number,number':
      case 'string,string': return a + v;

      default: return null;
    }
  }),
  
  '-': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)): [any] => vectorize(args, (a: any, v: any) => {
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : return -a;
      case 'string'       : return -Number(a);
      case 'array'        : return builtins['-'](ctx, a, [])[0];
      
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  : return -v;
      case 'null,string'  : return '';

      case 'number,string': return a - +v;
      case 'string,number': return +a - v;
      
      case 'number,number': return a - v;
      
      case 'string,string': {
        const matrix = Array(v.length + 1).fill(null).map((_,j) => Array(a.length + 1).fill(null).map((_,i) => j?i?null:j:i));
        for (let j = 1; j <= v.length; j++) {
          for (let i = 1; i <= a.length; i++) {
             const indicator = a[i-1] === v[j-1] ? 0 : 1;
             matrix[j][i] = Math.min(
                matrix[j][i-1]!+1,
                matrix[j-1][i]!+1,
                matrix[j-1][i-1]! + indicator,
             );
          }
       }
       return matrix[v.length][a.length];
      }

      default: return null;
    }
  }),
  
  '*': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)): [any] => vectorize(args, (a: any, v: any) => {
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : return a;
      case 'string'       : {
        const ps = [''];
        for (const c of a) {
          const n = [];
          for (const s of ps) n.push(s + c);
          ps.push(...n);
        }
        return [...new Set(ps)];
      }
      case 'array'        : return builtins['*'](ctx, a, [])[0];
      
      case 'number,null'  :
      case 'null,number'  : return 0;
      case 'string,null'  :
      case 'null,string'  : return '';
          
      case 'number,string': return v.repeat(a)
      case 'string,number': return a.repeat(v);
      
      case 'number,number': return a * v;

      case 'string,string': {
        const f = (a: string, b: string): string[] => {
          if (!(a||b)) return [''];

          const ca = a[0] || '';
          const cb = b[0] || '';
          const rest = f(a.slice(1), b.slice(1));

          return [...new Set(ca === cb
            ? rest.map(e => ca + e)
            : rest.flatMap(e => [ca + e, cb + e])
          )];
        }

        return f(a, v);
      }

      default: return null;
    }
  }),
  
  '/': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)): [any] => vectorize(args, (a: any, v: any) => {
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : return [...`${a}`].map(d => +d);
      case 'string'       : return a.split('');
      case 'array'        : return builtins['/'](ctx, a, [])[0];
      
      case 'number,null'  : return NaN;
      case 'null,number'  : return 0;
      case 'number,number': return a / v;
      
      case 'string,number': {
        const l = Math.floor(a.length / v);
        const idx = (i: number) => i*l + Math.min(i, a.length % v);
        return Array.from({ length: v }, (_, i) => a.slice(idx(i), idx(i+1)));
      }

      case 'string,string': return a.split(v);

      case 'string,null'  :
      case 'null,string'  :
      case 'number,string': return NaN;

      default: return null;
    }
  }),
  
  '%': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)): [any] => vectorize(args, (a: any, v: any) => {
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : {
        const divs = [];
        for (let i = 1; i <= Math.sqrt(a); i++) {
          if (!(a%i)) {
            divs.push(i, a / i);
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
      case 'string'       : return a;
      case 'array'        : return builtins['%'](ctx, a, [])[0];

      case 'number,null'  : return NaN;
      case 'null,number'  : return 0;
      case 'number,number': return a % v;

      case 'string,number': {
        const l = Math.ceil(a.length / v);
        return Array.from({ length: l }, (_, i) => a.slice(i * v, (i+1) * v));
      }

      case 'string,string': {
        const indeces: number[] = [];
        for (let i = 0; i <= a.length - v.length; i++) {
          if (a.slice(i, i + v.length) === v) indeces.push(i);
        }
        return indeces;
      }
      
      case 'string,null'  :
      case 'null,string'  :
      case 'number,string': return NaN;

      default: return null;
    }
  }),
  
  'ə': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)): [any]|any[] => vectorize(args, (a: any, v: any) => {
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : return a ** a;
      case 'string'       : return a; // TODO: replace with powerset
      case 'array'        : return builtins['ə'](ctx, a, [])[0];

      case 'number,null'  : return 1;
      case 'null,number'  : return 0;
      case 'number,number': return a ** v;
      
      case 'string,null'  :
      case 'null,string'  :
      case 'number,string':
      case 'string,number':
      case 'string,string': return NaN;
      
      default: return null;
    }
  }, true),
  
  
  '∨': (ctx: PsithurismContext, passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => a || v),

  '∧': (ctx: PsithurismContext, passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => a && v),

  '⊻': (ctx: PsithurismContext, passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => a ? v ? a : a : v),


  '&': (ctx: PsithurismContext, passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       :
      case 'string'       : return a;
      case 'array'        : return builtins['&'](ctx, a, [])[0];

      case 'number,null'  :
      case 'null,number'  : return 0;
      case 'string,null'  :
      case 'null,string'  : return '';

      case 'number,number': return a & v;
      
      case 'number,string': return Array.from({ length: Math.ceil(v.length / a) }, (_,i) => v[i*a]);
      case 'string,number': return Array.from({ length: Math.ceil(a.length / v) }, (_,i) => a[i*v]);

      case 'string,string': return [...new Set(a + v)].map(c => (<string>c).repeat(Math.min([...a].reduce((a, v) => v === c ? a + 1 : a, 0), [...v].reduce((a, v) => v === c ? a + 1 : a, 0)))).join('');

      default: return null;
    }
  }),

  '‖': (ctx: PsithurismContext, passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       :
      case 'string'       : return a;
      case 'array'        : return builtins['‖'](ctx, a, [])[0];

      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  :
      case 'null,string'  : return v;

      case 'number,number': return a | v;
      
      case 'string,string': return [...new Set(a + v)].map(c => (<string>c).repeat(Math.max([...a].reduce((a, v) => v === c ? a + 1 : a, 0), [...v].reduce((a, v) => v === c ? a + 1 : a, 0)))).join('');
      
      default: return null;
    }
  }),

  '^': (ctx: PsithurismContext, passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       :
      case 'string'       : return a;
      case 'array'        : return builtins['^'](ctx, a, [])[0];

      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  :
      case 'null,string'  : return v;

      case 'number,number': return a ^ v;

      case 'number,string': return Array.from({ length: Math.ceil(v.length / a) }, (_,i) => v.slice(i*a, i*a + a-1));
      case 'string,number': return Array.from({ length: Math.ceil(a.length / v) }, (_,i) => a.slice(i*v, i*v + v-1));

      case 'string,string': return [...new Set(a + v)].map(c => (<string>c).repeat(Math.abs([...a].reduce((a, v) => v === c ? a + 1 : a, 0) - [...v].reduce((a, v) => v === c ? a + 1 : a, 0)))).join('');
      
      default: return null;
    }
  }),

  '«': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)): [any] => vectorize(args, (a: any, v: any) => {
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : return a << 1;
      case 'string'       : return Buffer.from(a).map(char => char - 1).toString();
      case 'array'        : return builtins['«'](ctx, a, [])[0];

      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  : return 0 << v;

      case 'number,number': return a << v;

      case 'string,number': return Buffer.from(a).map(char => char - v).toString();
      
      default: return null;
    }
  }),

  '»': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)): [any] => vectorize(args, (a: any, v: any) => {
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : return a >> 1;
      case 'string'       : return Buffer.from(a).map(char => char + 1).toString();
      case 'array'        : return builtins['»'](ctx, a, [])[0];

      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  : return 0;

      case 'number,number': return a >> v;

      case 'string,number': return Buffer.from(a).map(char => char + v).toString();
      
      default: return null;
    }
  }),


  '=': (ctx: PsithurismContext, passed: any[], piped: any[], args = passed.concat(piped)): [boolean] => [args.slice(0, -1).every((a: any, i: number) => {
    const v = args[i+1];
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       :
      case 'string'       :
      case 'array'        : return true;

      case 'string,string':
      case 'number,number': return a === v;

      case 'array,array'  : return a.every((e: any, i: number) => v[i] === e);

      default: return false;
    }
  })],

  '≈': (ctx: PsithurismContext, passed: any[], piped: any[], args = passed.concat(piped)) => [args.slice(0, -1).every((a: any, i: number) => {
    const v = args[i+1];
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       :
      case 'string'       :
      case 'array'        : return true;

      case 'number,number': return a === v;
      case 'string,string': {
        if (a.length !== v.length) return false;
        const _a = [...a].sort().join('');
        const _v = [...v].sort().join('');
        return _a === _v;
      }

      case 'number,string': return a.toString() === v;
      case 'string,number': return a === v.toString();

      case 'array,string' :
      case 'array,number' : return a.every((e: any) => e === v);
      
      case 'string,array' :
      case 'number,array' : return v.every((e: any) => e === a);

      case 'array,array'  : {
        if (a.length !== v.length) return false;
        const _a = [...a].sort((a: any, b: any) => a>b ? 1 : a<b ? -1 : 0);
        const _v = [...v].sort((a: any, b: any) => a>b ? 1 : a<b ? -1 : 0);
        return _a.every((e: any, i: number) => _v[i] === e);
      }

      default: return false;
    }
  })],

  '≠': (ctx: PsithurismContext, passed: any[], piped: any[], args = passed.concat(piped)) => [args.slice(0, -1).every((a: any, i: number) => {
    const v = args[i+1];
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       :
      case 'string'       :
      case 'array'        : return false;

      case 'number,number':
      case 'string,string': return a !== v;

      case 'array,array'  : return a.some((e: any, i: number) => v[i] !== e);

      default: return true;
    }
  })],

  '≉': (ctx: PsithurismContext, passed: any[], piped: any[], args = passed.concat(piped)) => [args.slice(0, -1).every((a: any, i: number) => {
    const v = args[i+1];
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number':
      case 'string':
      case 'array' : return false;

      case 'number,number': return a === v;
      case 'string,string': {
        if (a.length !== v.length) return true;
        const _a = [...a].sort().join('');
        const _v = [...v].sort().join('');
        return _a === _v;
      }

      case 'number,string': return a.toString() !== v;
      case 'string,number': return a !== v.toString();

      case 'array,string':
      case 'array,number': return a.some((e: any) => e !== v);
      
      case 'string,array':
      case 'number,array': return v.some((e: any) => e !== a);

      case 'array,array': {
        if (a.length !== v.length) return true;
        const _a = [...a].sort((a: any, b: any) => a>b ? 1 : a<b ? -1 : 0);
        const _v = [...v].sort((a: any, b: any) => a>b ? 1 : a<b ? -1 : 0);
        return _a.some((e: any, i: number) => _v[i] !== e);
      }

      default: return true;
    }
  })],

  '>': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)) => [args.slice(0, -1).every((a: any, i: number) => {
    const v = args[i+1];
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number': return a > 0;
      case 'string': return true;
      case 'array' : return a.map((v: any) => builtins['>'](ctx, [v], []))[0];

      case 'number,null'  : return a > 0;
      case 'null,number'  : return 0 > v;
      case 'string,null'  : return a.length > 0;
      case 'null,string'  : return false;

      case 'number,number':
      case 'number,string':
      case 'string,number':
      case 'string,string': return a > v;


      case 'array,string':
      case 'array,number': return a.every((e: any) => builtins['>'](ctx, [e, v], []));
      
      case 'string,array':
      case 'number,array': return v.every((e: any) => builtins['>'](ctx, [e, a], []));

      case 'array,array': return a.length > v.length 
        ? a.every((e: any, i: number) => builtins['>'](ctx, [e, v[i]], []))
        : v.every((e: any, i: number) => builtins['>'](ctx, [e, a[i]], []));

      default: return null;
    }
  })],

  '≥': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)) => [args.slice(0, -1).every((a: any, i: number) => {
    const v = args[i+1];
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : return a >= 0;
      case 'string'       : return true;
      case 'array'        : return a.map((v: any) => builtins['≥'](ctx, [v], []))[0];

      case 'number,null'  : return a >= 0;
      case 'null,number'  : return 0 >= v;
      case 'string,null'  : return true;
      case 'null,string'  : return a.length <= 0;

      case 'number,number':
      case 'number,string':
      case 'string,number':
      case 'string,string': return a >= v;


      case 'array,string':
      case 'array,number': return a.every((e: any) => builtins['≥'](ctx, [e, v], []));
      
      case 'string,array':
      case 'number,array': return v.every((e: any) => builtins['≥'](ctx, [e, a], []));

      case 'array,array': return a.length > v.length 
        ? a.every((e: any, i: number) => builtins['≥'](ctx, [e, v[i]], []))
        : v.every((e: any, i: number) => builtins['≥'](ctx, [e, a[i]], []));

      default: return null;
    }
  })],

  '<': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)) => [args.slice(0, -1).every((a: any, i: number) => {
    const v = args[i+1];
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : return a < 0;
      case 'string'       : return true;
      case 'array'        : return a.map((v: any) => builtins['<'](ctx, [v], []))[0];

      case 'number,null'  : return a < 0;
      case 'null,number'  : return 0 < v;
      case 'string,null'  : return false;
      case 'null,string'  : return a.length > 0;

      case 'number,number':
      case 'number,string':
      case 'string,number':
      case 'string,string': return a < v;


      case 'array,string':
      case 'array,number': return a.every((e: any) => builtins['<'](ctx, [e, v], []));
      
      case 'string,array':
      case 'number,array': return v.every((e: any) => builtins['<'](ctx, [e, a], []));

      case 'array,array': return a.length > v.length 
        ? a.every((e: any, i: number) => builtins['<'](ctx, [e, v[i]], []))
        : v.every((e: any, i: number) => builtins['<'](ctx, [e, a[i]], []));

      default: return null;
    }
  })],

  '≤': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)) => [args.slice(0, -1).every((a: any, i: number) => {
    const v = args[i+1];
    const types = getTypes(a, v).join();
    switch (types) {
      case 'number'       : return a <= 0;
      case 'string'       : return true;
      case 'array'        : return a.map((v: any) => builtins['≤'](ctx, [v], []))[0];

      case 'number,null'  : return a <= 0;
      case 'null,number'  : return 0 <= v;
      case 'string,null'  : return a.length <= 0;
      case 'null,string'  : return true;

      case 'number,number':
      case 'number,string':
      case 'string,number':
      case 'string,string': return a <= v;


      case 'array,string':
      case 'array,number': return a.every((e: any) => builtins['≤'](ctx, [e, v], []));
      
      case 'string,array':
      case 'number,array': return v.every((e: any) => builtins['≤'](ctx, [e, a], []));

      case 'array,array': return a.length > v.length 
        ? a.every((e: any, i: number) => builtins['≤'](ctx, [e, v[i]], []))
        : v.every((e: any, i: number) => builtins['≤'](ctx, [e, a[i]], []));

      default: return null;
    }
  })],


  '"': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)) => args.map(arg => arg.toString()),
  '@': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)) => args.map(arg => Array.isArray(arg) ? builtins['@'](ctx, arg, []) : +arg),
  
  '⇄': (ctx: PsithurismContext, passed: any[], piped: any[], args = piped.concat(passed)) => {
    return args.every(arg => typeof arg === 'string')
        ? args.map(arg => [...arg].map(c => c.charCodeAt()))
        : args.every(arg => typeof arg === 'string' || Array.isArray(arg))
          ? args.map(arg => typeof arg === 'string' ? arg : String.fromCharCode(...arg))
          : [args.flat().map(arg => typeof arg === 'string' ? arg : String.fromCharCode(arg)).join('')];
  },


  i: (ctx: PsithurismContext): [number] => [ctx.i],

 
  true: (): [boolean] => [true],
  false: (): [boolean] => [false],
  null: (): [null] => [null],
}

export { builtins };
