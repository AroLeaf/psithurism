function vectorize(args: any[], callback: Function): [any] {
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
  '=': (args: any[]): any[] => args,
  '.': (args: any[]): [] => (console.log(...args), []),


  '»': (args: any[]): any[] => args.slice(0, -1),
  '«': (args: any[]): any[] => args.slice(1),
  

  '+': (args: any[]): [any] => vectorize(args, (a: any, v: any) => {
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  :
      case 'null,string'  : return v;
          
      case 'number,string':
      case 'string,number': return `${a}${v}`;
      
      case 'number,number':
      case 'string,string': return a + v;

      default: {
        return null;
      }
    }
  }),
  
  '-': (args: any[]): [any] => vectorize(args, (a: any, v: any) => {
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  :
      case 'string,null'  : return a;
      case 'null,number'  : return -v;
      case 'null,string'  : return '';

      case 'string,number': return a.slice(0, -v);
      
      case 'number,number': return a - v;
      case 'string,string': return a.replaceAll(v, '');

      default: {
        return null;
      }
    }
  }),
  
  '*': (args: any[]): [any] => vectorize(args, (a: any, v: any)=> {
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    
    switch (types) {
      case 'number,null'  :
      case 'null,number'  : return 0;
      case 'string,null'  :
      case 'null,string'  : return '';
          
      case 'number,string': return v.repeat(a)
      case 'string,number': return a.repeat(v);
      
      case 'number,number': return a * v;

      default: {
        return null;
      }
    }
  }),
  
  '/': (args: any[]): [any] => vectorize(args, (a: any, v: any) => {
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  : return NaN;
      case 'null,number'  : return 0;
      case 'number,number': return a / v;
      
      case 'string,null'  :
      case 'null,string'  :
      case 'number,string':
      case 'string,number':
      case 'string,string': return NaN;

      default: {
        return null;
      }
    }
  }),
  
  '%': (args: any[]): [any] => vectorize(args, (a: any, v: any) => {
    const types = `${a == null ? 'null' : typeof a},${v == null ? 'null' : typeof v}`;
    switch (types) {
      case 'number,null'  : return NaN;
      case 'null,number'  : return 0;
      case 'number,number': return a % v;
      
      case 'string,null'  :
      case 'null,string'  :
      case 'number,string':
      case 'string,number':
      case 'string,string': return NaN;

      default: {
        return null;
      }
    }
  }),
  
  '^': (args: any[]): [any]|any[] => vectorize(args, (a: any, v: any) => {
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
      
      default: {
        return null;
      }
    }
  }),

  '~': ([from, to, step = 1]: [number, number|undefined, number|undefined]): number[] => {
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
  

  '∨': (args: any[]): [any] => [args.reduce((a,v)=>a||v)],
  '∧': (args: any[]): [any] => [args.reduce((a,v)=>a&&v)],
  

  true: (): [boolean] => [true],
  false: (): [boolean] => [false],
  null: (): [null] => [null],
}

export { builtins };

