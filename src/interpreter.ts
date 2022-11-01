import { Token } from '@aroleaf/parser';
import { builtins } from './builtins';
import { ParsedNode } from './parser';
import { PsithurismContext } from './types';

export const interpreter = {
  interpret(program: ParsedNode) {
    const functions: { [key: string]: Function } = { ...builtins }
    const expressions: Function[] = [];

    const assignments = program.children.filter(child => child.type === 'assignment') as ParsedNode[];
    const statements = program.children.filter(child => child.type !== 'assignment') as ParsedNode[];
    
    for (const func of assignments) {
      const name = (<Token>func.children[0]).value;
      const callback = this.expression(<ParsedNode>func.children[1]);
      functions[name] = callback;
    }

    for (const statement of statements) {
      const expression = this.expression(<ParsedNode>statement);
      expressions.push(expression);
    }

    const ctx = {
      functions,
      pipes: new Map(),
      i: -1,
    };

    return (args: any[]) => expressions.reduce((args, expr) => expr(ctx, args), args);
  },

  expression(expr: ParsedNode|Token): Function {
    switch (expr.type) {
      case 'pipe': return this.pipe(<ParsedNode>expr);
      case 'conditional': return this.conditional(<ParsedNode>expr);
      case 'call': return this.call(<ParsedNode>expr);
      case 'operator': return this.operator(<ParsedNode>expr);
      case 'string': return this.string(<Token>expr);
      case 'number': return this.number(<Token>expr);
      case 'js': return this.js(<Token>expr);
      case 'list': return this.list(<ParsedNode>expr);
      case 'array': return this.array(<ParsedNode>expr);
      default: throw new Error(`unknown expression type "${expr.type}"`);
    }
  },

  pipe(node: ParsedNode) {
    const ops = <Token[]>node.children.filter((_,i) => i%2);
    const exprs = <ParsedNode[]>node.children.filter((_,i) => !(i%2));
    
    return exprs.map(expr => this.expression(expr)).reduce((from, to, i) => {
      const op = ops[i-1].value;
      switch (op) {
        case '|': return (ctx: PsithurismContext, args: any[]) => to(ctx, from(ctx, args));
        case '≻': return (ctx: PsithurismContext, args: any[]) => to(ctx, from(ctx, args).flat());
        case '≺': return (ctx: PsithurismContext, args: any[]) => {
          const input = from(ctx, args);
          const output = Array(input.length);
          const _i = ctx.i;
          for (ctx.i = 0; ctx.i < input.length; ctx.i++) {
            const arg = input[ctx.i];
            output[ctx.i] = to(ctx, Array.isArray(arg) ? arg : [arg]);
          };
          ctx.i = _i;
          return output;
        }
        case '⇥': return (ctx: PsithurismContext, args: any[]) => {
          const v = from(ctx, args);
          const k = to(ctx, args)[0];
          let pipe = ctx.pipes.get(k);
          if (!pipe) {
            pipe = [];
            ctx.pipes.set(k, pipe);
          }
          pipe.push(...v);
          return v;
        };
        case '⟼': return (ctx: PsithurismContext, args: any[]) => {
          const k = from(ctx, args)[0];
          const v = to(ctx, ctx.pipes.get(k) || []);
          ctx.pipes.delete(k);
          return v;
        };
        default: throw new Error();
      }
    });
  },

  conditional(node: ParsedNode) {
    const condition = this.expression(node.children[0]);
    
    const then = !(node.children.length % 2) ? this.expression(node.children[1]) : () => [null];
    const not = node.children.length > 2 ? this.expression(node.children.at(-1)!) : () => [null];
    
    return (ctx: PsithurismContext, args: any[]) => condition(ctx, args)[0] ? then(ctx, args) : not(ctx, args);
  },

  call(node: ParsedNode) {
    const children = node.children as [Token, ParsedNode?];
    const passed = children[1] ? this.expression(children[1]) : () => [];
    
    return (ctx: PsithurismContext, piped: any[]) => ctx.functions[children[0].value](ctx, passed(ctx, piped), piped);
  },

  operator(node: ParsedNode) {
    const ops = <Token[]>node.children.filter((_,i) => i%2);
    const exprs = <ParsedNode[]>node.children.filter((_,i) => !(i%2));
    const expressions = exprs.map(expr => this.expression(expr));

    return (ctx: PsithurismContext, args: any[]) => expressions.reduce((left, right, i) => ctx.functions[ops[i-1].value](ctx, left(ctx, args).concat(right(ctx, args)), []));
  },

  string(token: Token) {
    return () => [token.value];
  },

  number(token: Token) {
    return () => [+token.value];
  },

  js(token: Token) {
    const code = token.value;
    return new Function(`return (ctx, args) => ${code}`)();
  },

  list(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return (ctx: PsithurismContext, args: any[]) => expressions.flatMap(expr => expr(ctx, args));
  },

  array(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return (ctx: PsithurismContext, args: any[]) => [expressions.flatMap(expr => expr(ctx, args))];
  },
}