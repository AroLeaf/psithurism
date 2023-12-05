import { ParsedNode, Token } from '@aroleaf/parser';
import { State } from './types';
import builtins from './builtins';

export default {
  parse(program: ParsedNode) {
    const lines = program.children.map(expr => this.expression(expr));
    return (...args: any[]) => {
      const state: State = {
        variables: new Map(),
        portals: new Map(),
        builtins,
        i: [],
        $: args,
      };

      let out = [];
      for (const line of lines) {
        out = line(state, args);
      }
      return out;
    }
  },
  
  expression(expr: Token | ParsedNode): (state: State, args: any[]) => any[] {
    switch (expr.type) {
      case 'function': return this.function(expr as ParsedNode);
      case 'pipe': return this.pipe(expr as ParsedNode);
      case 'loop': return this.loop(expr as ParsedNode);
      case 'portal_in': return this.portalIn(expr as ParsedNode);
      case 'portal_out': return this.portalOut(expr as ParsedNode);
      case 'portal_through': return this.portalThrough(expr as ParsedNode);
      case 'lambda': return this.lambda(expr as ParsedNode);
      case 'conditional': return this.conditional(expr as ParsedNode);
      case 'operator': return this.operator(expr as ParsedNode);
      case 'call': return this.call(expr as ParsedNode);
      case 'list': return this.list(expr as ParsedNode);
      case 'array': return this.array(expr as ParsedNode);
      case 'string': return this.string(expr as Token);
      case 'regex': return this.regex(expr as Token);
      case 'character': return this.character(expr as Token);
      case 'number': return this.number(expr as Token);
      default: throw Error(`Unknown expression type: ${expr.type}`);
    }
  },

  function(node: ParsedNode) {
    const name = node.children[0].value;
    const expression = this.expression(node.children[1]);
    
    return (state: State) => {
      const func = [(...args: any[]) => expression(state, args)];
      state.variables.set(name, func);
      return func;
    }
  },

  pipe(node: ParsedNode) {
    const expressions = node.children.filter((_,i) => !(i%2)).map(child => this.expression(child));
    const ops = node.children.filter((_,i) => i%2).map(token => token.value);

    return expressions.reduce((from, to, i) => {
      switch(ops[i-1]) {
        case '|': return (state: State, args: any[]) => to(state, from(state, args));

        case '≺': return (state: State, args: any[]) => {
          const input = from(state, args);
          const output = Array(input.length);
          for (state.i.unshift(0); state.i[0] < input.length; state.i[0]++) {
            const arg = input[state.i[0]];
            output[state.i[0]] = to(state, Array.isArray(arg) ? arg : [arg]);
          };
          state.i.shift();
          return output;
        };

        // TODO: find a different use for this
        case '≻': return (state: State, args: any[]) => to(state, from(state, args).flat());

        default: throw new Error();
      }
    });
  },

  loop(node: ParsedNode) {
    const [condition, body] = node.children.map(child => this.expression(child));

    return (state: State, args: any[]) => {
      let res = args;
      while (condition(state, res)[0]) res = body(state, res);
      return res;
    }
  },

  portalIn(node: ParsedNode) {
    const [initial, ...rest] = node.children;
    return rest.reduce((from, to) => {
      const portalExpression = to.type === 'identifier' ? () => [to.value] : this.expression(to);
      return (state: State, args: any[]) => {
        const value = from(state, args);
        const portalName = portalExpression(state, args)[0];
        const portal = state.portals.get(portalName) || state.portals.set(portalName, []).get(portalName)!;
        portal.push(...value);
        return value;
      }
    }, this.expression(initial));
  },

  portalOut(node: ParsedNode) {
    const [initial, ...rest] = node.children.toReversed();
    return rest.reduce((from, to) => {
      const portalExpression = to.type === 'identifier' ? () => [to.value] : this.expression(to);
      return (state: State, args: any[]) => {
        const portalName = portalExpression(state, args)[0];
        const portal = state.portals.get(portalName) || state.portals.set(portalName, []).get(portalName)!;
        return from(state, portal.splice(0, portal.length));
      }
    }, this.expression(initial));
  },

  portalThrough(node: ParsedNode) {
    const [initial, ...rest] = node.children.toReversed();
    return rest.reduce((from, to) => {
      const portalExpression = to.type === 'identifier' ? () => [to.value] : this.expression(to);
      return (state: State, args: any[]) => {
        const portalName = portalExpression(state, args)[0];
        const portal = state.portals.get(portalName) || state.portals.set(portalName, []).get(portalName)!;
        return from(state, portal.slice(0));
      }
    }, this.expression(initial));
  },

  lambda(node: ParsedNode) {
    const expression = this.expression(node.children[0]);
    return (state: State) => [(...args: any[]) => expression(state, args)];
  },

  conditional(node: ParsedNode) {
    const condition = this.expression(node.children[0]);
    
    const then = !(node.children.length % 2) ? this.expression(node.children[1]) : () => [null];
    const not = node.children.length > 2 ? this.expression(node.children.at(-1)!) : () => [null];
    
    return (state: State, args: any[]) => condition(state, args)[0] ? then(state, args) : not(state, args);
  },

  operator(node: ParsedNode) {
    const expressions = node.children.filter((_,i) => !(i%2)).map(e => this.expression(e));
    const ops = node.children.filter((_,i) => i%2);
    
    return expressions.reduce((left, right, i) => (state: State, args: any[]) => {
      const op = ops[i-1].value;
      const variable = state.variables.get(op);
      if (variable && typeof variable?.[0] === 'function') return variable[0](left(state, args), right(state, args))
      
      if (op in builtins) return builtins[op].operator(state, left(state, args), right(state, args));
      
      throw new Error(`${op} is neither a list variable with a function as its first element, nor a builtin function!`);
    });
  },

  call(node: ParsedNode) {
    const name = node.children[0].value;
    const expression = node.children[1] ? this.expression(node.children[1]) : () => [];
    
    return (state: State, args: any[]) => {
      const variable = state.variables.get(name);
      if (variable) {
        return typeof variable?.[0] === 'function' ? variable[0](...args, ...expression(state, args)) : variable;
      }
      
      if (state.builtins[name]) return state.builtins[name].operand(state, args, expression(state, args));
      
      throw new Error(`${name} is neither a variable, nor a builtin function!`);
    }
  },

  list(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return (state: State, args: any[]) => expressions.flatMap(expr => expr(state, args));
  },

  array(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return (state: State, args: any[]) => [expressions.flatMap(expr => expr(state, args))];
  },

  string(token: Token) {
    return () => [token.value];
  },

  regex(token: Token) {
    return (_state: State, args: any[]) => {
      return token.value ? [new RegExp(token.value, 'gs')] : args.map(arg => new RegExp(arg, 'gs'));
    };
  },

  character(token: Token) {
    return () => [token.value];
  },

  number(token: Token) {
    return () => [+token.value];
  },
}
