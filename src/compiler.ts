import { ParsedNode } from './parser';
import { builtins } from './builtins';
import { Token } from '@aroleaf/parser';
import XRegExp from 'xregexp';

export interface CompilerOptions {
  builtinsPath?: string
}

export class Compiler {
  compile(program: ParsedNode, options: CompilerOptions = {}) {
    const functions: { [key: string]: Function } = {};
    const expressions: Function[] = [];

    const assignments = program.children.filter(child => child.type === 'assignment') as ParsedNode[];
    const statements = program.children.filter(child => child.type !== 'assignment') as ParsedNode[];
    
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
    
    return `${options.builtinsPath ? `const builtins = require('${options.builtinsPath}').builtins;` : ''}${Object.entries(functions).map(([name, func]) => `const ${name}=((passed, piped, args = passed.concat(piped)) => ${func('args')});`).join('')}module.exports=(args)=>{globalThis.$ = args;return ${expressions.reduce((a,v) => v(a), 'args')}};if (require('path').resolve(process.argv[1])==__filename) module.exports(process.argv.slice(2));`;
  }
  
  expression(expr: ParsedNode|Token): Function {
    switch (expr.type) {
      case 'pipe': return this.pipe(<ParsedNode>expr);
      case 'conditional': return this.conditional(<ParsedNode>expr);
      case 'call': return this.call(<ParsedNode>expr);
      case 'operator': return this.operator(<ParsedNode>expr);
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
        case '|': return (args: string) => to(from(args));
        case '≻': return (args: string) => to(`${from(args)}.flat()`);
        case '≺': return (args: string) => `
((args) => {
  const input = ${from(args)};
  const output = Array(input.length);
  const _i = globalThis.i;
  for (let i = 0; i < input.length; i++) {
    const arg = input[i];
    globalThis.i = i;
    output[i] = ${to('Array.isArray(arg) ? arg : [arg]')};
  };
  globalThis.i = _i;
  return output;
})(${args})
        `.slice(1);
        default: throw new Error(`Invalid operator "${op}"`);
      }
    });
  }
  
  conditional(node: ParsedNode) {
    const condition = this.expression(node.children[0]);
    
    const then = !(node.children.length % 2) ? this.expression(node.children[1]) : () => '[null]';
    const not = node.children.length > 2 ? this.expression(node.children.at(-1)!) : () => '[null]';
    
    return (args: string) => `((args) => ${condition('args')}[0] ? ${then('args')} : ${not('args')})(${args})`;
  }
  
  call(node: ParsedNode) {
    const children = node.children as [Token, ParsedNode?];
    const func = builtins[children[0].value] ? `builtins['${children[0].value}']` : children[0].value;
    const passed = children[1] ? this.expression(children[1]) : () => '[]';
    
    return (args: string) => `((piped) => ${func}(${passed('piped')}, piped))(${args})`;
  }

  list(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return (args: string) => `((args) => [${expressions.map(expr => `...${expr('args')}`).join(',')}])(${args})`;
  }

  array(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return (args: string) => `((args) => [[${expressions.map(expr => `...${expr('args')}`).join(',')}]])(${args})`;
  }
  
  operator(node: ParsedNode) {
    const ops = <Token[]>node.children.filter((_,i) => i%2);
    const exprs = <ParsedNode[]>node.children.filter((_,i) => !(i%2));

    return (args: string) => `((args) => ${exprs.map(expr => this.expression(expr)).reduce((left, right, i) => () => `builtins['${ops[i-1].value}'](${left('args')}.concat(${right('args')}),[])`)()})(${args})`;
  }

  string(token: Token) {
    return () => `[${JSON.stringify(token.value)}]`;
  }

  number(token: Token) {
    return () => `[${token.value}]`;
  }

  regex(token: Token) {
    const regex = token.value;
    const flags = token.flags;
    return () => `[${XRegExp(regex, flags).toString()}]`;
  }
}

export default new Compiler();