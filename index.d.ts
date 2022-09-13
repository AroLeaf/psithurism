import { ParsedNode, Token } from '@aroleaf/parser';

export function tokenize(code: string): Token[];
export function parse(tokens: string | Token[]): ParsedNode;
export function compile(AST: string | Token[] | ParsedNode): string;
export function interpret(AST: string | Token[] | ParsedNode): (args: any[]) => any[];