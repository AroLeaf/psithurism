import lexer from './lexer';
import parser, { ParsedNode } from './parser';
import compiler from './compiler';

export function compile(code: string) {
  const tokens = lexer.parse(code);
  const AST = parser.parse(tokens);
  return compiler(<ParsedNode>AST); 
}

console.log(compile(`
.
`));