import { ParsedNode, Token } from '@aroleaf/parser';
import builtins, { BreezeBuiltin } from './builtins';

export interface BreezeContext {
  variables: Map<any, any[]>;
  builtins: { [key: string]: BreezeBuiltin };
  i: number;
  $: any[];
}

export default {
  parse(program: ParsedNode) {
    const lines = program.children.map(expr => this.expression(expr));
    return (...args: any[]) => {
      const ctx: BreezeContext = {
        variables: new Map(),
        builtins,
        i: NaN,
        $: args,
      };

      let out = [];
      for (const line of lines) {
        out = line(ctx, args);
      }
      return out;
    }
  },

  expression(expr: Token | ParsedNode): (ctx: BreezeContext, args: any[]) => any[] {
    switch (expr.type) {
      case 'function': return this.function(expr as ParsedNode);
      case 'pipe': return this.pipe(expr as ParsedNode);
      case 'loop': return this.loop(expr as ParsedNode);
      case 'assignment': return this.assignment(expr as ParsedNode);
      case 'lambda': return this.lambda(expr as ParsedNode);
      case 'conditional': return this.conditional(expr as ParsedNode);
      case 'operator': return this.operator(expr as ParsedNode);
      case 'call': return this.call(expr as ParsedNode);
      case 'chain': return this.chain(expr as ParsedNode);
      case 'list': return this.list(expr as ParsedNode);
      case 'array': return this.array(expr as ParsedNode);
      case 'string': return this.string(expr as Token);
      case 'characters': return this.character(expr as Token);
      case 'number': return this.number(expr as Token);
      default: throw Error(`Unknown expression type: ${expr.type}`);
    }
  },

  function(node: ParsedNode) {
    const name = node.children[0].value;
    const expression = this.expression(node.children[1]);
    
    return (ctx: BreezeContext) => {
      const func = [(...args: any[]) => expression(ctx, args)];
      ctx.variables.set(name, func);
      return func;
    }
  },

  pipe(node: ParsedNode) {
    const expressions = node.children.filter((_,i) => !(i%2)).map(child => this.expression(child));
    const ops = node.children.filter((_,i) => i%2).map(token => token.value);

    return expressions.reduce((from, to, i) => {
      switch(ops[i-1]) {
        case '|': return (ctx: BreezeContext, args: any[]) => to(ctx, from(ctx, args));

        case '≺': return (ctx: BreezeContext, args: any[]) => {
          const input = from(ctx, args);
          const output = Array(input.length);
          const i = ctx.i;
          for (ctx.i = 0; ctx.i < input.length; ctx.i++) {
            const arg = input[ctx.i];
            output[ctx.i] = to(ctx, Array.isArray(arg) ? arg : [arg]);
          };
          ctx.i = i;
          return output;
        };

        // TODO: make flatten a function instead
        case '≻': return (ctx: BreezeContext, args: any[]) => to(ctx, from(ctx, args).flat());

        default: throw new Error();
      }
    })
  },

  loop(node: ParsedNode) {
    const [condition, body] = node.children.map(child => this.expression(child));

    return (ctx: BreezeContext, args: any[]) => {
      let res = args;
      while (condition(ctx, res)[0]) res = body(ctx, res);
      return res;
    }
  },

  assignment(node: ParsedNode) {
    const name = node.children[0].value;
    const expression = this.expression(node.children[1]);
    
    return (ctx: BreezeContext, args: any[]) => {
      const value = expression(ctx, args);
      ctx.variables.set(name, value);
      return value;
    }
  },

  lambda(node: ParsedNode) {
    const expression = this.expression(node.children[0]);
    return (ctx: BreezeContext) => [(...args: any[]) => expression(ctx, args)];
  },

  conditional(node: ParsedNode) {
    const condition = this.expression(node.children[0]);
    
    const then = !(node.children.length % 2) ? this.expression(node.children[1]) : () => [null];
    const not = node.children.length > 2 ? this.expression(node.children.at(-1)!) : () => [null];
    
    return (ctx: BreezeContext, args: any[]) => condition(ctx, args)[0] ? then(ctx, args) : not(ctx, args);
  },

  operator(node: ParsedNode) {
    const ops = <Token[]>node.children.filter((_,i) => i%2);
    const expressions = node.children.filter((_,i) => !(i%2)).map(child => this.expression(child));

    return expressions.reduce((left, right, i) => (ctx: BreezeContext, args: any[]) => {
      const op = ops[i-1].value;
      const variable = ctx.variables.get(op);
      if (typeof variable?.[0] === 'function') return variable[0](...left(ctx, args), ...right(ctx, args));
      if (ctx.builtins[op]) return ctx.builtins[op](ctx, left(ctx, args).concat(right(ctx, args)), []);
      throw new Error(`${op} is neither a function variable, nor a builtin function!`);
    });
  },

  call(node: ParsedNode) {
    const name = node.children[0].value;
    const expression = node.children[1] ? this.expression(node.children[1]) : () => [];

    return (ctx: BreezeContext, args: any[]) => {
      const variable = ctx.variables.get(name);
      if (typeof variable?.[0] === 'function') return variable[0](...expression(ctx, args));
      if (ctx.builtins[name]) return ctx.builtins[name](ctx, expression(ctx, args), args);
      throw new Error(`${name} is neither a function variable, nor a builtin function!`);
    }
  },

  chain(node: ParsedNode) {
    const fakePipe = (children: (Token | ParsedNode)[]): ParsedNode => ({
      type: 'pipe',
      children: children.flatMap(child => <[Token | ParsedNode, Token]>[child, { type: 'pipe', col: NaN, line: NaN, value: '|', raw: '|' }]).slice(0, -1),
    });

    const fakeCall = (identifier: Token): ParsedNode => ({
      type: 'call',
      children: [identifier],
    });

    const nodes = Object.assign(<(Token | ParsedNode)[]>node.children, { current: 0 });
    function parse() {
      const isFirst = nodes.current === 0;
      const children: (Token | ParsedNode)[] = [];
      while(nodes[nodes.current]) {
        const child = nodes[nodes.current++];
        switch(child.type) {
          case 'lambda': {
            children.push(parse());
            break;
          }
          case 'break': {
            if (isFirst) throw new Error('Nothing to break out of!');
            return fakePipe(children);
          }
          case 'identifier': {
            children.push(fakeCall(child as Token));
            break;
          }
          default: {
            children.push(child);
          }
        }
      }
      return fakePipe(children);
    }

    const expression = this.expression(parse());

    return (ctx: BreezeContext, args: any[]) => expression(ctx, args);
  },

  list(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return (ctx: BreezeContext, args: any[]) => expressions.flatMap(expr => expr(ctx, args));
  },

  array(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return (ctx: BreezeContext, args: any[]) => [expressions.flatMap(expr => expr(ctx, args))];
  },

  string(token: Token) {
    return () => [token.value];
  },

  character(token: Token) {
    return () => [token.value];
  },

  number(token: Token) {
    return () => [+token.value];
  },
}