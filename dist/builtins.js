"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.internals = exports.builtins = void 0;
var swcHelpers = require("@swc/helpers");
var XRegExp = swcHelpers.interopRequireWildcard(require("xregexp"));
const builtins = {
    '=': (_ctx, ...args)=>args
    ,
    '.': (_ctx, ...args)=>(console.log(...args), [])
    ,
    '»': (_ctx, ...args)=>args.slice(0, -1)
    ,
    '«': (_ctx, ...args)=>args.slice(1)
    ,
    '+': (ctx, ...args)=>[
            args.reduce((a, v)=>{
                const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
                switch(types){
                    case 'number,null':
                    case 'string,null':
                        return a;
                    case 'null,number':
                    case 'null,string':
                        return v;
                    case 'number,string':
                    case 'string,number':
                        return `${a}${v}`;
                    case 'number,number':
                    case 'string,string':
                        return a + v;
                    case 'array,number':
                    case 'array,string':
                        {
                            return a.map((item)=>builtins['+'](ctx, item, v)[0]
                            );
                        }
                    case 'number,array':
                    case 'string,array':
                        {
                            return v.map((item)=>builtins['+'](ctx, item, a)[0]
                            );
                        }
                    case 'array,array':
                        {
                            return a.length > v.length ? a.map((item, i)=>builtins['+'](ctx, item, v[i % v.length])[0]
                            ) : v.map((item, i)=>builtins['+'](ctx, item, a[i % a.length])[0]
                            );
                        }
                    default:
                        {
                            return a + v;
                        }
                }
            })
        ]
    ,
    '-': (ctx, ...args)=>[
            args.reduce((a, v)=>{
                const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
                switch(types){
                    case 'number,null':
                    case 'string,null':
                        return a;
                    case 'null,number':
                        return -v;
                    case 'null,string':
                        return '';
                    case 'string,number':
                        return a.slice(0, -v);
                    case 'number,number':
                        return a - v;
                    case 'string,string':
                        return a.replaceAll(v, '');
                    case 'array,number':
                    case 'array,string':
                        {
                            return a.map((item)=>builtins['-'](ctx, item, v)[0]
                            );
                        }
                    case 'number,array':
                    case 'string,array':
                        {
                            return v.map((item)=>builtins['-'](ctx, item, a)[0]
                            );
                        }
                    case 'array,array':
                        {
                            return a.length > v.length ? a.map((item, i)=>builtins['-'](ctx, item, v[i % v.length])[0]
                            ) : v.map((item, i)=>builtins['-'](ctx, item, a[i % a.length])[0]
                            );
                        }
                    default:
                        {
                            return a - v;
                        }
                }
            })
        ]
    ,
    '*': (ctx, ...args)=>[
            args.reduce((a, v)=>{
                const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
                switch(types){
                    case 'number,null':
                    case 'null,number':
                        return 0;
                    case 'string,null':
                    case 'null,string':
                        return '';
                    case 'number,string':
                        return v.repeat(a);
                    case 'string,number':
                        return a.repeat(v);
                    case 'number,number':
                        return a * v;
                    // case 'string,string': return a + v;
                    case 'array,number':
                    case 'array,string':
                        {
                            return a.map((item)=>builtins['*'](ctx, item, v)[0]
                            );
                        }
                    case 'number,array':
                    case 'string,array':
                        {
                            return v.map((item)=>builtins['*'](ctx, item, a)[0]
                            );
                        }
                    case 'array,array':
                        {
                            return a.length > v.length ? a.map((item, i)=>builtins['*'](ctx, item, v[i % v.length])[0]
                            ) : v.map((item, i)=>builtins['*'](ctx, item, a[i % a.length])[0]
                            );
                        }
                    default:
                        {
                            return a * v;
                        }
                }
            })
        ]
    ,
    '/': (ctx, ...args)=>[
            args.reduce((a, v)=>{
                const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
                switch(types){
                    case 'number,null':
                        return NaN;
                    case 'null,number':
                        return 0;
                    case 'number,number':
                        return a / v;
                    case 'string,null':
                    case 'null,string':
                    case 'number,string':
                    case 'string,number':
                    case 'string,string':
                        return NaN;
                    case 'array,number':
                    case 'array,string':
                        {
                            return a.map((item)=>builtins['/'](ctx, item, v)[0]
                            );
                        }
                    case 'number,array':
                    case 'string,array':
                        {
                            return v.map((item)=>builtins['/'](ctx, item, a)[0]
                            );
                        }
                    case 'array,array':
                        {
                            return a.length > v.length ? a.map((item, i)=>builtins['/'](ctx, item, v[i % v.length])[0]
                            ) : v.map((item, i)=>builtins['/'](ctx, item, a[i % a.length])[0]
                            );
                        }
                    default:
                        {
                            return a / v;
                        }
                }
            })
        ]
    ,
    '%': (ctx, ...args)=>[
            args.reduce((a, v)=>{
                const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
                switch(types){
                    case 'number,null':
                        return NaN;
                    case 'null,number':
                        return 0;
                    case 'number,number':
                        return a % v;
                    case 'string,null':
                    case 'null,string':
                    case 'number,string':
                    case 'string,number':
                    case 'string,string':
                        return NaN;
                    case 'array,number':
                    case 'array,string':
                        {
                            return a.map((item)=>builtins['%'](ctx, item, v)[0]
                            );
                        }
                    case 'number,array':
                    case 'string,array':
                        {
                            return v.map((item)=>builtins['%'](ctx, item, a)[0]
                            );
                        }
                    case 'array,array':
                        {
                            return a.length > v.length ? a.map((item, i)=>builtins['%'](ctx, item, v[i % v.length])[0]
                            ) : v.map((item, i)=>builtins['%'](ctx, item, a[i % a.length])[0]
                            );
                        }
                    default:
                        {
                            return a % v;
                        }
                }
            })
        ]
    ,
    '^': (ctx, ...args)=>[
            args.reduce((a, v)=>{
                const types = `${Array.isArray(a) ? 'array' : a == null ? 'null' : typeof a},${Array.isArray(v) ? 'array' : v == null ? 'null' : typeof v}`;
                switch(types){
                    case 'number,null':
                        return 1;
                    case 'null,number':
                        return 0;
                    case 'number,number':
                        return a ** v;
                    case 'string,null':
                    case 'null,string':
                    case 'number,string':
                    case 'string,number':
                    case 'string,string':
                        return NaN;
                    case 'array,number':
                    case 'array,string':
                        {
                            return a.map((item)=>builtins['^'](ctx, item, v)[0]
                            );
                        }
                    case 'number,array':
                    case 'string,array':
                        {
                            return v.map((item)=>builtins['^'](ctx, item, a)[0]
                            );
                        }
                    case 'array,array':
                        {
                            return a.length > v.length ? a.map((item, i)=>builtins['^'](ctx, item, v[i % v.length])[0]
                            ) : v.map((item, i)=>builtins['^'](ctx, item, a[i % a.length])[0]
                            );
                        }
                    default:
                        {
                            return a ** v;
                        }
                }
            })
        ]
    ,
    '~': (_ctx, from, to, step = 1)=>{
        if (step === 0) throw new Error('Can\'t create a range with a step size of 0');
        if (step < 0) {
            to ??= 0;
            return Array(Math.max(Math.floor((from - to) / -step), 0)).fill(0).map((_, i)=>from + i * step
            );
        }
        if (!to) {
            to = from;
            from = 0;
        }
        return Array(Math.max(Math.floor((to - from) / step), 0)).fill(0).map((_, i)=>from + i * step
        );
    },
    '∨': (_ctx, ...args)=>[
            args.reduce((a, v)=>a || v
            )
        ]
    ,
    '∧': (_ctx, ...args)=>[
            args.reduce((a, v)=>a && v
            )
        ]
    ,
    true: ()=>[
            true
        ]
    ,
    false: ()=>[
            false
        ]
    ,
    null: ()=>[
            null
        ]
};
const internals = {
    pipe (from, to) {
        return async (ctx, ...args)=>to(ctx, ...await from(ctx, ...args))
        ;
    },
    expand (from, to) {
        return async (ctx, ...args)=>{
            const input = await from(ctx, ...args);
            const returns = Array(input.length);
            for(let i = 0; i < input.length; i++){
                const arg = input[i];
                returns[i] = await to(ctx, ...Array.isArray(arg) ? arg : [
                    arg
                ]);
            }
            return returns;
        };
    },
    merge (from, to) {
        return async (ctx, ...args)=>{
            const f = await from(ctx, ...args);
            return to(ctx, f.flat());
        };
    },
    if (condition, then = builtins.null, not = builtins.null) {
        return async (ctx, ...args)=>{
            const [value] = await condition(ctx, ...args);
            return value ? then(ctx, ...args) : not(ctx, ...args);
        };
    },
    call (funcName, passedArgs = ()=>[]
    ) {
        return async (ctx, ...pipedArgs)=>{
            const func = builtins[funcName] || ctx.functions[funcName];
            if (!func) throw new Error(`Function ${funcName} is not defined`);
            return func(ctx, ...await passedArgs(ctx, ...pipedArgs), ...pipedArgs);
        };
    },
    list (...expressions) {
        return async (ctx, ...args)=>{
            const returns = [];
            for (const expr of expressions){
                returns.push(...await expr(ctx, ...args));
            }
            return returns;
        };
    },
    array (...expressions) {
        return async (ctx, ...args)=>{
            const returns = [];
            for (const expr of expressions){
                const res = await expr(ctx, ...args);
                returns.push(res.length > 1 ? res : res[0]);
            }
            return [
                returns
            ];
        };
    },
    operator (op, left, right) {
        return async (ctx, ...args)=>{
            const l = await left(ctx, ...args);
            const r = await right(ctx, ...args);
            return builtins[op](ctx, ...l, ...r);
        };
    },
    string (str) {
        return ()=>[
                str
            ]
        ;
    },
    number (num) {
        return ()=>[
                num
            ]
        ;
    },
    regex (regex, flags) {
        return ()=>[
                XRegExp(regex, flags)
            ]
        ;
    }
};
exports.builtins = builtins;
exports.internals = internals;
