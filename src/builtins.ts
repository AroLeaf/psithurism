import XRegExp from 'xregexp';

declare global {
  var i: number|undefined
}

function vectorize(args: any[], callback: Function): [any] {
  if (args.length <= 2) return [callback(...args)];

  return [args.reduce((a,v) => {
    if (Array.isArray(a)) {
      if (Array.isArray(v)) {
        return a.length > v.length
          ? a.map((item: any, i: number) => vectorize([item, v[i]], callback)[0])
          : v.map((item: any, i: number) => vectorize([a[i], item], callback)[0]);
      }

      return a.map((item: number|string) => vectorize([item, v], callback)[0]);
    }
    
    if (Array.isArray(v)) {
      return v.map((item: number|string) => vectorize([a, item], callback)[0]);
    }

    return callback(a,v);
  })];
}


const builtins: { [key: string]: Function } = {
  '=': (passed: any[], piped: any[]): any[] => passed.concat(piped),
  
  '›': (passed: any[], piped: any[]): any[] =>
    piped.length
      ? piped.slice(0, -(passed[0] || 1)).concat(passed.slice(1))
      : passed.slice(1).map(e => Array.isArray(e) ? e.slice(0, -passed[0]) : e),
  
  '‹': (passed: any[], piped: any[]): any[] =>
    piped.length
      ? piped.slice(passed[0] || 1).concat(passed.slice(1))
      : passed.slice(1).map(e => Array.isArray(e) ? e.slice(passed[0]) : e),


  'i': (): [number|undefined] => [globalThis.i],


  '…': (passed: any[], piped: any[]): [] => (console.log(...passed, ...piped), []),
  '.': (passed: any[], piped: any[]): [] => (process.stdout.write(passed.concat(piped).join('')), []),


  '~': (passed: any[], piped: any[], args = passed.concat(piped)): number[] => {
    const from = args[0];
    if (typeof from !== 'number') throw new Error('Can\'t create a range starting at a non-number value');
    const to = typeof args[1] === 'number' ? args[1] : 0;
    const step = typeof args[2] === 'number' ? args[2] : (to ? (to > from) : from < 0) ? 1 : -1;
    if (step === 0) throw new Error('Can\'t create a range with a step size of 0');
    
    return (step < 0) 
      ? Array.from({ length: Math.max(Math.ceil((from - (to || 0)) / -step), 0) }, (_,i) => from + i * step)
      : Array.from({ length: Math.max(Math.ceil(((to || 0) - from) / step), 0) }, (_,i) => from + i * step);
  },

  '+': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    if (args.length < 2) { switch (a == null ? 'null' : typeof a) {
      case 'number': return a;
      case 'string': return Number(a);
      default: return a; 
    }}
    
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  :
      case 'null,string'  : return v;
          
      case 'number,string': return a.toString() + v;
      case 'string,number': return a + v.toString();
      
      case 'number,number':
      case 'string,string': return a + v;

      default: return null;
    }
  }),
  
  '-': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    if (args.length < 2) { switch (a == null ? 'null' : typeof a) {
      case 'number': return -a;
      case 'string': return -Number(a);
      default: return a; 
    }}
    
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  : return -v;
      case 'null,string'  : return '';

      case 'number,string': return a - Number(v);
      case 'string,number': return Number(a) - v;
      
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
  
  '*': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    if (args.length < 2) { switch (a == null ? 'null' : typeof a) {
      case 'number': return a;
      case 'string': {
        const ps = [''];
        for (const c of a) {
          const n = [];
          for (const s of ps) n.push(s + c);
          ps.push(...n);
        }
        return ps;
      }
      default: return a; 
    }}
    
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
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

          return ca === cb
            ? rest.map(e => ca + e)
            : rest.flatMap(e => [ca + e, cb + e]);
        }

        return f(a, v);
      }

      default: return null;
    }
  }),
  
  '/': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    if (args.length < 2) { switch (a == null ? 'null' : typeof a) {
      case 'number': return a;
      case 'string': return a.split('');
      default: return a; 
    }}

    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
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
  
  '%': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    if (args.length < 2) return a;

    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
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
          if (a.slice(i, i + v.length) == v) indeces.push(i);
        }
        return indeces;
      }
      
      case 'string,null'  :
      case 'null,string'  :
      case 'number,string': return NaN;

      default: return null;
    }
  }),
  
  'ə': (passed: any[], piped: any[], args = passed.concat(piped)): [any]|any[] => vectorize(args.reverse(), (a: any, v: any) => {
    if (args.length < 2) return a;

    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
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
  }),
  
  
  '∨': (passed: any[], piped: any[]): [any] => [passed.concat(piped).reduce((a,v)=>a||v)],
  '∧': (passed: any[], piped: any[]): [any] => [passed.concat(piped).reduce((a,v)=>a&&v)],

  '⊻': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {    
    if (args.length < 2) return !!a;

    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch(types) {
      default: return !!(+!a^+!v);
    }
  }),


  '&': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  :
      case 'null,number'  : return 0;
      case 'string,null'  :
      case 'null,string'  : return '';

      case 'number,number': return a & v;
      
      case 'number,string':
      case 'string,number': {
        const s = typeof a === 'string' ? a : v;
        const n = typeof a === 'number' ? a : v;
        return Array.from({ length: Math.ceil(s.length / n) }, (_,i) => s[i*n]).join('');
      }

      case 'string,string': return [...new Set(a + v)].map(c => (<string>c).repeat(Math.min([...a].reduce((a, v) => v === c ? a + 1 : a, 0), [...v].reduce((a, v) => v === c ? a + 1 : a, 0)))).join('');

      default: return null;
    }
  }),

  '‖': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  :
      case 'null,string'  : return v;

      case 'number,number': return a | v;
      
      case 'string,string': return [...new Set(a + v)].map(c => (<string>c).repeat(Math.max([...a].reduce((a, v) => v === c ? a + 1 : a, 0), [...v].reduce((a, v) => v === c ? a + 1 : a, 0)))).join('');
      
      default: return null;
    }
  }),

  '^': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  :
      case 'null,string'  : return v;

      case 'number,number': return a ^ v;

      case 'number,string':
      case 'string,number': {
        const s = typeof a === 'string' ? a : v;
        const n = typeof a === 'number' ? a : v;
        return Array.from({ length: Math.ceil(s.length / n) }, (_,i) => s.slice(i*n, i*n + n-1)).join('');
      }

      case 'string,string': return [...new Set(a + v)].map(c => (<string>c).repeat(Math.abs([...a].reduce((a, v) => v === c ? a + 1 : a, 0) - [...v].reduce((a, v) => v === c ? a + 1 : a, 0)))).join('');
      
      default: return null;
    }
  }),

  '«': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  : return 0 << v;

      case 'number,number': return a << v;

      case 'string,number': return Buffer.from(a).map(char => char - v).toString();
      
      default: return null;
    }
  }),

  '»': (passed: any[], piped: any[], args = passed.concat(piped)): [any] => vectorize(args, (a: any, v: any) => {
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    
    switch (types) {
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  : return 0;

      case 'number,number': return a >> v;

      case 'string,number': return Buffer.from(a).map(char => char + v).toString();
      
      default: return null;
    }
  }),
  

  true: (): [boolean] => [true],
  false: (): [boolean] => [false],
  null: (): [null] => [null],
}


export { builtins };

