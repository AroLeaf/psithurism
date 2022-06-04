import * as XRegExp from 'xregexp';


export interface LoglangContext {
  functions: { [key: string]: Function }
}

const builtins: { [key: string]: Function } = {
  '=': (_ctx: LoglangContext, ...args: any[]): any[] => args,
  '.': (_ctx: LoglangContext, ...args: any[]): [] => (console.log(...args), []),


  '»': (_ctx: LoglangContext, ...args: any[]): any[] => args.slice(0, -1),
  '«': (_ctx: LoglangContext, ...args: any[]): any[] => args.slice(1),
  

  '+': (ctx: LoglangContext, ...args: any[]): [any]|any[] => [args.reduce((a,v) => {    
    const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  :
      case 'null,string'  : return v;
          
      case 'number,string':
      case 'string,number': return `${a}${v}`;
      
      case 'number,number':
      case 'string,string': return a + v;

      case 'array,number' :
      case 'array,string' : {
        return a.map((item: number|string) => builtins['+'](ctx, item, v)[0]);
      }

      case 'number,array' :
      case 'string,array' : {
        return v.map((item: number|string) => builtins['+'](ctx, item, a)[0]);
      }

      case 'array,array'  : {
        return a.length > v.length
          ? a.map((item: any, i: number) => builtins['+'](ctx, item, v[i%v.length])[0])
          : v.map((item: any, i: number) => builtins['+'](ctx, item, a[i%a.length])[0]);
      }

      default: {
        return a + v;
      }
    }
  })],
  
  '-': (ctx: LoglangContext, ...args: any[]): [any]|any[] => [args.reduce((a,v)=> {
    const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  : return -v;
      case 'null,string'  : return '';

      case 'string,number': return a.slice(0, -v);
      
      case 'number,number': return a - v;
      case 'string,string': return a.replaceAll(v, '');

      case 'array,number' :
      case 'array,string' : {
        return a.map((item: number|string) => builtins['-'](ctx, item, v)[0]);
      }

      case 'number,array' :
      case 'string,array' : {
        return v.map((item: number|string) => builtins['-'](ctx, item, a)[0]);
      }

      case 'array,array'  : {
        return a.length > v.length
          ? a.map((item: any, i: number) => builtins['-'](ctx, item, v[i%v.length])[0])
          : v.map((item: any, i: number) => builtins['-'](ctx, item, a[i%a.length])[0]);
      }

      default: {
        return a - v;
      }
    }
  })],
  
  '*': (ctx: LoglangContext, ...args: any[]): [any]|any[] => [args.reduce((a,v)=> {
    const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
    
    switch (types) {
      case 'number,null'  :
      case 'null,number'  : return 0;
      case 'string,null'  :
      case 'null,string'  : return '';
          
      case 'number,string': return v.repeat(a)
      case 'string,number': return a.repeat(v);
      
      case 'number,number': return a * v;
      // case 'string,string': return a + v;

      case 'array,number' :
      case 'array,string' : {
        return a.map((item: number|string) => builtins['*'](ctx, item, v)[0]);
      }

      case 'number,array' :
      case 'string,array' : {
        return v.map((item: number|string) => builtins['*'](ctx, item, a)[0]);
      }

      case 'array,array'  : {
        return a.length > v.length
          ? a.map((item: any, i: number) => builtins['*'](ctx, item, v[i%v.length])[0])
          : v.map((item: any, i: number) => builtins['*'](ctx, item, a[i%a.length])[0]);
      }

      default: {
        return a * v;
      }
    }
  })],
  
  '/': (ctx: LoglangContext, ...args: any[]): [any]|any[] => [args.reduce((a,v)=> {
    const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  : return NaN;
      case 'null,number'  : return 0;
      case 'number,number': return a / v;
      
      case 'string,null'  :
      case 'null,string'  :
      case 'number,string':
      case 'string,number':
      case 'string,string': return NaN;
      

      case 'array,number' :
      case 'array,string' : {
        return a.map((item: number|string) => builtins['/'](ctx, item, v)[0]);
      }

      case 'number,array' :
      case 'string,array' : {
        return v.map((item: number|string) => builtins['/'](ctx, item, a)[0]);
      }

      case 'array,array'  : {
        return a.length > v.length
          ? a.map((item: any, i: number) => builtins['/'](ctx, item, v[i%v.length])[0])
          : v.map((item: any, i: number) => builtins['/'](ctx, item, a[i%a.length])[0]);
      }

      default: {
        return a / v;
      }
    }
  })],
  
  '%': (ctx: LoglangContext, ...args: any[]): [any]|any[] => [args.reduce((a,v)=> {
    const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  : return NaN;
      case 'null,number'  : return 0;
      case 'number,number': return a % v;
      
      case 'string,null'  :
      case 'null,string'  :
      case 'number,string':
      case 'string,number':
      case 'string,string': return NaN;
      

      case 'array,number' :
      case 'array,string' : {
        return a.map((item: number|string) => builtins['%'](ctx, item, v)[0]);
      }

      case 'number,array' :
      case 'string,array' : {
        return v.map((item: number|string) => builtins['%'](ctx, item, a)[0]);
      }

      case 'array,array'  : {
        return a.length > v.length
          ? a.map((item: any, i: number) => builtins['%'](ctx, item, v[i%v.length])[0])
          : v.map((item: any, i: number) => builtins['%'](ctx, item, a[i%a.length])[0]);
      }

      default: {
        return a % v;
      }
    }
  })],
  
  '^': (ctx: LoglangContext, ...args: any[]): [any]|any[] => [args.reduce((a,v)=> {
    const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  : return 1;
      case 'null,number'  : return 0;
      case 'number,number': return a ** v;
      
      case 'string,null'  :
      case 'null,string'  :
      case 'number,string':
      case 'string,number':
      case 'string,string': return NaN;
      

      case 'array,number' :
      case 'array,string' : {
        return a.map((item: number|string) => builtins['^'](ctx, item, v)[0]);
      }

      case 'number,array' :
      case 'string,array' : {
        return v.map((item: number|string) => builtins['^'](ctx, item, a)[0]);
      }

      case 'array,array'  : {
        return a.length > v.length
          ? a.map((item: any, i: number) => builtins['^'](ctx, item, v[i%v.length])[0])
          : v.map((item: any, i: number) => builtins['^'](ctx, item, a[i%a.length])[0]);
      }

      default: {
        return a ** v;
      }
    }
  })],

  '~': (_ctx: LoglangContext, from: number, to?: number, step = 1 ): number[] => {
    if (step === 0) throw new Error('Can\'t create a range with a step size of 0');
    
    if (step < 0) {
      to ??= 0;
      return Array<number>(Math.max(Math.floor((from - to) / -step), 0)).fill(0).map((_,i) => from + i * step);
    }

    if (!to) {
      to = from;
      from = 0;
    }

    return Array(Math.max(Math.floor((to - from) / step), 0)).fill(0).map((_,i) => from + i * step);
  },
  

  '∨': (_ctx: LoglangContext, ...args: any[]): [any] => [args.reduce((a,v)=>a||v)],
  '∧': (_ctx: LoglangContext, ...args: any[]): [any] => [args.reduce((a,v)=>a&&v)],
  

  true: (): [boolean] => [true],
  false: (): [boolean] => [false],
  null: (): [null] => [null],
}


