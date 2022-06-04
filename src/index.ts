import lexer from './lexer';
import parser, { ParsedNode } from './parser';
import interpreter from './interpreter';

export function interpret(code: string) {
  const tokens = lexer.parse(code);
  const AST = parser.parse(tokens);
  return interpreter(<ParsedNode>AST);
}

console.log('start');
interpret(`

`)().then(res => console.log(...res));