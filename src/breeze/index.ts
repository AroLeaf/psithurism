import { Parsed, ParsedNode, Token } from '@aroleaf/parser';
import lexer from './lexer';
import parser from './parser';
import interpreter from './interpreter';

export function parse(code: string): Function;
export function parse(tokens: Token[]): Function;
export function parse(program: ParsedNode): Function;
export function parse(input: string | Token[] | ParsedNode): Function {
  let program: string | Token[] | Parsed = input;
  if (typeof program === 'string') program = lexer.parse(program);
  if (Array.isArray(program)) program = parser.parse(program);
  if (!program || Array.isArray(program)) throw new Error('Something went wrong while parsing the program.');
  return interpreter.parse(program);
}

export default { parse };