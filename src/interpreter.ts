import { Token } from '@aroleaf/parser';
import XRegExp from 'xregexp';
import { builtins } from './builtins';
import { ParsedNode } from './parser';

export const interpreter = {
  interpret(program: ParsedNode) {
    const functions: { [key: string]: Function } = { ...builtins }
    const expressions: Function[] = [];

    const assignments = program.children.filter(child => child.type === 'assignment') as ParsedNode[];
    const statements = program.children.filter(child => child.type !== 'assignment') as ParsedNode[];
    
    for (const func of assignments) {
      const name = (<Token>func.children[0]).value;
      const callback = this.expression(<ParsedNode>func.children[1], functions);
      functions[name] = callback;
    }

    for (const statement of statements) {
      const expression = this.expression(<ParsedNode>statement, functions);
      expressions.push(expression);
    }

    return (args: any[]) => expressions.reduce((args, expr) => expr(args), args);
  },

  expression(expr: ParsedNode|Token, functions: { [key: string]: Function }): Function {
    switch (expr.type) {
      case 'pipe': return this.pipe(<ParsedNode>expr, functions);
      case 'conditional': return this.conditional(<ParsedNode>expr, functions);
      case 'call': return this.call(<ParsedNode>expr, functions);
      case 'operator': return this.operator(<ParsedNode>expr, functions);
      case 'string': return this.string(<Token>expr);
      case 'number': return this.number(<Token>expr);
      case 'regex': return this.regex(<Token>expr);
      case 'list': return this.list(<ParsedNode>expr, functions);
      case 'array': return this.array(<ParsedNode>expr, functions);
      default: throw new Error(`unknown expression type "${expr.type}"`);
    }
  },

  pipe(node: ParsedNode, functions: { [key: string]: Function }) {
    const ops = <Token[]>node.children.filter((_,i) => i%2);
    const exprs = <ParsedNode[]>node.children.filter((_,i) => !(i%2));
    
    return exprs.map(expr => this.expression(expr, functions)).reduce((from, to, i) => {
      const op = ops[i-1].value;
      switch (op) {
        case '|': return (args: any[]) => to(from(args));
        case '≻': return (args: any[]) => to(from(args).flat());
        case '≺': return (args: any[]) => {
          const input = from(args);
          const output = Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const arg = input[i];
            output[i] = to(Array.isArray(arg) ? arg : [arg]);
          };
          return output;
        }
        default: throw new Error();
      }
    })
  },

  conditional(node: ParsedNode, functions: { [key: string]: Function }) {
    const condition = this.expression(node.children[0], functions);
    
    const then = !(node.children.length % 2) ? this.expression(node.children[1], functions) : () => [null];
    const not = node.children.length > 2 ? this.expression(node.children.at(-1)!, functions) : () => [null];
    
    return (args: any[]) => condition(args)[0] ? then(args) : not(args);
  },

  call(node: ParsedNode, functions: { [key: string]: Function }) {
    const children = node.children as [Token, ParsedNode?];
    const passed = children[1] ? this.expression(children[1], functions) : () => [];
    
    return (piped: any[]) => functions[children[0].value](passed(piped), piped);
  },

  operator(node: ParsedNode, functions: { [key: string]: Function }) {
    const ops = <Token[]>node.children.filter((_,i) => i%2);
    const exprs = <ParsedNode[]>node.children.filter((_,i) => !(i%2));
    const expressions = exprs.map(expr => this.expression(expr, functions));

    return (args: any[]) => expressions.reduce((left, right, i) => functions[ops[i-1].value](left(args).concat(right(args)), []));
  },

  string(token: Token) {
    return () => [token.value];
  },

  number(token: Token) {
    return () => [+token.value];
  },

  regex(token: Token) {
    const regex = token.value;
    const flags = token.flags;
    return () => [XRegExp(regex, flags)];
  },

  list(node: ParsedNode, functions: { [key: string]: Function }) {
    const expressions = node.children.map(child => this.expression(child, functions));
    return (args: any[]) => expressions.flatMap(expr => expr(args));
  },

  array(node: ParsedNode, functions: { [key: string]: Function }) {
    const expressions = node.children.map(child => this.expression(child, functions));
    return (args: any[]) => expressions.map(expr => expr(args));
  },

}