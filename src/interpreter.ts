import { ParsedNode } from './parser';
import { builtins, internals } from './builtins';
import { Token } from '@aroleaf/parser';


export class Interpreter {
  interpret(node: ParsedNode) {
    const functions: { [key: string]: Function } = {};
    const expressions: Function[] = [];

    const assignments = node.children.filter(child => child.type === 'assignment') as ParsedNode[];
    const statements = node.children.filter(child => child.type !== 'assignment') as ParsedNode[];
    
    for (const func of assignments) {
      const name = (<Token>func.children[0]).value;
      const callback = this.expression(<ParsedNode>func.children[1]);
      if (name in builtins) throw new Error(`${name} is a builtin function, and therefore a reserved name`);
      functions[name] = callback;
    }

    for (const statement of statements) {
      const expression = this.expression(<ParsedNode>statement);
      expressions.push(expression);
    }

    // console.log(this.expressions);

    return async (...args: any[]) => expressions.reduce(async (a: any[] | Promise<any[]>, f) => f({ functions }, ...(await a)), args);
  }
  
  expression(expr: ParsedNode|Token): Function {
    switch (expr.type) {
      case 'pipe': return this.pipe(<ParsedNode>expr);
      case 'conditional': return this.conditional(<ParsedNode>expr);
      case 'call': return this.call(<ParsedNode>expr);
      case 'operator':
      case 'add_or_sub':
      case 'mul_or_div':
      case 'power': return this.operator(<ParsedNode>expr);
      case 'string': return this.string(<Token>expr);
      case 'number': return this.number(<Token>expr);
      case 'regex': return this.regex(<Token>expr);
      case 'list': return this.list(<ParsedNode>expr);
      case 'array': return this.array(<ParsedNode>expr);
      default: throw new Error(`unknown expression type "${expr.type}"`);
    }
  }
  
  pipe(node: ParsedNode) {
    const ops = <Token[]>node.children.filter((_,i) => i%2);
    const exprs = <ParsedNode[]>node.children.filter((_,i) => !(i%2));

    return exprs.map(expr => this.expression(expr)).reduce((from, to, i) => {
      const op = ops[i-1].value;
      switch (op) {
        case '|': return internals.pipe(from, to);
        case '>': return internals.merge(from, to);
        case '<': return internals.expand(from, to);
        default: throw new Error(`Invalid operator "${op}"`);
      }
    });
  }
  
  conditional(node: ParsedNode) {
    const condition = this.expression(node.children[0]);
    
    const then = !(node.children.length % 2) ? this.expression(node.children[1]) : undefined;
    const not = node.children.length > 2 ? this.expression(node.children.at(-1)!) : undefined;
    return internals.if(condition, then, not);
  }
  
  call(node: ParsedNode) {
    const children = node.children as [Token, ParsedNode?];
    const funcName = children[0].value;
    const args = children[1] && this.expression(children[1]);
    return internals.call(funcName, args);
  }

  list(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return internals.list(...expressions);
  }

  array(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return internals.array(...expressions);
  }

  operator(node: ParsedNode) {
    const ops = <Token[]>node.children.filter((_,i) => i%2);
    const exprs = <ParsedNode[]>node.children.filter((_,i) => !(i%2));

    return exprs.map(expr => this.expression(expr)).reduce((left, right, i) => internals.operator(ops[i-1].value, left, right));
  }

  string(token: Token) {
    const str = token.value;
    return internals.string(str);
  }

  number(token: Token) {
    const str = token.value;
    return internals.number(Number(str));
  }

  regex(token: Token) {
    const regex = token.value;
    const flags = token.flags;
    return internals.regex(regex, flags);
  }
}

export default function interpreter(node: ParsedNode) {
  return new Interpreter().interpret(node);
}