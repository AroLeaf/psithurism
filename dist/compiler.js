"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = void 0;
var _builtins = require("./builtins");
class Compiler {
    functions = {};
    expressions = [];
    compile(node) {
        this.functions = {};
        this.expressions = [];
        const functions = node.children.filter((child)=>child.type === 'assignment'
        );
        const statements = node.children.filter((child)=>child.type !== 'assignment'
        );
        for (const func of functions){
            const name = func.children[0].value;
            const callback = this.expression(func.children[1]);
            if (name in _builtins.builtins) throw new Error(`${name} is a builtin function, and therefore a reserved name`);
            this.functions[name] = callback;
        }
        for (const statement of statements){
            const expression = this.expression(statement);
            this.expressions.push(expression);
        }
        // console.log(this.expressions);
        return async (...args)=>this.expressions.reduce(async (a, f)=>f({
                    functions: this.functions
                }, ...await a)
            , args)
        ;
    }
    expression(expr) {
        if (expr.type.startsWith('list')) return this.list(expr);
        switch(expr.type){
            case 'pipe':
                return this.pipe(expr);
            case 'conditional':
                return this.conditional(expr);
            case 'call':
                return this.call(expr);
            case 'operator':
            case 'add_or_sub':
            case 'mul_or_div':
            case 'power':
                return this.operator(expr);
            case 'regex':
                return this.regex(expr);
            case 'string':
                return this.string(expr);
            case 'number':
                return this.number(expr);
            default:
                throw new Error(`unknown expression type "${expr.type}"`);
        }
    }
    pipe(node) {
        const ops = node.children.filter((_, i)=>i % 2
        );
        const exprs = node.children.filter((_, i)=>!(i % 2)
        );
        return exprs.map((expr)=>this.expression(expr)
        ).reduce((from, to, i)=>{
            const op = ops[i - 1].value;
            switch(op){
                case '|':
                    return _builtins.internals.pipe(from, to);
                case '>':
                    return _builtins.internals.merge(from, to);
                case '<':
                    return _builtins.internals.expand(from, to);
                default:
                    throw new Error(`Invalid operator "${op}"`);
            }
        });
    }
    conditional(node) {
        const condition = this.expression(node.children[0]);
        const then = !(node.children.length % 2) ? this.expression(node.children[1]) : undefined;
        const not = node.children.length > 2 ? this.expression(node.children.at(-1)) : undefined;
        return _builtins.internals.if(condition, then, not);
    }
    call(node) {
        const children = node.children;
        const funcName = children[0].value;
        const args = children[1] && this.expression(children[1]);
        return _builtins.internals.call(funcName, args);
    }
    list(node) {
        const expressions = node.children.map((child)=>this.expression(child)
        );
        return _builtins.internals.list(...expressions);
    }
    operator(node) {
        const ops = node.children.filter((_, i)=>i % 2
        );
        const exprs = node.children.filter((_, i)=>!(i % 2)
        );
        return exprs.map((expr)=>this.expression(expr)
        ).reduce((left, right, i)=>_builtins.internals.operator(ops[i - 1].value, left, right)
        );
    }
    string(token) {
        const str = token.value;
        return _builtins.internals.string(str);
    }
    number(token) {
        const str = token.value;
        return _builtins.internals.number(Number(str));
    }
    regex(token) {
        const regex = token.value;
        const flags = token.flags;
        return _builtins.internals.regex(regex, flags);
    }
}
exports.default = Compiler;
