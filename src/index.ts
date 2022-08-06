import lexer from './lexer';
import parser, { ParsedNode } from './parser';
import compiler from './compiler';

import { Token } from '@aroleaf/parser';
import path from 'path';

export function tokenize(code: string) {
  return lexer.parse(code);
}

export function parse(tokens: string | Token[]): ParsedNode {
  if (typeof tokens === 'string') return parse(tokenize(tokens));
  return <ParsedNode>parser.parse(tokens);
}

export function compile(AST: string | Token[] | ParsedNode): string {
  if (typeof AST === 'string' || Array.isArray(AST)) return compile(<ParsedNode>parse(AST));
  return compiler.compile(<ParsedNode>AST, { builtinsPath: path.join(__dirname, 'builtins') });
}