const internals = {
  pipe(from: Function, to: Function) {
    return async (ctx: LoglangContext, ...args: any[]) => to(ctx, ...await from(ctx, ...args));
  },

  expand(from: Function, to: Function) {
    return async (ctx: LoglangContext, ...args: any[]) => {
      const input = await from(ctx, ...args) as any[];
      const returns = Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const arg = input[i];
        returns[i] = await to(ctx, ...(Array.isArray(arg) ? arg : [arg]));
      }
      return returns;
    }
  },

  merge(from: Function, to: Function) {
    return async (ctx: LoglangContext, ...args: any[]) => {
      const f = await from(ctx, ...args);
      return to(ctx, (f).flat());
    };
  },

  if (condition: Function, then: Function = builtins.null, not: Function = builtins.null) {
    return async (ctx: LoglangContext, ...args: any[]) => {
      const [value] = await condition(ctx, ...args);
      return value
        ? then(ctx, ...args)
        : not(ctx, ...args);
    }
  },

  call(funcName: string, passedArgs: Function = () => []) {
    return async (ctx: LoglangContext, ...pipedArgs: any[]) => {
      const func = builtins[funcName] || ctx.functions[funcName];
      if (!func) throw new Error(`Function ${funcName} is not defined`);
      return func(ctx, ...await passedArgs(ctx, ...pipedArgs), ...pipedArgs);
    };
  },

  list(...expressions: Function[]) {
    return async (ctx: LoglangContext, ...args: any[]) => {
      const returns = [];
      for (const expr of expressions) {
        returns.push(...await expr(ctx, ...args));
      }
      return returns;
    }
  },

  array(...expressions: Function[]) {
    return async (ctx: LoglangContext, ...args: any[]) => {
      const returns = [];
      for (const expr of expressions) {
        const res = await expr(ctx, ...args);
        returns.push(res.length > 1 ? res : res[0]);
      }
      return [returns];
    }
  },

  operator(op: string, left: Function, right: Function) {
    return async (ctx: LoglangContext, ...args: any[]) => {      
      const l = await left(ctx, ...args);
      const r = await right(ctx, ...args);
      return builtins[op](ctx, ...l, ...r);
    }
  },

  string(str: string) {
    return () => [str];
  },

  number(num: number) {
    return () => [num];
  },

  regex(regex: string, flags?: string) {
    return () => [XRegExp(regex, flags)];
  },
}


export { builtins, internals };

