import lexer from './lexer';
import parser, { ParsedNode } from './parser';
import compiler from './compiler';
import { minifySync } from '@swc/core';
import { Token } from '@aroleaf/parser';

export function tokenize(code: string) {
  return lexer.parse(code);
}

export function parse(tokens: string | Token[]): ParsedNode {
  if (typeof tokens === 'string') return parse(tokenize(tokens));
  return <ParsedNode>parser.parse(tokens);
}

export function compile(AST: string | Token[] | ParsedNode, minified = false): string {
  if (typeof AST === 'string' || Array.isArray(AST)) return compile(<ParsedNode>parse(AST), minified);
  const js = compiler.compile(<ParsedNode>AST);
  return minified ? minifySync(js).code : js;
}

if (require.main === module) require('./sidhe');