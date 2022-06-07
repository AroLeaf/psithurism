import { ParsedNode } from './parser';
import { builtins } from './builtins';
import { Token } from '@aroleaf/parser';
import XRegExp from 'xregexp';

export class Compiler {
  compile(node: ParsedNode) {
    const functions: { [key: string]: string } = {};
    const expressions: string[] = [];

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

    return `${Object.entries(functions).map(([name, func]) => `const ${name}=${func}`).join(';')};module.exports=(...args)=>${expressions.reduce((a,v) => `${v}(${a})`, 'args')};if (require.main === module) module.exports(process.argv.slice(2));`;
  }
  
  expression(expr: ParsedNode|Token): string {
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
        case '|': return `((args) => ${to}(${from}(args)))`;
        case '>': return `((args) => ${to}(${from}(args).flat()))`;
        case '<': return `((args) => {
                            const input = ${from}(args);
                            const output = Array(input.length);
                            for (let i = 0; i < input.length; i++) {
                              const arg = input[i];
                              output[i] = ${to}(Array.isArray(arg) ? arg : [arg])
                            }; return output;
                          })`;
        default: throw new Error(`Invalid operator "${op}"`);
      }
    });
  }
  
  conditional(node: ParsedNode) {
    const condition = this.expression(node.children[0]);
    
    const then = !(node.children.length % 2) ? this.expression(node.children[1]) : '(()=>[null])';
    const not = node.children.length > 2 ? this.expression(node.children.at(-1)!) : '(()=>[null])';
    
    return `((args) => ${condition}(args)[0] ? ${then}(args) : ${not}(args))`;
  }
  
  call(node: ParsedNode) {
    const children = node.children as [Token, ParsedNode?];
    const func = builtins[children[0].value] ? `builtins['${children[0].value}']` : children[0].value;
    const passed = children[1] ? this.expression(children[1]) : '(()=>[])';
    
    return `((piped) => ${func}(${passed}(piped).concat(piped)))`;
  }

  list(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return `((args) => [${expressions.map(expr => `...${expr}(args)`).join(',')}])`;
  }

  array(node: ParsedNode) {
    const expressions = node.children.map(child => this.expression(child));
    return `((args) => [[${expressions.map(expr => `${expr}(args)`).join(',')}].map(v=>v.length>1?v:v[0])])`;
  }

  operator(node: ParsedNode) {
    const ops = <Token[]>node.children.filter((_,i) => i%2);
    const exprs = <ParsedNode[]>node.children.filter((_,i) => !(i%2));

    return exprs.map(expr => this.expression(expr)).reduce((left, right, i) => `((args) => builtins['${ops[i-1].value}'](${left}(args).concat(${right}(args))))`);
  }

  string(token: Token) {
    return `(() => [${JSON.stringify(token.value)}])`;
  }

  number(token: Token) {
    return `(() => [${token.value}])`;
  }

  regex(token: Token) {
    const regex = token.value;
    const flags = token.flags;
    return `(() => [${XRegExp(regex, flags).toString()}])`;
  }
}

export default function compiler(node: ParsedNode) {
  return new Compiler().compile(node);
}